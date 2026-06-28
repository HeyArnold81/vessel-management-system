import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service.js';

const aiAssistantAuditEntityId = '00000000-0000-4000-8000-000000000001';

type AiAuditRecordInput = {
  readonly tenantId: string;
  readonly question: string;
  readonly intent: string;
  readonly sourceCount: number;
  readonly limitationCount: number;
};

@Injectable()
export class AiAssistantAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AiAuditRecordInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        action: 'ai.ask',
        entityType: 'ai_assistant',
        entityId: aiAssistantAuditEntityId,
        metadata: {
          questionLength: input.question.length,
          intent: input.intent,
          sourceCount: input.sourceCount,
          limitationCount: input.limitationCount,
        },
      },
    });
  }
}
