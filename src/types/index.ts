// Shared TypeScript types

// Base types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User types
export interface User extends BaseEntity {
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

export type UserRole = "admin" | "manager" | "staff";

// Product types
export interface Product extends BaseEntity {
  name: string;
  description: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  category?: Category;
  price: number;
  cost: number;
  stockQuantity: number;
  minStockLevel: number;
  unit: string;
  isActive: boolean;
}

export interface Category extends BaseEntity {
  name: string;
  description?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  isActive: boolean;
}

// Customer types
export interface Customer extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  isActive: boolean;
}

// Order types
export interface Order extends BaseEntity {
  orderNumber: string;
  customerId: string;
  customer?: Customer;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  notes?: string;
}

export type OrderStatus = 
  | "pending" 
  | "confirmed" 
  | "processing" 
  | "shipped" 
  | "delivered" 
  | "cancelled" 
  | "returned";

export interface OrderItem extends BaseEntity {
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Supplier types
export interface Supplier extends BaseEntity {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  isActive: boolean;
}

// Purchase types
export interface Purchase extends BaseEntity {
  purchaseNumber: string;
  supplierId: string;
  supplier?: Supplier;
  status: PurchaseStatus;
  totalAmount: number;
  items: PurchaseItem[];
  expectedDate?: string;
  receivedDate?: string;
}

export type PurchaseStatus = 
  | "draft" 
  | "ordered" 
  | "partial" 
  | "received" 
  | "cancelled";

export interface PurchaseItem extends BaseEntity {
  purchaseId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQuantity: number;
}

// Inventory types
export interface InventoryMovement extends BaseEntity {
  productId: string;
  product?: Product;
  type: InventoryMovementType;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
}

export type InventoryMovementType = 
  | "in" 
  | "out" 
  | "adjustment" 
  | "transfer" 
  | "return";

// Expense types
export interface Expense extends BaseEntity {
  expenseNumber: string;
  category: ExpenseCategory;
  amount: number;
  description?: string;
  date: string;
  status: ExpenseStatus;
}

export type ExpenseCategory = 
  | "rent" 
  | "utilities" 
  | "salaries" 
  | "marketing" 
  | "supplies" 
  | "transport" 
  | "other";

export type ExpenseStatus = "pending" | "approved" | "paid" | "rejected";

// Payment types
export interface Payment extends BaseEntity {
  paymentNumber: string;
  type: PaymentType;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  referenceType?: string;
  referenceId?: string;
  date: string;
  notes?: string;
}

export type PaymentType = "income" | "expense";
export type PaymentMethod = "cash" | "bank_transfer" | "card" | "check" | "online";
export type PaymentStatus = "pending" | "completed" | "failed" | "cancelled";

// Return types
export interface Return extends BaseEntity {
  returnNumber: string;
  orderId: string;
  order?: Order;
  customerId: string;
  customer?: Customer;
  status: ReturnStatus;
  totalAmount: number;
  items: ReturnItem[];
  reason?: string;
}

export type ReturnStatus = 
  | "requested" 
  | "approved" 
  | "received" 
  | "processed" 
  | "rejected" 
  | "completed";

export interface ReturnItem extends BaseEntity {
  returnId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reason?: string;
}

// Courier types
export interface Courier extends BaseEntity {
  name: string;
  code: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive: boolean;
}

// Shipment types
export interface Shipment extends BaseEntity {
  shipmentNumber: string;
  orderId: string;
  order?: Order;
  courierId: string;
  courier?: Courier;
  trackingNumber?: string;
  status: ShipmentStatus;
  shippedDate?: string;
  deliveredDate?: string;
  notes?: string;
}

export type ShipmentStatus = 
  | "pending" 
  | "picked_up" 
  | "in_transit" 
  | "out_for_delivery" 
  | "delivered" 
  | "failed" 
  | "returned";

// Report types
export interface Report {
  id: string;
  name: string;
  type: ReportType;
  generatedAt: string;
  data: unknown;
}

export type ReportType = 
  | "sales" 
  | "inventory" 
  | "financial" 
  | "customer" 
  | "supplier" 
  | "product";

// Settings types
export interface Settings {
  general: GeneralSettings;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
}

export interface GeneralSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  currency: string;
  timezone: string;
  dateFormat: string;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  lowStockAlert: boolean;
  orderNotifications: boolean;
}

export interface IntegrationSettings {
  apiEnabled: boolean;
  webhookUrl?: string;
  apiKey?: string;
}