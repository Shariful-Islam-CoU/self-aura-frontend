"use client";

import { useEffect, useId, useRef, useState } from "react";
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
}

function DropdownList({
  listboxId,
  options,
  selected,
  focusedIndex,
  label,
  onSelect,
  onMouseEnter,
}: {
  listboxId: string;
  options: ListboxOption[];
  selected: ListboxOption | null;
  focusedIndex: number;
  label?: string;
  onSelect: (option: ListboxOption) => void;
  onMouseEnter: (index: number) => void;
}) {
  return (
    <Portal>
      <ul
        id={`${listboxId}-listbox`}
        role="listbox"
        aria-label={label ?? "Options"}
        className="z-[60] max-h-56 overflow-y-auto rounded-lg border border-border bg-elevated shadow-lg"
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
              onSelect(option);
            }}
            onMouseEnter={() => onMouseEnter(index)}
            onClick={() => onSelect(option)}
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
}: SearchableListboxProps) {
  const generatedId = useId();
  const listboxId = id ?? generatedId;
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close the dropdown when clicking outside the combobox.
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const showResults = open && (options.length > 0 || query.trim() !== "");

  const handleInputChange = (value: string) => {
    onQueryChange(value);
    setOpen(true);
    setFocusedIndex(-1);
  };

  const handleInputFocus = () => {
    // On focus, always open and trigger search (empty query = show all active)
    setOpen(true);
    setFocusedIndex(-1);
    onQueryChange(query);
  };

  const handleSelect = (option: ListboxOption) => {
    if (option.disabled) return;
    onSelect(option);
    setOpen(false);
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
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
      <div className="relative">
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
                setOpen(false);
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