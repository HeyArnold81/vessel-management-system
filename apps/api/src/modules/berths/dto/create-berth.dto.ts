import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

import { berthStatuses, type BerthStatus } from '@vms/shared';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class CreateBerthDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Terminal id must be a valid UUID.' })
  terminalId!: string;

  @ApiProperty({ example: 'B14' })
  @IsString()
  @Length(1, 40)
  code!: string;

  @ApiProperty({ example: 'Berth 14' })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiPropertyOptional({ example: 320 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(600)
  maxLengthM?: number | null;

  @ApiPropertyOptional({ example: 14.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  @Max(40)
  maxDraftM?: number | null;

  @ApiPropertyOptional({ example: 'active', enum: berthStatuses })
  @IsOptional()
  @IsIn(berthStatuses)
  status?: BerthStatus;
}

export class BerthIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Berth id must be a valid UUID.' })
  id!: string;
}

export class ListBerthsQueryDto {
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

  @ApiPropertyOptional({ example: 'B14' })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  search?: string;

  @ApiPropertyOptional({ example: 'active', enum: berthStatuses })
  @IsOptional()
  @IsIn(berthStatuses)
  status?: BerthStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @Matches(uuidPattern, { message: 'Terminal id must be a valid UUID.' })
  terminalId?: string;

  @ApiPropertyOptional({ example: 'name' })
  @IsOptional()
  @IsIn(['name', 'code', 'status', 'createdAt'])
  sortBy?: 'name' | 'code' | 'status' | 'createdAt' = 'name';

  @ApiPropertyOptional({ example: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: 'asc' | 'desc' = 'asc';
}
