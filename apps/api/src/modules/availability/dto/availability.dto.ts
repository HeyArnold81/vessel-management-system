import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsISO8601, IsOptional, IsString, Matches } from 'class-validator';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

export class AvailabilityCheckDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @Matches(uuidPattern, { message: 'Booking request id must be a valid UUID.' })
  bookingRequestId?: string;

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

  @ApiProperty({ example: '2026-07-01T10:00:00.000Z' })
  @IsISO8601({ strict: true })
  requestedEta!: string;

  @ApiProperty({ example: '2026-07-02T18:00:00.000Z' })
  @IsISO8601({ strict: true })
  requestedEtd!: string;

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(uuidPattern, { each: true, message: 'Cargo item id must be a valid UUID.' })
  cargoItemIds?: readonly string[];

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(uuidPattern, { each: true, message: 'Service id must be a valid UUID.' })
  requestedServiceIds?: readonly string[];
}

export class AvailabilityCheckIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Availability check id must be a valid UUID.' })
  id!: string;
}
