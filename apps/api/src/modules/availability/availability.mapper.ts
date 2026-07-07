import type { AvailabilityCheck } from '@prisma/client';

import type { AvailabilityCheckRecord, AvailabilityResult } from '@vms/shared';

type StoredRecommendations = {
  readonly summary?: string;
  readonly recommendedBerthIds?: readonly string[];
  readonly blockingReasons?: readonly string[];
  readonly warnings?: readonly string[];
};

export function toAvailabilityCheckRecord(check: AvailabilityCheck): AvailabilityCheckRecord {
  const recommendations = (check.recommendations ?? {}) as StoredRecommendations;

  return {
    id: check.id,
    tenantId: check.tenantId,
    bookingRequestId: check.bookingRequestId,
    vesselId: check.vesselId,
    portId: check.portId,
    berthId: check.berthId,
    requestedEta: check.requestedEta.toISOString(),
    requestedEtd: check.requestedEtd.toISOString(),
    result: check.result as AvailabilityResult,
    score: check.score,
    summary: recommendations.summary ?? 'Availability check completed.',
    checks: check.checks as AvailabilityCheckRecord['checks'],
    recommendedBerthIds: recommendations.recommendedBerthIds ?? [],
    blockingReasons: recommendations.blockingReasons ?? [],
    warnings: recommendations.warnings ?? [],
    createdAt: check.createdAt.toISOString(),
  };
}
