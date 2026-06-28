import { describe, expect, it, vi } from 'vitest';

import type { AiAssistantContext, AiAssistantRepository } from './ai-assistant.repository.js';
import { AiAssistantService } from './ai-assistant.service.js';
import type { AiAssistantProvider } from './ai-provider.js';

const tenantId = '11111111-1111-4111-8111-111111111111';

const context: AiAssistantContext = {
  counts: {
    vesselCalls: 2,
    movements: 1,
    movementServices: 1,
    billingEvents: 1,
    failedBillingEvents: 1,
    pendingBillingEvents: 0,
  },
  items: [
    {
      type: 'billing_event',
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      reference: 'BILL-001',
      label: 'Billing event BILL-001',
      status: 'failed',
      detail: 'ERP timeout.',
      occurredAt: new Date('2026-06-01T00:00:00.000Z'),
      href: '/billing-events?search=BILL-001',
    },
  ],
};

function buildRepository(overrides: Partial<AiAssistantRepository> = {}): AiAssistantRepository {
  return {
    buildContext: vi.fn().mockResolvedValue(context),
    ...overrides,
  };
}

function buildProvider(overrides: Partial<AiAssistantProvider> = {}): AiAssistantProvider {
  return {
    generate: vi.fn().mockResolvedValue({
      intent: 'billing_readiness',
      answer: 'Billing event BILL-001 needs review.',
      sources: [
        {
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          type: 'billing_event',
          reference: 'BILL-001',
          label: 'Billing event BILL-001',
          href: '/billing-events?search=BILL-001',
        },
      ],
      limitations: ['Read-only assistant.'],
      suggestedPrompts: ['Summarise failed billing events.'],
    }),
    ...overrides,
  };
}

describe('AiAssistantService', () => {
  it('generates a sourced assistant response and records audit metadata', async () => {
    const audit = { record: vi.fn() };
    const provider = buildProvider();
    const service = new AiAssistantService(buildRepository(), provider, audit);

    const response = await service.ask(tenantId, {
      question: 'Which billing events need attention?',
    });

    expect(response.answer).toContain('BILL-001');
    expect(provider.generate).toHaveBeenCalledWith(
      expect.objectContaining({ intent: 'billing_readiness' }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId, intent: 'billing_readiness', sourceCount: 1 }),
    );
  });

  it('classifies write requests as unsupported', async () => {
    const provider = buildProvider();
    const service = new AiAssistantService(buildRepository(), provider, { record: vi.fn() });

    await service.ask(tenantId, { question: 'Approve this billing event for export.' });

    expect(provider.generate).toHaveBeenCalledWith(
      expect.objectContaining({ intent: 'unsupported_write_request' }),
    );
  });
});
