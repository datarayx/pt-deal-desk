-- Reference data the app needs in every environment (demo and production): default settings,
-- deal stages (WORKFLOWS.md §2), facility types, KYC checklists and the default chart of
-- accounts (ACCOUNTING.md). All are editable in Settings / Chart of accounts; P&T's own lists
-- replace them later (DECISIONS.md). Idempotent: re-running changes nothing.

-- Settings (DECISIONS.md kick-off clarifications)
insert into public.settings (key, value) values
  ('reminder_days_before_due', '[7, 3, 0]'),
  ('overdue_email_weekdays', '["mon", "thu"]'),
  ('stale_deal_days', '30'),
  ('vat_rate_pct', '7.5'),
  ('wht_rate_pct', '10'),
  ('fiscal_year_end', '"12-31"'),
  ('referral_fee_trigger', '"on_disbursement"'),
  ('reliability_thresholds', '{"on_time_grace_days": 3, "good_on_time_pct": 90, "watch_on_time_pct": 70, "high_risk_overdue_days": 30}'),
  ('company_profile', '{"name": "P&T Finance Consult Limited"}')
on conflict (key) do nothing;

-- Deal stages (WORKFLOWS.md §2 default list)
insert into public.deal_stages (name, sort_order, is_terminal, color) values
  ('Enquiry', 1, false, '#7C93AB'),
  ('KYC & CIS', 2, false, '#7C93AB'),
  ('Transaction review', 3, false, '#7C93AB'),
  ('Structuring', 4, false, '#00B29E'),
  ('Requirements', 5, false, '#00B29E'),
  ('Submitted', 6, false, '#00B29E'),
  ('Risk analysis', 7, false, '#00B29E'),
  ('Approved', 8, false, '#00796F'),
  ('Collateral & documentation', 9, false, '#00796F'),
  ('Disbursed', 10, false, '#011A32'),
  ('Repaying', 11, false, '#011A32'),
  ('Completed', 12, true, '#047857')
on conflict (name) do nothing;

-- Facility types (DATA_MODEL.md)
insert into public.facility_types (name) values
  ('LPO financing'), ('Asset financing'), ('Working capital'), ('Project finance'),
  ('Invoice discounting'), ('Other')
on conflict (name) do nothing;

-- KYC checklists — demo defaults (DECISIONS.md: our own Nigerian-standard forms until P&T's arrive).
-- Directors' documents use the individual list, attached to the director's individual profile.
insert into public.kyc_document_types (client_type, name, is_required, has_expiry, sort_order) values
  ('individual', 'Signed customer information form (CIS)', true, false, 1),
  ('individual', 'Valid government ID (NIN slip, international passport, driver''s licence or voter''s card)', true, true, 2),
  ('individual', 'Recent passport photograph', true, false, 3),
  ('individual', 'Proof of address (utility bill, not older than 3 months)', true, false, 4),
  ('individual', 'Bank statement (last 6 months)', true, false, 5),
  ('individual', 'Evidence of income or business', false, false, 6),
  ('company', 'Signed customer information form (CIS)', true, false, 1),
  ('company', 'Certificate of incorporation (CAC)', true, false, 2),
  ('company', 'CAC status report (particulars of directors and shareholders)', true, false, 3),
  ('company', 'Memorandum and articles of association', true, false, 4),
  ('company', 'Board resolution to borrow', true, false, 5),
  ('company', 'Tax identification number (TIN) certificate', true, false, 6),
  ('company', 'Bank statement (last 12 months)', true, false, 7),
  ('company', 'Audited financial statements (last 2 years)', false, false, 8),
  ('company', 'Proof of business address (utility bill, not older than 3 months)', true, false, 9)
on conflict (client_type, name) do nothing;

-- Default chart of accounts (ACCOUNTING.md + 1120 WHT receivable). is_system marks accounts that
-- automatic postings (fees, receipts, payments, VAT/WHT, retained earnings) depend on.
insert into public.accounts (code, name, type, subtype, is_system) values
  ('1000', 'Cash at bank – Main account', 'asset', 'bank', true),
  ('1010', 'Cash in hand', 'asset', 'cash', false),
  ('1100', 'Fees receivable – Provider commissions', 'asset', 'receivable', true),
  ('1110', 'Fees receivable – Client & collateral fees', 'asset', 'receivable', true),
  ('1120', 'WHT receivable (tax credit)', 'asset', 'tax_credit', true),
  ('1200', 'Prepayments', 'asset', 'prepayment', false),
  ('1300', 'Short-term investments (trading with related company)', 'asset', 'investment', false),
  ('1500', 'Property, plant & equipment', 'asset', 'fixed_asset', false),
  ('1510', 'Accumulated depreciation', 'asset', 'contra_asset', false),
  ('2000', 'Referral fees payable', 'liability', 'payable', true),
  ('2100', 'Accrued expenses', 'liability', 'accrual', false),
  ('2200', 'VAT payable', 'liability', 'tax', true),
  ('2210', 'Withholding tax payable', 'liability', 'tax', true),
  ('2220', 'PAYE payable', 'liability', 'tax', false),
  ('2300', 'Income tax payable', 'liability', 'tax', false),
  ('3000', 'Share capital', 'equity', 'capital', false),
  ('3100', 'Retained earnings', 'equity', 'retained_earnings', true),
  ('4000', 'Commission income – Providers', 'income', 'revenue', true),
  ('4100', 'Advisory fee income – Clients', 'income', 'revenue', true),
  ('4200', 'Collateral negotiation fee income', 'income', 'revenue', true),
  ('4300', 'Investment income', 'income', 'revenue', false),
  ('4900', 'Other income', 'income', 'other_income', false),
  ('5000', 'Referral fee expense', 'expense', 'operating', true),
  ('5100', 'Salaries & wages', 'expense', 'operating', false),
  ('5200', 'Rent & office costs', 'expense', 'operating', false),
  ('5300', 'Professional & legal fees', 'expense', 'operating', false),
  ('5400', 'Transport & travel', 'expense', 'operating', false),
  ('5500', 'Utilities, internet & phone', 'expense', 'operating', false),
  ('5600', 'Bank charges', 'expense', 'operating', false),
  ('5700', 'Marketing & business development', 'expense', 'operating', false),
  ('5800', 'Depreciation', 'expense', 'operating', false),
  ('5900', 'Income tax expense', 'expense', 'tax', false)
on conflict (code) do nothing;
