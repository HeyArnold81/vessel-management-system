import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
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
  authProviders,
  userStatuses,
  type AuthProvider,
  type UserSortField,
  type UserStatus,
} from '@vms/shared';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class CreateUserDto {
  @ApiProperty({ example: 'planner@example.com' })
  @IsEmail()
  @Length(3, 254)
  email!: string;

  @ApiProperty({ example: 'Marine Planner' })
  @IsString()
  @Length(2, 160)
  displayName!: string;

  @ApiPropertyOptional({ example: 'local', enum: authProviders })
  @IsOptional()
  @IsIn(authProviders)
  authProvider?: AuthProvider = 'local';

  @ApiPropertyOptional({ example: 'entra-object-id' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  externalSubject?: string | null;

  @ApiPropertyOptional({ example: 'active', enum: userStatuses })
  @IsOptional()
  @IsIn(userStatuses)
  status?: UserStatus = 'invited';
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'planner@example.com' })
  @IsOptional()
  @IsEmail()
  @Length(3, 254)
  email?: string;

  @ApiPropertyOptional({ example: 'Marine Planner' })
  @IsOptional()
  @IsString()
  @Length(2, 160)
  displayName?: string;

  @ApiPropertyOptional({ example: 'local', enum: authProviders })
  @IsOptional()
  @IsIn(authProviders)
  authProvider?: AuthProvider;

  @ApiPropertyOptional({ example: 'entra-object-id' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  externalSubject?: string | null;

  @ApiPropertyOptional({ example: 'active', enum: userStatuses })
  @IsOptional()
  @IsIn(userStatuses)
  status?: UserStatus;
}

export class AssignUserRoleDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Role id must be a valid UUID.' })
  roleId!: string;
}

export class UserIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'User id must be a valid UUID.' })
  id!: string;
}

export class UserRoleParamDto extends UserIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Role id must be a valid UUID.' })
  roleId!: string;
}

export class ListUsersQueryDto {
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

  @ApiPropertyOptional({ example: 'active', enum: userStatuses })
  @IsOptional()
  @IsIn(userStatuses)
  status?: UserStatus;

  @ApiPropertyOptional({ example: 'local', enum: authProviders })
  @IsOptional()
  @IsIn(authProviders)
  authProvider?: AuthProvider;

  @ApiPropertyOptional({ example: 'displayName' })
  @IsOptional()
  @IsIn(['displayName', 'email', 'status', 'createdAt'])
  sortBy?: UserSortField = 'displayName';

  @ApiPropertyOptional({ example: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: 'asc' | 'desc' = 'asc';
}
