// Returns feature barrel. Constants are exported explicitly (like the
// payments feature) so the array/map values don't collide with the union
// types that types.ts re-exports from constants.ts.
export {
  CANCELLABLE_RETURN_STATUSES,
  REFUND_STATUSES,
  RETURNABLE_ORDER_STATUS,
  RETURN_CONDITIONS,
  RETURN_NUMBER_PREFIX,
  RETURN_REASONS,
  RETURN_STATUSES,
  RETURN_STATUS_TRANSITIONS,
} from "./constants";
export * from "./types";
export * from "./utils";
export * from "./components";
export { returnClient, returnClient as returnService } from "./services/returnService";