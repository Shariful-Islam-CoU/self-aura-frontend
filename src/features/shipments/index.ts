// Shipments feature barrel. Constants are exported explicitly (like the
// payments/returns features) so the array/map values don't collide with the
// union types that types.ts re-exports from constants.ts.
export {
  ACTIVE_SHIPMENT_STATUSES,
  CANCELLABLE_SHIPMENT_STATUSES,
  DEFAULT_SHIPMENT_STATUS,
  DELIVERY_FAILURE_REASONS,
  EDITABLE_SHIPMENT_STATUSES,
  SHIPMENT_NUMBER_PREFIX,
  SHIPMENT_STATUSES,
  SHIPMENT_STATUS_TRANSITIONS,
  SHIPPABLE_ORDER_STATUSES,
} from "./constants";
export * from "./types";
export * from "./utils";
export * from "./components";
export { shipmentClient, shipmentClient as shipmentService } from "./services/shipmentService";