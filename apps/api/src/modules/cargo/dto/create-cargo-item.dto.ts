import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
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
  cargoCategories,
  cargoItemStatuses,
  type CargoCategory,
  type CargoItemStatus,
} from '@vms/shared';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class CreateCargoItemDto {
  @ApiProperty({ example: 'IRON-ORE' })
  @IsString()
  @Length(2, 40)
  @Matches(/^[A-Z0-9][A-Z0-9-]*$/, {
    message: 'Cargo code must use uppercase letters, numbers, and hyphens.',
  })
  cargoCode!: string;

  @ApiProperty({ example: 'Iron Ore Fines' })
  @IsString()
  @Length(2, 160)
  name!: string;

  @ApiProperty({ example: 'bulk', enum: cargoCategories })
  @IsIn(cargoCategories)
  cargoCategory!: CargoCategory;

  @ApiPropertyOptional({ example: '1202' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/, { message: 'UN number must be four digits.' })
  unNumber?: string | null;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isHazardous?: boolean;

  @ApiPropertyOptional({ example: 'active', enum: cargoItemStatuses })
  @IsOptional()
  @IsIn(cargoItemStatuses)
  status?: CargoItemStatus;
}

export class CargoItemIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Cargo item id must be a valid UUID.' })
  id!: string;
}

export class ListCargoItemsQueryDto {
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

  @ApiPropertyOptional({ example: 'iron' })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  search?: string;

  @ApiPropertyOptional({ example: 'active', enum: cargoItemStatuses })
  @IsOptional()
  @IsIn(cargoItemStatuses)
  status?: CargoItemStatus;

  @ApiPropertyOptional({ example: 'bulk', enum: cargoCategories })
  @IsOptional()
  @IsIn(cargoCategories)
  cargoCategory?: CargoCategory;

  @ApiPropertyOptional({ example: false })
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
  isHazardous?: boolean;

  @ApiPropertyOptional({ example: 'name' })
  @IsOptional()
  @IsIn(['name', 'cargoCode', 'cargoCategory', 'status', 'createdAt'])
  sortBy?: 'name' | 'cargoCode' | 'cargoCategory' | 'status' | 'createdAt' = 'name';

  @ApiPropertyOptional({ example: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: 'asc' | 'desc' = 'asc';
}
