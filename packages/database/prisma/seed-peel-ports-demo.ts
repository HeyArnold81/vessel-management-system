import { PrismaClient, type Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const demoTenantId = '11111111-1111-4111-8111-111111111111';
const tenantSlug = 'peel-ports-demo';

type BerthSeed = {
  readonly code: string;
  readonly name: string;
  readonly maxLengthM: number;
  readonly maxDraftM: number;
};

type TerminalSeed = {
  readonly code: string;
  readonly name: string;
  readonly type: string;
  readonly berths: readonly BerthSeed[];
};

const terminals: readonly TerminalSeed[] = [
  {
    code: 'L2',
    name: 'Liverpool2 Container Terminal',
    type: 'container',
    berths: [
      { code: 'L2-01', name: 'Liverpool2 Berth 1', maxLengthM: 430, maxDraftM: 16.5 },
      { code: 'L2-02', name: 'Liverpool2 Berth 2', maxLengthM: 420, maxDraftM: 16.5 },
    ],
  },
  {
    code: 'RSCT',
    name: 'Royal Seaforth Container Terminal',
    type: 'container',
    berths: [
      { code: 'RSCT-01', name: 'Royal Seaforth Berth 1', maxLengthM: 300, maxDraftM: 11.5 },
      { code: 'RSCT-02', name: 'Royal Seaforth Berth 2', maxLengthM: 290, maxDraftM: 11.5 },
    ],
  },
  {
    code: 'BULK',
    name: 'Bulk and General Cargo Terminal',
    type: 'bulk',
    berths: [
      { code: 'BULK-01', name: 'Bulk Berth 1', maxLengthM: 240, maxDraftM: 10.5 },
      { code: 'BULK-02', name: 'Bulk Berth 2', maxLengthM: 220, maxDraftM: 10 },
    ],
  },
  {
    code: 'RORO',
    name: 'RoRo Terminal',
    type: 'roro',
    berths: [{ code: 'RORO-01', name: 'RoRo Berth 1', maxLengthM: 210, maxDraftM: 9.5 }],
  },
  {
    code: 'CRUISE',
    name: 'Passenger and Cruise Terminal',
    type: 'passenger',
    berths: [{ code: 'CRUISE-01', name: 'Cruise Berth 1', maxLengthM: 320, maxDraftM: 10 }],
  },
];

const demoDisclaimer =
  'Synthetic Port of Liverpool-inspired demo data. Not live Peel Ports operational data.';

async function main() {
  const previousDemoTenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (previousDemoTenant && previousDemoTenant.id !== demoTenantId) {
    await resetTenantData(previousDemoTenant.id);
    await prisma.tenant.delete({ where: { id: previousDemoTenant.id } });
  }

  const tenant = await prisma.tenant.upsert({
    where: { id: demoTenantId },
    create: {
      id: demoTenantId,
      name: 'Peel Ports Demo',
      slug: tenantSlug,
      status: 'active',
    },
    update: {
      name: 'Peel Ports Demo',
      status: 'active',
    },
  });

  await resetTenantData(tenant.id);

  const unitedKingdom = await prisma.country.upsert({
    where: { iso2Code: 'GB' },
    create: { iso2Code: 'GB', iso3Code: 'GBR', name: 'United Kingdom' },
    update: { iso3Code: 'GBR', name: 'United Kingdom' },
  });
  const panama = await prisma.country.upsert({
    where: { iso2Code: 'PA' },
    create: { iso2Code: 'PA', iso3Code: 'PAN', name: 'Panama' },
    update: { iso3Code: 'PAN', name: 'Panama' },
  });
  const liberia = await prisma.country.upsert({
    where: { iso2Code: 'LR' },
    create: { iso2Code: 'LR', iso3Code: 'LBR', name: 'Liberia' },
    update: { iso3Code: 'LBR', name: 'Liberia' },
  });
  const malta = await prisma.country.upsert({
    where: { iso2Code: 'MT' },
    create: { iso2Code: 'MT', iso3Code: 'MLT', name: 'Malta' },
    update: { iso3Code: 'MLT', name: 'Malta' },
  });

  const port = await prisma.port.create({
    data: {
      tenantId: tenant.id,
      countryId: unitedKingdom.id,
      unlocode: 'GBLIV',
      name: 'Port of Liverpool',
      timeZone: 'Europe/London',
      status: 'active',
    },
  });

  const berthByCode = new Map<string, string>();

  for (const terminalSeed of terminals) {
    const terminal = await prisma.terminal.create({
      data: {
        tenantId: tenant.id,
        portId: port.id,
        code: terminalSeed.code,
        name: terminalSeed.name,
        type: terminalSeed.type,
        status: 'active',
      },
    });

    for (const berthSeed of terminalSeed.berths) {
      const berth = await prisma.berth.create({
        data: {
          tenantId: tenant.id,
          terminalId: terminal.id,
          code: berthSeed.code,
          name: berthSeed.name,
          maxLengthM: berthSeed.maxLengthM,
          maxDraftM: berthSeed.maxDraftM,
          status: 'active',
        },
      });

      berthByCode.set(berth.code, berth.id);
    }
  }

  const organizations = await createOrganizations(tenant.id);
  const services = await createServices(tenant.id);
  const cargo = await createCargo(tenant.id);
  const vessels = await createVessels(tenant.id, {
    panamaId: panama.id,
    liberiaId: liberia.id,
    maltaId: malta.id,
    unitedKingdomId: unitedKingdom.id,
  });

  const vesselCalls = await createVesselCalls({
    tenantId: tenant.id,
    portId: port.id,
    berthByCode,
    vessels,
    organizations,
  });

  const movements = await createMovements({
    tenantId: tenant.id,
    portId: port.id,
    vesselCalls,
    vessels,
    berthByCode,
  });

  await createMovementCargo({ tenantId: tenant.id, movements, cargo });
  const movementServices = await createMovementServices({
    tenantId: tenant.id,
    movements,
    services,
    organizations,
  });
  await createBillingExamples({ tenantId: tenant.id, movementServices });

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'planner.demo@peelports.example',
      displayName: 'Liverpool Marine Planner',
      authProvider: 'local',
      status: 'active',
    },
  });

  const counts = await countDemoRows(tenant.id);

  console.log(`Seeded ${tenant.name} with Port of Liverpool demo data.`);
  console.log(`Tenant id: ${tenant.id}`);
  console.log(
    `Created ${counts.ports} port, ${counts.terminals} terminals, ${counts.berths} berths, ` +
      `${counts.vessels} vessels, ${counts.vesselCalls} vessel calls, ${counts.movements} movements, ` +
      `${counts.movementServices} movement services, and ${counts.billingEvents} billing events.`,
  );
  console.log(demoDisclaimer);
}

async function countDemoRows(tenantId: string) {
  const [
    ports,
    terminals,
    berths,
    vessels,
    vesselCalls,
    movements,
    movementServices,
    billingEvents,
  ] = await Promise.all([
    prisma.port.count({ where: { tenantId } }),
    prisma.terminal.count({ where: { tenantId } }),
    prisma.berth.count({ where: { tenantId } }),
    prisma.vessel.count({ where: { tenantId } }),
    prisma.vesselCall.count({ where: { tenantId } }),
    prisma.vesselMovement.count({ where: { tenantId } }),
    prisma.movementService.count({ where: { tenantId } }),
    prisma.billingEvent.count({ where: { tenantId } }),
  ]);

  return {
    ports,
    terminals,
    berths,
    vessels,
    vesselCalls,
    movements,
    movementServices,
    billingEvents,
  };
}

async function resetTenantData(tenantId: string) {
  const movements = await prisma.vesselMovement.findMany({
    where: { tenantId },
    select: { id: true },
  });
  const movementIds = movements.map((movement) => movement.id);
  const invoices = await prisma.invoice.findMany({ where: { tenantId }, select: { id: true } });
  const invoiceIds = invoices.map((invoice) => invoice.id);

  await prisma.auditLog.deleteMany({ where: { tenantId } });
  await prisma.invoiceLine.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
  await prisma.invoice.deleteMany({ where: { tenantId } });
  await prisma.billingEvent.deleteMany({ where: { tenantId } });
  await prisma.billingExportBatch.deleteMany({ where: { tenantId } });
  await prisma.operationalEvent.deleteMany({ where: { tenantId } });
  await prisma.towageJob.deleteMany({ where: { tenantId } });
  await prisma.pilotageJob.deleteMany({ where: { tenantId } });
  await prisma.movementCargo.deleteMany({ where: { tenantId } });
  await prisma.movementBerthStay.deleteMany({ where: { movementId: { in: movementIds } } });
  await prisma.movementService.deleteMany({ where: { tenantId } });
  await prisma.vesselMovement.deleteMany({ where: { tenantId } });
  await prisma.vesselCall.deleteMany({ where: { tenantId } });
  await prisma.vesselParty.deleteMany({ where: { tenantId } });
  await prisma.vessel.deleteMany({ where: { tenantId } });
  await prisma.cargoItem.deleteMany({ where: { tenantId } });
  await prisma.serviceCatalog.deleteMany({ where: { tenantId } });
  await prisma.organization.deleteMany({ where: { tenantId } });
  await prisma.userRole.deleteMany({
    where: { user: { tenantId } },
  });
  await prisma.user.deleteMany({ where: { tenantId } });
  await prisma.rolePermission.deleteMany({
    where: { role: { tenantId } },
  });
  await prisma.role.deleteMany({ where: { tenantId } });
  await prisma.berth.deleteMany({ where: { tenantId } });
  await prisma.terminal.deleteMany({ where: { tenantId } });
  await prisma.port.deleteMany({ where: { tenantId } });
}

async function createOrganizations(tenantId: string) {
  const peel = await prisma.organization.create({
    data: {
      tenantId,
      legalName: 'Peel Ports Demo Operations Ltd',
      tradingName: 'Peel Ports Demo',
      email: 'operations.demo@peelports.example',
      phone: '+44 151 000 0100',
      status: 'active',
    },
  });
  const merseyAgency = await prisma.organization.create({
    data: {
      tenantId,
      legalName: 'Mersey Maritime Agency Ltd',
      tradingName: 'Mersey Maritime Agency',
      email: 'agency@example.test',
      phone: '+44 151 000 0110',
      status: 'active',
    },
  });
  const atlanticLine = await prisma.organization.create({
    data: {
      tenantId,
      legalName: 'Atlantic Container Line Demo Ltd',
      tradingName: 'Atlantic Container Line Demo',
      email: 'ops@atlantic-demo.example',
      status: 'active',
    },
  });
  const northSeaRoRo = await prisma.organization.create({
    data: {
      tenantId,
      legalName: 'North Sea RoRo Demo Ltd',
      tradingName: 'North Sea RoRo Demo',
      email: 'ops@roro-demo.example',
      status: 'active',
    },
  });

  return { peel, merseyAgency, atlanticLine, northSeaRoRo };
}

async function createServices(tenantId: string) {
  const pilotage = await prisma.serviceCatalog.create({
    data: {
      tenantId,
      code: 'PILOTAGE',
      name: 'Pilotage',
      category: 'pilotage',
      defaultUnit: 'movement',
      isBillable: true,
      status: 'active',
    },
  });
  const towage = await prisma.serviceCatalog.create({
    data: {
      tenantId,
      code: 'TOWAGE',
      name: 'Towage',
      category: 'towage',
      defaultUnit: 'job',
      isBillable: true,
      status: 'active',
    },
  });
  const mooring = await prisma.serviceCatalog.create({
    data: {
      tenantId,
      code: 'MOORING',
      name: 'Mooring and line handling',
      category: 'mooring',
      defaultUnit: 'call',
      isBillable: true,
      status: 'active',
    },
  });
  const waste = await prisma.serviceCatalog.create({
    data: {
      tenantId,
      code: 'WASTE',
      name: 'Ship waste reception',
      category: 'waste',
      defaultUnit: 'tonne',
      isBillable: true,
      status: 'active',
    },
  });

  return { pilotage, towage, mooring, waste };
}

async function createCargo(tenantId: string) {
  const containers = await prisma.cargoItem.create({
    data: {
      tenantId,
      cargoCode: 'CONT',
      name: 'Containerised cargo',
      cargoCategory: 'container',
      isHazardous: false,
      status: 'active',
    },
  });
  const grain = await prisma.cargoItem.create({
    data: {
      tenantId,
      cargoCode: 'GRAIN',
      name: 'Agricultural bulk grain',
      cargoCategory: 'bulk',
      isHazardous: false,
      status: 'active',
    },
  });
  const vehicles = await prisma.cargoItem.create({
    data: {
      tenantId,
      cargoCode: 'VEH',
      name: 'Vehicles and rolling cargo',
      cargoCategory: 'general',
      isHazardous: false,
      status: 'active',
    },
  });

  return { containers, grain, vehicles };
}

async function createVessels(
  tenantId: string,
  countries: {
    readonly panamaId: string;
    readonly liberiaId: string;
    readonly maltaId: string;
    readonly unitedKingdomId: string;
  },
) {
  const merseyTrader = await prisma.vessel.create({
    data: {
      tenantId,
      flagCountryId: panamaIdOrFallback(countries.panamaId),
      name: 'MV Mersey Trader',
      imoNumber: '9301234',
      mmsi: '352000001',
      callSign: '3FMD1',
      vesselType: 'container',
      grossTonnage: 91000,
      lengthOverallM: 333,
      maxDraftM: 14.5,
      status: 'active',
    },
  });
  const atlanticBridge = await prisma.vessel.create({
    data: {
      tenantId,
      flagCountryId: countries.liberiaId,
      name: 'MV Atlantic Bridge',
      imoNumber: '9412345',
      mmsi: '636000001',
      callSign: 'D5AB1',
      vesselType: 'container',
      grossTonnage: 74000,
      lengthOverallM: 300,
      maxDraftM: 13.8,
      status: 'active',
    },
  });
  const royalMersey = await prisma.vessel.create({
    data: {
      tenantId,
      flagCountryId: countries.maltaId,
      name: 'MV Royal Mersey',
      imoNumber: '9523456',
      mmsi: '248000001',
      callSign: '9HMR1',
      vesselType: 'bulk_carrier',
      grossTonnage: 42000,
      lengthOverallM: 225,
      maxDraftM: 10.2,
      status: 'active',
    },
  });
  const irishSeaRunner = await prisma.vessel.create({
    data: {
      tenantId,
      flagCountryId: countries.unitedKingdomId,
      name: 'MV Irish Sea Runner',
      imoNumber: '9634567',
      mmsi: '235000001',
      callSign: 'MIRS1',
      vesselType: 'roro',
      grossTonnage: 28000,
      lengthOverallM: 190,
      maxDraftM: 7.2,
      status: 'active',
    },
  });

  return { merseyTrader, atlanticBridge, royalMersey, irishSeaRunner };
}

function panamaIdOrFallback(value: string): string {
  return value;
}

async function createVesselCalls(input: {
  readonly tenantId: string;
  readonly portId: string;
  readonly berthByCode: ReadonlyMap<string, string>;
  readonly vessels: Awaited<ReturnType<typeof createVessels>>;
  readonly organizations: Awaited<ReturnType<typeof createOrganizations>>;
}) {
  const call1 = await prisma.vesselCall.create({
    data: {
      tenantId: input.tenantId,
      callReference: 'LIV-2026-0001',
      vesselId: input.vessels.merseyTrader.id,
      portId: input.portId,
      berthId: requireBerth(input.berthByCode, 'L2-01'),
      agentId: input.organizations.merseyAgency.id,
      operatorId: input.organizations.atlanticLine.id,
      voyageNumber: 'AX26W',
      status: 'alongside',
      eta: date('2026-06-28T04:30:00Z'),
      ata: date('2026-06-28T04:48:00Z'),
      etd: date('2026-06-29T18:00:00Z'),
      remarks: `${demoDisclaimer} Deep-water container call.`,
    },
  });
  const call2 = await prisma.vesselCall.create({
    data: {
      tenantId: input.tenantId,
      callReference: 'LIV-2026-0002',
      vesselId: input.vessels.atlanticBridge.id,
      portId: input.portId,
      berthId: requireBerth(input.berthByCode, 'L2-02'),
      agentId: input.organizations.merseyAgency.id,
      operatorId: input.organizations.atlanticLine.id,
      voyageNumber: 'AB14E',
      status: 'expected',
      eta: date('2026-06-29T07:15:00Z'),
      etd: date('2026-06-30T13:30:00Z'),
      remarks: `${demoDisclaimer} Planned container exchange.`,
    },
  });
  const call3 = await prisma.vesselCall.create({
    data: {
      tenantId: input.tenantId,
      callReference: 'LIV-2026-0003',
      vesselId: input.vessels.royalMersey.id,
      portId: input.portId,
      berthId: requireBerth(input.berthByCode, 'BULK-01'),
      agentId: input.organizations.merseyAgency.id,
      operatorId: input.organizations.peel.id,
      voyageNumber: 'BG77',
      status: 'planned',
      eta: date('2026-06-30T11:00:00Z'),
      etd: date('2026-07-01T22:00:00Z'),
      remarks: `${demoDisclaimer} Bulk grain discharge example.`,
    },
  });
  const call4 = await prisma.vesselCall.create({
    data: {
      tenantId: input.tenantId,
      callReference: 'LIV-2026-0004',
      vesselId: input.vessels.irishSeaRunner.id,
      portId: input.portId,
      berthId: requireBerth(input.berthByCode, 'RORO-01'),
      agentId: input.organizations.merseyAgency.id,
      operatorId: input.organizations.northSeaRoRo.id,
      voyageNumber: 'ISR102',
      status: 'departed',
      eta: date('2026-06-27T22:00:00Z'),
      ata: date('2026-06-27T22:05:00Z'),
      etd: date('2026-06-28T03:00:00Z'),
      atd: date('2026-06-28T03:12:00Z'),
      remarks: `${demoDisclaimer} RoRo turnaround completed.`,
    },
  });

  return { call1, call2, call3, call4 };
}

async function createMovements(input: {
  readonly tenantId: string;
  readonly portId: string;
  readonly vesselCalls: Awaited<ReturnType<typeof createVesselCalls>>;
  readonly vessels: Awaited<ReturnType<typeof createVessels>>;
  readonly berthByCode: ReadonlyMap<string, string>;
}) {
  const arrival1 = await prisma.vesselMovement.create({
    data: {
      tenantId: input.tenantId,
      movementReference: 'MOV-LIV-0001-A',
      vesselCallId: input.vesselCalls.call1.id,
      vesselId: input.vessels.merseyTrader.id,
      portId: input.portId,
      toBerthId: requireBerth(input.berthByCode, 'L2-01'),
      movementType: 'arrival',
      status: 'completed',
      plannedAt: date('2026-06-28T04:30:00Z'),
      actualAt: date('2026-06-28T04:48:00Z'),
      eta: date('2026-06-28T04:30:00Z'),
      ata: date('2026-06-28T04:48:00Z'),
      remarks: demoDisclaimer,
    },
  });
  const departure1 = await prisma.vesselMovement.create({
    data: {
      tenantId: input.tenantId,
      movementReference: 'MOV-LIV-0001-D',
      vesselCallId: input.vesselCalls.call1.id,
      vesselId: input.vessels.merseyTrader.id,
      portId: input.portId,
      fromBerthId: requireBerth(input.berthByCode, 'L2-01'),
      movementType: 'departure',
      status: 'planned',
      plannedAt: date('2026-06-29T18:00:00Z'),
      etd: date('2026-06-29T18:00:00Z'),
      remarks: demoDisclaimer,
    },
  });
  const arrival2 = await prisma.vesselMovement.create({
    data: {
      tenantId: input.tenantId,
      movementReference: 'MOV-LIV-0002-A',
      vesselCallId: input.vesselCalls.call2.id,
      vesselId: input.vessels.atlanticBridge.id,
      portId: input.portId,
      toBerthId: requireBerth(input.berthByCode, 'L2-02'),
      movementType: 'arrival',
      status: 'planned',
      plannedAt: date('2026-06-29T07:15:00Z'),
      eta: date('2026-06-29T07:15:00Z'),
      remarks: demoDisclaimer,
    },
  });
  const arrival3 = await prisma.vesselMovement.create({
    data: {
      tenantId: input.tenantId,
      movementReference: 'MOV-LIV-0003-A',
      vesselCallId: input.vesselCalls.call3.id,
      vesselId: input.vessels.royalMersey.id,
      portId: input.portId,
      toBerthId: requireBerth(input.berthByCode, 'BULK-01'),
      movementType: 'arrival',
      status: 'planned',
      plannedAt: date('2026-06-30T11:00:00Z'),
      eta: date('2026-06-30T11:00:00Z'),
      remarks: demoDisclaimer,
    },
  });

  await prisma.movementBerthStay.create({
    data: {
      tenantId: input.tenantId,
      movementId: arrival1.id,
      berthId: requireBerth(input.berthByCode, 'L2-01'),
      sequenceNo: 1,
      alongsideAt: date('2026-06-28T05:20:00Z'),
      operationsStartedAt: date('2026-06-28T06:15:00Z'),
    },
  });

  return { arrival1, departure1, arrival2, arrival3 };
}

async function createMovementCargo(input: {
  readonly tenantId: string;
  readonly movements: Awaited<ReturnType<typeof createMovements>>;
  readonly cargo: Awaited<ReturnType<typeof createCargo>>;
}) {
  await prisma.movementCargo.createMany({
    data: [
      {
        tenantId: input.tenantId,
        movementId: input.movements.arrival1.id,
        cargoItemId: input.cargo.containers.id,
        operationType: 'discharge',
        quantity: 1850,
        unitOfMeasure: 'teu',
      },
      {
        tenantId: input.tenantId,
        movementId: input.movements.arrival2.id,
        cargoItemId: input.cargo.containers.id,
        operationType: 'load',
        quantity: 920,
        unitOfMeasure: 'teu',
      },
      {
        tenantId: input.tenantId,
        movementId: input.movements.arrival3.id,
        cargoItemId: input.cargo.grain.id,
        operationType: 'discharge',
        quantity: 22000,
        unitOfMeasure: 'tonne',
      },
    ],
  });
}

async function createMovementServices(input: {
  readonly tenantId: string;
  readonly movements: Awaited<ReturnType<typeof createMovements>>;
  readonly services: Awaited<ReturnType<typeof createServices>>;
  readonly organizations: Awaited<ReturnType<typeof createOrganizations>>;
}) {
  const completedPilotage = await prisma.movementService.create({
    data: {
      tenantId: input.tenantId,
      movementId: input.movements.arrival1.id,
      serviceId: input.services.pilotage.id,
      providerOrganizationId: input.organizations.peel.id,
      status: 'completed',
      quantity: 1,
      unitOfMeasure: 'movement',
      requestedAt: date('2026-06-27T18:00:00Z'),
      completedAt: date('2026-06-28T04:48:00Z'),
      isBillable: true,
    },
  });
  const completedTowage = await prisma.movementService.create({
    data: {
      tenantId: input.tenantId,
      movementId: input.movements.arrival1.id,
      serviceId: input.services.towage.id,
      providerOrganizationId: input.organizations.peel.id,
      status: 'completed',
      quantity: 2,
      unitOfMeasure: 'job',
      requestedAt: date('2026-06-27T18:00:00Z'),
      completedAt: date('2026-06-28T05:05:00Z'),
      isBillable: true,
    },
  });
  const scheduledPilotage = await prisma.movementService.create({
    data: {
      tenantId: input.tenantId,
      movementId: input.movements.arrival2.id,
      serviceId: input.services.pilotage.id,
      providerOrganizationId: input.organizations.peel.id,
      status: 'scheduled',
      quantity: 1,
      unitOfMeasure: 'movement',
      requestedAt: date('2026-06-28T12:00:00Z'),
      isBillable: true,
    },
  });
  const onHoldWaste = await prisma.movementService.create({
    data: {
      tenantId: input.tenantId,
      movementId: input.movements.arrival3.id,
      serviceId: input.services.waste.id,
      providerOrganizationId: input.organizations.peel.id,
      status: 'on_hold',
      quantity: 8,
      unitOfMeasure: 'tonne',
      requestedAt: date('2026-06-28T16:30:00Z'),
      isBillable: true,
    },
  });

  await prisma.pilotageJob.create({
    data: {
      tenantId: input.tenantId,
      movementId: input.movements.arrival2.id,
      jobType: 'arrival',
      scheduledAt: date('2026-06-29T06:30:00Z'),
      status: 'requested',
    },
  });
  await prisma.towageJob.create({
    data: {
      tenantId: input.tenantId,
      movementId: input.movements.arrival2.id,
      jobType: 'arrival',
      tugsRequired: 2,
      scheduledAt: date('2026-06-29T06:45:00Z'),
      status: 'requested',
    },
  });

  return { completedPilotage, completedTowage, scheduledPilotage, onHoldWaste };
}

async function createBillingExamples(input: {
  readonly tenantId: string;
  readonly movementServices: Awaited<ReturnType<typeof createMovementServices>>;
}) {
  const exportedBatch = await prisma.billingExportBatch.create({
    data: {
      tenantId: input.tenantId,
      batchReference: 'BATCH-LIV-2026-0001',
      status: 'exported',
      erpSystem: 'SAP',
      externalReference: 'SAP-DEMO-10001',
      eventCount: 1,
      payload: toJson({
        erpSystem: 'SAP',
        documentType: 'billing_export_batch',
        version: '1.0',
        billingEventIds: [],
        summary: { eventCount: 1 },
      }),
      requestedAt: date('2026-06-28T09:00:00Z'),
      completedAt: date('2026-06-28T09:15:00Z'),
    },
  });

  await prisma.billingEvent.create({
    data: {
      tenantId: input.tenantId,
      eventReference: 'BILL-LIV-0001',
      movementServiceId: input.movementServices.completedPilotage.id,
      status: 'exported',
      erpSystem: 'SAP',
      exportBatchId: exportedBatch.id,
      exportedAt: date('2026-06-28T09:15:00Z'),
      payload: toJson(buildBillingPayload(input.movementServices.completedPilotage.id)),
    },
  });
  await prisma.billingEvent.create({
    data: {
      tenantId: input.tenantId,
      eventReference: 'BILL-LIV-0002',
      movementServiceId: input.movementServices.completedTowage.id,
      status: 'failed',
      erpSystem: 'SAP',
      failureReason: 'Demo failure: customer cost centre missing.',
      rejectedAt: date('2026-06-28T10:30:00Z'),
      payload: toJson(buildBillingPayload(input.movementServices.completedTowage.id)),
    },
  });
  await prisma.billingEvent.create({
    data: {
      tenantId: input.tenantId,
      eventReference: 'BILL-LIV-0003',
      movementServiceId: input.movementServices.onHoldWaste.id,
      status: 'on_hold',
      erpSystem: 'SAP',
      failureReason: 'Awaiting waste quantity confirmation.',
      payload: toJson(buildBillingPayload(input.movementServices.onHoldWaste.id)),
    },
  });
}

function buildBillingPayload(movementServiceId: string) {
  return {
    source: { movementServiceId },
    service: {},
    erp: { documentType: 'billing_request', version: '1.0' },
    snapshot: { demo: true, disclaimer: demoDisclaimer },
  };
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function requireBerth(berths: ReadonlyMap<string, string>, code: string): string {
  const berthId = berths.get(code);

  if (!berthId) {
    throw new Error(`Missing demo berth ${code}.`);
  }

  return berthId;
}

function date(value: string): Date {
  return new Date(value);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
