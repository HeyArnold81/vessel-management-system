import type { BookingRequestedService, ServiceCatalog } from '@prisma/client';

import type {
  BookingRequestedServiceRecord,
  BookingRequestedServiceStatus,
  ServiceCategory,
} from '@vms/shared';

export type BookingRequestedServiceWithCatalog = BookingRequestedService & {
  readonly service: ServiceCatalog;
};

export function toBookingRequestedServiceRecord(
  requestedService: BookingRequestedServiceWithCatalog,
): BookingRequestedServiceRecord {
  return {
    id: requestedService.id,
    tenantId: requestedService.tenantId,
    bookingRequestId: requestedService.bookingRequestId,
    serviceId: requestedService.serviceId,
    serviceCode: requestedService.service.code,
    serviceName: requestedService.service.name,
    serviceCategory: requestedService.service.category as ServiceCategory,
    providerOrganizationId: requestedService.providerOrganizationId,
    serviceReceiverOrganizationId: requestedService.serviceReceiverOrganizationId,
    billToOrganizationId: requestedService.billToOrganizationId,
    payerOrganizationId: requestedService.payerOrganizationId,
    status: requestedService.status as BookingRequestedServiceStatus,
    quantity: requestedService.quantity.toString(),
    unitOfMeasure: requestedService.unitOfMeasure,
    requestedAt: requestedService.requestedAt?.toISOString() ?? null,
    isBillable: requestedService.isBillable,
    notes: requestedService.notes,
    createdAt: requestedService.createdAt.toISOString(),
    updatedAt: requestedService.updatedAt.toISOString(),
  };
}
