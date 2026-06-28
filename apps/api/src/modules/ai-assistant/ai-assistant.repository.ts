import { Inject, Injectable } from '@nestjs/common';

import type { AiAssistantSource } from '@vms/shared';

import { PrismaService } from '../../database/prisma.service.js';

export type AiOperationalContextItem = {
  readonly type: AiAssistantSource['type'];
  readonly id: string;
  readonly reference: string;
  readonly label: string;
  readonly status: string;
  readonly detail: string;
  readonly occurredAt: Date | null;
  readonly href: string;
};

export type AiAssistantContext = {
  readonly items: readonly AiOperationalContextItem[];
  readonly counts: {
    readonly vesselCalls: number;
    readonly movements: number;
    readonly movementServices: number;
    readonly billingEvents: number;
    readonly failedBillingEvents: number;
    readonly pendingBillingEvents: number;
  };
};

export interface AiAssistantRepository {
  buildContext(tenantId: string, question: string): Promise<AiAssistantContext>;
}

export const AI_ASSISTANT_REPOSITORY = Symbol('AI_ASSISTANT_REPOSITORY');

@Injectable()
export class PrismaAiAssistantRepository implements AiAssistantRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async buildContext(tenantId: string, question: string): Promise<AiAssistantContext> {
    const normalizedQuestion = question.trim();
    const targetedSearch = this.toTargetedSearch(normalizedQuestion);
    const [vesselCalls, movements, movementServices, billingEvents, counts] = await Promise.all([
      this.prisma.vesselCall.findMany({
        where: {
          tenantId,
          deletedAt: null,
          ...(targetedSearch
            ? {
                OR: [
                  { callReference: { contains: targetedSearch, mode: 'insensitive' } },
                  { remarks: { contains: targetedSearch, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: [{ eta: 'asc' }, { createdAt: 'desc' }],
        take: 5,
      }),
      this.prisma.vesselMovement.findMany({
        where: {
          tenantId,
          deletedAt: null,
          ...(targetedSearch
            ? {
                OR: [
                  { movementReference: { contains: targetedSearch, mode: 'insensitive' } },
                  { remarks: { contains: targetedSearch, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: [{ plannedAt: 'asc' }, { createdAt: 'desc' }],
        take: 5,
      }),
      this.prisma.movementService.findMany({
        where: { tenantId },
        include: { service: true, movement: true },
        orderBy: [{ completedAt: 'asc' }, { requestedAt: 'asc' }, { createdAt: 'desc' }],
        take: 5,
      }),
      this.prisma.billingEvent.findMany({
        where: {
          tenantId,
          deletedAt: null,
          status: { in: ['draft', 'ready', 'on_hold', 'failed', 'rejected'] },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
        take: 8,
      }),
      this.buildCounts(tenantId),
    ]);

    return {
      counts,
      items: [
        ...vesselCalls.map((call) => ({
          type: 'vessel_call' as const,
          id: call.id,
          reference: call.callReference,
          label: `Vessel call ${call.callReference}`,
          status: call.status,
          detail: `ETA ${this.formatDate(call.eta)}, ETD ${this.formatDate(call.etd)}.`,
          occurredAt: call.eta,
          href: `/vessel-calls?search=${encodeURIComponent(call.callReference)}`,
        })),
        ...movements.map((movement) => ({
          type: 'movement' as const,
          id: movement.id,
          reference: movement.movementReference,
          label: `Movement ${movement.movementReference}`,
          status: movement.status,
          detail: `${movement.movementType} planned ${this.formatDate(movement.plannedAt)}.`,
          occurredAt: movement.plannedAt,
          href: `/movements?search=${encodeURIComponent(movement.movementReference)}`,
        })),
        ...movementServices.map((movementService) => ({
          type: 'movement_service' as const,
          id: movementService.id,
          reference: movementService.service.code,
          label: movementService.service.name,
          status: movementService.status,
          detail: `${movementService.quantity.toString()} ${movementService.unitOfMeasure}; billable ${movementService.isBillable ? 'yes' : 'no'}.`,
          occurredAt: movementService.completedAt ?? movementService.requestedAt,
          href: `/movement-services`,
        })),
        ...billingEvents.map((event) => ({
          type: 'billing_event' as const,
          id: event.id,
          reference: event.eventReference,
          label: `Billing event ${event.eventReference}`,
          status: event.status,
          detail: event.failureReason ?? `ERP system ${event.erpSystem ?? 'not assigned'}.`,
          occurredAt: event.createdAt,
          href: `/billing-events?search=${encodeURIComponent(event.eventReference)}`,
        })),
      ],
    };
  }

  private async buildCounts(tenantId: string): Promise<AiAssistantContext['counts']> {
    const [
      vesselCalls,
      movements,
      movementServices,
      billingEvents,
      failedBillingEvents,
      pendingBillingEvents,
    ] = await Promise.all([
      this.prisma.vesselCall.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.vesselMovement.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.movementService.count({ where: { tenantId } }),
      this.prisma.billingEvent.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.billingEvent.count({
        where: { tenantId, deletedAt: null, status: { in: ['failed', 'rejected'] } },
      }),
      this.prisma.billingEvent.count({
        where: { tenantId, deletedAt: null, status: { in: ['draft', 'ready', 'on_hold'] } },
      }),
    ]);

    return {
      vesselCalls,
      movements,
      movementServices,
      billingEvents,
      failedBillingEvents,
      pendingBillingEvents,
    };
  }

  private formatDate(value: Date | null): string {
    return value?.toISOString() ?? 'not set';
  }

  private toTargetedSearch(question: string): string {
    const referenceMatch = /\b[A-Z]{2,}-[A-Z0-9-]{2,}\b/i.exec(question);

    return referenceMatch?.[0] ?? '';
  }
}
