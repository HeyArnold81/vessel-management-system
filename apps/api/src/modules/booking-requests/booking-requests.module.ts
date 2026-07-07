import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module.js';

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
    BookingRequestsService,
    { provide: BOOKING_REQUESTS_REPOSITORY, useClass: PrismaBookingRequestsRepository },
  ],
  exports: [BookingRequestsService],
})
export class BookingRequestsModule {}
