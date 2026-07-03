import { Controller, Get, Headers, Inject, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

import type { AuditLogRecord, PaginatedResponse } from '@vms/shared';

import { AuditLogsService } from './audit.service.js';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto.js';
import { requireTenantId } from './tenant-context.js';

@ApiTags('Audit Logs')
@ApiSecurity('tenant')
@Controller('v1/audit-logs')
export class AuditLogsController {
  constructor(@Inject(AuditLogsService) private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({
    summary: 'List immutable audit log entries for operational and administration activity.',
  })
  @ApiOkResponse({ description: 'Paginated audit log list.' })
  list(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Query() query: ListAuditLogsQueryDto,
  ): Promise<PaginatedResponse<AuditLogRecord>> {
    return this.auditLogsService.list(requireTenantId(tenantHeader), query);
  }
}
