"use client";

import { UserPlusIcon } from "lucide-react";
import { Controller } from "react-hook-form";

import { Field } from "@/components/common/field";
import { FormSheet } from "@/components/common/form-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteUser } from "@/features/settings/actions/user-actions";
import { RolePicker } from "@/features/settings/components/role-picker";
import { inviteUserSchema } from "@/features/settings/schemas";
import { useSheetForm } from "@/hooks/use-sheet-form";

export function InviteUserSheet() {
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: inviteUserSchema,
    defaultValues: { full_name: "", email: "", role: "accountant" },
    action: inviteUser,
    successMessage: "Invitation sent",
  });
  const { errors } = form.formState;

  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button>
          <UserPlusIcon /> Invite user
        </Button>
      }
      title="Invite a user"
      description="They'll get an email with a link to set their password. Access depends on the role."
      submitLabel="Send invitation"
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      <Field label="Full name" htmlFor="invite-name" required error={errors.full_name?.message}>
        <Input
          id="invite-name"
          autoFocus
          {...form.register("full_name")}
          aria-invalid={errors.full_name ? true : undefined}
          aria-describedby="invite-name-error"
        />
      </Field>
      <Field label="Work email" htmlFor="invite-email" required error={errors.email?.message}>
        <Input
          id="invite-email"
          type="email"
          autoComplete="off"
          {...form.register("email")}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby="invite-email-error"
        />
      </Field>
      <Controller
        control={form.control}
        name="role"
        render={({ field }) => <RolePicker value={field.value} onChange={field.onChange} />}
      />
    </FormSheet>
  );
}
