import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
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
  bookingRequestStatuses,
  type BookingRequestSortField,
  type BookingRequestStatus,
} from '@vms/shared';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

export class CreateBookingRequestDto {
  @ApiProperty({ example: 'BR-2026-0001' })
  @IsString()
  @Length(3, 50)
  @Matches(/^[A-Z0-9][A-Z0-9-]*$/, {
    message: 'Request reference must use uppercase letters, numbers, and hyphens.',
  })
  requestReference!: string;

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
  @Matches(uuidPattern, { message: 'Preferred berth id must be a valid UUID.' })
  preferredBerthId?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @Matches(uuidPattern, { message: 'Agent organization id must be a valid UUID.' })
  agentOrganizationId?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @Matches(uuidPattern, { message: 'Customer organization id must be a valid UUID.' })
  customerOrganizationId?: string | null;

  @ApiPropertyOptional({ example: '2026-07-01T10:00:00.000Z' })
  @IsOptional()
  @IsISO8601({ strict: true })
  requestedEta?: string | null;

  @ApiPropertyOptional({ example: '2026-07-02T18:00:00.000Z' })
  @IsOptional()
  @IsISO8601({ strict: true })
  requestedEtd?: string | null;

  @ApiPropertyOptional({ example: 'VOY-7781' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  voyageNumber?: string | null;

  @ApiPropertyOptional({ example: '40 import containers, non-hazardous.' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  cargoSummary?: string | null;

  @ApiPropertyOptional({ example: 'Customer requests Liverpool 2 if available.' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  remarks?: string | null;
}

export class UpdateBookingRequestDto extends PartialType(CreateBookingRequestDto) {
  @ApiPropertyOptional({ example: 'under_review', enum: bookingRequestStatuses })
  @IsOptional()
  @IsIn(bookingRequestStatuses)
  status?: BookingRequestStatus;
}

export class BookingRequestIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Booking request id must be a valid UUID.' })
  id!: string;
}

export class ListBookingRequestsQueryDto {
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

  @ApiPropertyOptional({ example: 'BR-2026' })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  search?: string;

  @ApiPropertyOptional({ example: 'submitted', enum: bookingRequestStatuses })
  @IsOptional()
  @IsIn(bookingRequestStatuses)
  status?: BookingRequestStatus;

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
  @Matches(uuidPattern, { message: 'Preferred berth id must be a valid UUID.' })
  preferredBerthId?: string;

  @ApiPropertyOptional({ example: 'requestedEta' })
  @IsOptional()
  @IsIn(['requestReference', 'requestedEta', 'status', 'createdAt', 'updatedAt'])
  sortBy?: BookingRequestSortField = 'requestedEta';

  @ApiPropertyOptional({ example: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: 'asc' | 'desc' = 'asc';
}
