"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import type * as React from "react";
import {
  type DefaultValues,
  type FieldValues,
  type Path,
  type Resolver,
  useForm,
} from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import type { ActionResult } from "@/lib/actions";

/**
 * Glue for "edit in a side sheet" forms: react-hook-form + zod on the client, a Server Action on
 * submit (which re-validates on the server), field errors from the server mapped back onto the
 * form, a toast on success and the sheet closing itself.
 * The RAW form values are sent; the server parses them with the same schema.
 */
export function useSheetForm<S extends z.ZodType<FieldValues, FieldValues>, R = undefined>({
  schema,
  defaultValues,
  action,
  successMessage,
  onSuccess,
}: {
  schema: S;
  defaultValues: z.input<S> & FieldValues;
  action: (values: z.input<S>) => Promise<ActionResult<R>>;
  successMessage: string;
  /** Runs after a successful save, e.g. to open the new record. */
  onSuccess?: (data: R | undefined) => void;
}) {
  type Input = z.input<S> & FieldValues;
  const [open, setOpenState] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<Input>({
    // zod's input/output generics don't line up with react-hook-form's here; values are validated
    // by this schema on the client and again on the server.
    resolver: zodResolver(schema as never) as unknown as Resolver<Input>,
    defaultValues: defaultValues as DefaultValues<Input>,
    mode: "onTouched",
  });

  function setOpen(next: boolean) {
    if (next) {
      form.reset(defaultValues as Input);
      setFormError(null);
    }
    setOpenState(next);
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setFormError(null);
    void form.handleSubmit(() => {
      const raw = form.getValues();
      startTransition(async () => {
        const result = await action(raw);
        if (result.ok) {
          toast.success(successMessage);
          setOpenState(false);
          onSuccess?.(result.data);
          return;
        }
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            form.setError(field as Path<Input>, { message });
          }
        }
        setFormError(result.error);
      });
    })(event);
  };

  return { form, open, setOpen, pending, formError, onSubmit };
}
