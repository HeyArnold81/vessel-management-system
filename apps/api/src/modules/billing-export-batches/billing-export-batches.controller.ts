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

import type { BillingExportBatchRecord, PaginatedResponse } from '@vms/shared';

import { BillingExportBatchesService } from './billing-export-batches.service.js';
import {
  BillingExportBatchIdParamDto,
  CreateBillingExportBatchDto,
  ListBillingExportBatchesQueryDto,
  UpdateBillingExportBatchDto,
} from './dto/create-billing-export-batch.dto.js';
import { requireTenantId } from './tenant-context.js';

@ApiTags('Billing Export Batches')
@ApiSecurity('tenant')
@Controller('v1/billing-export-batches')
export class BillingExportBatchesController {
  constructor(
    @Inject(BillingExportBatchesService)
    private readonly billingExportBatchesService: BillingExportBatchesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List billing export batches with filtering and pagination.' })
  @ApiOkResponse({ description: 'Paginated billing export batch list.' })
  list(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Query() query: ListBillingExportBatchesQueryDto,
  ): Promise<PaginatedResponse<BillingExportBatchRecord>> {
    return this.billingExportBatchesService.list(requireTenantId(tenantHeader), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one billing export batch by id.' })
  @ApiOkResponse({ description: 'Billing export batch found.' })
  getById(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: BillingExportBatchIdParamDto,
  ): Promise<BillingExportBatchRecord> {
    return this.billingExportBatchesService.getById(requireTenantId(tenantHeader), params.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an ERP export batch from ready billing events.' })
  @ApiCreatedResponse({ description: 'Billing export batch created.' })
  create(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Body() body: CreateBillingExportBatchDto,
  ): Promise<BillingExportBatchRecord> {
    return this.billingExportBatchesService.create(requireTenantId(tenantHeader), body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ERP export lifecycle status.' })
  @ApiOkResponse({ description: 'Billing export batch updated.' })
  update(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: BillingExportBatchIdParamDto,
    @Body() body: UpdateBillingExportBatchDto,
  ): Promise<BillingExportBatchRecord> {
    return this.billingExportBatchesService.update(requireTenantId(tenantHeader), params.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a queued billing export batch.' })
  @ApiOkResponse({ description: 'Billing export batch cancelled.' })
  remove(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: BillingExportBatchIdParamDto,
  ): Promise<BillingExportBatchRecord> {
    return this.billingExportBatchesService.remove(requireTenantId(tenantHeader), params.id);
  }
}
