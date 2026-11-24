"use client";

import { useMemo, useState } from "react";

import { Field } from "@/components/common/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  currentQuarter,
  currentYear,
  isoMonth,
  rangeFromPreset,
  type PeriodPreset,
} from "@/features/reports/periods";
import type { PeriodRange } from "@/features/reports/logic";

export function PeriodPicker({ onChange }: { onChange: (range: PeriodRange) => void }) {
  const [preset, setPreset] = useState<PeriodPreset>("month");
  const [month, setMonth] = useState(isoMonth());
  const [quarter, setQuarter] = useState(currentQuarter());
  const [year, setYear] = useState(currentYear());
  const [customFrom, setCustomFrom] = useState(`${currentYear()}-01-01`);
  const [customTo, setCustomTo] = useState(`${currentYear()}-12-31`);
  const range = useMemo(
    () =>
      rangeFromPreset(
        preset,
        preset === "month" ? month : preset === "quarter" ? quarter : year,
        customFrom,
        customTo,
      ),
    [customFrom, customTo, month, preset, quarter, year],
  );
  function change(nextPreset: PeriodPreset) {
    setPreset(nextPreset);
    const nextRange = rangeFromPreset(
      nextPreset,
      nextPreset === "month" ? month : nextPreset === "quarter" ? quarter : year,
      customFrom,
      customTo,
    );
    onChange(nextRange);
  }
  function update(callback: () => void, next: PeriodRange) {
    callback();
    onChange(next);
  }
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
      <Field label="Period" htmlFor="report-period-preset">
        <Select value={preset} onValueChange={(value) => change(value as PeriodPreset)}>
          <SelectTrigger id="report-period-preset" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="quarter">Quarter</SelectItem>
            <SelectItem value="year">Year</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {preset === "month" && (
        <Field label="Month" htmlFor="report-month">
          <Input
            id="report-month"
            type="month"
            value={month}
            onChange={(event) =>
              update(
                () => setMonth(event.target.value),
                rangeFromPreset("month", event.target.value, customFrom, customTo),
              )
            }
          />
        </Field>
      )}
      {preset === "quarter" && (
        <Field label="Quarter" htmlFor="report-quarter">
          <Input
            id="report-quarter"
            type="text"
            value={quarter}
            placeholder="2026-Q4"
            pattern="\d{4}-Q[1-4]"
            onChange={(event) => {
              setQuarter(event.target.value);
              if (/^\d{4}-Q[1-4]$/.test(event.target.value))
                onChange(rangeFromPreset("quarter", event.target.value, customFrom, customTo));
            }}
          />
        </Field>
      )}
      {preset === "year" && (
        <Field label="Year" htmlFor="report-year">
          <Input
            id="report-year"
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={(event) =>
              update(
                () => setYear(event.target.value),
                rangeFromPreset("year", event.target.value, customFrom, customTo),
              )
            }
          />
        </Field>
      )}
      {preset === "custom" && (
        <>
          <Field label="From" htmlFor="report-from">
            <Input
              id="report-from"
              type="date"
              value={customFrom}
              onChange={(event) =>
                update(
                  () => setCustomFrom(event.target.value),
                  rangeFromPreset("custom", "", event.target.value, customTo),
                )
              }
            />
          </Field>
          <Field label="To" htmlFor="report-to">
            <Input
              id="report-to"
              type="date"
              value={customTo}
              onChange={(event) =>
                update(
                  () => setCustomTo(event.target.value),
                  rangeFromPreset("custom", "", customFrom, event.target.value),
                )
              }
            />
          </Field>
        </>
      )}
      <p className="pb-2 text-small text-muted-foreground">
        Current: <span className="num">{range.from}</span> → <span className="num">{range.to}</span>
      </p>
    </div>
  );
}
