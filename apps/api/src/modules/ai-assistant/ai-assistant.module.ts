import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module.js';
import { AiAssistantController } from './ai-assistant.controller.js';
import { AI_ASSISTANT_REPOSITORY, PrismaAiAssistantRepository } from './ai-assistant.repository.js';
import { AI_ASSISTANT_AUDIT_RECORDER, AiAssistantService } from './ai-assistant.service.js';
import { AI_ASSISTANT_PROVIDER, LocalAiAssistantProvider } from './ai-provider.js';
import { AiAssistantAuditService } from './audit.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [AiAssistantController],
  providers: [
    AiAssistantService,
    AiAssistantAuditService,
    {
      provide: AI_ASSISTANT_REPOSITORY,
      useClass: PrismaAiAssistantRepository,
    },
    {
      provide: AI_ASSISTANT_PROVIDER,
      useClass: LocalAiAssistantProvider,
    },
    {
      provide: AI_ASSISTANT_AUDIT_RECORDER,
      useExisting: AiAssistantAuditService,
    },
  ],
})
export class AiAssistantModule {}
