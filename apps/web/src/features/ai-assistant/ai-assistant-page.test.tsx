import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AiAssistantPage } from './ai-assistant-page';

describe('AiAssistantPage', () => {
  beforeEach(() => {
    let index = 0;

    Object.defineProperty(globalThis, 'crypto', {
      value: {
        randomUUID: vi.fn(() => {
          index += 1;
          return `aaaaaaaa-aaaa-4aaa-8aaa-${String(index).padStart(12, '0')}`;
        }),
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('submits a question and renders the sourced assistant answer', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({
        answer: 'Billing event BILL-001 needs review.',
        intent: 'billing_readiness',
        sources: [
          {
            id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            type: 'billing_event',
            reference: 'BILL-001',
            label: 'Billing event BILL-001',
            href: '/billing-events?search=BILL-001',
          },
        ],
        limitations: ['This assistant is read-only.'],
        suggestedPrompts: ['Summarise failed billing events.'],
        generatedAt: '2026-06-01T10:00:00.000Z',
      }),
    );

    render(<AiAssistantPage />);

    fireEvent.change(screen.getByLabelText('Question'), {
      target: { value: 'Which billing events need attention?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ask assistant' }));

    await waitFor(() =>
      expect(screen.getByText('Billing event BILL-001 needs review.')).toBeInTheDocument(),
    );
    expect(screen.getByText('billing readiness')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Billing event BILL-001' })).toHaveAttribute(
      'href',
      '/billing-events?search=BILL-001',
    );
  });
});
