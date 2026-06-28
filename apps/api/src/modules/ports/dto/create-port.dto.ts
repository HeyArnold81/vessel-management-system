import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';

import { portStatuses, type PortStatus } from '@vms/shared';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class CreatePortDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Country id must be a valid UUID.' })
  countryId!: string;

  @ApiProperty({ example: 'GBLGP' })
  @IsString()
  @Matches(/^[A-Z]{2}[A-Z0-9]{3}$/, {
    message: 'UN/LOCODE must be five uppercase letters or digits, starting with ISO country code.',
  })
  unlocode!: string;

  @ApiProperty({ example: 'London Gateway Port' })
  @IsString()
  @Length(2, 160)
  name!: string;

  @ApiProperty({ example: 'Europe/London' })
  @IsString()
  @Length(3, 80)
  timeZone!: string;

  @ApiPropertyOptional({ example: 'active', enum: portStatuses })
  @IsOptional()
  @IsIn(portStatuses)
  status?: PortStatus;
}

export class PortIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Port id must be a valid UUID.' })
  id!: string;
}

export class ListPortsQueryDto {
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

  @ApiPropertyOptional({ example: 'gateway' })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  search?: string;

  @ApiPropertyOptional({ example: 'active', enum: portStatuses })
  @IsOptional()
  @IsIn(portStatuses)
  status?: PortStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @Matches(uuidPattern, { message: 'Country id must be a valid UUID.' })
  countryId?: string;

  @ApiPropertyOptional({ example: 'name' })
  @IsOptional()
  @IsIn(['name', 'unlocode', 'timeZone', 'status', 'createdAt'])
  sortBy?: 'name' | 'unlocode' | 'timeZone' | 'status' | 'createdAt' = 'name';

  @ApiPropertyOptional({ example: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: 'asc' | 'desc' = 'asc';
}
