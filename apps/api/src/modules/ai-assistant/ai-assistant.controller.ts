import { Body, Controller, Headers, Inject, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

import type { AiAssistantResponse } from '@vms/shared';

import { AiAssistantService } from './ai-assistant.service.js';
import { AskAiDto } from './dto/ask-ai.dto.js';
import { requireTenantId } from './tenant-context.js';

@ApiTags('AI Assistant')
@ApiSecurity('tenant')
@Controller('v1/ai')
export class AiAssistantController {
  constructor(
    @Inject(AiAssistantService)
    private readonly aiAssistantService: AiAssistantService,
  ) {}

  @Post('ask')
  @ApiOperation({ summary: 'Ask the read-only AI operations assistant.' })
  @ApiCreatedResponse({ description: 'AI assistant response generated.' })
  ask(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Body() body: AskAiDto,
  ): Promise<AiAssistantResponse> {
    return this.aiAssistantService.ask(requireTenantId(tenantHeader), body);
  }
}
