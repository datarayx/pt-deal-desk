import { sumDecimalStrings } from "@/lib/money/decimal";

export type PeriodRange = { from: string; to: string; label: string };

export type ReportAccount = {
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "income" | "expense";
  subtype: string | null;
};

export type ReportLine = {
  entry_date: string;
  reference: string | null;
  account_code: string;
  account_name: string;
  account_type: ReportAccount["type"];
  account_subtype: string | null;
  debit: string;
  credit: string;
};

export type ReportRow = { code: string; name: string; amount: string };

function cents(value: string | number | null | undefined): bigint {
  const raw = String(value ?? "0").trim();
  const negative = raw.startsWith("-");
  const clean = negative ? raw.slice(1) : raw;
  if (!/^\d+(\.\d+)?$/.test(clean)) return BigInt(0);
  const [whole = "0", fraction = ""] = clean.split(".");
  const result = BigInt(whole) * BigInt(100) + BigInt((fraction + "00").slice(0, 2));
  return negative ? -result : result;
}

function money(value: bigint): string {
  const sign = value < BigInt(0) ? "-" : "";
  const absolute = value < BigInt(0) ? -value : value;
  return `${sign}${absolute / BigInt(100)}.${(absolute % BigInt(100)).toString().padStart(2, "0")}`;
}

function addSigned(left: string, right: string) {
  return money(cents(left) + cents(right));
}

function subtractSigned(left: string, right: string) {
  return money(cents(left) - cents(right));
}

function negate(value: string) {
  return money(-cents(value));
}

function signedSum(values: string[]) {
  return values.reduce((total, value) => addSigned(total, value), "0.00");
}

function isWithin(date: string, range: PeriodRange) {
  return date >= range.from && date <= range.to;
}

function isOpening(line: ReportLine) {
  return line.reference?.startsWith("OB-") ?? false;
}

function selectedLines(lines: ReportLine[], range: PeriodRange) {
  return lines.filter((line) => isWithin(line.entry_date, range));
}

function accountMovement(lines: ReportLine[], account: ReportAccount, from: string, to: string) {
  return signedSum(
    lines
      .filter(
        (line) =>
          line.account_code === account.code && line.entry_date >= from && line.entry_date <= to,
      )
      .map((line) => subtractSigned(line.debit, line.credit)),
  );
}

function accountBalance(lines: ReportLine[], account: ReportAccount, asOf: string) {
  const net = signedSum(
    lines
      .filter((line) => line.account_code === account.code && line.entry_date <= asOf)
      .map((line) => subtractSigned(line.debit, line.credit)),
  );
  return account.type === "asset" ? net : negate(net);
}

function flowStartBalance(lines: ReportLine[], account: ReportAccount, from: string) {
  return accountBalance(
    lines.filter((line) => line.entry_date < from || (line.entry_date === from && isOpening(line))),
    account,
    from,
  );
}

export function buildTrialBalance(
  lines: ReportLine[],
  accounts: ReportAccount[],
  range: PeriodRange,
) {
  const scoped = selectedLines(lines, range);
  const rows = accounts.flatMap((account) => {
    const debit = sumDecimalStrings(
      scoped.filter((line) => line.account_code === account.code).map((line) => line.debit),
    );
    const credit = sumDecimalStrings(
      scoped.filter((line) => line.account_code === account.code).map((line) => line.credit),
    );
    const net = cents(debit) - cents(credit);
    if (net === BigInt(0)) return [];
    return [
      {
        code: account.code,
        name: account.name,
        type: account.type,
        debit: net > BigInt(0) ? money(net) : "0.00",
        credit: net < BigInt(0) ? money(-net) : "0.00",
      },
    ];
  });
  return {
    rows,
    debitTotal: sumDecimalStrings(rows.map((row) => row.debit)),
    creditTotal: sumDecimalStrings(rows.map((row) => row.credit)),
  };
}

export function buildProfitAndLoss(
  lines: ReportLine[],
  accounts: ReportAccount[],
  range: PeriodRange,
) {
  const scoped = selectedLines(lines, range);
  const incomeRows: ReportRow[] = [];
  const expenseRows: ReportRow[] = [];
  const taxRows: ReportRow[] = [];
  for (const account of accounts) {
    if (account.type !== "income" && account.type !== "expense") continue;
    const movement = signedSum(
      scoped
        .filter((line) => line.account_code === account.code)
        .map((line) => subtractSigned(line.credit, line.debit)),
    );
    const amount = account.type === "expense" ? negate(movement) : movement;
    if (amount === "0.00") continue;
    const row = { code: account.code, name: account.name, amount };
    if (account.type === "expense" && account.code === "5900") taxRows.push(row);
    else if (account.type === "expense") expenseRows.push(row);
    else incomeRows.push(row);
  }
  const revenue = signedSum(
    incomeRows
      .filter((row) => Number(row.code) >= 4000 && Number(row.code) <= 4300)
      .map((row) => row.amount),
  );
  const otherIncome = signedSum(
    incomeRows.filter((row) => Number(row.code) > 4300).map((row) => row.amount),
  );
  const operatingExpenses = signedSum(expenseRows.map((row) => row.amount));
  const tax = signedSum(taxRows.map((row) => row.amount));
  const profitBeforeTax = addSigned(addSigned(revenue, otherIncome), negate(operatingExpenses));
  const profit = addSigned(profitBeforeTax, negate(tax));
  return {
    revenueRows: incomeRows.filter((row) => Number(row.code) >= 4000 && Number(row.code) <= 4300),
    otherIncomeRows: incomeRows.filter((row) => Number(row.code) > 4300),
    expenseRows,
    taxRows,
    revenue,
    otherIncome,
    operatingExpenses,
    tax,
    profitBeforeTax,
    profit,
  };
}

export function buildBalanceSheet(lines: ReportLine[], accounts: ReportAccount[], asOf: string) {
  const assets: ReportRow[] = [];
  const liabilities: ReportRow[] = [];
  const equity: ReportRow[] = [];
  for (const account of accounts) {
    if (!["asset", "liability", "equity"].includes(account.type)) continue;
    const amount = accountBalance(lines, account, asOf);
    if (amount === "0.00") continue;
    const row = { code: account.code, name: account.name, amount };
    if (account.type === "asset") assets.push(row);
    else if (account.type === "liability") liabilities.push(row);
    else equity.push(row);
  }
  const profit = buildProfitAndLoss(lines, accounts, {
    from: "0000-01-01",
    to: asOf,
    label: "To date",
  }).profit;
  const totalAssets = signedSum(assets.map((row) => row.amount));
  const totalLiabilities = signedSum(liabilities.map((row) => row.amount));
  const equityBeforeProfit = signedSum(equity.map((row) => row.amount));
  const totalEquity = addSigned(equityBeforeProfit, profit);
  return {
    assets,
    liabilities,
    equity,
    profit,
    totalAssets,
    totalLiabilities,
    equityBeforeProfit,
    totalEquity,
    difference: subtractSigned(totalAssets, addSigned(totalLiabilities, totalEquity)),
  };
}

export function buildCashFlow(lines: ReportLine[], accounts: ReportAccount[], range: PeriodRange) {
  const pnl = buildProfitAndLoss(lines, accounts, range);
  const depreciation = accountMovement(
    lines,
    accounts.find((account) => account.code === "5800") ?? {
      code: "5800",
      name: "Depreciation",
      type: "expense",
      subtype: null,
    },
    range.from,
    range.to,
  );
  const currentAssetAdjustments: ReportRow[] = [];
  const operatingLiabilityAdjustments: ReportRow[] = [];
  const investing: ReportRow[] = [];
  const financing: ReportRow[] = [];
  for (const account of accounts) {
    const movement = subtractSigned(
      accountBalance(lines, account, range.to),
      flowStartBalance(lines, account, range.from),
    );
    if (movement === "0.00") continue;
    if (
      account.type === "asset" &&
      account.code !== "1000" &&
      account.code !== "1010" &&
      account.subtype !== "fixed_asset" &&
      account.subtype !== "investment" &&
      account.subtype !== "contra_asset"
    )
      currentAssetAdjustments.push({
        code: account.code,
        name: account.name,
        amount: negate(movement),
      });
    if (account.type === "liability")
      operatingLiabilityAdjustments.push({
        code: account.code,
        name: account.name,
        amount: movement,
      });
    if (
      account.type === "asset" &&
      (account.subtype === "fixed_asset" || account.subtype === "investment")
    )
      investing.push({ code: account.code, name: account.name, amount: negate(movement) });
    if (account.type === "equity")
      financing.push({ code: account.code, name: account.name, amount: movement });
  }
  const operatingAdjustments = [...currentAssetAdjustments, ...operatingLiabilityAdjustments];
  const operating = signedSum([
    pnl.profit,
    depreciation,
    ...operatingAdjustments.map((row) => row.amount),
  ]);
  const investingTotal = signedSum(investing.map((row) => row.amount));
  const financingTotal = signedSum(financing.map((row) => row.amount));
  const actualCashMovement = signedSum(
    selectedLines(lines, range)
      .filter((line) => line.account_code === "1000" && !isOpening(line))
      .map((line) => subtractSigned(line.debit, line.credit)),
  );
  const netChange = signedSum([operating, investingTotal, financingTotal]);
  return {
    profit: pnl.profit,
    depreciation,
    operatingAdjustments,
    operating,
    investing,
    investingTotal,
    financing,
    financingTotal,
    actualCashMovement,
    netChange,
    reconciliationDifference: subtractSigned(netChange, actualCashMovement),
  };
}

export function previousPeriod(range: PeriodRange): PeriodRange {
  const from = new Date(`${range.from}T00:00:00Z`);
  const to = new Date(`${range.to}T00:00:00Z`);
  const days = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
  const previousTo = new Date(from.getTime() - 86400000);
  const previousFrom = new Date(previousTo.getTime() - (days - 1) * 86400000);
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  return {
    from: iso(previousFrom),
    to: iso(previousTo),
    label: `Prior period · ${iso(previousFrom)} to ${iso(previousTo)}`,
  };
}
