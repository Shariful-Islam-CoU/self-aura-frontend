// Reports feature barrel.
//
// Every report request goes through reportClient (services/reportService.ts),
// which uses the shared apiClient against the backend /reports endpoints. The
// backend is the single source of truth for all report calculations; the
// frontend renders only what the API returns.
export * from "./types";
export * from "./constants";
export * from "./utils";
export * from "./hooks/useReportQuery";
export * from "./components";
export { reportClient, reportClient as reportService, ReportClient } from "./services/reportService";