import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type {
  AvailabilityCheckInput,
  AvailabilityCheckRecord,
  AvailabilityRuleResult,
} from '@vms/shared';

import { PrismaService } from '../../database/prisma.service.js';

import { toAvailabilityCheckRecord } from './availability.mapper.js';

type AvailabilityChecks = AvailabilityCheckRecord['checks'];

@Injectable()
export class AvailabilityService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async check(tenantId: string, input: AvailabilityCheckInput): Promise<AvailabilityCheckRecord> {
    const requestedEta = new Date(input.requestedEta);
    const requestedEtd = new Date(input.requestedEtd);

    if (requestedEta.getTime() > requestedEtd.getTime()) {
      throw new BadRequestException('Requested ETA cannot be later than requested ETD.');
    }

    const [vessel, cargoItems, requestedServices] = await Promise.all([
      this.prisma.vessel.findFirst({
        where: { id: input.vesselId, tenantId, deletedAt: null },
      }),
      this.prisma.cargoItem.findMany({
        where: {
          tenantId,
          id: { in: [...(input.cargoItemIds ?? [])] },
          deletedAt: null,
        },
      }),
      this.prisma.serviceCatalog.findMany({
        where: {
          tenantId,
          id: { in: [...(input.requestedServiceIds ?? [])] },
          deletedAt: null,
        },
      }),
    ]);

    if (!vessel) {
      throw new NotFoundException('Vessel was not found.');
    }

    const candidateBerths = await this.prisma.berth.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: 'active',
        ...(input.preferredBerthId ? { id: input.preferredBerthId } : {}),
        terminal: { portId: input.portId },
      },
      orderBy: { name: 'asc' },
    });

    const overlappingCalls = await this.prisma.vesselCall.findMany({
      where: {
        tenantId,
        deletedAt: null,
        berthId: { in: candidateBerths.map((berth) => berth.id) },
        eta: { lt: requestedEtd },
        etd: { gt: requestedEta },
      },
    });

    const availableBerths = candidateBerths.filter(
      (berth) => !overlappingCalls.some((call) => call.berthId === berth.id),
    );
    const berthWindow = this.buildBerthWindowCheck(candidateBerths.length, availableBerths.length);
    const vesselDimensions = this.buildDimensionCheck(
      vessel.lengthOverallM ? Number(vessel.lengthOverallM) : null,
      availableBerths.map((berth) => (berth.maxLengthM ? Number(berth.maxLengthM) : null)),
      'length overall',
    );
    const draft = this.buildDimensionCheck(
      vessel.maxDraftM ? Number(vessel.maxDraftM) : null,
      availableBerths.map((berth) => (berth.maxDraftM ? Number(berth.maxDraftM) : null)),
      'draft',
    );
    const cargoRestrictions = this.buildCargoCheck(cargoItems.some((item) => item.isHazardous));
    const serviceAvailability = this.buildServiceCheck(
      input.requestedServiceIds?.length ?? 0,
      requestedServices.filter((service) => service.status === 'active').length,
    );

    const checks: AvailabilityChecks = {
      berthWindow,
      vesselDimensions,
      draft,
      cargoRestrictions,
      serviceAvailability,
    };
    const blockingReasons = Object.values(checks)
      .filter((check) => check.status === 'fail')
      .map((check) => check.message);
    const warnings = Object.values(checks)
      .filter((check) => check.status === 'warning' || check.status === 'manual_review')
      .map((check) => check.message);
    const result = this.resolveResult(blockingReasons.length, warnings.length);
    const score = Math.max(0, 100 - blockingReasons.length * 35 - warnings.length * 10);
    const summary =
      result === 'available'
        ? 'Availability looks suitable for port review.'
        : 'Availability requires port review before approval.';

    const saved = await this.prisma.availabilityCheck.create({
      data: {
        tenantId,
        bookingRequestId: input.bookingRequestId?.trim() || null,
        vesselId: input.vesselId,
        portId: input.portId,
        berthId: input.preferredBerthId?.trim() || null,
        requestedEta,
        requestedEtd,
        result,
        score,
        checks: checks as unknown as Prisma.InputJsonValue,
        recommendations: {
          summary,
          recommendedBerthIds: availableBerths.map((berth) => berth.id).slice(0, 5),
          blockingReasons,
          warnings: [
            ...warnings,
            'Availability is advisory and must be reviewed by port operations.',
          ],
        } as Prisma.InputJsonValue,
      },
    });

    return toAvailabilityCheckRecord(saved);
  }

  async getById(tenantId: string, id: string): Promise<AvailabilityCheckRecord> {
    const check = await this.prisma.availabilityCheck.findFirst({
      where: { id, tenantId },
    });

    if (!check) {
      throw new NotFoundException('Availability check was not found.');
    }

    return toAvailabilityCheckRecord(check);
  }

  private buildBerthWindowCheck(
    candidateCount: number,
    availableCount: number,
  ): AvailabilityRuleResult {
    if (candidateCount === 0) {
      return {
        status: 'fail',
        message: 'No active berths were found for the selected port or preferred berth.',
      };
    }

    if (availableCount === 0) {
      return {
        status: 'fail',
        message: 'No candidate berth is free for the requested window.',
      };
    }

    return {
      status: 'pass',
      message: `${availableCount} candidate berth${availableCount === 1 ? ' is' : 's are'} free for the requested window.`,
    };
  }

  private buildDimensionCheck(
    vesselValue: number | null,
    berthLimits: readonly (number | null)[],
    label: string,
  ): AvailabilityRuleResult {
    if (!vesselValue) {
      return {
        status: 'warning',
        message: `Vessel ${label} is missing and needs manual review.`,
      };
    }

    if (berthLimits.some((limit) => limit === null || vesselValue <= limit)) {
      return {
        status: 'pass',
        message: `Vessel ${label} is within at least one candidate berth limit.`,
      };
    }

    return {
      status: 'fail',
      message: `Vessel ${label} exceeds every candidate berth limit.`,
    };
  }

  private buildCargoCheck(hasHazardousCargo: boolean): AvailabilityRuleResult {
    if (hasHazardousCargo) {
      return {
        status: 'manual_review',
        message: 'Hazardous cargo requires EHS and terminal restriction review.',
      };
    }

    return {
      status: 'pass',
      message: 'No hazardous cargo restriction was identified from the request.',
    };
  }

  private buildServiceCheck(requestedCount: number, activeCount: number): AvailabilityRuleResult {
    if (requestedCount === 0) {
      return {
        status: 'pass',
        message: 'No pre-arrival services were requested.',
      };
    }

    if (requestedCount !== activeCount) {
      return {
        status: 'warning',
        message: 'One or more requested services are inactive or unavailable.',
      };
    }

    return {
      status: 'warning',
      message: 'Requested services are active; service capacity is not modelled yet.',
    };
  }

  private resolveResult(blockingReasonCount: number, warningCount: number) {
    if (blockingReasonCount > 0) {
      return 'conflict';
    }

    if (warningCount > 0) {
      return 'manual_review_required';
    }

    return 'available';
  }
}
