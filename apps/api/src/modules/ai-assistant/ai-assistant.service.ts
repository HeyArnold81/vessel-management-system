import { Inject, Injectable } from '@nestjs/common';

import type { AiAssistantAskInput, AiAssistantIntent, AiAssistantResponse } from '@vms/shared';

import { AiAssistantAuditService } from './audit.service.js';
import { AI_ASSISTANT_PROVIDER, type AiAssistantProvider } from './ai-provider.js';
import { AI_ASSISTANT_REPOSITORY, type AiAssistantRepository } from './ai-assistant.repository.js';

type AiAssistantAuditRecorder = Pick<AiAssistantAuditService, 'record'>;

export const AI_ASSISTANT_AUDIT_RECORDER = Symbol('AI_ASSISTANT_AUDIT_RECORDER');

@Injectable()
export class AiAssistantService {
  constructor(
    @Inject(AI_ASSISTANT_REPOSITORY)
    private readonly repository: AiAssistantRepository,
    @Inject(AI_ASSISTANT_PROVIDER)
    private readonly provider: AiAssistantProvider,
    @Inject(AI_ASSISTANT_AUDIT_RECORDER)
    private readonly auditService: AiAssistantAuditRecorder,
  ) {}

  async ask(tenantId: string, input: AiAssistantAskInput): Promise<AiAssistantResponse> {
    const question = input.question.trim();
    const intent = this.detectIntent(question);
    const context = await this.repository.buildContext(tenantId, question);
    const generated = await this.provider.generate({
      question,
      conversation: input.conversation ?? [],
      context,
      intent,
    });
    const response = {
      ...generated,
      generatedAt: new Date().toISOString(),
    };

    await this.auditService.record({
      tenantId,
      question,
      intent: response.intent,
      sourceCount: response.sources.length,
      limitationCount: response.limitations.length,
    });

    return response;
  }

  private detectIntent(question: string): AiAssistantIntent {
    const normalized = question.toLowerCase();

    if (/\b(create|update|delete|approve|export|cancel|change|assign|save)\b/.test(normalized)) {
      return 'unsupported_write_request';
    }

    if (/\b(billing|invoice|erp|export|finance|failed|rejected)\b/.test(normalized)) {
      return 'billing_readiness';
    }

    if (/\b(exception|attention|delay|failed|rejected|conflict|problem|risk)\b/.test(normalized)) {
      return 'exception_review';
    }

    if (
      /\b(summary|summarise|summarize|today|operations|movement|arrival|departure)\b/.test(
        normalized,
      )
    ) {
      return 'operations_summary';
    }

    return 'general_question';
  }
}
