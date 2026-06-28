import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

import { vesselCallStatuses, type VesselCallStatus } from '@vms/shared';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class CreateVesselCallDto {
  @ApiProperty({ example: 'CALL-2026-0001' })
  @IsString()
  @Length(3, 50)
  @Matches(/^[A-Z0-9][A-Z0-9-]*$/, {
    message: 'Call reference must use uppercase letters, numbers, and hyphens.',
  })
  callReference!: string;

  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Vessel id must be a valid UUID.' })
  vesselId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Port id must be a valid UUID.' })
  portId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @Matches(uuidPattern, { message: 'Berth id must be a valid UUID.' })
  berthId?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @Matches(uuidPattern, { message: 'Agent id must be a valid UUID.' })
  agentId?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @Matches(uuidPattern, { message: 'Operator id must be a valid UUID.' })
  operatorId?: string | null;

  @ApiPropertyOptional({ example: 'VOY-7781' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  voyageNumber?: string | null;

  @ApiPropertyOptional({ example: 'expected', enum: vesselCallStatuses })
  @IsOptional()
  @IsIn(vesselCallStatuses)
  status?: VesselCallStatus;

  @ApiPropertyOptional({ example: '2026-07-01T10:00:00.000Z' })
  @IsOptional()
  @IsISO8601({ strict: true })
  eta?: string | null;

  @ApiPropertyOptional({ example: '2026-07-02T18:00:00.000Z' })
  @IsOptional()
  @IsISO8601({ strict: true })
  etd?: string | null;

  @ApiPropertyOptional({ example: '2026-07-01T11:15:00.000Z' })
  @IsOptional()
  @IsISO8601({ strict: true })
  ata?: string | null;

  @ApiPropertyOptional({ example: '2026-07-02T19:30:00.000Z' })
  @IsOptional()
  @IsISO8601({ strict: true })
  atd?: string | null;

  @ApiPropertyOptional({ example: 'Requires tide window review.' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  remarks?: string | null;
}

export class VesselCallIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Vessel call id must be a valid UUID.' })
  id!: string;
}

export class ListVesselCallsQueryDto {
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

  @ApiPropertyOptional({ example: 'CALL-2026' })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  search?: string;

  @ApiPropertyOptional({ example: 'expected', enum: vesselCallStatuses })
  @IsOptional()
  @IsIn(vesselCallStatuses)
  status?: VesselCallStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @Matches(uuidPattern, { message: 'Vessel id must be a valid UUID.' })
  vesselId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @Matches(uuidPattern, { message: 'Port id must be a valid UUID.' })
  portId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @Matches(uuidPattern, { message: 'Berth id must be a valid UUID.' })
  berthId?: string;

  @ApiPropertyOptional({ example: 'eta' })
  @IsOptional()
  @IsIn(['callReference', 'eta', 'etd', 'status', 'createdAt'])
  sortBy?: 'callReference' | 'eta' | 'etd' | 'status' | 'createdAt' = 'eta';

  @ApiPropertyOptional({ example: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: 'asc' | 'desc' = 'asc';
}
