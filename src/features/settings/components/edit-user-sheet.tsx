"use client";

import type * as React from "react";
import { Controller } from "react-hook-form";

import { Field } from "@/components/common/field";
import { FormSheet } from "@/components/common/form-sheet";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { updateUser } from "@/features/settings/actions/user-actions";
import { RolePicker } from "@/features/settings/components/role-picker";
import type { UserRow } from "@/features/settings/queries";
import { updateUserSchema } from "@/features/settings/schemas";
import { useSheetForm } from "@/hooks/use-sheet-form";

export function EditUserSheet({
  user,
  isSelf,
  trigger,
}: {
  user: UserRow;
  isSelf: boolean;
  trigger: React.ReactNode;
}) {
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: updateUserSchema,
    defaultValues: { full_name: user.full_name, role: user.role, is_active: user.is_active },
    action: (values) => updateUser(user.id, values),
    successMessage: "User updated",
  });
  const { errors } = form.formState;

  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title={`Edit ${user.full_name}`}
      description={user.email}
      submitLabel="Save user"
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      <Field label="Full name" htmlFor="user-name" required error={errors.full_name?.message}>
        <Input
          id="user-name"
          autoFocus
          {...form.register("full_name")}
          aria-invalid={errors.full_name ? true : undefined}
          aria-describedby="user-name-error"
        />
      </Field>
      <Controller
        control={form.control}
        name="role"
        render={({ field }) => (
          <RolePicker value={field.value} onChange={field.onChange} disabled={isSelf} />
        )}
      />
      <Controller
        control={form.control}
        name="is_active"
        render={({ field }) => (
          <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
            <div className="space-y-0.5">
              <label htmlFor="user-active" className="text-small font-medium">
                Can sign in
              </label>
              <p className="text-small text-muted-foreground">
                Turning this off signs them out everywhere straight away. Their history is kept.
              </p>
            </div>
            <Switch
              id="user-active"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={isSelf}
            />
          </div>
        )}
      />
      {isSelf && (
        <p className="text-small text-muted-foreground">
          You can&apos;t change your own role or switch off your own access. Ask another CEO to do
          it.
        </p>
      )}
    </FormSheet>
  );
}
