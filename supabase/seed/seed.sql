-- P&T Deal Desk — demo seed (task 1.3, docs/SEED_DATA.md). Run with `npm run db:seed`.
--
-- * Repeatable: wipes ONLY demo business data (clients, deals, repayments, fees, journals …) and
--   rebuilds it. Reference data (settings, stages, facility types, KYC checklists, chart of
--   accounts), users and saved views are kept.
-- * Safe: refuses to run if any non-demo user exists (so it can never wipe a real P&T database).
-- * Dates are relative to today in Africa/Lagos; opening balances are fixed at 1 Jan this year.
-- * Every deal, schedule, repayment, fee, receipt and journal goes through the same database
--   functions the app uses (disburse_deal, report_repayment, confirm_repayment_report,
--   recognise_fee, record_fee_receipt, pay_referral_fee, post_journal), so the books balance by
--   construction.
-- * All people and companies are fictional. BVNs start 99… and NINs 98… so they can never be real.
-- * One statement (a DO block) = one transaction: if anything fails, nothing changes.

do $seed$
begin

-- ---------------------------------------------------------------------------
-- Safety + reset
-- ---------------------------------------------------------------------------
begin
  if exists (select 1 from public.profiles where email not like '%@demo.ptdealdesk.ng') then
    raise exception 'Refusing to seed: this database has non-demo users. The seed is for demo databases only.';
  end if;
  if not exists (select 1 from public.profiles where role = 'ceo' and is_active) then
    raise exception 'No active demo CEO. Run `npm run demo:users` first.';
  end if;
end;

truncate table
  public.activities, public.alerts, public.outbox_emails, public.reminder_log, public.audit_log,
  public.follow_up_tasks, public.repayment_reports, public.repayment_schedules,
  public.deal_fees, public.journal_lines, public.journal_entries, public.periods,
  public.deal_documents, public.deal_requirements, public.deal_stage_history, public.deals,
  public.external_exposures, public.credit_checks, public.client_documents,
  public.company_directors, public.company_profiles, public.individual_profiles, public.clients,
  public.financier_requirements, public.financiers, public.referrers, public.notification_recipients;

-- ---------------------------------------------------------------------------
-- Notification recipients (staff who get emails, don't sign in)
-- ---------------------------------------------------------------------------
insert into public.notification_recipients (name, title, email) values
  ('Kelechi Nnaji', 'Business Manager', 'kelechi.nnaji@demo.ptdealdesk.ng'),
  ('Zainab Lawal', 'Admin Officer', 'zainab.lawal@demo.ptdealdesk.ng'),
  ('Oluwaseun Ajayi', 'Head of Operations', 'oluwaseun.ajayi@demo.ptdealdesk.ng');

-- ---------------------------------------------------------------------------
-- Financiers (6, fictional) + requirement checklists (6–10 items)
-- ---------------------------------------------------------------------------
insert into public.financiers (name, financier_type, contact_person, phone, email, rate_min_monthly, rate_max_monthly, facility_types, collateral_policy, notes) values
  ('Crestline Finance House', 'finance_house', 'Olumide Bakare', '+2348031234501', 'credit@crestline-finance.example', 5.000, 6.500,
   '{LPO financing,Working capital,Invoice discounting}', 'LPO domiciliation plus post-dated cheques; 120% cover on working capital.', 'Fast on verified LPOs from federal MDAs.'),
  ('Harbourgate Capital', 'finance_house', 'Adaeze Nwankwo', '+2348092234502', 'deals@harbourgate-capital.example', 5.500, 7.500,
   '{Asset financing,Project finance,Working capital}', 'Debenture or legal mortgage; asset title retained until final instalment.', 'Prefers ticket sizes above ₦50m.'),
  ('Savanna Credit Ltd', 'finance_house', 'Yakubu Garba', '+2348063234503', 'origination@savanna-credit.example', 6.000, 8.000,
   '{LPO financing,Working capital,Invoice discounting}', 'Warehouse receipts or LPO domiciliation; guarantor with cheques.', 'Strong in agro-processing in the North.'),
  ('Northstar Microfinance Bank', 'bank', 'Ngozi Eze', '+2348054234504', 'sme@northstar-mfb.example', 4.700, 6.000,
   '{Working capital}', 'Personal guarantee and post-dated cheques up to ₦50m.', 'Small tickets, quick decisions.'),
  ('Meridian Asset Finance', 'finance_house', 'Tolulope Adebayo', '+2348025234505', 'assets@meridian-af.example', 5.000, 7.000,
   '{Asset financing}', 'Financed asset as collateral; 20% equity contribution.', 'Trucks, plant and equipment.'),
  ('Kolanut Bank Plc', 'bank', 'Ibrahim Sule', '+2348036234506', 'corporate@kolanut-bank.example', 4.700, 5.500,
   '{Project finance,Working capital}', 'Legal mortgage or debenture at 150% cover; credit committee sign-off.', 'Lowest rates; slowest approvals.');

insert into public.financier_requirements (financier_id, item, is_required, sort_order)
select f.id, r.item, r.is_required, r.sort_order
from (values
  ('Crestline Finance House', 'CAC documents (certificate, status report, MEMART)', true, 1),
  ('Crestline Finance House', '12-month bank statement', true, 2),
  ('Crestline Finance House', 'LPO / contract copy with award letter', true, 3),
  ('Crestline Finance House', 'Board resolution to borrow', true, 4),
  ('Crestline Finance House', 'Directors'' IDs and passport photographs', true, 5),
  ('Crestline Finance House', 'Guarantor form + post-dated cheques', true, 6),
  ('Crestline Finance House', 'Executive summary of the transaction', false, 7),
  ('Harbourgate Capital', 'CAC documents (certificate, status report, MEMART)', true, 1),
  ('Harbourgate Capital', '12-month bank statement', true, 2),
  ('Harbourgate Capital', 'Audited accounts (last 2 years)', true, 3),
  ('Harbourgate Capital', 'Management accounts (year to date)', true, 4),
  ('Harbourgate Capital', 'Board resolution to borrow', true, 5),
  ('Harbourgate Capital', 'Pro-forma invoice for the asset', true, 6),
  ('Harbourgate Capital', 'Collateral title documents', true, 7),
  ('Harbourgate Capital', 'Insurance cover note', true, 8),
  ('Harbourgate Capital', 'Executive summary of the transaction', false, 9),
  ('Savanna Credit Ltd', 'CAC documents (certificate, status report, MEMART)', true, 1),
  ('Savanna Credit Ltd', '12-month bank statement', true, 2),
  ('Savanna Credit Ltd', 'LPO / contract copy with award letter', true, 3),
  ('Savanna Credit Ltd', 'Warehouse receipts or stock report', false, 4),
  ('Savanna Credit Ltd', 'Guarantor form + post-dated cheques', true, 5),
  ('Savanna Credit Ltd', 'Directors'' IDs and passport photographs', true, 6),
  ('Northstar Microfinance Bank', 'Valid ID and BVN of the borrower', true, 1),
  ('Northstar Microfinance Bank', '6-month bank statement', true, 2),
  ('Northstar Microfinance Bank', 'Proof of business address', true, 3),
  ('Northstar Microfinance Bank', 'Guarantor form + post-dated cheques', true, 4),
  ('Northstar Microfinance Bank', 'Evidence of business (invoices, contracts)', true, 5),
  ('Northstar Microfinance Bank', 'Passport photographs', false, 6),
  ('Meridian Asset Finance', 'CAC documents (certificate, status report, MEMART)', true, 1),
  ('Meridian Asset Finance', '12-month bank statement', true, 2),
  ('Meridian Asset Finance', 'Pro-forma invoice for the asset', true, 3),
  ('Meridian Asset Finance', 'Evidence of 20% equity contribution', true, 4),
  ('Meridian Asset Finance', 'Insurance cover note', true, 5),
  ('Meridian Asset Finance', 'Board resolution to borrow', true, 6),
  ('Meridian Asset Finance', 'Executive summary of the transaction', false, 7),
  ('Kolanut Bank Plc', 'CAC documents (certificate, status report, MEMART)', true, 1),
  ('Kolanut Bank Plc', '12-month bank statement', true, 2),
  ('Kolanut Bank Plc', 'Audited accounts (last 3 years)', true, 3),
  ('Kolanut Bank Plc', 'Management accounts (year to date)', true, 4),
  ('Kolanut Bank Plc', 'Board resolution to borrow', true, 5),
  ('Kolanut Bank Plc', 'Collateral title documents + valuation report', true, 6),
  ('Kolanut Bank Plc', 'Tax clearance certificate', true, 7),
  ('Kolanut Bank Plc', 'Feasibility study / project cash flows', true, 8),
  ('Kolanut Bank Plc', 'Directors'' IDs and passport photographs', true, 9),
  ('Kolanut Bank Plc', 'Executive summary of the transaction', false, 10)
) as r (financier, item, is_required, sort_order)
join public.financiers f on f.name = r.financier;

-- ---------------------------------------------------------------------------
-- Referrers (2 consultants, 1 advisory firm, 2 past clients; 1%–2.5% or ₦250k–₦1m)
-- ---------------------------------------------------------------------------
insert into public.referrers (name, referrer_type, contact_person, phone, email, default_fee_type, default_fee_value, bank_name, account_name) values
  ('Emeka Nwosu', 'consultant', 'Emeka Nwosu', '+2348031112201', 'emeka.nwosu@mail.example', 'percent', 1.5000, 'Demo Bank A', 'Emeka Nwosu'),
  ('Halima Abubakar', 'consultant', 'Halima Abubakar', '+2348061112202', 'halima.abubakar@mail.example', 'percent', 2.0000, 'Demo Bank B', 'Halima Abubakar'),
  ('Lekki Bridge Advisory', 'advisory_firm', 'Tunde Afolabi', '+2348091112203', 'partners@lekkibridge.example', 'percent', 2.5000, 'Demo Bank C', 'Lekki Bridge Advisory Ltd'),
  ('Obinna Eze', 'past_client', 'Obinna Eze', '+2348071112204', 'obinna.eze@mail.example', 'flat', 500000.0000, 'Demo Bank D', 'Obinna Eze'),
  ('Funke Adeleke', 'past_client', 'Funke Adeleke', '+2348051112205', 'funke.adeleke@mail.example', 'flat', 250000.0000, 'Demo Bank E', 'Funke Adeleke');

-- ---------------------------------------------------------------------------
-- Clients (12 companies, 6 individuals). kyc: mostly verified, 3 incomplete.
-- ---------------------------------------------------------------------------
create temp table s_clients on commit drop as
select gen_random_uuid() as id, v.*
from (values
  ('c01', 'company', 'Nasarawa Lithium & Tin Mining Ltd', 'Mining', 'referral', 'Lekki Bridge Advisory', 'verified', 330),
  ('c02', 'company', 'Lokoja Iron Ore Resources Ltd', 'Mining', 'email', null, 'verified', 250),
  ('c03', 'company', 'Maitama Heights Developers Ltd', 'Real estate', 'referral', 'Obinna Eze', 'verified', 220),
  ('c04', 'company', 'Ikoyi Crest Properties Ltd', 'Real estate', 'website', null, 'verified', 160),
  ('c05', 'company', 'Zaria Grains Processing Ltd', 'Agro-processing', 'phone', null, 'verified', 240),
  ('c06', 'company', 'Benue Valley Agro Mills Ltd', 'Agro-processing', 'walk_in', null, 'verified', 335),
  ('c07', 'company', 'Garki Supplies & Contracts Ltd', 'LPO contracting', 'referral', 'Emeka Nwosu', 'verified', 260),
  ('c08', 'company', 'Wuse Allied Contractors Ltd', 'LPO contracting', 'whatsapp', null, 'verified', 110),
  ('c09', 'company', 'Bonny Marine & Pipeline Services Ltd', 'Oil & gas services', 'referral', 'Halima Abubakar', 'verified', 210),
  ('c10', 'company', 'Trans-Amadi Energy Services Ltd', 'Oil & gas services', 'email', null, 'verified', 190),
  ('c11', 'company', 'Apapa Haulage & Logistics Ltd', 'Logistics', 'website', null, 'verified', 175),
  ('c12', 'company', 'Ikeja Freight Logistics Ltd', 'Logistics', 'phone', null, 'submitted', 90),
  ('c13', 'individual', 'Chukwudi Okonkwo', 'Building materials trading', 'whatsapp', null, 'verified', 140),
  ('c14', 'individual', 'Aisha Bello', 'Textile trading', 'phone', null, 'submitted', 75),
  ('c15', 'individual', 'Babatunde Adeyemi', 'Construction', 'referral', 'Funke Adeleke', 'verified', 300),
  ('c16', 'individual', 'Chiamaka Obi', 'Property development', 'website', null, 'incomplete', 95),
  ('c17', 'individual', 'Ibrahim Musa', 'Trading', 'walk_in', null, 'incomplete', 45),
  ('c18', 'individual', 'Folake Ogunleye', 'Fashion retail', 'whatsapp', null, 'incomplete', 6)
) as v (key, client_type, display_name, sector, source, referrer, kyc, age_days);

insert into public.clients (id, client_type, display_name, sector, enquiry_source, referrer_id, kyc_status, notes, created_at)
select s.id, s.client_type::public.client_type, s.display_name, s.sector, s.source::public.enquiry_source,
       r.id, s.kyc::public.kyc_status, null,
       public.lagos_noon(public.lagos_today() - s.age_days)
from s_clients s left join public.referrers r on r.name = s.referrer;

insert into public.activities (entity_type, entity_id, kind, body, occurred_at, created_at)
select 'client'::public.activity_entity, s.id, 'system'::public.activity_kind,
       'Client created from a ' || replace(s.source, '_', '-') || ' enquiry' || coalesce(' (referred by ' || s.referrer || ')', ''),
       public.lagos_noon(public.lagos_today() - s.age_days), public.lagos_noon(public.lagos_today() - s.age_days)
from s_clients s;

-- Company profiles
insert into public.company_profiles (client_id, registered_name, rc_number, incorporation_date, company_type, registered_address, operating_address, tin, sector, annual_turnover_range, website, contact_person, contact_phone, contact_email)
select s.id, s.display_name, v.rc, v.inc::date, v.ctype::public.company_type, v.reg_addr, v.op_addr, v.tin, s.sector, v.turnover, v.web, v.contact, v.phone, v.email
from (values
  ('c01', 'RC 1184520', '2014-03-11', 'ltd', 'Plot 14, Jos Road, Lafia, Nasarawa State', 'Mining lease site, Akwanga LGA, Nasarawa State', '11845201-0001', '₦1bn–₦5bn', 'nasarawalithium.example', 'Musa Danladi', '+2348034412201', 'musa.danladi@nasarawalithium.example'),
  ('c02', 'RC 1420377', '2017-06-22', 'ltd', '22 Ganaja Road, Lokoja, Kogi State', 'Itakpe road quarry site, Kogi State', '14203770-0001', '₦500m–₦1bn', null, 'Joseph Abah', '+2348064412202', 'j.abah@lokojaironore.example'),
  ('c03', 'RC 905114', '2010-09-02', 'ltd', '7 Aguiyi Ironsi Street, Maitama, Abuja', '7 Aguiyi Ironsi Street, Maitama, Abuja', '09051140-0001', '₦1bn–₦5bn', 'maitamaheights.example', 'Obiageli Nwafor', '+2348094412203', 'o.nwafor@maitamaheights.example'),
  ('c04', 'RC 1633908', '2019-11-15', 'ltd', '3B Bourdillon Road, Ikoyi, Lagos', '3B Bourdillon Road, Ikoyi, Lagos', '16339080-0001', '₦500m–₦1bn', 'ikoyicrest.example', 'Femi Oladipo', '+2348024412204', 'femi@ikoyicrest.example'),
  ('c05', 'RC 1277451', '2015-02-04', 'ltd', 'Km 6, Zaria–Kano Road, Zaria, Kaduna State', 'Km 6, Zaria–Kano Road, Zaria, Kaduna State', '12774510-0001', '₦500m–₦1bn', null, 'Sani Idris', '+2348064412205', 'sani.idris@zariagrains.example'),
  ('c06', 'RC 988215', '2011-07-19', 'ltd', '15 J.S. Tarka Way, Makurdi, Benue State', 'Mill site, Gboko Road, Makurdi, Benue State', '09882150-0001', '₦100m–₦500m', null, 'Terver Iorliam', '+2348034412206', 't.iorliam@benuevalley.example'),
  ('c07', 'RC 1502286', '2018-04-30', 'ltd', 'Suite 12, Area 11 Shopping Complex, Garki, Abuja', 'Suite 12, Area 11 Shopping Complex, Garki, Abuja', '15022860-0001', '₦100m–₦500m', null, 'Ifeanyi Okafor', '+2348054412207', 'ifeanyi@garkisupplies.example'),
  ('c08', 'BN 3311409', '2021-01-12', 'bn', '41 Aminu Kano Crescent, Wuse 2, Abuja', '41 Aminu Kano Crescent, Wuse 2, Abuja', '33114090-0001', '₦50m–₦100m', null, 'Hauwa Shehu', '+2348074412208', 'hauwa@wuseallied.example'),
  ('c09', 'RC 1093372', '2012-10-08', 'ltd', '9 Bonny Way, Bonny Island, Rivers State', 'Trans-Amadi Industrial Layout, Port Harcourt, Rivers State', '10933720-0001', '₦1bn–₦5bn', 'bonnymarine.example', 'Ibiye Georgewill', '+2348034412209', 'i.georgewill@bonnymarine.example'),
  ('c10', 'RC 1366025', '2016-05-17', 'ltd', '27 Trans-Amadi Road, Port Harcourt, Rivers State', '27 Trans-Amadi Road, Port Harcourt, Rivers State', '13660250-0001', '₦500m–₦1bn', null, 'Ebiere Douglas', '+2348064412210', 'e.douglas@transamadienergy.example'),
  ('c11', 'RC 1218843', '2014-08-26', 'ltd', 'Plot 5, Creek Road, Apapa, Lagos', 'Tin Can Island Port access road, Apapa, Lagos', '12188430-0001', '₦500m–₦1bn', 'apapahaulage.example', 'Kunle Bello', '+2348024412211', 'kunle.bello@apapahaulage.example'),
  ('c12', 'RC 1789024', '2020-06-03', 'ltd', '18 Obafemi Awolowo Way, Ikeja, Lagos', 'Ikeja cargo terminal annex, Lagos', '17890240-0001', '₦100m–₦500m', null, 'Damilola Fashola', '+2348094412212', 'dami@ikejafreight.example')
) as v (key, rc, inc, ctype, reg_addr, op_addr, tin, turnover, web, contact, phone, email)
join s_clients s on s.key = v.key;

-- Individual clients (the person record carries client_id)
insert into public.individual_profiles (client_id, title, first_name, middle_name, last_name, gender, date_of_birth, phone, email, residential_address, state, lga, occupation, employer_or_business, monthly_income_range, bvn, nin, id_type, id_number, id_expiry, next_of_kin_name, next_of_kin_phone, next_of_kin_relationship, is_pep, consent_given_at)
select s.id, v.title, v.first, v.middle, v.last, v.gender::public.gender, v.dob::date, v.phone, v.email, v.addr, v.state, v.lga,
       v.occupation, v.business, v.income, v.bvn, v.nin, v.id_type, v.id_no, public.lagos_today() + v.id_expiry_in,
       v.nok, v.nok_phone, v.nok_rel, false, public.lagos_noon(public.lagos_today() - s.age_days)
from (values
  ('c13', 'Mr', 'Chukwudi', 'Emeka', 'Okonkwo', 'male', '1979-04-12', '+2348035550113', 'chukwudi.okonkwo@mail.example', '12 New Market Road, Onitsha', 'Anambra', 'Onitsha North', 'Trader', 'Okonkwo Building Materials (sole proprietor)', '₦5m–₦10m', '99000000113', '98000000113', 'International passport', 'A09213413', 900, 'Uchenna Okonkwo', '+2348035550213', 'Spouse'),
  ('c14', 'Mrs', 'Aisha', null, 'Bello', 'female', '1986-09-03', '+2348065550114', 'aisha.bello@mail.example', '4 Zoo Road, Kano', 'Kano', 'Gwale', 'Trader', 'Aisha Bello Textiles (sole proprietor)', '₦2m–₦5m', '99000000114', '98000000114', 'NIN slip', '98000000114', 2000, 'Abubakar Bello', '+2348065550214', 'Spouse'),
  ('c15', 'Engr', 'Babatunde', 'Olusegun', 'Adeyemi', 'male', '1975-01-27', '+2348025550115', 'b.adeyemi@mail.example', '22 Ring Road, Ibadan', 'Oyo', 'Ibadan South-West', 'Civil engineer and contractor', 'Adeyemi Works (business name)', '₦5m–₦10m', '99000000115', '98000000115', 'Driver''s licence', 'IBD77391AB15', 600, 'Bisi Adeyemi', '+2348025550215', 'Spouse'),
  ('c16', 'Ms', 'Chiamaka', 'Nneka', 'Obi', 'female', '1984-11-19', '+2348095550116', 'chiamaka.obi@mail.example', '9 Independence Layout, Enugu', 'Enugu', 'Enugu North', 'Property developer', 'Obi Homes (business name)', '₦5m–₦10m', '99000000116', '98000000116', 'International passport', 'B11821716', 1200, 'Ifeoma Obi', '+2348095550216', 'Sister'),
  ('c17', 'Alhaji', 'Ibrahim', null, 'Musa', 'male', '1970-06-08', '+2348055550117', 'ibrahim.musa@mail.example', '17 Ahmadu Bello Way, Kaduna', 'Kaduna', 'Kaduna North', 'Trader', 'Musa & Sons (business name)', '₦2m–₦5m', '99000000117', '98000000117', 'Voter''s card', '90F5B71A17', 3000, 'Fatima Musa', '+2348055550217', 'Spouse'),
  ('c18', 'Mrs', 'Folake', 'Adunni', 'Ogunleye', 'female', '1990-02-14', '+2348075550118', 'folake.ogunleye@mail.example', '5 Allen Avenue, Ikeja', 'Lagos', 'Ikeja', 'Fashion retailer', 'Adunni Couture (business name)', '₦1m–₦2m', '99000000118', '98000000118', 'NIN slip', '98000000118', 2500, 'Seun Ogunleye', '+2348075550218', 'Spouse')
) as v (key, title, first, middle, last, gender, dob, phone, email, addr, state, lga, occupation, business, income, bvn, nin, id_type, id_no, id_expiry_in, nok, nok_phone, nok_rel)
join s_clients s on s.key = v.key;

-- Directors / shareholders of the companies (1–3 each), each an individual profile
create temp table s_directors on commit drop as
select gen_random_uuid() as id, v.*
from (values
  ('c01', 1, 'Alhaji', 'Musa', 'Danladi', 'male', '1968-05-02', '+2348034412201', 'Nasarawa', 'director_shareholder', 60.00),
  ('c01', 2, 'Mrs', 'Rakiya', 'Danladi', 'female', '1972-08-14', '+2348034412301', 'Nasarawa', 'shareholder', 40.00),
  ('c02', 3, 'Mr', 'Joseph', 'Abah', 'male', '1976-02-21', '+2348064412202', 'Kogi', 'director_shareholder', 70.00),
  ('c02', 4, 'Mr', 'Salihu', 'Ozigi', 'male', '1980-12-03', '+2348064412302', 'Kogi', 'director', null),
  ('c03', 5, 'Dr', 'Obiageli', 'Nwafor', 'female', '1971-03-30', '+2348094412203', 'FCT', 'director_shareholder', 55.00),
  ('c03', 6, 'Mr', 'Obinna', 'Nwafor', 'male', '1969-10-11', '+2348094412303', 'FCT', 'director_shareholder', 45.00),
  ('c03', 7, 'Mr', 'Garba', 'Lawan', 'male', '1983-07-07', '+2348094412403', 'FCT', 'director', null),
  ('c04', 8, 'Mr', 'Femi', 'Oladipo', 'male', '1982-01-25', '+2348024412204', 'Lagos', 'director_shareholder', 100.00),
  ('c05', 9, 'Alhaji', 'Sani', 'Idris', 'male', '1965-09-16', '+2348064412205', 'Kaduna', 'director_shareholder', 75.00),
  ('c05', 10, 'Hajiya', 'Maryam', 'Idris', 'female', '1970-04-04', '+2348064412305', 'Kaduna', 'shareholder', 25.00),
  ('c06', 11, 'Mr', 'Terver', 'Iorliam', 'male', '1974-11-28', '+2348034412206', 'Benue', 'director_shareholder', 100.00),
  ('c07', 12, 'Mr', 'Ifeanyi', 'Okafor', 'male', '1981-06-19', '+2348054412207', 'FCT', 'director_shareholder', 80.00),
  ('c07', 13, 'Mrs', 'Ngozika', 'Okafor', 'female', '1984-02-09', '+2348054412307', 'FCT', 'shareholder', 20.00),
  ('c08', 14, 'Ms', 'Hauwa', 'Shehu', 'female', '1988-12-01', '+2348074412208', 'FCT', 'director_shareholder', 100.00),
  ('c09', 15, 'Chief', 'Ibiye', 'Georgewill', 'male', '1963-08-23', '+2348034412209', 'Rivers', 'director_shareholder', 65.00),
  ('c09', 16, 'Mr', 'Tamuno', 'Briggs', 'male', '1977-05-15', '+2348034412309', 'Rivers', 'director_shareholder', 35.00),
  ('c10', 17, 'Mrs', 'Ebiere', 'Douglas', 'female', '1978-10-06', '+2348064412210', 'Rivers', 'director_shareholder', 90.00),
  ('c10', 18, 'Mr', 'Preye', 'Douglas', 'male', '1975-03-12', '+2348064412310', 'Rivers', 'shareholder', 10.00),
  ('c11', 19, 'Mr', 'Kunle', 'Bello', 'male', '1973-07-29', '+2348024412211', 'Lagos', 'director_shareholder', 60.00),
  ('c11', 20, 'Mr', 'Chinedu', 'Agu', 'male', '1979-09-09', '+2348024412311', 'Lagos', 'director_shareholder', 40.00),
  ('c12', 21, 'Mrs', 'Damilola', 'Fashola', 'female', '1987-05-21', '+2348094412212', 'Lagos', 'director_shareholder', 100.00)
) as v (company_key, n, title, first, last, gender, dob, phone, state, role, pct);

insert into public.individual_profiles (id, client_id, title, first_name, last_name, gender, date_of_birth, phone, state, bvn, nin, id_type, id_number, id_expiry, is_pep, consent_given_at)
select d.id, null, d.title, d.first, d.last, d.gender::public.gender, d.dob::date, d.phone, d.state,
       '9900000' || lpad(d.n::text, 4, '0'), '9800000' || lpad(d.n::text, 4, '0'),
       'International passport', 'P' || lpad((7000000 + d.n * 137)::text, 8, '0'),
       public.lagos_today() + 700 + d.n * 11, false, now()
from s_directors d;

insert into public.company_directors (company_client_id, individual_profile_id, role, shareholding_pct)
select s.id, d.id, d.role::public.director_role, d.pct
from s_directors d join s_clients s on s.key = d.company_key;

-- KYC documents against the checklist: verified clients → all verified; submitted → required
-- received; incomplete → first three received, the rest missing. One expired ID (c02 director).
insert into public.client_documents (client_id, individual_profile_id, document_type_id, file_path, status, expiry_date, verified_by, verified_at, created_at)
select s.id, null, t.id,
       case when x.status <> 'missing' then s.key || '/' || lpad(t.sort_order::text, 2, '0') || '-' || regexp_replace(lower(split_part(t.name, ' (', 1)), '[^a-z0-9]+', '-', 'g') || '.pdf' end,
       x.status::public.document_status,
       case when t.has_expiry and x.status <> 'missing' then public.lagos_today() + 540 end,
       case when x.status = 'verified' then (select id from public.profiles where role = 'ceo' order by created_at limit 1) end,
       case when x.status = 'verified' then public.lagos_noon(public.lagos_today() - s.age_days + 7) end,
       public.lagos_noon(public.lagos_today() - s.age_days + 2)
from s_clients s
join public.kyc_document_types t on t.client_type = s.client_type::public.client_type
cross join lateral (
  select case
    when s.kyc = 'verified' then case when t.is_required or t.sort_order % 2 = 0 then 'verified' else 'missing' end
    when s.kyc = 'submitted' then case when t.is_required then 'received' else 'missing' end
    else case when t.sort_order <= 3 then 'received' else 'missing' end
  end as status
) x;

-- Directors' ID + photo (verified for verified companies; c02's second director ID has expired)
insert into public.client_documents (client_id, individual_profile_id, document_type_id, file_path, status, expiry_date, verified_by, verified_at)
select s.id, d.id, t.id,
       s.key || '/directors/' || d.n || '-' || t.sort_order || '.pdf',
       (case when d.n = 4 and t.has_expiry then 'expired' when s.kyc = 'verified' then 'verified' else 'received' end)::public.document_status,
       case when t.has_expiry then case when d.n = 4 then public.lagos_today() - 20 else public.lagos_today() + 700 end end,
       case when s.kyc = 'verified' and not (d.n = 4 and t.has_expiry) then (select id from public.profiles where role = 'ceo' order by created_at limit 1) end,
       case when s.kyc = 'verified' and not (d.n = 4 and t.has_expiry) then public.lagos_noon(public.lagos_today() - s.age_days + 7) end
from s_directors d
join s_clients s on s.key = d.company_key
join public.kyc_document_types t on t.client_type = 'individual' and t.sort_order in (2, 3);

-- Credit checks (varied ratings) and external exposures (two clients with notable exposure)
insert into public.credit_checks (client_id, bureau, check_date, rating, score, total_exposure, delinquent_facilities, remarks, report_file_path)
select s.id, v.bureau::public.credit_bureau, public.lagos_today() - v.days_ago, v.rating, v.score, v.exposure, v.delinquent, v.remarks,
       s.key || '/' || lower(v.bureau) || '-' || to_char(public.lagos_today() - v.days_ago, 'YYYY-MM-DD') || '.pdf'
from (values
  ('c01', 'CRC', 320, 'AA', 812, 85000000.00, 0, 'Clean history; one asset finance facility repaid early.'),
  ('c02', 'FirstCentral', 240, 'BB', 664, 120000000.00, 1, 'One facility 60 days past due in 2024, since regularised.'),
  ('c03', 'CRC', 210, 'A', 768, 210000000.00, 0, 'Mortgage-backed facilities performing.'),
  ('c04', 'CreditRegistry', 150, 'A', 741, 40000000.00, 0, null),
  ('c05', 'CRC', 230, 'A', 755, 60000000.00, 0, null),
  ('c06', 'FirstCentral', 330, 'BBB', 702, 15000000.00, 0, null),
  ('c07', 'CRC', 250, 'A', 733, 30000000.00, 0, 'Two LPO facilities repaid on time.'),
  ('c08', 'CreditRegistry', 100, 'BB', 648, 0.00, 0, 'Thin file — first formal facility.'),
  ('c09', 'CRC', 200, 'BB', 671, 410000000.00, 1, 'High existing exposure to a commercial bank; one restructured facility.'),
  ('c09', 'FirstCentral', 25, 'BB', 659, 395000000.00, 1, 'Exposure slightly down since last check.'),
  ('c10', 'FirstCentral', 180, 'BBB', 694, 70000000.00, 0, null),
  ('c10', 'CRC', 15, 'B', 588, 154000000.00, 2, 'Two facilities now past due, including this deal.'),
  ('c11', 'CRC', 170, 'A', 749, 95000000.00, 0, null),
  ('c12', 'CreditRegistry', 80, 'BBB', 689, 35000000.00, 0, null),
  ('c13', 'CRC', 130, 'BBB', 706, 8000000.00, 0, null),
  ('c14', 'FirstCentral', 70, 'BB', 642, 4500000.00, 0, null),
  ('c15', 'CRC', 290, 'A', 758, 6000000.00, 0, 'Personal guarantees honoured in full.'),
  ('c15', 'CreditRegistry', 40, 'BB', 655, 62000000.00, 0, 'New large equipment lease with another lender.'),
  ('c16', 'CRC', 90, 'BBB', 698, 12000000.00, 0, null),
  ('c17', 'FirstCentral', 40, 'C', 541, 9000000.00, 1, 'One overdraft in arrears.')
) as v (key, bureau, days_ago, rating, score, exposure, delinquent, remarks)
join s_clients s on s.key = v.key;

insert into public.external_exposures (client_id, lender_name, facility_type, amount, outstanding, status)
select s.id, v.lender, v.facility, v.amount, v.outstanding, v.status::public.exposure_status
from (values
  ('c09', 'A commercial bank (demo)', 'Term loan', 500000000.00, 310000000.00, 'active'),
  ('c09', 'An equipment lessor (demo)', 'Marine vessel lease', 120000000.00, 85000000.00, 'active'),
  ('c15', 'An equipment lessor (demo)', 'Equipment lease', 70000000.00, 62000000.00, 'active'),
  ('c10', 'A finance house (demo)', 'Working capital', 80000000.00, 64000000.00, 'delinquent'),
  ('c03', 'A mortgage bank (demo)', 'Construction finance', 300000000.00, 0.00, 'closed')
) as v (key, lender, facility, amount, outstanding, status)
join s_clients s on s.key = v.key;

-- ---------------------------------------------------------------------------
-- Deals (25). Scenarios: 8 disbursed/repaying, 2 completed, 1 defaulter (2 overdue instalments),
-- 2 declined by lender, 1 declined by client, 1 negotiating, 3 stale (> 30 days in stage), 7 in
-- progress. Disbursements spread over the last ~10 months.
-- ---------------------------------------------------------------------------
create temp table s_deals on commit drop as
select v.*, null::uuid as deal_id
from (values
 -- n, key, client, financier, use_referrer, facility, requested, approved, tenor, rate, freq, purpose, collateral, coll_value, guarantor, cheques, other_fees, target_stage, outcome, reason, entered_days_ago, disb_days_ago, client_fee_pct, coll_basis, coll_value_fee, commission_pct
 (1, 'D1', 'c01', 'Harbourgate Capital', true, 'Asset financing', 450000000.00, 420000000.00, 12, 5.500, 'monthly', 'Two tipper trucks and a crushing plant for the Akwanga tin site', 'Equipment (crushing plant) + debenture', 610000000.00, 'Musa Danladi', true, 'Insurance 1.5%, management fee 1% (financier)', 'Repaying', 'open', null, null, 280, 1.5, 'percent', 0.5000, 1.25),
 (2, 'D2', 'c07', 'Crestline Finance House', true, 'LPO financing', 85000000.00, 85000000.00, 9, 6.000, 'monthly', 'LPO for office furniture supply to a federal ministry', 'LPO domiciliation', 85000000.00, 'Ifeanyi Okafor', true, null, 'Repaying', 'open', null, null, 200, 2.0, null, null, 1.00),
 (3, 'D3', 'c05', 'Savanna Credit Ltd', false, 'Working capital', 120000000.00, 110000000.00, 9, 6.500, 'monthly', 'Maize and sorghum procurement ahead of harvest', 'Warehouse receipts', 150000000.00, 'Sani Idris', true, null, 'Repaying', 'open', null, null, 170, 1.5, null, null, 1.00),
 (4, 'D4', 'c09', 'Kolanut Bank Plc', true, 'Project finance', 300000000.00, 300000000.00, 18, 4.900, 'monthly', 'Mobilisation for a pipeline maintenance contract at the Bonny terminal', 'Contract proceeds assignment + debenture', 420000000.00, 'Ibiye Georgewill', true, 'Legal fee ₦1.2m (financier)', 'Repaying', 'open', null, null, 150, 1.0, 'percent', 0.5000, 1.50),
 (5, 'D5', 'c11', 'Meridian Asset Finance', false, 'Asset financing', 65000000.00, 60000000.00, 12, 5.800, 'monthly', 'Three 30-tonne haulage trucks', 'Vehicles (title retained by financier)', 75000000.00, null, false, 'Insurance 2% p.a. (financier)', 'Repaying', 'open', null, null, 120, 1.5, 'flat', 300000.0000, 1.00),
 (6, 'D6', 'c03', 'Kolanut Bank Plc', true, 'Project finance', 250000000.00, 240000000.00, 12, 5.000, 'quarterly', 'Completion of a 24-unit terrace development in Maitama', 'Legal mortgage over site and units', 520000000.00, 'Obiageli Nwafor', false, null, 'Repaying', 'open', null, null, 95, 1.0, 'percent', 0.7500, 1.25),
 (7, 'D7', 'c13', 'Northstar Microfinance Bank', false, 'Working capital', 25000000.00, 25000000.00, 6, 5.200, 'monthly', 'Stock financing for building materials', 'Personal guarantee + post-dated cheques', null, 'Uchenna Okonkwo', true, null, 'Repaying', 'open', null, null, 75, 2.0, null, null, 1.00),
 (8, 'D8', 'c08', 'Crestline Finance House', false, 'LPO financing', 40000000.00, 40000000.00, 3, 6.000, 'bullet', 'LPO for medical consumables to a state hospital', 'LPO domiciliation', 40000000.00, 'Hauwa Shehu', true, null, 'Disbursed', 'open', null, null, 40, 1.5, null, null, 1.00),
 (9, 'C1', 'c06', 'Savanna Credit Ltd', false, 'LPO financing', 30000000.00, 30000000.00, 3, 7.000, 'monthly', 'Milled rice under a state school-feeding LPO', 'LPO domiciliation', 30000000.00, 'Terver Iorliam', true, null, 'Completed', 'completed', null, null, 290, 2.0, 'flat', 250000.0000, 1.00),
 (10, 'C2', 'c15', 'Northstar Microfinance Bank', true, 'Working capital', 12000000.00, 12000000.00, 4, 5.500, 'monthly', 'Mobilisation for a road-drainage subcontract', 'Personal guarantee + post-dated cheques', null, 'Bisi Adeyemi', true, null, 'Completed', 'completed', null, null, 250, 2.0, null, null, 1.00),
 (11, 'X1', 'c10', 'Harbourgate Capital', false, 'Working capital', 90000000.00, 90000000.00, 6, 7.500, 'monthly', 'Working capital for a diving and inspection services contract', 'Debenture + receivables assignment', 110000000.00, 'Ebiere Douglas', true, null, 'Repaying', 'defaulted', null, null, 130, 1.5, null, null, 1.25),
 (12, 'L1', 'c02', 'Kolanut Bank Plc', false, 'Project finance', 380000000.00, null, 18, 4.800, 'monthly', 'Expansion of an iron ore beneficiation plant', 'Legal mortgage over plant', 420000000.00, 'Joseph Abah', false, null, 'Risk analysis', 'declined_by_lender', 'Kolanut''s credit committee wants 150% collateral cover; the plant was valued at 110%.', 60, null, null, null, null, null),
 (13, 'L2', 'c14', 'Crestline Finance House', false, 'LPO financing', 18000000.00, null, 6, 6.500, 'monthly', 'LPO for textile supply to a state uniform programme', 'LPO domiciliation', 18000000.00, null, false, null, 'Risk analysis', 'declined_by_lender', 'The LPO issuer is not on Crestline''s approved list of state agencies.', 35, null, null, null, null, null),
 (14, 'K1', 'c04', 'Harbourgate Capital', false, 'Asset financing', 150000000.00, 140000000.00, 12, 5.500, 'monthly', 'Fleet of 10 vehicles for short-let property operations', 'Vehicles (title retained by financier)', 160000000.00, 'Femi Oladipo', false, 'Insurance 2.5%, management fee 2%, legal fee 1% (financier)', 'Approved', 'declined_by_client', 'Client declined after fee disclosure: insurance, management and legal fees added about 5.5% to the cost.', 50, null, 1.0, null, null, 1.25),
 (15, 'N1', 'c12', 'Meridian Asset Finance', false, 'Asset financing', 55000000.00, 50000000.00, 12, 5.800, 'monthly', 'Two forklifts and a reach stacker', 'Equipment (title retained by financier)', 62000000.00, 'Damilola Fashola', false, 'Management fee 2% (financier)', 'Approved', 'negotiating', 'Client is asking Meridian to cut the management fee from 2% to 1% before signing.', 8, null, 1.5, null, null, 1.00),
 (16, 'S1', 'c16', 'Northstar Microfinance Bank', false, 'Working capital', 35000000.00, null, 9, 5.600, 'monthly', 'Bridge finance for a 6-unit duplex project in Enugu', 'Personal guarantee + post-dated cheques', null, 'Ifeoma Obi', true, null, 'Requirements', 'open', null, 48, null, null, null, null, null),
 (17, 'S2', 'c17', 'Savanna Credit Ltd', false, 'LPO financing', 22000000.00, null, 4, 7.000, 'monthly', 'LPO for solar street lights', 'LPO domiciliation', 22000000.00, null, false, null, 'KYC & CIS', 'open', null, 37, null, null, null, null, null),
 (18, 'S3', 'c13', null, false, 'Working capital', 30000000.00, null, 6, null, null, 'Expansion of building materials stock to a second shop', null, null, null, false, null, 'Transaction review', 'open', null, 55, null, null, null, null, null),
 (19, 'O1', 'c01', 'Kolanut Bank Plc', false, 'Working capital', 60000000.00, 55000000.00, 9, 4.900, 'monthly', 'Working capital for tin concentrate exports', 'Debenture', 80000000.00, 'Musa Danladi', false, null, 'Approved', 'open', null, 6, null, 1.0, null, null, 1.00),
 (20, 'O2', 'c09', 'Savanna Credit Ltd', true, 'Invoice discounting', 45000000.00, null, 4, 6.500, 'monthly', 'Discounting of oil-terminal contractor invoices', 'Assignment of invoices', 52000000.00, null, false, null, 'Submitted', 'open', null, 12, null, null, null, null, null),
 (21, 'O3', 'c03', 'Harbourgate Capital', true, 'Project finance', 180000000.00, 170000000.00, 12, 5.400, 'quarterly', 'Phase 2: 16 apartments in Katampe', 'Legal mortgage over phase 2 site', 330000000.00, 'Obiageli Nwafor', false, null, 'Collateral & documentation', 'open', null, 9, null, 1.0, 'percent', 0.5000, 1.25),
 (22, 'O4', 'c05', 'Crestline Finance House', false, 'Working capital', 75000000.00, null, 6, 6.000, 'monthly', 'Purchase of a second milling line', null, null, null, false, null, 'Structuring', 'open', null, 5, null, null, null, null, null),
 (23, 'O5', 'c11', 'Meridian Asset Finance', false, 'Asset financing', 40000000.00, null, 12, 5.800, 'monthly', 'Two refrigerated trucks for a cold-chain contract', 'Vehicles (title retained by financier)', 48000000.00, null, false, null, 'Requirements', 'open', null, 14, null, null, null, null, null),
 (24, 'O6', 'c18', null, false, 'Working capital', 8000000.00, null, 4, null, null, 'Restocking ahead of the festive season', null, null, null, false, null, 'Enquiry', 'open', null, 2, null, null, null, null, null),
 (25, 'O7', 'c07', 'Crestline Finance House', true, 'LPO financing', 95000000.00, null, 6, 6.000, 'monthly', 'LPO for ICT equipment supply to a federal agency', 'LPO domiciliation', 95000000.00, 'Ifeanyi Okafor', true, null, 'Risk analysis', 'open', null, 18, null, null, null, null, null)
) as v (n, key, client_key, financier, use_referrer, facility, requested, approved, tenor, rate, freq, purpose, collateral, coll_value, guarantor, cheques, other_fees, target_stage, outcome, reason, entered_days_ago, disb_days_ago, client_fee_pct, coll_basis, coll_value_fee, commission_pct);

declare
  T date := public.lagos_today();
  ceo uuid := (select id from public.profiles where role = 'ceo' order by created_at limit 1);
  d record;
  v_client uuid;
  v_referrer uuid;
  v_fin uuid;
  v_deal uuid;
  v_ref text;
  v_created date;
  v_final date;
  v_target_sort integer;
  v_walk_to integer;
  v_stage record;
  v_steps integer;
  v_k integer;
  v_disb date;
  v_first date;
  s record;
  v_paid date;
  v_ids uuid[];
  v_id uuid;
  v_channel public.payment_channel;
  v_last_past integer;
begin
  for d in select * from s_deals order by n loop
    select sc.id, (select c.referrer_id from public.clients c where c.id = sc.id) into v_client, v_referrer from s_clients sc where sc.key = d.client_key;
    v_fin := (select id from public.financiers where name = d.financier);
    v_target_sort := (select sort_order from public.deal_stages where name = d.target_stage);

    if d.disb_days_ago is not null then
      v_disb := T - d.disb_days_ago;
      v_created := v_disb - 45;
      v_final := v_disb - 4;
      v_walk_to := 9; -- walk to "Collateral & documentation"; disbursement moves it on
    else
      v_final := T - d.entered_days_ago;
      v_created := v_final - greatest(v_target_sort - 1, 0) * 6;
      v_walk_to := v_target_sort;
    end if;
    v_ref := 'PT-' || extract(year from v_created)::int || '-' || lpad(d.n::text, 4, '0');

    insert into public.deals (reference, client_id, financier_id, referrer_id, facility_type_id, stage_id, stage_entered_at,
                              amount_requested, tenor_months, interest_rate_monthly, purpose, collateral_type, collateral_value,
                              guarantor_name, guarantor_cheques, other_fees_note, owner_id, created_at)
    values (v_ref, v_client, v_fin, case when d.use_referrer then v_referrer end,
            (select id from public.facility_types where name = d.facility),
            (select id from public.deal_stages where system_key = 'enquiry'), public.lagos_noon(v_created),
            d.requested, d.tenor, d.rate, d.purpose, d.collateral, d.coll_value,
            d.guarantor, d.cheques, d.other_fees, ceo, public.lagos_noon(v_created))
    returning id into v_deal;
    update s_deals set deal_id = v_deal where n = d.n;

    insert into public.activities (entity_type, entity_id, kind, body, occurred_at, created_at)
    values ('deal', v_deal, 'system', 'Deal opened', public.lagos_noon(v_created), public.lagos_noon(v_created));

    -- Walk the pipeline, spreading stage entries evenly up to the final stage date
    v_steps := greatest(v_walk_to - 1, 1);
    v_k := 0;
    for v_stage in select name, sort_order, system_key from public.deal_stages where sort_order between 2 and v_walk_to order by sort_order loop
      v_k := v_k + 1;
      perform public.move_deal_stage(v_deal, v_stage.name, null,
        public.lagos_noon(v_created + ((v_final - v_created) * v_k / v_steps)));
      if v_stage.system_key = 'approved' then
        update public.deals set amount_approved = d.approved,
               offer_date = (v_created + ((v_final - v_created) * v_k / v_steps))
        where id = v_deal;
      end if;
    end loop;

    -- Financier requirement checklist (from the Requirements stage on)
    if v_fin is not null and (v_walk_to >= 5) then
      insert into public.deal_requirements (deal_id, item, is_required, sort_order, status, file_path)
      select v_deal, fr.item, fr.is_required, fr.sort_order,
             (case when v_walk_to >= 6 then 'received'
                   when fr.sort_order <= 3 then 'received'
                   when not fr.is_required then 'waived'
                   else 'pending' end)::public.requirement_status,
             case when v_walk_to >= 6 or fr.sort_order <= 3 then v_ref || '/requirements/' || fr.sort_order || '.pdf' end
      from public.financier_requirements fr where fr.financier_id = v_fin;
    end if;

    -- Agreed fees (from Approved on)
    if d.client_fee_pct is not null then
      insert into public.deal_fees (deal_id, fee_kind, basis, value, trigger)
      values (v_deal, 'client_fee', 'percent', d.client_fee_pct, 'on_disbursement');
      insert into public.deal_fees (deal_id, fee_kind, basis, value, trigger)
      values (v_deal, 'provider_commission', 'percent', d.commission_pct, 'on_first_repayment');
      if d.coll_basis is not null then
        insert into public.deal_fees (deal_id, fee_kind, basis, value, trigger)
        values (v_deal, 'collateral_fee', d.coll_basis::public.fee_basis, d.coll_value_fee, 'on_disbursement');
      end if;
      if d.use_referrer and v_referrer is not null then
        insert into public.deal_fees (deal_id, fee_kind, basis, value, trigger)
        select v_deal, 'referral_fee', r.default_fee_type, r.default_fee_value, 'on_disbursement'
        from public.referrers r where r.id = v_referrer;
      end if;
    end if;

    -- Side outcomes (reason mandatory)
    if d.outcome in ('declined_by_lender', 'declined_by_client', 'negotiating') then
      update public.deals set outcome = d.outcome::public.deal_outcome, decline_reason = d.reason where id = v_deal;
      insert into public.activities (entity_type, entity_id, kind, body, occurred_at, created_at)
      values ('deal', v_deal, (case when d.outcome = 'negotiating' then 'meeting' else 'note' end)::public.activity_kind,
              initcap(replace(d.outcome, '_', ' ')) || ': ' || d.reason,
              public.lagos_noon(v_final + 1), public.lagos_noon(v_final + 1));
      if d.outcome = 'declined_by_client' then
        update public.deal_fees set status = 'cancelled' where deal_id = v_deal;
      end if;
    end if;

    -- Disbursement → schedule → disbursement-triggered fees (the app's function)
    if d.disb_days_ago is not null then
      v_first := (case d.freq
                    when 'monthly' then v_disb + interval '1 month'
                    when 'quarterly' then v_disb + interval '3 months'
                    else v_disb + make_interval(months => d.tenor) end)::date;
      perform public.disburse_deal(v_deal, d.approved, v_disb, v_first, d.freq::public.repayment_frequency,
                                   public.lagos_noon(v_disb));
      insert into public.deal_documents (deal_id, title, file_path, created_at) values
        (v_deal, 'Executive summary', v_ref || '/executive-summary.pdf', public.lagos_noon(v_disb - 30)),
        (v_deal, 'Signed offer letter', v_ref || '/offer-letter-signed.pdf', public.lagos_noon(v_disb - 6));

      -- Repayments: client reports with proof, financier confirms (the app's functions)
      -- Everything due before today is paid (so only the defaulter has overdue instalments)
      select max(instalment_no) into v_last_past
      from public.repayment_schedules where deal_id = v_deal and due_date < T;

      for s in select * from public.repayment_schedules where deal_id = v_deal and due_date < T order by instalment_no loop
        exit when d.key = 'X1' and s.instalment_no >= 3; -- defaulter: instalments 3 and 4 unpaid
        v_paid := s.due_date - (s.instalment_no % 3);
        if d.key = 'D7' and s.instalment_no = 1 then v_paid := s.due_date + 6; end if;  -- paid late
        if d.key = 'X1' and s.instalment_no = 2 then v_paid := s.due_date + 9; end if;  -- paid late
        v_channel := (array['bank_alert', 'receipt', 'whatsapp'])[1 + s.instalment_no % 3]::public.payment_channel;
        v_ids := public.report_repayment(v_deal, s.total_due, v_paid, v_channel,
                   v_ref || '/instalment-' || lpad(s.instalment_no::text, 2, '0') || '.pdf',
                   least(public.lagos_noon(v_paid) + interval '2 hours', now() - interval '2 hours'));
        -- D3: the latest instalment is reported but the financier hasn't confirmed yet
        continue when d.key = 'D3' and s.instalment_no = v_last_past;
        foreach v_id in array v_ids loop
          perform public.confirm_repayment_report(v_id,
                    least(public.lagos_noon(v_paid + 1) + interval '3 hours', now() - interval '1 hour'),
                    'Confirmed by ' || d.financier || ' by email');
        end loop;
      end loop;

      -- D5: part-payment of the next (not yet due) instalment, made early and confirmed
      if d.key = 'D5' then
        select * into s from public.repayment_schedules where deal_id = v_deal and due_date >= T order by instalment_no limit 1;
        v_ids := public.report_repayment(v_deal, round(s.total_due * 0.6, 2), T - 2, 'bank_alert',
                   v_ref || '/instalment-' || lpad(s.instalment_no::text, 2, '0') || '-part.pdf', public.lagos_noon(T - 2));
        perform public.confirm_repayment_report(v_ids[1], least(public.lagos_noon(T - 1), now() - interval '1 hour'),
                                                'Part payment confirmed by Meridian');
      end if;

      if d.key = 'X1' then
        update public.deals set outcome = 'defaulted' where id = v_deal;
      end if;
    end if;
  end loop;
end;

-- ---------------------------------------------------------------------------
-- Defaulter follow-up (WORKFLOWS §5): calls, a broken promise to pay, open call tasks
-- ---------------------------------------------------------------------------
declare
  T date := public.lagos_today();
  ceo uuid := (select id from public.profiles where role = 'ceo' order by created_at limit 1);
  v_deal uuid := (select deal_id from s_deals where key = 'X1');
  v_i3 uuid := (select id from public.repayment_schedules where deal_id = (select deal_id from s_deals where key = 'X1') and instalment_no = 3);
  v_i4 uuid := (select id from public.repayment_schedules where deal_id = (select deal_id from s_deals where key = 'X1') and instalment_no = 4);
  v_due3 date := (select due_date from public.repayment_schedules where id = (select id from public.repayment_schedules where deal_id = (select deal_id from s_deals where key = 'X1') and instalment_no = 3));
begin
  insert into public.follow_up_tasks (deal_id, schedule_id, due_date, assigned_to, status, outcome, promise_to_pay_date, created_at)
  values (v_deal, v_i3, v_due3 + 3, ceo, 'done',
          'Spoke to Mrs Douglas (MD). Client payment from their own customer delayed; promised to pay in full.',
          v_due3 + 15, public.lagos_noon(v_due3 + 1));
  insert into public.follow_up_tasks (deal_id, schedule_id, due_date, assigned_to, status, created_at)
  values (v_deal, v_i3, T, ceo, 'open', public.lagos_noon(v_due3 + 16)),
         (v_deal, v_i4, T + 1, ceo, 'open', public.lagos_noon(T - 9));
  insert into public.activities (entity_type, entity_id, kind, body, occurred_at, created_at) values
    ('deal', v_deal, 'call', 'Called Mrs Douglas about instalment 3. Promise to pay within two weeks.', public.lagos_noon(v_due3 + 3), public.lagos_noon(v_due3 + 3)),
    ('deal', v_deal, 'email', 'Promise to pay missed. Sent a formal reminder copying Harbourgate.', public.lagos_noon(v_due3 + 17), public.lagos_noon(v_due3 + 17)),
    ('deal', v_deal, 'note', 'Marked as defaulted after the second missed instalment. Harbourgate considering the receivables assignment.', public.lagos_noon(T - 7), public.lagos_noon(T - 7));

  -- Notes on stale deals
  insert into public.activities (entity_type, entity_id, kind, body, occurred_at, created_at)
  select 'deal'::public.activity_entity, sd.deal_id, 'call'::public.activity_kind, v.body, public.lagos_noon(T - v.ago), public.lagos_noon(T - v.ago)
  from (values
    ('S1', 'Chiamaka still owes the guarantor form and cheques; promised to send them next week.', 20),
    ('S2', 'Ibrahim has not sent his ID or bank statement. Left a WhatsApp message.', 12),
    ('S3', 'Waiting for 12 months of shop sales records before structuring.', 25)
  ) as v (key, body, ago)
  join s_deals sd on sd.key = v.key;
end;

-- ---------------------------------------------------------------------------
-- Fee receipts and referral payouts (the app's receipt/payment functions)
-- ---------------------------------------------------------------------------
declare
  T date := public.lagos_today();
  r record;
begin
  for r in
    select f.id, f.fee_kind, (f.earned_at at time zone 'Africa/Lagos')::date as earned_on, v.after_days
    from (values
      ('D1', 'client_fee', 14), ('D1', 'collateral_fee', 14), ('D1', 'provider_commission', 21),
      ('D2', 'client_fee', 10), ('D2', 'provider_commission', 25),
      ('D3', 'client_fee', 12), ('D4', 'client_fee', 18),
      ('C1', 'client_fee', 9), ('C1', 'collateral_fee', 9), ('C1', 'provider_commission', 15),
      ('C2', 'client_fee', 7), ('C2', 'provider_commission', 12),
      ('X1', 'client_fee', 11)
    ) as v (key, kind, after_days)
    join s_deals sd on sd.key = v.key
    join public.deal_fees f on f.deal_id = sd.deal_id and f.fee_kind = v.kind::public.fee_kind and f.status = 'earned'
  loop
    perform public.record_fee_receipt(r.id, least(r.earned_on + r.after_days, T - 1), null);
  end loop;

  for r in
    select f.id, (f.earned_at at time zone 'Africa/Lagos')::date as earned_on, v.after_days
    from (values ('D1', 20), ('C2', 15)) as v (key, after_days)
    join s_deals sd on sd.key = v.key
    join public.deal_fees f on f.deal_id = sd.deal_id and f.fee_kind = 'referral_fee' and f.status = 'earned'
  loop
    perform public.pay_referral_fee(r.id, least(r.earned_on + r.after_days, T - 1));
  end loop;
end;

-- ---------------------------------------------------------------------------
-- The rest of the books (post_journal): opening balances on 1 Jan, monthly running costs,
-- depreciation, and quarterly investment income from the related-company trading
-- ---------------------------------------------------------------------------
declare
  T date := public.lagos_today();
  y integer := extract(year from public.lagos_today())::int;
  m integer;
  v_day date;
begin
  perform public.post_journal(make_date(y, 1, 1), 'Opening balances', jsonb_build_array(
    jsonb_build_object('account', '1000', 'debit', 60000000, 'description', 'Bank balance b/f'),
    jsonb_build_object('account', '1300', 'debit', 25000000, 'description', 'Investment b/f'),
    jsonb_build_object('account', '1500', 'debit', 9800000, 'description', 'Office equipment and vehicles b/f'),
    jsonb_build_object('account', '1510', 'credit', 2450000, 'description', 'Accumulated depreciation b/f'),
    jsonb_build_object('account', '3000', 'credit', 10000000, 'description', 'Share capital'),
    jsonb_build_object('account', '3100', 'credit', 82350000, 'description', 'Retained earnings b/f')
  ), 'manual', null, 'OB-' || y);

  for m in 1 .. extract(month from T)::int loop
    v_day := make_date(y, m, 25);
    continue when v_day > T;

    perform public.post_journal(v_day, 'Monthly running costs ' || to_char(v_day, 'Mon YYYY'), jsonb_build_array(
      jsonb_build_object('account', '5100', 'debit', 3400000, 'description', 'Salaries'),
      jsonb_build_object('account', '5200', 'debit', 1250000, 'description', 'Office rent and service charge'),
      jsonb_build_object('account', '5400', 'debit', 280000 + m * 7500, 'description', 'Transport and travel'),
      jsonb_build_object('account', '5500', 'debit', 145000, 'description', 'Power, internet and phones'),
      jsonb_build_object('account', '5600', 'debit', 12500, 'description', 'Bank charges'),
      jsonb_build_object('account', '1000', 'credit', 3400000 + 1250000 + 280000 + m * 7500 + 145000 + 12500, 'description', 'Paid from bank')
    ), 'expense', null, 'EXP-' || to_char(v_day, 'YYYY-MM'));

    if m % 2 = 0 then
      perform public.post_journal(v_day, 'Business development ' || to_char(v_day, 'Mon YYYY'), jsonb_build_array(
        jsonb_build_object('account', '5700', 'debit', 350000, 'description', 'Client events and marketing'),
        jsonb_build_object('account', '1000', 'credit', 350000, 'description', 'Paid from bank')
      ), 'expense', null, 'MKT-' || to_char(v_day, 'YYYY-MM'));
    end if;

    if (date_trunc('month', v_day) + interval '1 month - 1 day')::date <= T then
      perform public.post_journal((date_trunc('month', v_day) + interval '1 month - 1 day')::date, 'Depreciation ' || to_char(v_day, 'Mon YYYY'), jsonb_build_array(
        jsonb_build_object('account', '5800', 'debit', 81666.67, 'description', 'Monthly depreciation'),
        jsonb_build_object('account', '1510', 'credit', 81666.67, 'description', 'Monthly depreciation')
      ), 'manual', null, 'DEP-' || to_char(v_day, 'YYYY-MM'));
    end if;

    if m in (3, 6, 9) and make_date(y, m, 28) <= T then
      perform public.post_journal(make_date(y, m, 28), 'Investment income Q' || (m / 3), jsonb_build_array(
        jsonb_build_object('account', '1000', 'debit', 750000, 'description', 'Return on related-company trading'),
        jsonb_build_object('account', '4300', 'credit', 750000, 'description', 'Investment income')
      ), 'manual', null, 'INV-Q' || (m / 3) || '-' || y);
    end if;
  end loop;
end;

-- ---------------------------------------------------------------------------
-- Finish: instalment statuses as of today; months up to three months ago are closed
-- ---------------------------------------------------------------------------
perform public.refresh_all_instalment_statuses(public.lagos_today());

insert into public.periods (period, is_locked, locked_at, locked_by)
select to_char(make_date(extract(year from public.lagos_today())::int, m, 1), 'YYYY-MM'), true, now(),
       (select id from public.profiles where role = 'accountant' order by created_at limit 1)
from generate_series(1, extract(month from public.lagos_today())::int - 3) as m;

end $seed$;
