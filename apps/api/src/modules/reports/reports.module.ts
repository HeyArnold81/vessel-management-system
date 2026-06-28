import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module.js';
import { ReportsController } from './reports.controller.js';
import { PrismaReportsRepository, REPORTS_REPOSITORY } from './reports.repository.js';
import { ReportsService } from './reports.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    {
      provide: REPORTS_REPOSITORY,
      useClass: PrismaReportsRepository,
    },
  ],
})
export class ReportsModule {}
