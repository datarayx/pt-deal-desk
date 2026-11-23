import { describe, expect, it } from "vitest";

import {
  companyProfileSchema,
  feeDefaultsSchema,
  recipientSchema,
  reminderSettingsSchema,
} from "@/features/settings/schemas";

const fees = {
  vat_rate_pct: "7.5",
  wht_rate_pct: "10",
  referral_fee_trigger: "on_disbursement",
  client_fee_pct: "1.5",
  provider_commission_pct: "1",
  collateral_fee_basis: "percent",
  collateral_fee_value: "0.5",
} as const;

describe("feeDefaultsSchema", () => {
  it("accepts percentages up to 100", () => {
    expect(feeDefaultsSchema.safeParse(fees).success).toBe(true);
    expect(feeDefaultsSchema.safeParse({ ...fees, vat_rate_pct: "150" }).success).toBe(false);
  });

  it("validates the collateral value against its basis", () => {
    expect(
      feeDefaultsSchema.safeParse({
        ...fees,
        collateral_fee_basis: "flat",
        collateral_fee_value: "₦250,000.00",
      }).success,
    ).toBe(true);
    const bad = feeDefaultsSchema.safeParse({
      ...fees,
      collateral_fee_basis: "flat",
      collateral_fee_value: "abc",
    });
    expect(bad.success).toBe(false);
    expect(bad.error?.issues[0]?.path).toEqual(["collateral_fee_value"]);
  });
});

describe("reminderSettingsSchema", () => {
  it("de-duplicates and sorts reminder days, latest first", () => {
    const parsed = reminderSettingsSchema.parse({
      reminder_days_before_due: [0, 7, 3, 7],
      overdue_email_weekdays: ["mon"],
      stale_deal_days: "30",
    });
    expect(parsed.reminder_days_before_due).toEqual([7, 3, 0]);
  });

  it("keeps stale-deal days between 7 and 180", () => {
    const base = { reminder_days_before_due: [3], overdue_email_weekdays: ["mon"] as const };
    expect(reminderSettingsSchema.safeParse({ ...base, stale_deal_days: "5" }).success).toBe(false);
    expect(reminderSettingsSchema.safeParse({ ...base, stale_deal_days: "181" }).success).toBe(
      false,
    );
  });
});

describe("companyProfileSchema", () => {
  it("normalises CAC numbers and Nigerian phone numbers, and blanks to null", () => {
    const parsed = companyProfileSchema.parse({
      name: "P&T Finance Consult Limited",
      rc_number: "rc 1234567",
      tin: "",
      address: "",
      phone: "0803 123 4567",
      email: "",
      website: "",
    });
    expect(parsed.rc_number).toBe("RC 1234567");
    expect(parsed.phone).toBe("+2348031234567");
    expect(parsed.tin).toBeNull();
    expect(parsed.email).toBeNull();
  });
});

describe("recipientSchema", () => {
  it("needs at least one alert type", () => {
    const parsed = recipientSchema.safeParse({
      name: "Test",
      title: "",
      email: "test@example.com",
      alert_types: [],
      is_active: true,
    });
    expect(parsed.success).toBe(false);
  });
});
