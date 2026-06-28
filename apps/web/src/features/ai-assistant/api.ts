import type { AiAssistantAskInput, AiAssistantResponse } from '@vms/shared';

import { requestJson } from '@/lib/api/http';

export function askAiAssistant(input: AiAssistantAskInput): Promise<AiAssistantResponse> {
  return requestJson<AiAssistantResponse>('/api/v1/ai/ask', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
