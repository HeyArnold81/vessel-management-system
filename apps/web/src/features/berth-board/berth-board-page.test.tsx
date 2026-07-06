import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BerthBoardPage } from './berth-board-page';

const berthResponse = {
  data: [
    {
      id: 'berth-1',
      tenantId: 'tenant-1',
      terminalId: 'terminal-1',
      code: 'L2-01',
      name: 'Liverpool 2 Berth 1',
      maxLengthM: '400',
      maxDraftM: '16',
      status: 'active',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    },
  ],
  meta: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
};

const vesselCallResponse = {
  data: [
    {
      id: 'call-1',
      tenantId: 'tenant-1',
      callReference: 'LIV-2026-0001',
      vesselId: 'vessel-1',
      portId: 'port-1',
      berthId: 'berth-1',
      agentId: null,
      operatorId: null,
      voyageNumber: 'VOY-1',
      status: 'expected',
      eta: '2026-07-06T08:00:00.000Z',
      etd: '2026-07-06T16:00:00.000Z',
      ata: null,
      atd: null,
      remarks: null,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    },
    {
      id: 'call-2',
      tenantId: 'tenant-1',
      callReference: 'LIV-2026-0002',
      vesselId: 'vessel-2',
      portId: 'port-1',
      berthId: null,
      agentId: null,
      operatorId: null,
      voyageNumber: null,
      status: 'planned',
      eta: '2026-07-06T18:00:00.000Z',
      etd: null,
      ata: null,
      atd: null,
      remarks: null,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    },
    {
      id: 'call-3',
      tenantId: 'tenant-1',
      callReference: 'LIV-2026-0003',
      vesselId: 'vessel-3',
      portId: 'port-1',
      berthId: 'berth-1',
      agentId: null,
      operatorId: null,
      voyageNumber: null,
      status: 'alongside',
      eta: '2026-07-06T12:00:00.000Z',
      etd: '2026-07-06T18:00:00.000Z',
      ata: null,
      atd: null,
      remarks: null,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    },
  ],
  meta: { page: 1, pageSize: 100, totalItems: 3, totalPages: 1 },
};

const movementResponse = {
  data: [
    {
      id: 'movement-1',
      tenantId: 'tenant-1',
      movementReference: 'MOV-LIV-0001',
      vesselCallId: 'call-1',
      vesselId: 'vessel-1',
      portId: 'port-1',
      fromBerthId: null,
      toBerthId: 'berth-1',
      movementType: 'arrival',
      status: 'scheduled',
      plannedAt: '2026-07-06T07:00:00.000Z',
      actualAt: null,
      remarks: null,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    },
  ],
  meta: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
};

const vesselResponse = {
  data: [
    {
      id: 'vessel-1',
      tenantId: 'tenant-1',
      name: 'Atlantic Trader',
      imoNumber: '9234567',
      mmsi: null,
      callSign: null,
      vesselType: 'container',
      grossTonnage: null,
      lengthOverallM: null,
      maxDraftM: null,
      status: 'active',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    },
    {
      id: 'vessel-2',
      tenantId: 'tenant-1',
      name: 'Mersey Pioneer',
      imoNumber: '9345678',
      mmsi: null,
      callSign: null,
      vesselType: 'ro_ro',
      grossTonnage: null,
      lengthOverallM: null,
      maxDraftM: null,
      status: 'active',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    },
    {
      id: 'vessel-3',
      tenantId: 'tenant-1',
      name: 'Seaforth Express',
      imoNumber: '9456789',
      mmsi: null,
      callSign: null,
      vesselType: 'container',
      grossTonnage: null,
      lengthOverallM: null,
      maxDraftM: null,
      status: 'active',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    },
  ],
  meta: { page: 1, pageSize: 100, totalItems: 3, totalPages: 1 },
};

const portResponse = {
  data: [
    {
      id: 'port-1',
      tenantId: 'tenant-1',
      countryId: 'country-1',
      unlocode: 'GBLIV',
      name: 'Port of Liverpool',
      timeZone: 'Europe/London',
      status: 'active',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    },
  ],
  meta: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
};

describe('BerthBoardPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders active berth lanes with vessel calls and movement context', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/api/v1/berths')) {
        return jsonResponse(berthResponse);
      }

      if (url.includes('/api/v1/vessel-calls')) {
        return jsonResponse(vesselCallResponse);
      }

      if (url.includes('/api/v1/movements')) {
        return jsonResponse(movementResponse);
      }

      if (url.includes('/api/v1/ports')) {
        return jsonResponse(portResponse);
      }

      if (url.includes('/api/v1/vessels')) {
        return jsonResponse(vesselResponse);
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    render(<BerthBoardPage />);

    expect(await screen.findByRole('heading', { name: 'Berth Board' })).toBeInTheDocument();
    expect(screen.getByText('Planning filters')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Port' })).toHaveDisplayValue('All ports');
    expect(screen.getByRole('combobox', { name: 'Terminal' })).toHaveDisplayValue('All terminals');
    expect(screen.getByText('Liverpool 2 Berth 1')).toBeInTheDocument();
    expect(screen.getByText('Unassigned planning queue')).toBeInTheDocument();
    expect(screen.getByText('Atlantic Trader')).toBeInTheDocument();
    expect(screen.getByText('Mersey Pioneer')).toBeInTheDocument();
    expect(screen.getByText('Seaforth Express')).toBeInTheDocument();
    expect(screen.getByText('Berth conflict review')).toBeInTheDocument();
    expect(screen.getByLabelText('Berth occupancy timeline')).toBeInTheDocument();
    expect(screen.getByText(/Arrival/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'LIV-2026-0001 operational chain' })).toHaveAttribute(
      'href',
      '/vessel-calls?id=call-1',
    );
  });
});

function jsonResponse(body: unknown) {
  return {
    ok: true,
    json: async () => body,
  } as Response;
}
