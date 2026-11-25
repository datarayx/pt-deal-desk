# P&T Deal Desk — 10-minute demo script

This walkthrough follows the six-item **Demo acceptance** list in `docs/PRD.md`. It assumes a seeded demo Supabase project, `NEXT_PUBLIC_DEMO_MODE=true`, and the CEO demo account. All names, companies, financiers, and numbers below are fictional.

## Demo setup

- Open the Vercel Preview or Production URL and use the **CEO** button on the login page. If the demo cards are hidden, enter the values of `DEMO_CEO_EMAIL` and `DEMO_CEO_PASSWORD` from the deployment environment.
- The seed dates are relative to the day the seed ran. Deal references therefore use the seed year: `PT-<seed year>-0001`, not a hard-coded calendar year.
- For placeholder uploads, use the repository image `public/brand/mark.png`. On this workstation its path is `C:\Users\USER\Desktop\P % T Deal Desk\pt-deal-desk\public\brand\mark.png`. It is accepted as an image by the KYC, credit-report, and repayment-proof upload controls.
- Leave the browser window open at a usable desktop width for the tables and side sheets.

## Seed record cheat sheet

| Seed key / visible identifier | Use in the demo |
|---|---|
| `c01` — **Nasarawa Lithium & Tin Mining Ltd** | Company story, two directors, CRC credit example, and the basis for the new walkthrough client. |
| c01 directors — **Musa Danladi** (60%) and **Rakiya Danladi** (40%) | Link these existing people in the New client wizard using BVNs `99000000001` and `99000000002`. |
| **Lekki Bridge Advisory** | Seeded referrer; use it for the company and the new deal. Its default referral fee is 2.5%. |
| **Harbourgate Capital** + **Asset financing** | New-deal example; the financier checklist is copied into the deal. |
| `D1` — reference ending `-0001` — Harbourgate / Nasarawa Lithium | Seeded disbursed deal with client, collateral, provider commission, and referral fees; use it to point out fee recognition. |
| `D3` — reference ending `-0003` — Savanna / Zaria Grains | Seeded reported repayment awaiting financier confirmation. Use it when the demo needs a pre-existing Reported row. |
| `X1` — reference ending `-0011` — Harbourgate / Trans-Amadi Energy | Seeded defaulter with two overdue instalments and open follow-up call tasks. Use it for alerts, Outbox, and Follow-ups. |
| `O1` — reference ending `-0019` — Kolanut / Nasarawa Lithium | Seeded Approved deal that can be disbursed if you need a no-create fallback. |

## The walkthrough

### 0:00–0:45 — 1. CEO dashboard

1. Open `/login`.
2. Click **Sign in** beside the demo **CEO** account.
3. On `/dashboard`, point to the KPI cards for active deals, pipeline value, outstanding balance, overdue amount, fees earned, and fees receivable.
4. Point to **Ongoing transactions**, **Repayments due next 14 days**, the overdue list, the pipeline chart, and the fees earned-versus-received chart. Call out that the data is already historical and relative to the seed date.

### 0:45–3:00 — 2. Add a company, two directors, KYC, and a credit check

1. Click **Clients** in the left sidebar, then **New client**.
2. On **What kind of client is this?**, select **Company**. Set **How did they find P&T?** to **Referral**, set **Referred by** to **Lekki Bridge Advisory**, and click **Continue**.
3. On **Company details**, use c01 as the source record but append ` — Walkthrough` to avoid a duplicate:
   - Registered name: `Nasarawa Lithium & Tin Mining Ltd — Walkthrough`
   - Company type: **Private limited company (Ltd)**
   - CAC number: `RC 1184521`
   - Date of incorporation: `2014-03-11`
   - Tax ID (TIN): `11845201-0001`
   - Annual turnover: **₦1bn – ₦5bn**
   - Registered address: `Plot 14, Jos Road, Lafia, Nasarawa State`
   - Operating address: `Mining lease site, Akwanga LGA, Nasarawa State`
   - Contact person: `Musa Danladi`; phone: `+2348034412201`; email: `musa.danladi@nasarawalithium.example`
   - Sector: `Mining`; website: `nasarawalithium.example`
   - Click **Continue**.
4. On **Directors and shareholders**, click **Add person**. Enter BVN `99000000001`, wait for the existing **Musa Danladi** match, leave the role as **Director & shareholder**, enter `60` for shareholding, then click **Add person**.
5. Click **Add person** again. Enter BVN `99000000002`, wait for **Rakiya Danladi**, leave the role as **Director & shareholder**, enter `40`, then click **Add person** and **Continue**.
6. On **KYC documents**, click **Upload** beside **Signed customer information form (CIS)** and beside **Certificate of incorporation (CAC)**. Select `public\brand\mark.png` in the file picker for each. The demo only needs to show the upload interaction; the remaining required documents can stay incomplete. Click **Continue**.
7. On **Review and create**, tick **The client and each director agreed to P&T processing this data**, then click **Create client**.
8. On the new Client 360 page, click the **Credit checks** tab, then **Add credit check**. Enter:
   - Bureau: **CRC**
   - Rating: `AA`; Score: `812`
   - Bureau-reported exposure: `85000000`; Delinquent facilities: `0`
   - Remarks: `Clean history; one asset finance facility repaid early.`
   - Click **Upload report**, select `public\brand\mark.png`, then click **Save credit check**.
9. Point to the new client header, KYC badge, **Directors** tab, uploaded KYC rows, and the CRC credit check.

### 3:00–5:30 — 3. Create, progress, and disburse a deal

1. Click **Deals** in the sidebar, then **New deal**.
2. In the side sheet choose the new `Nasarawa Lithium & Tin Mining Ltd — Walkthrough` client, **Harbourgate Capital**, and **Asset financing**.
3. Enter the request:
   - Amount requested: `25000000`; Amount approved: `25000000`
   - Tenor: `3` months; Interest rate / month: `5.5`
   - Purpose: `Two tipper trucks for the Akwanga mining site`
   - Collateral: `Equipment + debenture`; Collateral value: `40000000`
   - Guarantor: `Musa Danladi`; Guarantor cheques: **Provided**
   - Referrer: **Lekki Bridge Advisory**; Referral fee basis: **Percentage**; Referral fee: `2.5`
   - Click **Open deal**.
4. In the Deals Kanban, find the new card in **Enquiry** and drag it to **Requirements**. This records stage history. Click the card to open its detail page.
5. Click the **Requirements** tab and point to the copied Harbourgate checklist and pending deficiencies. Click **Move stage**, choose **Approved**, enter note `Requirements reviewed for demo`, and click **Move stage**.
6. Click **Disburse**. Keep the amount at `25000000`, set **Disbursement date** to today, **First repayment date** to one month from today, leave **Repayment frequency** as **Monthly**, and click **Disburse & generate schedule**.
7. Point out the success message, the **Repayments** tab, and the generated schedule. The disbursement also recognises client, collateral, and referral fees automatically.

### 5:30–7:00 — 4. Report and confirm a repayment

1. On the deal detail page, click the **Repayments** tab and show the generated instalments.
2. Click **Repayments** in the sidebar, then **Record reported payment**.
3. Choose the new deal reference, enter payment amount `1000000` (a deliberate partial payment), set **Paid on** to today, choose **Bank alert**, click **Upload proof**, select `public\brand\mark.png`, and click **Record payment**.
4. Click the **Reported** tab. Find the new deal row and click **Confirm with financier**.
5. Leave the confirmation date as today, optionally enter `Confirmed for demo walkthrough`, and click **Confirm repayment**.
6. Point out the partial-payment balance, the movement to **Confirmed**, and the provider commission now recognised on the first confirmed repayment. If you want to show the seeded path instead, use D3 (reference ending `-0003`) in the Reported tab and confirm its existing report.

### 7:00–8:30 — 5. Alerts, Outbox, and follow-up call task

1. Click **Settings** in the footer, then **Reminder timings**.
2. Click **Run reminders now**. This is the demo-only manual trigger for the daily reminder function.
3. Click the notification **bell** in the top bar. Point to the unread count and due/overdue/stale alerts. Click one alert to open its linked deal, then reopen the bell and click **Mark all read**.
4. Click **Outbox** in the footer. Click an email row to open the preview. Explain that demo reminders are stored here and are not sent externally.
5. Click **Follow-ups**. Point to the open call tasks for X1 (reference ending `-0011`, Trans-Amadi Energy Services) and its seeded promise-to-pay history. Click **Log call**, choose an outcome, enter a promise-to-pay date, and save.

### 8:30–10:00 — 6. Fees and referral payable

1. Return to the new deal detail page and click the **Fees** tab. Point to the client fee, collateral fee, referral fee, and provider commission; distinguish the disbursement-triggered fees from the first-confirmed-repayment fee.
2. Click **Fee receivables** under Finance. Use the new deal reference or D1 (reference ending `-0001`) to point to the earned fee lines and their client/deal reference context.
3. Click **Payables**. Point to the **Referral fees** row for the new deal or D1 and explain that it is payable to **Lekki Bridge Advisory**.
4. If time permits, click **Finance overview** to show the updated receivables, payables, income, and cash-position KPIs. Stop here; the acceptance path is complete.

## Backup records and reset guidance

- If the newly created client or deal is hard to find, use c01, D1, D3, and X1 from the cheat sheet. Search by client name or by the deal-reference suffix (`-0001`, `-0003`, `-0011`).
- The run is intentionally stateful: it creates one walkthrough company, one deal, one reported payment, alerts, and a call log. For a clean repeat, reseed the demo Supabase project and recreate the demo users before the next run.
- Never use real client information, BVNs, NINs, financier names, or documents during the demo.
