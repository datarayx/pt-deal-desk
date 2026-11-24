"use client";

import { ReceiptTextIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/common/field";
import { FormSheet } from "@/components/common/form-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { postExpense } from "@/features/accounting/actions";
import type { AccountRow } from "@/features/accounting/queries";
import { expenseSchema } from "@/features/accounting/finance-schemas";
import { useSheetForm } from "@/hooks/use-sheet-form";
import { lagosToday } from "@/lib/validation";

export function TransactionsWorkspace({ expenseAccounts }: { expenseAccounts: AccountRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick expense entry</CardTitle>
        <CardDescription>
          Record an expense paid from the main bank account. Each entry posts Dr the selected
          expense account and Cr Cash at bank.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ExpenseSheet accounts={expenseAccounts} />
      </CardContent>
    </Card>
  );
}

function ExpenseSheet({ accounts }: { accounts: AccountRow[] }) {
  const { form, open, setOpen, pending, formError, onSubmit } = useSheetForm({
    schema: expenseSchema,
    defaultValues: { entry_date: lagosToday(), expense_account: "", amount: "", description: "" },
    action: postExpense,
    successMessage: "Expense posted",
  });
  const { errors } = form.formState;
  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button disabled={accounts.length === 0}>
          <ReceiptTextIcon /> Record expense
        </Button>
      }
      title="Quick expense entry"
      description="This posts a balanced expense journal and cannot be edited after posting."
      submitLabel="Post expense"
      pending={pending}
      formError={formError}
      onSubmit={onSubmit}
    >
      <Field
        label="Expense date"
        htmlFor="expense-date"
        required
        error={errors.entry_date?.message}
      >
        <Input id="expense-date" type="date" {...form.register("entry_date")} />
      </Field>
      <Field
        label="Expense account"
        htmlFor="expense-account"
        required
        error={errors.expense_account?.message}
      >
        <Select
          value={form.watch("expense_account")}
          onValueChange={(value) =>
            form.setValue("expense_account", value, { shouldValidate: true })
          }
        >
          <SelectTrigger id="expense-account" className="w-full">
            <SelectValue placeholder="Choose an expense account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.code}>
                {account.code} · {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Amount" htmlFor="expense-amount" required error={errors.amount?.message}>
        <Input
          id="expense-amount"
          inputMode="decimal"
          className="num"
          {...form.register("amount")}
        />
      </Field>
      <Field
        label="Description"
        htmlFor="expense-description"
        required
        error={errors.description?.message}
      >
        <Input
          id="expense-description"
          placeholder="e.g. November office rent"
          {...form.register("description")}
        />
      </Field>
    </FormSheet>
  );
}
