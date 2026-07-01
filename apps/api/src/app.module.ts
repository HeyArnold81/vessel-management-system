import { Module } from '@nestjs/common';

import { DatabaseModule } from './database/database.module.js';
import { AiAssistantModule } from './modules/ai-assistant/ai-assistant.module.js';
import { BerthsModule } from './modules/berths/berths.module.js';
import { BillingExportBatchesModule } from './modules/billing-export-batches/billing-export-batches.module.js';
import { BillingEventsModule } from './modules/billing-events/billing-events.module.js';
import { CargoModule } from './modules/cargo/cargo.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { MovementServicesModule } from './modules/movement-services/movement-services.module.js';
import { MovementsModule } from './modules/movements/movements.module.js';
import { PermissionsModule } from './modules/permissions/permissions.module.js';
import { PortsModule } from './modules/ports/ports.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { RolesModule } from './modules/roles/roles.module.js';
import { ServicesModule } from './modules/services/services.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { VesselCallsModule } from './modules/vessel-calls/vessel-calls.module.js';
import { VesselsModule } from './modules/vessels/vessels.module.js';
import { AppController } from './app.controller.js';

@Module({
  imports: [
    DatabaseModule,
    VesselsModule,
    PortsModule,
    BerthsModule,
    CargoModule,
    VesselCallsModule,
    MovementsModule,
    MovementServicesModule,
    ServicesModule,
    BillingEventsModule,
    BillingExportBatchesModule,
    HealthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    ReportsModule,
    AiAssistantModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
