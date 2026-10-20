// Customer types matching the backend API
// Backend: routes/customer.routes.ts, validators/customerValidators.ts,
// types/customer.ts, types/report.ts

export interface CustomerAddress {
  id: string;
  label: string;
  recipientName?: string;
  phone?: string;
  addressLine: string;
  area?: string;
  /** Required: the district is what delivery pricing resolves against. */
  district: string;
  /** Optional: descriptive only, so a district alone is enough. */
  city?: string;
  postalCode?: string;
  country?: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  avatarUrl?: string | null;
  facebookName?: string | null;
  facebookProfileUrl?: string | null;
  addresses: CustomerAddress[];
  notes?: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CustomerListData {
  customers: Customer[];
  pagination: CustomerPagination;
}

export interface CustomerAddressInput {
  label: string;
  recipientName?: string;
  phone?: string;
  addressLine: string;
  area?: string;
  district: string;
  city?: string;
  postalCode?: string;
  country?: string;
  isDefault: boolean;
}

export interface CreateCustomerInput {
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  avatarUrl?: string | null;
  facebookName?: string | null;
  facebookProfileUrl?: string | null;
  addresses?: CustomerAddressInput[];
  notes?: string;
  tags?: string[];
}

// Nulls clear the optional fields on update (backend updateCustomerSchema).
export interface UpdateCustomerInput {
  name?: string;
  phone?: string;
  alternatePhone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  facebookName?: string | null;
  facebookProfileUrl?: string | null;
  addresses?: CustomerAddressInput[] | null;
  notes?: string | null;
  tags?: string[];
}

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "createdAt" | "name";
  sortOrder?: "asc" | "desc";
}

export type CustomerSortBy = NonNullable<CustomerListParams["sortBy"]>;
export type CustomerSortOrder = NonNullable<CustomerListParams["sortOrder"]>;

export type CustomerStatusFilter = "all" | "active" | "inactive";

// Backend-computed customer totals from GET /reports/customers
// (totalCustomers/activeCustomers are all-time; newCustomers and order-based
// metrics are scoped to the report date range, defaulting to the current month).
export interface CustomerStatsTotals {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  customersWithOrders: number;
  repeatCustomers: number;
  totalCustomerOrders: number;
  totalCustomerSales: number;
}

export interface CustomerStatsData {
  startDate: string;
  endDate: string;
  totals: CustomerStatsTotals;
}