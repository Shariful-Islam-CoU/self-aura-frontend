import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeliveryZoneSettings } from "@/features/settings/components/DeliveryZoneSettings";
import type { DeliveryZone } from "@/features/settings/types";

/**
 * Delivery RULE form tests (Step 19A) - management web.
 *
 * The settings service and the auth hook are faked so the assertions are about
 * the form's own behaviour: what it displays for a stored rule and exactly what
 * payload it sends when a rule is created or edited.
 *
 * These mirror the backend contract: ruleType (with Auto when unset), country,
 * aliases (Bangla/variant spellings), a rule-level charge where 0 is a real,
 * preserved value (a free area), and customer-facing name/description in both
 * English and Bangla. Empty fields never reach the payload.
 */

vi.mock("@/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "u1", username: "owner", role: "owner" },
    canAccess: () => true,
  }),
}));

const zoneFakes = vi.hoisted(() => ({
  calls: [] as Array<{ method: string; payload?: unknown }>,
  listResult: [] as DeliveryZone[],
  listError: null as Error | null,
  createError: null as Error | null,
  reset() {
    this.calls.length = 0;
    this.listResult = [];
    this.listError = null;
    this.createError = null;
  },
}));

vi.mock("@/features/settings/services/settingsService", () => ({
  settingsClient: {
    async getDeliveryZones() {
      zoneFakes.calls.push({ method: "list" });
      if (zoneFakes.listError) throw zoneFakes.listError;
      return { items: zoneFakes.listResult };
    },
    async createDeliveryZone(input: unknown) {
      zoneFakes.calls.push({ method: "create", payload: input });
      if (zoneFakes.createError) throw zoneFakes.createError;
      return { _id: "new-zone" };
    },
    async updateDeliveryZone(id: string, input: unknown) {
      zoneFakes.calls.push({ method: "update", payload: { id, input } });
      return { _id: id };
    },
    async toggleDeliveryZone() {
      zoneFakes.calls.push({ method: "toggle" });
      return {};
    },
    async deleteDeliveryZone(id: string) {
      zoneFakes.calls.push({ method: "delete", payload: id });
    },
  },
  SettingsClient: class {},
}));

const zone = (overrides: Partial<DeliveryZone> = {}): DeliveryZone => ({
  _id: "z1",
  code: "CUMILLA",
  name: "Cumilla",
  areas: [
    {
      district: "Cumilla",
      area: "Tomsom Bridge",
      country: "Bangladesh",
      ruleType: "exact_area",
      aliases: ["টমছম ব্রিজ"],
      charge: 0,
      customerName: "Tomsom Bridge",
      customerNameBn: "টমছম ব্রিজ",
      description: "Free delivery for Tomsom Bridge",
      descriptionBn: "টমছম ব্রিজে ফ্রি ডেলিভারি",
    },
    { district: "Cumilla", ruleType: "district_default", charge: 80 },
  ],
  baseCharge: 80,
  freeDeliveryEnabled: false,
  estimatedMinDays: 1,
  estimatedMaxDays: 3,
  isActive: true,
  priority: 0,
  sortOrder: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

beforeEach(() => {
  zoneFakes.reset();
});

afterEach(() => {
  cleanup();
});

describe("DeliveryZoneSettings — rule list", () => {
  it("shows rule types and rule-level charges per stored area", async () => {
    zoneFakes.listResult = [zone()];

    render(<DeliveryZoneSettings />);

    expect(await screen.findByText("Cumilla")).toBeTruthy();
    // Area summary line now carries the explicit rule types.
    expect(
      await screen.findByText(/Tomsom Bridge \/ Cumilla \/ Bangladesh \(exact_area\)/)
    ).toBeTruthy();
    expect(screen.getByText(/Cumilla \(district_default\)/)).toBeTruthy();
    // Rule-level charges are listed so ৳0 (a free area) is never ambiguous.
    expect(screen.getByText(/Rule-level charges:/)).toBeTruthy();
    expect(screen.getByText(/Tomsom Bridge \/ Cumilla \/ Bangladesh = 0/)).toBeTruthy();
  });
});

describe("DeliveryZoneSettings — rule create form", () => {
  it("sends ruleType, country, aliases, rule charge and bilingual customer text", async () => {
    const user = userEvent.setup();
    zoneFakes.listResult = [];

    render(<DeliveryZoneSettings />);

    await screen.findByText(/No delivery zones yet/);
    await user.click(screen.getByRole("button", { name: /Add delivery zone/ }));
    await user.type(screen.getByLabelText("Code"), "TOMSOM");
    await user.type(screen.getByLabelText("Name"), "Tomsom Bridge");
    await user.type(screen.getByLabelText("Base charge"), "80");

    // First area: an exact-area rule with Bangla + variant aliases.
    await user.selectOptions(screen.getByLabelText("Rule type"), "exact_area");
    await user.type(screen.getByLabelText("Area"), "Tomsom Bridge");
    await user.type(screen.getByLabelText("District"), "Cumilla");
    await user.clear(screen.getByLabelText("Country"));
    await user.type(screen.getByLabelText("Country"), "Bangladesh");
    await user.type(
      screen.getByLabelText(/Aliases \(Bangla \/ variant spellings\)/),
      "টমছম ব্রিজ, Tomshom Bridge"
    );
    // A rule-level charge of 0 must be sent, not dropped as "empty".
    await user.type(screen.getByLabelText(/Rule charge/), "0");
    await user.type(screen.getByLabelText("Customer-facing name"), "Tomsom Bridge");
    await user.type(screen.getByLabelText("Name (বাংলা)"), "টমছম ব্রিজ");
    await user.type(
      screen.getByLabelText("Customer-facing description"),
      "Free delivery for Tomsom Bridge"
    );
    await user.type(screen.getByLabelText("Description (বাংলা)"), "টমছম ব্রিজে ফ্রি ডেলিভারি");

    await user.click(screen.getByRole("button", { name: /Save zone/ }));

    await waitFor(() => {
      expect(zoneFakes.calls.some((call) => call.method === "create")).toBe(true);
    });
    const createCall = zoneFakes.calls.find((call) => call.method === "create");
    const payload = createCall?.payload as {
      code: string;
      name: string;
      baseCharge: number;
      areas: Array<Record<string, unknown>>;
    };

    expect(payload.code).toBe("TOMSOM");
    expect(payload.name).toBe("Tomsom Bridge");
    expect(payload.baseCharge).toBe(80);
    expect(payload.areas).toHaveLength(1);
    expect(payload.areas[0]).toMatchObject({
      ruleType: "exact_area",
      area: "Tomsom Bridge",
      district: "Cumilla",
      country: "Bangladesh",
      aliases: ["টমছম ব্রিজ", "Tomshom Bridge"],
      charge: 0,
      customerName: "Tomsom Bridge",
      customerNameBn: "টমছম ব্রিজ",
      description: "Free delivery for Tomsom Bridge",
      descriptionBn: "টমছম ব্রিজে ফ্রি ডেলিভারি",
    });
  }, 30000);

  it("omits auto ruleType, aliases and charge when the user leaves them empty", async () => {
    const user = userEvent.setup();
    zoneFakes.listResult = [];

    render(<DeliveryZoneSettings />);

    await screen.findByText(/No delivery zones yet/);
    await user.click(screen.getByRole("button", { name: /Add delivery zone/ }));

    await user.type(screen.getByLabelText("Code"), "CUMILLA");
    await user.type(screen.getByLabelText("Name"), "Cumilla City");
    await user.type(screen.getByLabelText("Base charge"), "80");
    // Only a district -> the backend derives district_default.
    await user.type(screen.getByLabelText("District"), "Cumilla");

    await user.click(screen.getByRole("button", { name: /Save zone/ }));

    await waitFor(() => {
      expect(zoneFakes.calls.some((call) => call.method === "create")).toBe(true);
    });
    const createCall = zoneFakes.calls.find((call) => call.method === "create");
    const payload = createCall?.payload as { areas: Array<Record<string, unknown>> };

    expect(payload.areas[0]).toEqual({
      district: "Cumilla",
      country: "Bangladesh",
    });
    expect(payload.areas[0].ruleType).toBeUndefined();
    expect(payload.areas[0].aliases).toBeUndefined();
    expect(payload.areas[0].charge).toBeUndefined();
  });

  it("blocks a save when no area carries any matching field", async () => {
    const user = userEvent.setup();
    zoneFakes.listResult = [];

    render(<DeliveryZoneSettings />);

    await screen.findByText(/No delivery zones yet/);
    await user.click(screen.getByRole("button", { name: /Add delivery zone/ }));

    await user.type(screen.getByLabelText("Code"), "VOID");
    await user.type(screen.getByLabelText("Name"), "Void zone");
    await user.type(screen.getByLabelText("Base charge"), "50");
    // Leave the area completely empty (including the prefilled country) so
    // there is nothing for the rule to actually match against.
    await user.clear(screen.getByLabelText("Country"));

    await user.click(screen.getByRole("button", { name: /Save zone/ }));

    expect(
      await screen.findByText(
        /Each area needs at least one of district, area, postal code or keywords/
      )
    ).toBeTruthy();
    expect(zoneFakes.calls.some((call) => call.method === "create")).toBe(false);
  });
});

describe("DeliveryZoneSettings — rule edit form", () => {
  it("pre-fills rule fields when editing an existing zone", async () => {
    const user = userEvent.setup();
    zoneFakes.listResult = [zone()];

    render(<DeliveryZoneSettings />);

    await screen.findByText("Cumilla");
    await user.click(screen.getByRole("button", { name: /Edit/ }));

    // The stored rule round-trips: explicit type, country, aliases, charge, text.
    // The fixture has two areas, so the first row is the exact-area rule.
    expect((screen.getAllByLabelText("Rule type")[0] as HTMLSelectElement).value).toBe(
      "exact_area"
    );
    expect((screen.getAllByLabelText("District")[0] as HTMLInputElement).value).toBe("Cumilla");
    expect((screen.getAllByLabelText("Area")[0] as HTMLInputElement).value).toBe("Tomsom Bridge");
    expect((screen.getAllByLabelText("Country")[0] as HTMLInputElement).value).toBe(
      "Bangladesh"
    );
    expect(
      (screen.getAllByLabelText(/Aliases \(Bangla \/ variant spellings\)/)[0] as HTMLInputElement)
        .value
    ).toBe("টমছম ব্রিজ");
    expect((screen.getAllByLabelText(/Rule charge/)[0] as HTMLInputElement).value).toBe(
      "0"
    );
    expect(
      (screen.getAllByLabelText("Customer-facing name")[0] as HTMLInputElement).value
    ).toBe("Tomsom Bridge");
  });
});