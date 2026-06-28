import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

import {
  billingExportBatchStatuses,
  type BillingExportBatchSortField,
  type BillingExportBatchStatus,
} from '@vms/shared';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class CreateBillingExportBatchDto {
  @ApiProperty({ example: 'SAP' })
  @IsString()
  @Length(2, 40)
  erpSystem!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Matches(uuidPattern, { each: true, message: 'Billing event ids must be valid UUIDs.' })
  billingEventIds!: string[];

  @ApiPropertyOptional({ example: 'ERP-EXPORT-2026-0001' })
  @IsOptional()
  @IsString()
  @Length(3, 80)
  @Matches(/^[A-Z0-9][A-Z0-9-]*$/, {
    message: 'Batch reference must use uppercase letters, numbers, and hyphens.',
  })
  batchReference?: string;
}

export class UpdateBillingExportBatchDto {
  @ApiPropertyOptional({ example: 'exported', enum: billingExportBatchStatuses })
  @IsOptional()
  @IsIn(billingExportBatchStatuses)
  status?: BillingExportBatchStatus;

  @ApiPropertyOptional({ example: 'SAP-DOC-90000123' })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  externalReference?: string | null;

  @ApiPropertyOptional({ example: 'ERP endpoint rejected payload.' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  failureReason?: string | null;
}

export class BillingExportBatchIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Billing export batch id must be a valid UUID.' })
  id!: string;
}

export class ListBillingExportBatchesQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @ApiPropertyOptional({ example: 'ERP-EXPORT-2026' })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  search?: string;

  @ApiPropertyOptional({ example: 'queued', enum: billingExportBatchStatuses })
  @IsOptional()
  @IsIn(billingExportBatchStatuses)
  status?: BillingExportBatchStatus;

  @ApiPropertyOptional({ example: 'SAP' })
  @IsOptional()
  @IsString()
  @Length(2, 40)
  erpSystem?: string;

  @ApiPropertyOptional({ example: 'requestedAt' })
  @IsOptional()
  @IsIn(['batchReference', 'status', 'requestedAt', 'completedAt'])
  sortBy?: BillingExportBatchSortField = 'requestedAt';

  @ApiPropertyOptional({ example: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: 'asc' | 'desc' = 'desc';
}
