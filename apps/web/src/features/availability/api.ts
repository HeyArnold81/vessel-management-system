import type { AvailabilityCheckInput, AvailabilityCheckRecord } from '@vms/shared';

import { requestJson } from '@/lib/api/http';

export function checkAvailability(input: AvailabilityCheckInput): Promise<AvailabilityCheckRecord> {
  return requestJson<AvailabilityCheckRecord>('/api/v1/availability/check', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
