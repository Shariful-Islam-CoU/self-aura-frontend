"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import { Search, X, Check } from "lucide-react";
import { Portal } from "@/components/ui/Portal";

/**
 * Lightweight searchable single-select combobox built from existing
 * primitives. Backed by server-side search: the parent owns the query state
 * and the options (already filtered by the API) and calls onSelect when an
 * option is picked.
 *
 * The option list is portaled to <body> so the dialog's scroll container
 * cannot clip it, which means it must be positioned explicitly against the
 * input's viewport rect (fixed coordinates): an unpositioned portal renders
 * in the body's normal flow - below the page and behind the dialog overlay -
 * where the results would be invisible no matter how good the search is.
 */

export interface ListboxOption {
  id: string;
  label: string;
  description?: string;
  hint?: string;
  disabled?: boolean;
}

interface SearchableListboxProps {
  id?: string;
  label?: string;
  placeholder?: string;
  query: string;
  onQueryChange: (query: string) => void;
  options: ListboxOption[];
  selected: ListboxOption | null;
  onSelect: (option: ListboxOption) => void;
  isSearching: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  emptyText?: string;
  /**
   * Reports open/close transitions so the parent can run its search while
   * the picker is open (an empty query should load the first page of active
   * records instead of showing an empty state on focus).
   */
  onOpenChange?: (open: boolean) => void;
}

function DropdownList({
  listboxId,
  options,
  selected,
  focusedIndex,
  label,
  listRef,
  suppressClickRef,
  onSelect,
  onMouseEnter,
}: {
  listboxId: string;
  options: ListboxOption[];
  selected: ListboxOption | null;
  focusedIndex: number;
  label?: string;
  /** Callback ref: the parent measures the input and positions the portaled list. */
  listRef?: (el: HTMLUListElement | null) => void;
  /**
   * Shared flag: mousedown selects an option and marks the following click as
   * already handled, so one interaction produces exactly one selection.
   */
  suppressClickRef: React.MutableRefObject<boolean>;
  onSelect: (option: ListboxOption) => void;
  onMouseEnter: (index: number) => void;
}) {
  return (
    <Portal>
      <ul
        ref={listRef}
        id={`${listboxId}-listbox`}
        role="listbox"
        aria-label={label ?? "Options"}
        // The list is portaled to <body>, so dialogs must be told not to
        // treat clicks on it as backdrop clicks (see Dialog's outside-click
        // guard).
        data-dialog-portal=""
        className="fixed z-[60] overflow-y-auto rounded-lg border border-border bg-elevated shadow-lg"
      >
        {options.map((option, index) => (
          <li
            key={option.id}
            role="option"
            aria-selected={selected?.id === option.id}
            aria-disabled={option.disabled}
            id={`${listboxId}-option-${option.id}`}
            className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm ${
              focusedIndex === index ? "bg-accent" : "bg-transparent"
            } ${
              option.disabled
                ? "cursor-not-allowed text-muted-foreground opacity-60"
                : "text-foreground hover:bg-accent"
            }`}
            onMouseDown={(event) => {
              event.preventDefault();
              if (event.button !== 0) return;
              onSelect(option);
              // The synthetic click that follows this mousedown must not fire
              // the selection a second time.
              suppressClickRef.current = true;
            }}
            onMouseEnter={() => onMouseEnter(index)}
            onClick={() => {
              if (suppressClickRef.current) {
                suppressClickRef.current = false;
                return;
              }
              onSelect(option);
            }}
          >
            <div className="min-w-0">
              <span className="block truncate font-medium">{option.label}</span>
              {option.description && (
                <span className="block truncate text-xs text-muted-foreground">
                  {option.description}
                </span>
              )}
            </div>
            <div className="flex flex-none items-center gap-1.5">
              {option.hint && (
                <span className="text-xs text-muted-foreground">{option.hint}</span>
              )}
              {selected?.id === option.id && (
                <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              )}
            </div>
          </li>
        ))}
      </ul>
    </Portal>
  );
}

export function SearchableListbox({
  id,
  label,
  placeholder = "Search...",
  query,
  onQueryChange,
  options,
  selected,
  onSelect,
  isSearching,
  disabled = false,
  required = false,
  error,
  helperText,
  emptyText = "No results found.",
  onOpenChange,
}: SearchableListboxProps) {
  const generatedId = useId();
  const listboxId = id ?? generatedId;
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const suppressClickRef = useRef(false);

  const changeOpen = useCallback(
    (next: boolean) => {
      setOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange]
  );

  // Position the portaled list against the input row's viewport rect (the
  // portal lives outside any positioned ancestor, so the dropdown needs fixed
  // coordinates) and flip it above the input when there is not enough room
  // below. The measurement is a DOM concern, not React state, so it is
  // written straight to the node - the callback ref re-applies it every time
  // the list mounts.
  const applyListPosition = useCallback((el: HTMLUListElement | null) => {
    listRef.current = el;
    if (!el) return;
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const flip = spaceBelow < 200 && spaceAbove > spaceBelow;
    el.style.top = flip ? "" : `${rect.bottom + 4}px`;
    el.style.bottom = flip ? `${viewportHeight - rect.top + 4}px` : "";
    el.style.left = `${rect.left}px`;
    el.style.width = `${rect.width}px`;
    el.style.maxHeight = `${Math.max(flip ? spaceAbove : spaceBelow, 96)}px`;
  }, []);

  // Keep the dropdown glued to the input while it is open: the dialog (and
  // the page behind it) can scroll without the portal moving on its own.
  useEffect(() => {
    if (!open) return;
    applyListPosition(listRef.current);
    const reposition = () => applyListPosition(listRef.current);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, applyListPosition]);

  // Close the dropdown when clicking outside the combobox.
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        changeOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [changeOpen]);

  const showResults = open && (options.length > 0 || query.trim() !== "");

  const handleInputChange = (value: string) => {
    onQueryChange(value);
    changeOpen(true);
    setFocusedIndex(-1);
  };

  const handleInputFocus = () => {
    // On focus, always open and trigger search (empty query = show all active)
    changeOpen(true);
    setFocusedIndex(-1);
    onQueryChange(query);
  };

  const handleSelect = (option: ListboxOption) => {
    if (option.disabled) return;
    onSelect(option);
    changeOpen(false);
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      changeOpen(false);
      return;
    }
    if (!showResults) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocusedIndex((prev) => (prev <= 0 ? options.length - 1 : prev - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = focusedIndex >= 0 ? options[focusedIndex] : options[0];
      if (option) handleSelect(option);
    }
  };

  return (
    <div ref={containerRef} className="space-y-1.5">
      {label && (
        <label htmlFor={listboxId}>
          <span className="text-sm font-label text-foreground">
            {label}
            {required && <span className="ml-0.5 text-destructive">*</span>}
          </span>
        </label>
      )}
      <div ref={anchorRef} className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        {selected && query === selected.label ? (
          <div className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-elevated pl-9 pr-2 text-sm">
            <span className="truncate font-medium text-foreground">{selected.label}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              aria-label="Clear selection"
              onClick={() => {
                onQueryChange("");
                changeOpen(false);
              }}
              onPointerDown={(event) => event.preventDefault()}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <Input
            ref={inputRef}
            id={listboxId}
            role="combobox"
            aria-expanded={showResults}
            aria-controls={`${listboxId}-listbox`}
            aria-autocomplete="list"
            disabled={disabled}
            value={query}
            onChange={(event) => handleInputChange(event.target.value)}
            onFocus={handleInputFocus}
            onBlur={() => setFocusedIndex(-1)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pl-9"
          />
        )}
        {isSearching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <LoadingSpinner size="sm" aria-label="Searching" />
          </span>
        )}
      </div>

      {showResults && (
        <DropdownList
          listboxId={listboxId}
          options={options}
          selected={selected}
          focusedIndex={focusedIndex}
          label={label}
          listRef={applyListPosition}
          suppressClickRef={suppressClickRef}
          onSelect={handleSelect}
          onMouseEnter={setFocusedIndex}
        />
      )}

      {open && !isSearching && options.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {query.trim() !== "" ? emptyText : "No active records found."}
        </p>
      )}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        helperText && <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}