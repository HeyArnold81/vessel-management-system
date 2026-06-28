import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import type { BillingEventRecord, PaginatedResponse } from '@vms/shared';

import {
  BillingEventIdParamDto,
  CreateBillingEventDto,
  ListBillingEventsQueryDto,
  UpdateBillingEventDto,
} from './dto/create-billing-event.dto.js';
import { BillingEventsService } from './billing-events.service.js';
import { requireTenantId } from './tenant-context.js';

@ApiTags('Billing Events')
@ApiSecurity('tenant')
@Controller('v1/billing-events')
export class BillingEventsController {
  constructor(
    @Inject(BillingEventsService)
    private readonly billingEventsService: BillingEventsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List billing events with filtering, sorting, and pagination.' })
  @ApiOkResponse({ description: 'Paginated billing event list.' })
  list(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Query() query: ListBillingEventsQueryDto,
  ): Promise<PaginatedResponse<BillingEventRecord>> {
    return this.billingEventsService.list(requireTenantId(tenantHeader), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one billing event by id.' })
  @ApiOkResponse({ description: 'Billing event found.' })
  getById(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: BillingEventIdParamDto,
  ): Promise<BillingEventRecord> {
    return this.billingEventsService.getById(requireTenantId(tenantHeader), params.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a billing event from a billable movement service.' })
  @ApiCreatedResponse({ description: 'Billing event created.' })
  create(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Body() body: CreateBillingEventDto,
  ): Promise<BillingEventRecord> {
    return this.billingEventsService.create(requireTenantId(tenantHeader), body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update billing review or ERP export status.' })
  @ApiOkResponse({ description: 'Billing event updated.' })
  update(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: BillingEventIdParamDto,
    @Body() body: UpdateBillingEventDto,
  ): Promise<BillingEventRecord> {
    return this.billingEventsService.update(requireTenantId(tenantHeader), params.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a billing event.' })
  @ApiOkResponse({ description: 'Billing event rejected.' })
  remove(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: BillingEventIdParamDto,
  ): Promise<BillingEventRecord> {
    return this.billingEventsService.remove(requireTenantId(tenantHeader), params.id);
  }
}
