import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module.js';
import { ServiceCatalogAuditService } from './audit.service.js';
import { ServiceCatalogController } from './service-catalog.controller.js';
import {
  PrismaServiceCatalogRepository,
  SERVICE_CATALOG_REPOSITORY,
} from './service-catalog.repository.js';
import {
  SERVICE_CATALOG_AUDIT_RECORDER,
  ServiceCatalogService,
} from './service-catalog.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [ServiceCatalogController],
  providers: [
    ServiceCatalogAuditService,
    ServiceCatalogService,
    {
      provide: SERVICE_CATALOG_REPOSITORY,
      useClass: PrismaServiceCatalogRepository,
    },
    {
      provide: SERVICE_CATALOG_AUDIT_RECORDER,
      useExisting: ServiceCatalogAuditService,
    },
  ],
  exports: [ServiceCatalogService],
})
export class ServicesModule {}
