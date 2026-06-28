import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { AiAssistantController } from './ai-assistant.controller.js';

const tenantId = '11111111-1111-4111-8111-111111111111';

function buildService() {
  return {
    ask: vi.fn().mockResolvedValue({ answer: 'Response', sources: [] }),
  };
}

describe('AiAssistantController', () => {
  it('passes tenant and body to the service', async () => {
    const service = buildService();
    const controller = new AiAssistantController(service as never);

    await controller.ask(tenantId, { question: 'Summarise operations.' });

    expect(service.ask).toHaveBeenCalledWith(tenantId, { question: 'Summarise operations.' });
  });

  it('requires the tenant header', () => {
    const controller = new AiAssistantController(buildService() as never);

    expect(() => controller.ask(undefined, { question: 'Summarise operations.' })).toThrow(
      BadRequestException,
    );
  });
});
