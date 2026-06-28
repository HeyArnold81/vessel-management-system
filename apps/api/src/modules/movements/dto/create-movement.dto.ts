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

import {
  movementStatuses,
  movementTypes,
  type MovementStatus,
  type MovementType,
} from '@vms/shared';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class CreateMovementDto {
  @ApiProperty({ example: 'MOVE-2026-0001' })
  @IsString()
  @Length(3, 50)
  @Matches(/^[A-Z0-9][A-Z0-9-]*$/, {
    message: 'Movement reference must use uppercase letters, numbers, and hyphens.',
  })
  movementReference!: string;

  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Vessel call id must be a valid UUID.' })
  vesselCallId!: string;

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
  @Matches(uuidPattern, { message: 'From berth id must be a valid UUID.' })
  fromBerthId?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @Matches(uuidPattern, { message: 'To berth id must be a valid UUID.' })
  toBerthId?: string | null;

  @ApiProperty({ example: 'arrival', enum: movementTypes })
  @IsIn(movementTypes)
  movementType!: MovementType;

  @ApiPropertyOptional({ example: 'planned', enum: movementStatuses })
  @IsOptional()
  @IsIn(movementStatuses)
  status?: MovementStatus;

  @ApiPropertyOptional({ example: '2026-07-01T10:00:00.000Z' })
  @IsOptional()
  @IsISO8601({ strict: true })
  plannedAt?: string | null;

  @ApiPropertyOptional({ example: '2026-07-01T10:25:00.000Z' })
  @IsOptional()
  @IsISO8601({ strict: true })
  actualAt?: string | null;

  @ApiPropertyOptional({ example: 'Pilot boarded at fairway buoy.' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  remarks?: string | null;
}

export class MovementIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Movement id must be a valid UUID.' })
  id!: string;
}

export class ListMovementsQueryDto {
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

  @ApiPropertyOptional({ example: 'MOVE-2026' })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  search?: string;

  @ApiPropertyOptional({ example: 'planned', enum: movementStatuses })
  @IsOptional()
  @IsIn(movementStatuses)
  status?: MovementStatus;

  @ApiPropertyOptional({ example: 'arrival', enum: movementTypes })
  @IsOptional()
  @IsIn(movementTypes)
  movementType?: MovementType;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @Matches(uuidPattern, { message: 'Vessel call id must be a valid UUID.' })
  vesselCallId?: string;

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

  @ApiPropertyOptional({ example: 'plannedAt' })
  @IsOptional()
  @IsIn(['movementReference', 'plannedAt', 'actualAt', 'status', 'createdAt'])
  sortBy?: 'movementReference' | 'plannedAt' | 'actualAt' | 'status' | 'createdAt' = 'plannedAt';

  @ApiPropertyOptional({ example: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: 'asc' | 'desc' = 'asc';
}
