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
  serviceCatalogStatuses,
  serviceCategories,
  type ServiceCatalogStatus,
  type ServiceCategory,
} from '@vms/shared';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class CreateServiceCatalogDto {
  @ApiProperty({ example: 'PILOTAGE' })
  @IsString()
  @Length(2, 40)
  @Matches(/^[A-Z0-9][A-Z0-9-]*$/, {
    message: 'Service code must use uppercase letters, numbers, and hyphens.',
  })
  code!: string;

  @ApiProperty({ example: 'Harbour Pilotage' })
  @IsString()
  @Length(2, 160)
  name!: string;

  @ApiProperty({ example: 'pilotage', enum: serviceCategories })
  @IsIn(serviceCategories)
  category!: ServiceCategory;

  @ApiProperty({ example: 'job' })
  @IsString()
  @Length(1, 30)
  defaultUnit!: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isBillable?: boolean;

  @ApiPropertyOptional({ example: 'active', enum: serviceCatalogStatuses })
  @IsOptional()
  @IsIn(serviceCatalogStatuses)
  status?: ServiceCatalogStatus;
}

export class ServiceCatalogIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Service id must be a valid UUID.' })
  id!: string;
}

export class ListServiceCatalogQueryDto {
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

  @ApiPropertyOptional({ example: 'pilot' })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  search?: string;

  @ApiPropertyOptional({ example: 'active', enum: serviceCatalogStatuses })
  @IsOptional()
  @IsIn(serviceCatalogStatuses)
  status?: ServiceCatalogStatus;

  @ApiPropertyOptional({ example: 'pilotage', enum: serviceCategories })
  @IsOptional()
  @IsIn(serviceCategories)
  category?: ServiceCategory;

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

  @ApiPropertyOptional({ example: 'name' })
  @IsOptional()
  @IsIn(['name', 'code', 'category', 'status', 'createdAt'])
  sortBy?: 'name' | 'code' | 'category' | 'status' | 'createdAt' = 'name';

  @ApiPropertyOptional({ example: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: 'asc' | 'desc' = 'asc';
}
