import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
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

import type { RoleSortField } from '@vms/shared';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class CreateRoleDto {
  @ApiProperty({ example: 'marine_planner' })
  @IsString()
  @Length(3, 80)
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'Role code must use lowercase letters, numbers, and underscores.',
  })
  code!: string;

  @ApiProperty({ example: 'Marine Planner' })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiPropertyOptional({ example: 'Plans movements and marine services.' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string | null;

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(uuidPattern, { each: true, message: 'Permission ids must be valid UUIDs.' })
  permissionIds?: string[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Marine Planner' })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @ApiPropertyOptional({ example: 'Plans movements and marine services.' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string | null;

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(uuidPattern, { each: true, message: 'Permission ids must be valid UUIDs.' })
  permissionIds?: string[];
}

export class RoleIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Role id must be a valid UUID.' })
  id!: string;
}

export class ListRolesQueryDto {
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

  @ApiPropertyOptional({ example: 'planner' })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  search?: string;

  @ApiPropertyOptional({ example: 'name' })
  @IsOptional()
  @IsIn(['name', 'code', 'createdAt'])
  sortBy?: RoleSortField = 'name';

  @ApiPropertyOptional({ example: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: 'asc' | 'desc' = 'asc';
}

export class ListPermissionsQueryDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeSystem?: boolean = true;
}
