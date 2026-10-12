// Shipment service - every shipment API call goes through the shared
// apiClient. Endpoints (routes/shipment.routes.ts; all require authentication):
//   GET    /shipments                     list (any staff; server pagination/filters)
//   POST   /shipments                     create (any staff; the backend validates
//                                         order eligibility + active courier + no
//                                         duplicate active shipment, snapshots the
//                                         order's address, assigns the SHP-* number)
//   GET    /shipments/courier-summary     courier delivery summary (owner/manager)
//   GET    /shipments/performance-summary delivery performance summary (owner/manager)
//   GET    /shipments/:id                 single shipment
//   GET    /shipments/:id/history         shipment event timeline
//   PATCH  /shipments/:id                 update courier/tracking/charge/note
//                                         (owner/manager, editable statuses only)
//   PATCH  /shipments/:id/status          transition (owner/manager; the backend also
//                                         syncs the linked order status and records)
//                                         a history event - never done client-side)
//   POST   /shipments/:id/cancel          cancel (owner/manager; pending/ready only)
//
// Tracking numbers are user-provided on create/update; the frontend never
// generates one and never constructs tracking URLs.

import { apiClient } from "@/lib/api";
import type {
  CourierDeliverySummaryData,
  CourierDeliverySummaryParams,
  CreateShipmentData,
  DeliveryPerformanceParams,
  DeliveryPerformanceSummaryData,
  Shipment,
  ShipmentEvent,
  ShipmentListData,
  ShipmentListParams,
  UpdateShipmentData,
  UpdateShipmentStatusData,
} from "../types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

class ShipmentClient {
  private readonly basePath = "/shipments";

  async listShipments(params: ShipmentListParams = {}): Promise<ShipmentListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      search: params.search || undefined,
      courier: params.courier || undefined,
      customer: params.customer || undefined,
      status: params.status || undefined,
      fromDate: params.fromDate || undefined,
      toDate: params.toDate || undefined,
      shippedFrom: params.shippedFrom || undefined,
      shippedTo: params.shippedTo || undefined,
      deliveredFrom: params.deliveredFrom || undefined,
      deliveredTo: params.deliveredTo || undefined,
      sortBy: params.sortBy ?? "createdAt",
      sortOrder: params.sortOrder ?? "desc",
    };
    const response = await apiClient.get<ApiEnvelope<ShipmentListData>>(
      this.basePath,
      { params: query }
    );
    return response.data;
  }

  async getShipment(id: string): Promise<Shipment> {
    const response = await apiClient.get<ApiEnvelope<{ shipment: Shipment }>>(
      `${this.basePath}/${id}`
    );
    return response.data.shipment;
  }

  async createShipment(input: CreateShipmentData): Promise<Shipment> {
    const response = await apiClient.post<ApiEnvelope<{ shipment: Shipment }>>(
      this.basePath,
      input
    );
    return response.data.shipment;
  }

  async updateShipment(id: string, input: UpdateShipmentData): Promise<Shipment> {
    const response = await apiClient.patch<ApiEnvelope<{ shipment: Shipment }>>(
      `${this.basePath}/${id}`,
      input
    );
    return response.data.shipment;
  }

  async updateShipmentStatus(
    id: string,
    input: UpdateShipmentStatusData
  ): Promise<Shipment> {
    const response = await apiClient.patch<ApiEnvelope<{ shipment: Shipment }>>(
      `${this.basePath}/${id}/status`,
      input
    );
    return response.data.shipment;
  }

  async cancelShipment(id: string): Promise<Shipment> {
    const response = await apiClient.post<ApiEnvelope<{ shipment: Shipment }>>(
      `${this.basePath}/${id}/cancel`,
      null
    );
    return response.data.shipment;
  }

  /** Returns the chronological event history exactly as the backend provides it. */
  async getShipmentHistory(id: string): Promise<ShipmentEvent[]> {
    const response = await apiClient.get<ApiEnvelope<{ history: ShipmentEvent[] }>>(
      `${this.basePath}/${id}/history`
    );
    return response.data.history;
  }

  async getCourierDeliverySummary(
    params: CourierDeliverySummaryParams = {}
  ): Promise<CourierDeliverySummaryData> {
    const query: Record<string, string | number | boolean | undefined> = {
      courier: params.courier || undefined,
      fromDate: params.fromDate || undefined,
      toDate: params.toDate || undefined,
    };
    const response = await apiClient.get<ApiEnvelope<CourierDeliverySummaryData>>(
      `${this.basePath}/courier-summary`,
      { params: query }
    );
    return response.data;
  }

  async getDeliveryPerformanceSummary(
    params: DeliveryPerformanceParams = {}
  ): Promise<DeliveryPerformanceSummaryData> {
    const query: Record<string, string | number | boolean | undefined> = {
      fromDate: params.fromDate || undefined,
      toDate: params.toDate || undefined,
    };
    const response = await apiClient.get<ApiEnvelope<DeliveryPerformanceSummaryData>>(
      `${this.basePath}/performance-summary`,
      { params: query }
    );
    return response.data;
  }
}

export const shipmentClient = new ShipmentClient();