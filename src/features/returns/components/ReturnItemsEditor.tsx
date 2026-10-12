import { Input } from "@/components/ui/Input";
import { RETURNABLE_ORDER_STATUS, RETURN_CONDITIONS, RETURN_REASONS } from "../constants";
import type { ReturnCondition, ReturnReason } from "../types";
import { getReturnConditionLabel, getReturnReasonLabel } from "../utils";

export interface ReturnItemsEditorLine {
  product: string;
  productName: string;
  sku: string;
  orderedQuantity: number;
  unitPrice: number;
  quantity: number;
  reason: ReturnReason;
  condition: ReturnCondition;
  included: boolean;
}

export interface ReturnItemsEditorProps {
  items: ReturnItemsEditorLine[];
  onChange: (items: ReturnItemsEditorLine[]) => void;
  errors?: Record<string, string | undefined>;
  disabled?: boolean;
}

const selectClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// Line items for a return. Ordered quantity and unit price are display/bounds
// hints from the loaded order; refund amounts and remaining returnable
// quantities are computed and enforced by the backend.
export function ReturnItemsEditor({
  items,
  onChange,
  errors,
  disabled,
}: ReturnItemsEditorProps) {
  const update = (index: number, patch: Partial<ReturnItemsEditorLine>) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-label">Include</th>
                <th className="px-3 py-2 font-label">Product</th>
                <th className="px-3 py-2 font-label">SKU</th>
                <th className="px-3 py-2 font-label text-right">Ordered</th>
                <th className="px-3 py-2 font-label text-right">Return qty</th>
                <th className="px-3 py-2 font-label text-right">Unit price</th>
                <th className="px-3 py-2 font-label">Reason</th>
                <th className="px-3 py-2 font-label">Condition</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.product} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label={`Return ${item.productName}`}
                      checked={item.included}
                      disabled={disabled}
                      onChange={(event) => update(index, { included: event.target.checked })}
                      className="h-4 w-4 rounded border-input"
                    />
                  </td>
                  <td className="px-3 py-2 font-medium text-foreground">{item.productName}</td>
                  <td className="px-3 py-2 text-muted-foreground">{item.sku}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{item.orderedQuantity}</td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={1}
                      max={Math.min(item.orderedQuantity, 9999)}
                      step={1}
                      inputMode="numeric"
                      aria-label={`Return quantity for ${item.productName}`}
                      value={item.included ? String(item.quantity) : ""}
                      disabled={disabled || !item.included}
                      onChange={(event) => {
                        const raw = event.target.value;
                        const parsed = parseInt(raw, 10);
                        update(index, {
                          quantity: Number.isNaN(parsed) ? 0 : parsed,
                        });
                      }}
                      className="h-9 w-20"
                    />
                    {errors?.[item.product] && (
                      <p className="mt-1 text-xs text-destructive" role="alert">
                        {errors[item.product]}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                    {item.unitPrice}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      aria-label={`Reason for ${item.productName}`}
                      className={selectClassName}
                      value={item.reason}
                      disabled={disabled || !item.included}
                      onChange={(event) =>
                        update(index, {
                          reason: event.target.value as (typeof RETURN_REASONS)[number],
                        })
                      }
                    >
                      {RETURN_REASONS.map((reason) => (
                        <option key={reason} value={reason}>
                          {getReturnReasonLabel(reason)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      aria-label={`Condition for ${item.productName}`}
                      className={selectClassName}
                      value={item.condition}
                      disabled={disabled || !item.included}
                      onChange={(event) =>
                        update(index, {
                          condition: event.target.value as (typeof RETURN_CONDITIONS)[number],
                        })
                      }
                    >
                      {RETURN_CONDITIONS.map((condition) => (
                        <option key={condition} value={condition}>
                          {getReturnConditionLabel(condition)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Only {RETURNABLE_ORDER_STATUS} orders are returnable. Remaining
        returnable quantities (minus previously returned amounts) are enforced
        by the backend on submit.
      </p>
    </div>
  );
}