export type NavigationItem = {
  readonly label: string;
  readonly href: string;
  readonly permission: PermissionCode;
};

export type PermissionCode =
  | 'vessel.read'
  | 'vessel.write'
  | 'vessel_call.read'
  | 'vessel_call.write'
  | 'movement.read'
  | 'movement.write'
  | 'movement.approve'
  | 'port.read'
  | 'port.write'
  | 'berth.read'
  | 'berth.write'
  | 'cargo.read'
  | 'cargo.write'
  | 'service.read'
  | 'service.write'
  | 'invoice.read'
  | 'invoice.write'
  | 'invoice.approve'
  | 'user.read'
  | 'user.write'
  | 'role.read'
  | 'role.write'
  | 'permission.read'
  | 'permission.write'
  | 'ai.read'
  | 'audit.read';

export type OperationalStatus = 'planned' | 'in_progress' | 'completed' | 'attention';

export type VesselStatus = 'active' | 'inactive';

export type VesselSortField = 'name' | 'imoNumber' | 'vesselType' | 'status' | 'createdAt';

export type PortStatus = 'active' | 'inactive';

export type PortSortField = 'name' | 'unlocode' | 'timeZone' | 'status' | 'createdAt';

export type BerthStatus = 'active' | 'inactive';

export type BerthSortField = 'name' | 'code' | 'status' | 'createdAt';

export type CargoItemStatus = 'active' | 'inactive';

export type CargoCategory = 'bulk' | 'container' | 'general' | 'hazardous' | 'liquid' | 'reefer';

export type CargoItemSortField = 'name' | 'cargoCode' | 'cargoCategory' | 'status' | 'createdAt';

export type VesselCallStatus =
  'planned' | 'expected' | 'arrived' | 'alongside' | 'departed' | 'cancelled';

export type VesselCallSortField = 'callReference' | 'eta' | 'etd' | 'status' | 'createdAt';

export type BookingRequestStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'availability_checked'
  | 'approved'
  | 'rejected'
  | 'confirmed'
  | 'cancelled';

export type BookingRequestSortField =
  'requestReference' | 'requestedEta' | 'status' | 'createdAt' | 'updatedAt';

export type AvailabilityResult = 'available' | 'limited' | 'conflict' | 'manual_review_required';

export type AvailabilityRuleStatus = 'pass' | 'warning' | 'fail' | 'manual_review';

export type MovementStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export type MovementType =
  | 'arrival'
  | 'departure'
  | 'berth_shift'
  | 'pilotage'
  | 'towage'
  | 'cargo_operation'
  | 'service'
  | 'inspection'
  | 'other';

export type MovementSortField =
  'movementReference' | 'plannedAt' | 'actualAt' | 'status' | 'createdAt';

export type ServiceCatalogStatus = 'active' | 'inactive';

export type ServiceCategory =
  | 'agency'
  | 'bunkering'
  | 'cargo'
  | 'inspection'
  | 'mooring'
  | 'pilotage'
  | 'security'
  | 'stores'
  | 'towage'
  | 'utilities'
  | 'waste'
  | 'other';

export type ServiceCatalogSortField = 'name' | 'code' | 'category' | 'status' | 'createdAt';

export type MovementServiceStatus =
  'requested' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';

export type MovementServiceSortField = 'status' | 'requestedAt' | 'completedAt' | 'createdAt';

export type BillingEventStatus =
  'draft' | 'ready' | 'on_hold' | 'rejected' | 'exported' | 'accepted' | 'failed';

export type BillingEventSortField = 'eventReference' | 'status' | 'createdAt' | 'exportedAt';

export type BillingExportBatchStatus =
  'queued' | 'exporting' | 'exported' | 'accepted' | 'failed' | 'cancelled';

export type BillingExportBatchSortField =
  'batchReference' | 'status' | 'requestedAt' | 'completedAt';

export type UserStatus = 'invited' | 'active' | 'suspended' | 'deactivated';

export type AuthProvider = 'local' | 'entra_id' | 'oidc' | 'saml' | 'oauth';

export type UserSortField = 'displayName' | 'email' | 'status' | 'createdAt';

export type RoleSortField = 'name' | 'code' | 'createdAt';

export type RoleStatus = 'active' | 'retired';

export type PermissionAction = 'read' | 'write' | 'approve' | 'admin';

export type SortDirection = 'asc' | 'desc';

export type VesselRecord = {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly imoNumber: string;
  readonly mmsi: string | null;
  readonly callSign: string | null;
  readonly vesselType: string;
  readonly grossTonnage: string | null;
  readonly lengthOverallM: string | null;
  readonly maxDraftM: string | null;
  readonly status: VesselStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type VesselListQuery = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly status?: VesselStatus;
  readonly vesselType?: string;
  readonly sortBy?: VesselSortField;
  readonly sortDirection?: SortDirection;
};

export type CreateVesselInput = {
  readonly name: string;
  readonly imoNumber: string;
  readonly mmsi?: string | null;
  readonly callSign?: string | null;
  readonly vesselType: string;
  readonly grossTonnage?: number | null;
  readonly lengthOverallM?: number | null;
  readonly maxDraftM?: number | null;
  readonly status?: VesselStatus;
};

export type UpdateVesselInput = Partial<CreateVesselInput>;

export type PortRecord = {
  readonly id: string;
  readonly tenantId: string;
  readonly countryId: string;
  readonly unlocode: string;
  readonly name: string;
  readonly timeZone: string;
  readonly status: PortStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type PortListQuery = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly status?: PortStatus;
  readonly countryId?: string;
  readonly sortBy?: PortSortField;
  readonly sortDirection?: SortDirection;
};

export type CreatePortInput = {
  readonly countryId: string;
  readonly unlocode: string;
  readonly name: string;
  readonly timeZone: string;
  readonly status?: PortStatus;
};

export type UpdatePortInput = Partial<CreatePortInput>;

export type BerthRecord = {
  readonly id: string;
  readonly tenantId: string;
  readonly terminalId: string;
  readonly code: string;
  readonly name: string;
  readonly maxLengthM: string | null;
  readonly maxDraftM: string | null;
  readonly status: BerthStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type BerthListQuery = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly status?: BerthStatus;
  readonly terminalId?: string;
  readonly sortBy?: BerthSortField;
  readonly sortDirection?: SortDirection;
};

export type CreateBerthInput = {
  readonly terminalId: string;
  readonly code: string;
  readonly name: string;
  readonly maxLengthM?: number | null;
  readonly maxDraftM?: number | null;
  readonly status?: BerthStatus;
};

export type UpdateBerthInput = Partial<CreateBerthInput>;

export type CargoItemRecord = {
  readonly id: string;
  readonly tenantId: string;
  readonly cargoCode: string;
  readonly name: string;
  readonly cargoCategory: CargoCategory;
  readonly unNumber: string | null;
  readonly isHazardous: boolean;
  readonly status: CargoItemStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CargoItemListQuery = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly status?: CargoItemStatus;
  readonly cargoCategory?: CargoCategory;
  readonly isHazardous?: boolean;
  readonly sortBy?: CargoItemSortField;
  readonly sortDirection?: SortDirection;
};

export type CreateCargoItemInput = {
  readonly cargoCode: string;
  readonly name: string;
  readonly cargoCategory: CargoCategory;
  readonly unNumber?: string | null;
  readonly isHazardous?: boolean;
  readonly status?: CargoItemStatus;
};

export type UpdateCargoItemInput = Partial<CreateCargoItemInput>;

export type VesselCallRecord = {
  readonly id: string;
  readonly tenantId: string;
  readonly callReference: string;
  readonly vesselId: string;
  readonly portId: string;
  readonly berthId: string | null;
  readonly agentId: string | null;
  readonly operatorId: string | null;
  readonly voyageNumber: string | null;
  readonly status: VesselCallStatus;
  readonly eta: string | null;
  readonly etd: string | null;
  readonly ata: string | null;
  readonly atd: string | null;
  readonly remarks: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type VesselCallListQuery = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly status?: VesselCallStatus;
  readonly vesselId?: string;
  readonly portId?: string;
  readonly berthId?: string;
  readonly sortBy?: VesselCallSortField;
  readonly sortDirection?: SortDirection;
};

export type CreateVesselCallInput = {
  readonly callReference: string;
  readonly vesselId: string;
  readonly portId: string;
  readonly berthId?: string | null;
  readonly agentId?: string | null;
  readonly operatorId?: string | null;
  readonly voyageNumber?: string | null;
  readonly status?: VesselCallStatus;
  readonly eta?: string | null;
  readonly etd?: string | null;
  readonly ata?: string | null;
  readonly atd?: string | null;
  readonly remarks?: string | null;
};

export type UpdateVesselCallInput = Partial<CreateVesselCallInput>;

export type BookingRequestRecord = {
  readonly id: string;
  readonly tenantId: string;
  readonly requestReference: string;
  readonly vesselId: string;
  readonly portId: string;
  readonly preferredBerthId: string | null;
  readonly agentOrganizationId: string | null;
  readonly customerOrganizationId: string | null;
  readonly vesselCallId: string | null;
  readonly status: BookingRequestStatus;
  readonly requestedEta: string | null;
  readonly requestedEtd: string | null;
  readonly voyageNumber: string | null;
  readonly cargoSummary: string | null;
  readonly remarks: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly submittedAt: string | null;
  readonly reviewedAt: string | null;
};

export type BookingRequestedServiceStatus =
  | 'requested'
  | 'reviewing'
  | 'accepted'
  | 'rejected'
  | 'cancelled';

export type BookingRequestedServiceRecord = {
  readonly id: string;
  readonly tenantId: string;
  readonly bookingRequestId: string;
  readonly serviceId: string;
  readonly serviceCode: string;
  readonly serviceName: string;
  readonly serviceCategory: ServiceCategory;
  readonly providerOrganizationId: string | null;
  readonly serviceReceiverOrganizationId: string | null;
  readonly billToOrganizationId: string | null;
  readonly payerOrganizationId: string | null;
  readonly status: BookingRequestedServiceStatus;
  readonly quantity: string;
  readonly unitOfMeasure: string;
  readonly requestedAt: string | null;
  readonly isBillable: boolean;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type BookingRequestListQuery = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly status?: BookingRequestStatus;
  readonly vesselId?: string;
  readonly portId?: string;
  readonly preferredBerthId?: string;
  readonly vesselCallId?: string;
  readonly sortBy?: BookingRequestSortField;
  readonly sortDirection?: SortDirection;
};

export type CreateBookingRequestInput = {
  readonly requestReference: string;
  readonly vesselId: string;
  readonly portId: string;
  readonly preferredBerthId?: string | null;
  readonly agentOrganizationId?: string | null;
  readonly customerOrganizationId?: string | null;
  readonly requestedEta?: string | null;
  readonly requestedEtd?: string | null;
  readonly voyageNumber?: string | null;
  readonly cargoSummary?: string | null;
  readonly remarks?: string | null;
};

export type UpdateBookingRequestInput = Partial<CreateBookingRequestInput> & {
  readonly status?: BookingRequestStatus;
};

export type CreateBookingRequestedServiceInput = {
  readonly serviceId: string;
  readonly providerOrganizationId?: string | null;
  readonly serviceReceiverOrganizationId?: string | null;
  readonly billToOrganizationId?: string | null;
  readonly payerOrganizationId?: string | null;
  readonly quantity: number;
  readonly unitOfMeasure: string;
  readonly requestedAt?: string | null;
  readonly isBillable?: boolean;
  readonly notes?: string | null;
};

export type AvailabilityRuleResult = {
  readonly status: AvailabilityRuleStatus;
  readonly message: string;
  readonly details?: Record<string, unknown>;
};

export type AvailabilityCheckInput = {
  readonly bookingRequestId?: string;
  readonly vesselId: string;
  readonly portId: string;
  readonly preferredBerthId?: string | null;
  readonly requestedEta: string;
  readonly requestedEtd: string;
  readonly cargoItemIds?: readonly string[];
  readonly requestedServiceIds?: readonly string[];
};

export type AvailabilityCheckRecord = {
  readonly id: string;
  readonly tenantId: string;
  readonly bookingRequestId: string | null;
  readonly vesselId: string | null;
  readonly portId: string;
  readonly berthId: string | null;
  readonly requestedEta: string;
  readonly requestedEtd: string;
  readonly result: AvailabilityResult;
  readonly score: number | null;
  readonly summary: string;
  readonly checks: {
    readonly berthWindow: AvailabilityRuleResult;
    readonly vesselDimensions: AvailabilityRuleResult;
    readonly draft: AvailabilityRuleResult;
    readonly cargoRestrictions: AvailabilityRuleResult;
    readonly serviceAvailability: AvailabilityRuleResult;
  };
  readonly recommendedBerthIds: readonly string[];
  readonly blockingReasons: readonly string[];
  readonly warnings: readonly string[];
  readonly createdAt: string;
};

export type MovementRecord = {
  readonly id: string;
  readonly tenantId: string;
  readonly movementReference: string;
  readonly vesselCallId: string;
  readonly vesselId: string;
  readonly portId: string;
  readonly fromBerthId: string | null;
  readonly toBerthId: string | null;
  readonly movementType: MovementType;
  readonly status: MovementStatus;
  readonly plannedAt: string | null;
  readonly actualAt: string | null;
  readonly remarks: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type MovementListQuery = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly status?: MovementStatus;
  readonly movementType?: MovementType;
  readonly vesselCallId?: string;
  readonly vesselId?: string;
  readonly portId?: string;
  readonly sortBy?: MovementSortField;
  readonly sortDirection?: SortDirection;
};

export type CreateMovementInput = {
  readonly movementReference: string;
  readonly vesselCallId: string;
  readonly vesselId: string;
  readonly portId: string;
  readonly fromBerthId?: string | null;
  readonly toBerthId?: string | null;
  readonly movementType: MovementType;
  readonly status?: MovementStatus;
  readonly plannedAt?: string | null;
  readonly actualAt?: string | null;
  readonly remarks?: string | null;
};

export type UpdateMovementInput = Partial<CreateMovementInput>;

export type ServiceCatalogRecord = {
  readonly id: string;
  readonly tenantId: string;
  readonly code: string;
  readonly name: string;
  readonly category: ServiceCategory;
  readonly defaultUnit: string;
  readonly isBillable: boolean;
  readonly status: ServiceCatalogStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type ServiceCatalogListQuery = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly status?: ServiceCatalogStatus;
  readonly category?: ServiceCategory;
  readonly isBillable?: boolean;
  readonly sortBy?: ServiceCatalogSortField;
  readonly sortDirection?: SortDirection;
};

export type CreateServiceCatalogInput = {
  readonly code: string;
  readonly name: string;
  readonly category: ServiceCategory;
  readonly defaultUnit: string;
  readonly isBillable?: boolean;
  readonly status?: ServiceCatalogStatus;
};

export type UpdateServiceCatalogInput = Partial<CreateServiceCatalogInput>;

export type MovementServiceRecord = {
  readonly id: string;
  readonly tenantId: string;
  readonly movementId: string;
  readonly serviceId: string;
  readonly providerOrganizationId: string | null;
  readonly serviceReceiverOrganizationId: string | null;
  readonly billToOrganizationId: string | null;
  readonly payerOrganizationId: string | null;
  readonly status: MovementServiceStatus;
  readonly quantity: string;
  readonly unitOfMeasure: string;
  readonly requestedAt: string | null;
  readonly completedAt: string | null;
  readonly isBillable: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type MovementServiceListQuery = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly status?: MovementServiceStatus;
  readonly movementId?: string;
  readonly serviceId?: string;
  readonly providerOrganizationId?: string;
  readonly serviceReceiverOrganizationId?: string;
  readonly billToOrganizationId?: string;
  readonly payerOrganizationId?: string;
  readonly isBillable?: boolean;
  readonly sortBy?: MovementServiceSortField;
  readonly sortDirection?: SortDirection;
};

export type CreateMovementServiceInput = {
  readonly movementId: string;
  readonly serviceId: string;
  readonly providerOrganizationId?: string | null;
  readonly serviceReceiverOrganizationId?: string | null;
  readonly billToOrganizationId?: string | null;
  readonly payerOrganizationId?: string | null;
  readonly status?: MovementServiceStatus;
  readonly quantity: number;
  readonly unitOfMeasure: string;
  readonly requestedAt?: string | null;
  readonly completedAt?: string | null;
  readonly isBillable?: boolean;
};

export type UpdateMovementServiceInput = Partial<CreateMovementServiceInput>;

export type OrganizationRecord = {
  readonly id: string;
  readonly tenantId: string;
  readonly legalName: string;
  readonly tradingName: string | null;
  readonly registrationNumber: string | null;
  readonly taxNumber: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly status: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type OrganizationListQuery = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly status?: string;
  readonly sortDirection?: SortDirection;
};

export type BillingEventPayload = {
  readonly source: {
    readonly movementServiceId: string;
    readonly movementId?: string;
    readonly serviceId?: string;
  };
  readonly parties?: {
    readonly serviceProviderOrganizationId?: string | null;
    readonly serviceReceiverOrganizationId?: string | null;
    readonly billToOrganizationId?: string | null;
    readonly payerOrganizationId?: string | null;
  };
  readonly service: {
    readonly quantity?: string;
    readonly unitOfMeasure?: string;
    readonly completedAt?: string | null;
    readonly isBillable?: boolean;
  };
  readonly erp: {
    readonly documentType: 'billing_request';
    readonly version: '1.0';
  };
  readonly snapshot: Record<string, unknown>;
};

export type BillingEventRecord = {
  readonly id: string;
  readonly tenantId: string;
  readonly eventReference: string;
  readonly movementServiceId: string;
  readonly status: BillingEventStatus;
  readonly erpSystem: string | null;
  readonly exportBatchId: string | null;
  readonly exportedAt: string | null;
  readonly acceptedAt: string | null;
  readonly rejectedAt: string | null;
  readonly failureReason: string | null;
  readonly payload: BillingEventPayload;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type BillingEventListQuery = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly status?: BillingEventStatus;
  readonly movementServiceId?: string;
  readonly erpSystem?: string;
  readonly exportBatchId?: string;
  readonly sortBy?: BillingEventSortField;
  readonly sortDirection?: SortDirection;
};

export type CreateBillingEventInput = {
  readonly movementServiceId: string;
  readonly eventReference?: string;
  readonly erpSystem?: string | null;
  readonly payload?: BillingEventPayload;
};

export type UpdateBillingEventInput = {
  readonly status?: BillingEventStatus;
  readonly erpSystem?: string | null;
  readonly exportBatchId?: string | null;
  readonly failureReason?: string | null;
};

export type BillingExportBatchPayload = {
  readonly erpSystem: string;
  readonly documentType: 'billing_export_batch';
  readonly version: '1.0';
  readonly billingEventIds: readonly string[];
  readonly summary: {
    readonly eventCount: number;
  };
};

export type BillingExportBatchRecord = {
  readonly id: string;
  readonly tenantId: string;
  readonly batchReference: string;
  readonly status: BillingExportBatchStatus;
  readonly erpSystem: string;
  readonly externalReference: string | null;
  readonly eventCount: number;
  readonly payload: BillingExportBatchPayload;
  readonly requestedAt: string;
  readonly completedAt: string | null;
  readonly failedAt: string | null;
  readonly failureReason: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type BillingExportBatchListQuery = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly status?: BillingExportBatchStatus;
  readonly erpSystem?: string;
  readonly sortBy?: BillingExportBatchSortField;
  readonly sortDirection?: SortDirection;
};

export type CreateBillingExportBatchInput = {
  readonly erpSystem: string;
  readonly billingEventIds: readonly string[];
  readonly batchReference?: string;
};

export type UpdateBillingExportBatchInput = {
  readonly status?: BillingExportBatchStatus;
  readonly externalReference?: string | null;
  readonly failureReason?: string | null;
};

export type RoleSummary = {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly isSystemRole: boolean;
};

export type PermissionRecord = {
  readonly id: string;
  readonly permissionGroupId: string | null;
  readonly code: string;
  readonly description: string | null;
  readonly resource: string | null;
  readonly action: PermissionAction | string | null;
  readonly isPrivileged: boolean;
  readonly sortOrder: number;
};

export type PermissionGroupRecord = {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly sortOrder: number;
  readonly permissions: readonly PermissionRecord[];
};

export type UserRecord = {
  readonly id: string;
  readonly tenantId: string;
  readonly email: string;
  readonly displayName: string;
  readonly authProvider: AuthProvider;
  readonly externalSubject: string | null;
  readonly status: UserStatus;
  readonly roles: readonly RoleSummary[];
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type UserListQuery = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly status?: UserStatus;
  readonly authProvider?: AuthProvider;
  readonly sortBy?: UserSortField;
  readonly sortDirection?: SortDirection;
};

export type CreateUserInput = {
  readonly email: string;
  readonly displayName: string;
  readonly authProvider?: AuthProvider;
  readonly externalSubject?: string | null;
  readonly status?: UserStatus;
};

export type UpdateUserInput = Partial<CreateUserInput>;

export type AssignUserRoleInput = {
  readonly roleId: string;
};

export type RoleRecord = {
  readonly id: string;
  readonly tenantId: string | null;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: RoleStatus;
  readonly isSystemRole: boolean;
  readonly isPrivileged: boolean;
  readonly requiresApproval: boolean;
  readonly permissions: readonly PermissionRecord[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt: string | null;
};

export type RoleListQuery = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly sortBy?: RoleSortField;
  readonly sortDirection?: SortDirection;
};

export type AuditLogRecord = {
  readonly id: string;
  readonly tenantId: string;
  readonly actorUserId: string | null;
  readonly action: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly requestId: string | null;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly beforeData: unknown | null;
  readonly afterData: unknown | null;
  readonly metadata: unknown | null;
  readonly createdAt: string;
};

export type AuditLogListQuery = {
  readonly page?: number;
  readonly pageSize?: number;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly action?: string;
  readonly sortDirection?: SortDirection;
};

export type CreateRoleInput = {
  readonly code: string;
  readonly name: string;
  readonly description?: string | null;
  readonly permissionIds?: readonly string[];
};

export type UpdateRoleInput = Partial<CreateRoleInput>;

export type UpdateRolePermissionsInput = {
  readonly permissionIds: readonly string[];
};

export type PermissionMatrixRole = {
  readonly role: RoleRecord;
  readonly permissionIds: readonly string[];
};

export type PermissionMatrixRecord = {
  readonly groups: readonly PermissionGroupRecord[];
  readonly roles: readonly PermissionMatrixRole[];
};

export type ReportDateRangeQuery = {
  readonly from?: string;
  readonly to?: string;
  readonly portId?: string;
};

export type ReportCountBreakdown = {
  readonly key: string;
  readonly label: string;
  readonly count: number;
};

export type ReportMetric = {
  readonly key: string;
  readonly label: string;
  readonly value: number;
};

export type ReportActivityItem = {
  readonly id: string;
  readonly reference: string;
  readonly status: string;
  readonly occurredAt: string | null;
  readonly portId?: string | null;
  readonly berthId?: string | null;
};

export type ReportsOverviewRecord = {
  readonly generatedAt: string;
  readonly filters: {
    readonly from: string | null;
    readonly to: string | null;
    readonly portId: string | null;
  };
  readonly operations: {
    readonly metrics: readonly ReportMetric[];
    readonly vesselCallsByStatus: readonly ReportCountBreakdown[];
    readonly movementsByStatus: readonly ReportCountBreakdown[];
    readonly movementsByType: readonly ReportCountBreakdown[];
    readonly berthActivity: readonly ReportCountBreakdown[];
    readonly upcomingArrivals: readonly ReportActivityItem[];
    readonly upcomingDepartures: readonly ReportActivityItem[];
  };
  readonly billing: {
    readonly metrics: readonly ReportMetric[];
    readonly billingEventsByStatus: readonly ReportCountBreakdown[];
    readonly billableServicesByStatus: readonly ReportCountBreakdown[];
    readonly exportBatchesByStatus: readonly ReportCountBreakdown[];
    readonly pendingBillingEvents: readonly ReportActivityItem[];
    readonly failedBillingEvents: readonly ReportActivityItem[];
  };
};

export type AiAssistantIntent =
  | 'operations_summary'
  | 'billing_readiness'
  | 'exception_review'
  | 'general_question'
  | 'unsupported_write_request';

export type AiAssistantSourceType =
  'vessel_call' | 'movement' | 'movement_service' | 'billing_event' | 'report';

export type AiAssistantSource = {
  readonly id: string;
  readonly type: AiAssistantSourceType;
  readonly reference: string;
  readonly label: string;
  readonly href: string;
};

export type AiAssistantMessage = {
  readonly role: 'user' | 'assistant';
  readonly content: string;
};

export type AiAssistantAskInput = {
  readonly question: string;
  readonly conversation?: readonly AiAssistantMessage[];
};

export type AiAssistantResponse = {
  readonly answer: string;
  readonly intent: AiAssistantIntent;
  readonly sources: readonly AiAssistantSource[];
  readonly limitations: readonly string[];
  readonly suggestedPrompts: readonly string[];
  readonly generatedAt: string;
};

export type PaginatedResponse<T> = {
  readonly data: readonly T[];
  readonly meta: {
    readonly page: number;
    readonly pageSize: number;
    readonly totalItems: number;
    readonly totalPages: number;
  };
};

export type ApiErrorResponse = {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, unknown>;
  };
};

export type DashboardMetric = {
  readonly label: string;
  readonly value: string;
  readonly status: OperationalStatus;
  readonly trend: string;
};

export const productName = 'Vessel Management System';

export const navigationItems: readonly NavigationItem[] = [
  { label: 'Operations', href: '/', permission: 'movement.read' },
  { label: 'Vessel Calls', href: '/vessel-calls', permission: 'vessel_call.read' },
  { label: 'Movements', href: '/movements', permission: 'movement.read' },
  { label: 'Vessels', href: '/vessels', permission: 'vessel.read' },
  { label: 'Ports', href: '/ports', permission: 'port.read' },
  { label: 'Berths', href: '/berths', permission: 'berth.read' },
  { label: 'Cargo', href: '/cargo', permission: 'cargo.read' },
  { label: 'Services', href: '/services', permission: 'service.read' },
  { label: 'Billing', href: '/billing-events', permission: 'invoice.read' },
  { label: 'ERP Exports', href: '/billing-export-batches', permission: 'invoice.read' },
  { label: 'Invoices', href: '/invoices', permission: 'invoice.read' },
  { label: 'Users', href: '/users', permission: 'user.read' },
  { label: 'Roles', href: '/roles', permission: 'role.read' },
  { label: 'Audit', href: '/audit', permission: 'audit.read' },
];

export const dashboardMetrics: readonly DashboardMetric[] = [
  {
    label: 'Active port calls',
    value: '18',
    status: 'in_progress',
    trend: '5 arrivals due in the next 12 hours',
  },
  {
    label: 'Berth conflicts',
    value: '2',
    status: 'attention',
    trend: 'Requires operations review',
  },
  {
    label: 'Services pending',
    value: '41',
    status: 'planned',
    trend: 'Pilotage, towage, waste, fresh water',
  },
  {
    label: 'Invoices ready',
    value: '9',
    status: 'completed',
    trend: 'Awaiting final approval',
  },
];

export const vesselStatuses: readonly VesselStatus[] = ['active', 'inactive'];

export const portStatuses: readonly PortStatus[] = ['active', 'inactive'];

export const berthStatuses: readonly BerthStatus[] = ['active', 'inactive'];

export const cargoItemStatuses: readonly CargoItemStatus[] = ['active', 'inactive'];

export const vesselCallStatuses: readonly VesselCallStatus[] = [
  'planned',
  'expected',
  'arrived',
  'alongside',
  'departed',
  'cancelled',
];

export const bookingRequestStatuses: readonly BookingRequestStatus[] = [
  'draft',
  'submitted',
  'under_review',
  'availability_checked',
  'approved',
  'rejected',
  'confirmed',
  'cancelled',
];

export const availabilityResults: readonly AvailabilityResult[] = [
  'available',
  'limited',
  'conflict',
  'manual_review_required',
];

export const availabilityRuleStatuses: readonly AvailabilityRuleStatus[] = [
  'pass',
  'warning',
  'fail',
  'manual_review',
];

export const movementStatuses: readonly MovementStatus[] = [
  'planned',
  'in_progress',
  'completed',
  'cancelled',
];

export const movementTypes: readonly MovementType[] = [
  'arrival',
  'departure',
  'berth_shift',
  'pilotage',
  'towage',
  'cargo_operation',
  'service',
  'inspection',
  'other',
];

export const serviceCatalogStatuses: readonly ServiceCatalogStatus[] = ['active', 'inactive'];

export const serviceCategories: readonly ServiceCategory[] = [
  'agency',
  'bunkering',
  'cargo',
  'inspection',
  'mooring',
  'pilotage',
  'security',
  'stores',
  'towage',
  'utilities',
  'waste',
  'other',
];

export const movementServiceStatuses: readonly MovementServiceStatus[] = [
  'requested',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'on_hold',
];

export const billingEventStatuses: readonly BillingEventStatus[] = [
  'draft',
  'ready',
  'on_hold',
  'rejected',
  'exported',
  'accepted',
  'failed',
];

export const billingExportBatchStatuses: readonly BillingExportBatchStatus[] = [
  'queued',
  'exporting',
  'exported',
  'accepted',
  'failed',
  'cancelled',
];

export const userStatuses: readonly UserStatus[] = [
  'invited',
  'active',
  'suspended',
  'deactivated',
];

export const authProviders: readonly AuthProvider[] = [
  'local',
  'entra_id',
  'oidc',
  'saml',
  'oauth',
];

export const cargoCategories: readonly CargoCategory[] = [
  'bulk',
  'container',
  'general',
  'hazardous',
  'liquid',
  'reefer',
];

export const vesselTypes: readonly string[] = [
  'Bulk Carrier',
  'Container Ship',
  'General Cargo',
  'LNG Carrier',
  'Oil Tanker',
  'Passenger Vessel',
  'Ro-Ro',
];

export function getStatusLabel(status: OperationalStatus): string {
  const labels: Record<OperationalStatus, string> = {
    planned: 'Planned',
    in_progress: 'In progress',
    completed: 'Completed',
    attention: 'Needs attention',
  };

  return labels[status];
}
