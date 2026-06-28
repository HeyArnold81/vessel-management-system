import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module.js';
import { CargoItemsAuditService } from './audit.service.js';
import { CargoItemsController } from './cargo-items.controller.js';
import { PrismaCargoItemsRepository, CARGO_ITEMS_REPOSITORY } from './cargo-items.repository.js';
import { CARGO_ITEM_AUDIT_RECORDER, CargoItemsService } from './cargo-items.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [CargoItemsController],
  providers: [
    CargoItemsAuditService,
    CargoItemsService,
    {
      provide: CARGO_ITEMS_REPOSITORY,
      useClass: PrismaCargoItemsRepository,
    },
    {
      provide: CARGO_ITEM_AUDIT_RECORDER,
      useExisting: CargoItemsAuditService,
    },
  ],
  exports: [CargoItemsService],
})
export class CargoModule {}
