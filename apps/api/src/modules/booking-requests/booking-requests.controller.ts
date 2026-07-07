import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import type { BookingRequestRecord, PaginatedResponse } from '@vms/shared';

import {
  BookingRequestIdParamDto,
  CreateBookingRequestDto,
  ListBookingRequestsQueryDto,
  UpdateBookingRequestDto,
} from './dto/booking-request.dto.js';
import { BookingRequestsService } from './booking-requests.service.js';
import { requireTenantId } from './tenant-context.js';

@ApiTags('Booking Requests')
@ApiSecurity('tenant')
@Controller('v1/booking-requests')
export class BookingRequestsController {
  constructor(
    @Inject(BookingRequestsService)
    private readonly bookingRequestsService: BookingRequestsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List booking requests with search, filters, sorting, and pagination.' })
  @ApiOkResponse({ description: 'Paginated booking request list.' })
  list(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Query() query: ListBookingRequestsQueryDto,
  ): Promise<PaginatedResponse<BookingRequestRecord>> {
    return this.bookingRequestsService.list(requireTenantId(tenantHeader), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one booking request by id.' })
  @ApiOkResponse({ description: 'Booking request found.' })
  getById(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: BookingRequestIdParamDto,
  ): Promise<BookingRequestRecord> {
    return this.bookingRequestsService.getById(requireTenantId(tenantHeader), params.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a booking request before confirming a vessel call.' })
  @ApiCreatedResponse({ description: 'Booking request created.' })
  create(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Body() body: CreateBookingRequestDto,
  ): Promise<BookingRequestRecord> {
    return this.bookingRequestsService.create(requireTenantId(tenantHeader), body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a booking request.' })
  @ApiOkResponse({ description: 'Booking request updated.' })
  update(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: BookingRequestIdParamDto,
    @Body() body: UpdateBookingRequestDto,
  ): Promise<BookingRequestRecord> {
    return this.bookingRequestsService.update(requireTenantId(tenantHeader), params.id, body);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit a draft booking request for port review.' })
  @ApiOkResponse({ description: 'Booking request submitted.' })
  submit(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: BookingRequestIdParamDto,
  ): Promise<BookingRequestRecord> {
    return this.bookingRequestsService.transition(
      requireTenantId(tenantHeader),
      params.id,
      'submitted',
    );
  }

  @Post(':id/start-review')
  @ApiOperation({ summary: 'Move a submitted booking request into port review.' })
  @ApiOkResponse({ description: 'Booking request moved into review.' })
  startReview(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: BookingRequestIdParamDto,
  ): Promise<BookingRequestRecord> {
    return this.bookingRequestsService.transition(
      requireTenantId(tenantHeader),
      params.id,
      'under_review',
    );
  }

  @Post(':id/mark-availability-checked')
  @ApiOperation({ summary: 'Mark availability as checked for a booking request.' })
  @ApiOkResponse({ description: 'Booking request availability checked.' })
  markAvailabilityChecked(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: BookingRequestIdParamDto,
  ): Promise<BookingRequestRecord> {
    return this.bookingRequestsService.transition(
      requireTenantId(tenantHeader),
      params.id,
      'availability_checked',
    );
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a booking request for confirmation.' })
  @ApiOkResponse({ description: 'Booking request approved.' })
  approve(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: BookingRequestIdParamDto,
  ): Promise<BookingRequestRecord> {
    return this.bookingRequestsService.transition(
      requireTenantId(tenantHeader),
      params.id,
      'approved',
    );
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a booking request.' })
  @ApiOkResponse({ description: 'Booking request rejected.' })
  reject(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: BookingRequestIdParamDto,
  ): Promise<BookingRequestRecord> {
    return this.bookingRequestsService.transition(
      requireTenantId(tenantHeader),
      params.id,
      'rejected',
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a booking request.' })
  @ApiOkResponse({ description: 'Booking request cancelled.' })
  remove(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: BookingRequestIdParamDto,
  ): Promise<BookingRequestRecord> {
    return this.bookingRequestsService.remove(requireTenantId(tenantHeader), params.id);
  }
}
