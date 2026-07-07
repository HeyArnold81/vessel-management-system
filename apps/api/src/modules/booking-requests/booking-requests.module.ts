import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module.js';

import { BookingRequestsAuditService } from './audit.service.js';
import { BookingRequestsController } from './booking-requests.controller.js';
import {
  BOOKING_REQUESTS_REPOSITORY,
  PrismaBookingRequestsRepository,
} from './booking-requests.repository.js';
import { BookingRequestsService } from './booking-requests.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [BookingRequestsController],
  providers: [
    BookingRequestsAuditService,
    BookingRequestsService,
    { provide: BOOKING_REQUESTS_REPOSITORY, useClass: PrismaBookingRequestsRepository },
  ],
  exports: [BookingRequestsService],
})
export class BookingRequestsModule {}
