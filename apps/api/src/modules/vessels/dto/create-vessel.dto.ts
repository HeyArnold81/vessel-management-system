import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

import { vesselStatuses, vesselTypes, type VesselStatus } from '@vms/shared';

export class CreateVesselDto {
  @ApiProperty({ example: 'MV Atlantic Meridian' })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiProperty({ example: '9321483' })
  @IsString()
  @Matches(/^\d{7}$/, { message: 'IMO number must be exactly seven digits.' })
  imoNumber!: string;

  @ApiPropertyOptional({ example: '235123456' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{9}$/, { message: 'MMSI must be exactly nine digits.' })
  mmsi?: string | null;

  @ApiPropertyOptional({ example: 'MAZU7' })
  @IsOptional()
  @IsString()
  @Length(3, 12)
  callSign?: string | null;

  @ApiProperty({ example: 'Container Ship', enum: vesselTypes })
  @IsString()
  @IsIn(vesselTypes)
  vesselType!: string;

  @ApiPropertyOptional({ example: 54210 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  grossTonnage?: number | null;

  @ApiPropertyOptional({ example: 294.1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(500)
  lengthOverallM?: number | null;

  @ApiPropertyOptional({ example: 12.4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  @Max(35)
  maxDraftM?: number | null;

  @ApiPropertyOptional({ example: 'active', enum: vesselStatuses })
  @IsOptional()
  @IsIn(vesselStatuses)
  status?: VesselStatus;
}

export class VesselIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, {
    message: 'Vessel id must be a valid UUID.',
  })
  id!: string;
}

export class ListVesselsQueryDto {
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

  @ApiPropertyOptional({ example: 'atlantic' })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  search?: string;

  @ApiPropertyOptional({ example: 'active', enum: vesselStatuses })
  @IsOptional()
  @IsIn(vesselStatuses)
  status?: VesselStatus;

  @ApiPropertyOptional({ example: 'Container Ship' })
  @IsOptional()
  @IsString()
  vesselType?: string;

  @ApiPropertyOptional({ example: 'name' })
  @IsOptional()
  @IsIn(['name', 'imoNumber', 'vesselType', 'status', 'createdAt'])
  sortBy?: 'name' | 'imoNumber' | 'vesselType' | 'status' | 'createdAt' = 'name';

  @ApiPropertyOptional({ example: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: 'asc' | 'desc' = 'asc';
}
