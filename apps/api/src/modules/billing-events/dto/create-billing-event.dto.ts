import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

import {
  billingEventStatuses,
  type BillingEventPayload,
  type BillingEventStatus,
} from '@vms/shared';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class CreateBillingEventDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Movement service id must be a valid UUID.' })
  movementServiceId!: string;

  @ApiPropertyOptional({ example: 'BILL-2026-0001' })
  @IsOptional()
  @IsString()
  @Length(3, 60)
  @Matches(/^[A-Z0-9][A-Z0-9-]*$/, {
    message: 'Billing event reference must use uppercase letters, numbers, and hyphens.',
  })
  eventReference?: string;

  @ApiPropertyOptional({ example: 'SAP' })
  @IsOptional()
  @IsString()
  @Length(2, 40)
  erpSystem?: string | null;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  payload?: BillingEventPayload;
}

export class UpdateBillingEventDto {
  @ApiPropertyOptional({ example: 'ready', enum: billingEventStatuses })
  @IsOptional()
  @IsIn(billingEventStatuses)
  status?: BillingEventStatus;

  @ApiPropertyOptional({ example: 'SAP' })
  @IsOptional()
  @IsString()
  @Length(2, 40)
  erpSystem?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @Matches(uuidPattern, { message: 'Export batch id must be a valid UUID.' })
  exportBatchId?: string | null;

  @ApiPropertyOptional({ example: 'Rejected by ERP validation.' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  failureReason?: string | null;
}

export class BillingEventIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Billing event id must be a valid UUID.' })
  id!: string;
}

export class ListBillingEventsQueryDto {
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

  @ApiPropertyOptional({ example: 'BILL-2026' })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  search?: string;

  @ApiPropertyOptional({ example: 'ready', enum: billingEventStatuses })
  @IsOptional()
  @IsIn(billingEventStatuses)
  status?: BillingEventStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @Matches(uuidPattern, { message: 'Movement service id must be a valid UUID.' })
  movementServiceId?: string;

  @ApiPropertyOptional({ example: 'SAP' })
  @IsOptional()
  @IsString()
  @Length(2, 40)
  erpSystem?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @Matches(uuidPattern, { message: 'Export batch id must be a valid UUID.' })
  exportBatchId?: string;

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  @IsIn(['eventReference', 'status', 'createdAt', 'exportedAt'])
  sortBy?: 'eventReference' | 'status' | 'createdAt' | 'exportedAt' = 'createdAt';

  @ApiPropertyOptional({ example: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: 'asc' | 'desc' = 'desc';
}
