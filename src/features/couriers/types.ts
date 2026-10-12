// Courier types mirroring the backend Courier API contract exactly
// (types/courier.ts + utils/courierMappers.ts). Nothing is invented.
//
// Backend surface (routes/courier.routes.ts):
//   GET     /couriers       list (any authenticated staff)
//   POST    /couriers       create (owner/manager)
//   GET     /couriers/:id   single courier
//   PATCH   /couriers/:id   update (owner/manager)
//   DELETE  /couriers/:id   DEACTIVATE (owner/manager) - there is no hard
//                           delete and no reactivation endpoint; deactivation
//                           is rejected (409) while the courier has active
//                           shipments.
//
// A courier's status is the backend boolean `isActive` - there is no status
// enum, and no service-type / tracking-template fields exist on the API.

export interface Courier {
  id: string;
  name: string;
  phone?: string;
  website?: string;
  contactPerson?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourierPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CourierListData {
  couriers: Courier[];
  pagination: CourierPagination;
}

// Server-side list query (courierListQuerySchema). `isActive` is a boolean in
// the UI and is serialized to the backend's 'true'|'false' query value by the
// service.
export interface CourierListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "createdAt" | "name" | "phone";
  sortOrder?: "asc" | "desc";
}

export interface CreateCourierData {
  name: string;
  phone?: string;
  website?: string;
  contactPerson?: string;
  address?: string;
  notes?: string;
}

// Partial update; the backend requires at least one field (courierValidators).
export type UpdateCourierData = Partial<CreateCourierData>;