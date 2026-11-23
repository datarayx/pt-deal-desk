# DATA_MODEL.md — Database design (Supabase Postgres)

All tables: `id uuid pk default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz`, `created_by uuid references auth.users`. Money `numeric(18,2)`. Rates `numeric(6,3)` (percent per month).

## Users
- **profiles**: id (= auth.users.id), full_name, email, role (`ceo` | `accountant`), is_active
- **notification_recipients**: name, title, email, alert_types text[] (`due_soon`,`due_today`,`overdue`,`stale_deal`), is_active

## Clients & KYC
- **clients**: client_type (`individual`|`company`), display_name, sector, enquiry_source (`email`|`whatsapp`|`phone`|`walk_in`|`website`|`referral`), referrer_id → referrers, kyc_status (`incomplete`|`submitted`|`verified`), notes
- **individual_profiles**: client_id (nullable — null when the person is only a director), title, first_name, middle_name, last_name, gender, date_of_birth, phone, email, residential_address, state, lga, occupation, employer_or_business, monthly_income_range, bvn, nin, id_type, id_number, id_expiry, next_of_kin_name, next_of_kin_phone, next_of_kin_relationship, is_pep, consent_given_at
- **company_profiles**: client_id, registered_name, rc_number, incorporation_date, company_type (`ltd`|`plc`|`bn`|`ngo`), registered_address, operating_address, tin, sector, annual_turnover_range, website, contact_person, contact_phone, contact_email
- **company_directors**: company_client_id → clients, individual_profile_id → individual_profiles, role (`director`|`shareholder`|`director_shareholder`), shareholding_pct
- **kyc_document_types**: client_type, name, is_required, has_expiry, sort_order (configurable)
- **client_documents**: client_id, individual_profile_id (nullable, for director docs), document_type_id, file_path (Storage), status (`missing`|`received`|`verified`|`expired`), expiry_date, verified_by, verified_at
- **credit_checks**: client_id, bureau (`CRC`|`FirstCentral`|`CreditRegistry`|`Other`), check_date, rating, score, total_exposure (bureau-reported snapshot), delinquent_facilities int, remarks, report_file_path
- **external_exposures**: client_id, lender_name, facility_type, amount, outstanding, status — itemised source of truth for exposure

## Partners
- **referrers**: name, referrer_type (`consultant`|`advisory_firm`|`past_client`|`individual`|`other`), contact_person, phone, email, default_fee_type (`percent`|`flat`), default_fee_value, bank_name, account_name (no account numbers in demo)
- **financiers**: name, financier_type (`finance_house`|`bank`|`capital_markets`|`other`), contact_person, phone, email, rate_min_monthly, rate_max_monthly, facility_types text[], collateral_policy, notes
- **financier_requirements**: financier_id, item, is_required, sort_order

## Deals
- **deal_stages**: name, sort_order, is_terminal, color (configurable). Default list in WORKFLOWS.md
- **facility_types**: name (LPO financing, Asset financing, Working capital, Project finance, Invoice discounting, Other)
- **deals**: reference (e.g. `PT-2026-0042`), client_id, financier_id, referrer_id, facility_type_id, stage_id, stage_entered_at, outcome (`open`|`negotiating`|`declined_by_lender`|`declined_by_client`|`defaulted`|`completed`) — progress lives in stage_id; declined deals keep their stage, amount_requested, amount_approved, amount_disbursed, tenor_months, interest_rate_monthly, purpose, collateral_type, collateral_value, guarantor_name, guarantor_cheques bool, other_fees_note, offer_date, disbursement_date, first_repayment_date, maturity_date, repayment_frequency (`monthly`|`bullet`|`quarterly`), decline_reason, owner_id
- **deal_requirements**: deal_id, item, status (`pending`|`received`|`waived`), file_path — deficiencies = pending required items
- **deal_stage_history**: deal_id, from_stage_id, to_stage_id, changed_at, changed_by, note
- **deal_documents**: deal_id, title, file_path
- **activities**: entity_type (`client`|`deal`|`referrer`), entity_id, kind (`note`|`call`|`email`|`meeting`|`system`), body, occurred_at

## Repayments & follow-up
- **repayment_schedules**: deal_id, instalment_no, due_date, principal_due, interest_due, total_due, status (`scheduled`|`due`|`reported`|`confirmed`|`partially_paid`|`overdue`), days_overdue
- **repayment_reports**: schedule_id, amount, paid_on, channel (`receipt`|`bank_alert`|`whatsapp`|`other`), proof_file_path, reported_at, confirmed_by_financier bool, confirmed_at, confirmation_note
- **follow_up_tasks**: deal_id, schedule_id, due_date, assigned_to, status (`open`|`done`), outcome, promise_to_pay_date
- **alerts**: user_id (nullable = all CEO), kind, title, body, link, read_at
- **outbox_emails**: to_emails text[], subject, html, related_entity, status (`queued`|`sent`|`demo`), created_at
- **reminder_log**: schedule_id (nullable), deal_id (nullable), condition (`due_7`|`due_3`|`due_0`|`overdue`|`stale_deal`), channel (`alert`|`email`), sent_on date — unique (schedule_id, deal_id, condition, channel, sent_on)

## Platform
- **audit_log**: actor_id, action (`view`|`create`|`update`|`delete`|`signed_url`), entity_type, entity_id, before jsonb, after jsonb, at
- **saved_views**: user_id, table_key, name, filters jsonb, columns jsonb

## Fees & accounting
- **deal_fees**: deal_id, fee_kind (`provider_commission`|`client_fee`|`collateral_fee`|`referral_fee`), basis (`percent`|`flat`), value, base_amount, computed_amount, trigger (`on_disbursement`|`on_first_repayment`|`manual`), status (`pending`|`earned`|`received`|`paid`|`cancelled`), vat_amount, wht_amount, earned_at, journal_entry_id, idempotency_key unique (prevents double recognition)
- **accounts**: code, name, type (`asset`|`liability`|`equity`|`income`|`expense`), subtype, parent_id, is_system, is_active
- **journal_entries**: entry_date, reference, memo, source (`manual`|`fee`|`receipt`|`payment`|`expense`), source_id, posted bool, period (YYYY-MM)
- **journal_lines**: entry_id, account_id, debit, credit, description — constraint: entry balances (sum debit = sum credit)
- **periods**: period (YYYY-MM), is_locked
- **settings**: key, value jsonb (reminder days, VAT %, WHT %, company profile, fiscal year end)

## Implementation notes (migrations `20261123200000`–`…201000`)
Columns added beyond the lists above, each for a rule in WORKFLOWS/ACCOUNTING:
- `journal_entries`: `posted_at`, `reverses_entry_id` (a posted system entry is corrected by a reversal; each entry can be reversed once). `period` is derived from `entry_date` by trigger.
- `periods`: `locked_at`, `locked_by`. A month with no `periods` row is open.
- `deal_requirements`: `is_required`, `sort_order` (copied from the financier's checklist; deficiencies = pending required items).
- `external_exposures.status`: `active` | `closed` | `delinquent`.
- `audit_log` uses `at` as its timestamp and has no `updated_at`/`created_by` (append-only; `actor_id` is the author).
- Accountant-safe access is via functions: `finance_referrers()` (name, bank_name, account_name) and `fee_lines_finance()` behind the view `v_fee_lines_finance`.
- `v_trial_balance(period_from, period_to)` is the function `trial_balance(period_from, period_to)`.

## Views (for reports)
- `v_trial_balance(period_from, period_to)`, `v_account_balances`, `v_receivables_aging`, `v_overdue_ageing`, `v_pipeline_by_stage`, `v_client_reliability`
- Accountant-safe views: `v_fee_lines_finance` (deal reference + client display name only)
