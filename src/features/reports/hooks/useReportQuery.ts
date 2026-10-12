"use client";

// Shared data-fetching hooks for the report panels. Every report request goes
// through a reportClient method (which itself uses the shared apiClient) - no
// report component calls fetch directly. A "key" re-triggers the fetch: the
// panels serialize their applied query, so only an Apply/Refresh changes the
// key and avoids uncontrolled duplicate requests.
//
// Loading is derived from the last applied key/nonce instead of set in the
// effect, and results arrive through a reducer - both keep the effects free of
// synchronous state updates.

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import type { SelectOption } from "@/components/ui/Select";

export interface ReportQueryState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  /** HTTP status of the last failure (403 = permission denied). */
  status: number | null;
  refresh: () => void;
}

interface ReportState<T> {
  key: string;
  nonce: number;
  data: T | null;
  error: string | null;
  status: number | null;
}

type ReportAction<T> =
  | { type: "success"; key: string; nonce: number; data: T }
  | { type: "failure"; key: string; nonce: number; error: string; status: number | null };

function reportReducer<T>(state: ReportState<T>, action: ReportAction<T>): ReportState<T> {
  if (action.type === "success") {
    return { ...state, key: action.key, nonce: action.nonce, data: action.data, error: null, status: null };
  }
  return { ...state, key: action.key, nonce: action.nonce, error: action.error, status: action.status };
}

export function useReportQuery<T>(
  fetcher: () => Promise<T>,
  key: string
): ReportQueryState<T> {
  const [state, dispatch] = useReducer(
    reportReducer<T>,
    { key: "", nonce: 0, data: null, error: null, status: null }
  );
  const [nonce, setNonce] = useState(0);

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  // Derive loading from whether the freshest applied key/nonce has completed.
  const isLoading = state.key !== key || state.nonce !== nonce;

  useEffect(() => {
    let active = true;

    fetcherRef
      .current()
      .then((result) => {
        if (active) dispatch({ type: "success", key, nonce, data: result });
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof ApiError) {
          dispatch({
            type: "failure",
            key,
            nonce,
            error: err.message || "Unable to load the report.",
            status: err.status,
          });
        } else {
          dispatch({
            type: "failure",
            key,
            nonce,
            error: err instanceof Error ? err.message : "Unable to load the report.",
            status: null,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [key, nonce]);

  return { data: state.data, isLoading, error: state.error, status: state.status, refresh };
}

export interface ReportSelectOptionsState {
  options: SelectOption[];
  loading: boolean;
}

interface OptionsState {
  key: string;
  options: SelectOption[];
}

/** Loads once (per key) the options for a report filter select. */
export function useReportSelectOptions(
  build: () => Promise<SelectOption[]>,
  key: string
): ReportSelectOptionsState {
  const [state, dispatch] = useReducer(
    (_state: OptionsState, action: OptionsState): OptionsState => action,
    { key: "", options: [] }
  );

  const buildRef = useRef(build);
  useEffect(() => {
    buildRef.current = build;
  });

  const loading = state.key !== key;

  useEffect(() => {
    let active = true;
    buildRef
      .current()
      .then((opts) => {
        if (active) dispatch({ key, options: opts });
      })
      .catch(() => {
        if (active) dispatch({ key, options: [] });
      });

    return () => {
      active = false;
    };
  }, [key]);

  return { options: state.options, loading };
}