// Supplier types matching the backend API.
// Backend: routes/supplier.routes.ts, validators/supplierValidators.ts,
// types/supplier.ts. Create/update/delete are owner/manager only; listing and
// viewing are available to all authenticated roles.

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SupplierListData {
  suppliers: Supplier[];
  pagination: SupplierPagination;
}

export interface SupplierListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "createdAt" | "name" | "phone";
  sortOrder?: "asc" | "desc";
}

export type SupplierSortBy = NonNullable<SupplierListParams["sortBy"]>;
export type SupplierSortOrder = NonNullable<SupplierListParams["sortOrder"]>;

export interface CreateSupplierInput {
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface UpdateSupplierInput {
  name?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  notes?: string;
}