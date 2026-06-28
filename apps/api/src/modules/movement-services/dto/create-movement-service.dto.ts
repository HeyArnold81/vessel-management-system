import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

import { movementServiceStatuses, type MovementServiceStatus } from '@vms/shared';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class CreateMovementServiceDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Movement id must be a valid UUID.' })
  movementId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Service id must be a valid UUID.' })
  serviceId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @Matches(uuidPattern, { message: 'Provider organization id must be a valid UUID.' })
  providerOrganizationId?: string | null;

  @ApiPropertyOptional({ example: 'requested', enum: movementServiceStatuses })
  @IsOptional()
  @IsIn(movementServiceStatuses)
  status?: MovementServiceStatus;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity!: number;

  @ApiProperty({ example: 'job' })
  @IsString()
  @Length(1, 30)
  unitOfMeasure!: string;

  @ApiPropertyOptional({ example: '2026-07-01T10:00:00.000Z' })
  @IsOptional()
  @IsISO8601({ strict: true })
  requestedAt?: string | null;

  @ApiPropertyOptional({ example: '2026-07-01T12:00:00.000Z' })
  @IsOptional()
  @IsISO8601({ strict: true })
  completedAt?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isBillable?: boolean;
}

export class MovementServiceIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Movement service id must be a valid UUID.' })
  id!: string;
}

export class ListMovementServicesQueryDto {
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

  @ApiPropertyOptional({ example: 'requested', enum: movementServiceStatuses })
  @IsOptional()
  @IsIn(movementServiceStatuses)
  status?: MovementServiceStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @Matches(uuidPattern, { message: 'Movement id must be a valid UUID.' })
  movementId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @Matches(uuidPattern, { message: 'Service id must be a valid UUID.' })
  serviceId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @Matches(uuidPattern, { message: 'Provider organization id must be a valid UUID.' })
  providerOrganizationId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return value;
  })
  @IsBoolean()
  isBillable?: boolean;

  @ApiPropertyOptional({ example: 'requestedAt' })
  @IsOptional()
  @IsIn(['status', 'requestedAt', 'completedAt', 'createdAt'])
  sortBy?: 'status' | 'requestedAt' | 'completedAt' | 'createdAt' = 'requestedAt';

  @ApiPropertyOptional({ example: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: 'asc' | 'desc' = 'asc';
}
