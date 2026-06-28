import type {
  AiAssistantIntent,
  AiAssistantMessage,
  AiAssistantResponse,
  AiAssistantSource,
} from '@vms/shared';

import type { AiAssistantContext } from './ai-assistant.repository.js';

export type AiProviderInput = {
  readonly question: string;
  readonly conversation: readonly AiAssistantMessage[];
  readonly context: AiAssistantContext;
  readonly intent: AiAssistantIntent;
};

export interface AiAssistantProvider {
  generate(input: AiProviderInput): Promise<Omit<AiAssistantResponse, 'generatedAt'>>;
}

export const AI_ASSISTANT_PROVIDER = Symbol('AI_ASSISTANT_PROVIDER');

export class LocalAiAssistantProvider implements AiAssistantProvider {
  async generate(input: AiProviderInput): Promise<Omit<AiAssistantResponse, 'generatedAt'>> {
    const sources = this.toSources(input.context);
    const limitations = [
      'This assistant is read-only and cannot create, update, approve, or export records.',
      'The response is based on a bounded operational snapshot, not the full database.',
    ];

    if (input.intent === 'unsupported_write_request') {
      return {
        intent: input.intent,
        answer:
          'I cannot perform write actions. I can help review the relevant vessel calls, movements, services, or billing events so a user can make the change manually.',
        sources,
        limitations,
        suggestedPrompts: this.suggestedPrompts(input.intent),
      };
    }

    return {
      intent: input.intent,
      answer: this.buildAnswer(input),
      sources,
      limitations,
      suggestedPrompts: this.suggestedPrompts(input.intent),
    };
  }

  private buildAnswer(input: AiProviderInput): string {
    if (input.intent === 'billing_readiness') {
      return this.buildBillingAnswer(input.context);
    }

    if (input.intent === 'exception_review') {
      return this.buildExceptionAnswer(input.context);
    }

    return this.buildOperationsAnswer(input.context);
  }

  private buildOperationsAnswer(context: AiAssistantContext): string {
    const latestItems = context.items.slice(0, 5);
    const highlights = latestItems
      .map((item) => `- ${item.label}: ${item.status}; ${item.detail}`)
      .join('\n');

    return [
      `I found ${context.counts.vesselCalls} vessel calls, ${context.counts.movements} movements, and ${context.counts.movementServices} movement services in the current operational snapshot.`,
      highlights ? `Key records:\n${highlights}` : 'No matching operational records were found.',
      'Use the linked sources to open the underlying records before making operational decisions.',
    ].join('\n\n');
  }

  private buildBillingAnswer(context: AiAssistantContext): string {
    const billingItems = context.items.filter((item) => item.type === 'billing_event');
    const highlights = billingItems
      .slice(0, 6)
      .map((item) => `- ${item.label}: ${item.status}; ${item.detail}`)
      .join('\n');

    return [
      `${context.counts.pendingBillingEvents} billing events are pending review and ${context.counts.failedBillingEvents} are failed or rejected.`,
      highlights
        ? `Billing records needing attention:\n${highlights}`
        : 'No billing exceptions were found in the bounded snapshot.',
      'Before ERP export, check that billable services are complete, ERP system is assigned, and failed events have a resolved failure reason.',
    ].join('\n\n');
  }

  private buildExceptionAnswer(context: AiAssistantContext): string {
    const exceptionItems = context.items.filter((item) =>
      ['failed', 'rejected', 'cancelled', 'on_hold'].includes(item.status),
    );
    const highlights = exceptionItems
      .slice(0, 6)
      .map((item) => `- ${item.label}: ${item.status}; ${item.detail}`)
      .join('\n');

    return [
      `I found ${context.counts.failedBillingEvents} failed or rejected billing events in the current snapshot.`,
      highlights
        ? `Exceptions:\n${highlights}`
        : 'No high-priority exceptions were found in the bounded snapshot.',
      'Review the source records and audit trail before deciding whether an operational correction or ERP retry is needed.',
    ].join('\n\n');
  }

  private toSources(context: AiAssistantContext): readonly AiAssistantSource[] {
    return context.items.slice(0, 8).map((item) => ({
      id: item.id,
      type: item.type,
      reference: item.reference,
      label: item.label,
      href: item.href,
    }));
  }

  private suggestedPrompts(intent: AiAssistantIntent): readonly string[] {
    if (intent === 'billing_readiness') {
      return [
        'Which billing events are not ready for ERP export?',
        'Summarise failed billing events.',
        'What should finance review first?',
      ];
    }

    return [
      'Summarise today’s operational picture.',
      'Which vessel calls need attention?',
      'Show movement and service exceptions.',
    ];
  }
}
