"use client";

import { cn } from "@/lib/utils";
import { ROLES } from "@/features/settings/schemas";
import { roleInfo } from "@/features/settings/settings-values";

/** Radio cards for choosing a role. */
export function RolePicker({
  value,
  onChange,
  disabled,
}: {
  value: (typeof ROLES)[number];
  onChange: (role: (typeof ROLES)[number]) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="mb-2 text-small font-medium">
        Role <span className="text-danger">*</span>
      </legend>
      {ROLES.map((role) => (
        <label
          key={role}
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-accent/60 has-[:checked]:bg-accent-soft/40",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <input
            type="radio"
            name="role"
            value={role}
            checked={value === role}
            onChange={() => onChange(role)}
            className="mt-0.5 size-4 accent-[var(--color-accent)]"
          />
          <span className="space-y-0.5">
            <span className="block text-small font-medium">{roleInfo[role].label}</span>
            <span className="block text-small text-muted-foreground">
              {roleInfo[role].description}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
