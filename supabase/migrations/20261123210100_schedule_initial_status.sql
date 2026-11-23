-- New instalments get their real status straight away (due / overdue / scheduled), instead of
-- 'scheduled' until the daily job runs. Found by the money-function tests: a schedule generated
-- for a back-dated disbursement showed past instalments as 'scheduled'.

create or replace function public.generate_repayment_schedule(p_deal_id uuid)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  d public.deals%rowtype;
  v_n integer;
  v_step integer;
  v_interest numeric;
  v_p numeric;
  v_i numeric;
  v_due date;
  v_id uuid;
  k integer;
begin
  perform public.assert_role('ceo');
  select * into d from public.deals where id = p_deal_id for update;
  if not found then raise exception 'Deal not found' using errcode = 'P0002'; end if;
  if d.amount_disbursed is null or d.tenor_months is null or d.interest_rate_monthly is null
     or d.repayment_frequency is null or d.first_repayment_date is null then
    raise exception 'Disbursed amount, tenor, monthly rate, frequency and first repayment date are required'
      using errcode = '22023';
  end if;
  if exists (select 1 from public.repayment_reports r join public.repayment_schedules s on s.id = r.schedule_id
             where s.deal_id = p_deal_id) then
    raise exception 'The schedule already has repayments and cannot be regenerated' using errcode = '22023';
  end if;

  delete from public.repayment_schedules where deal_id = p_deal_id;

  v_n := case d.repayment_frequency
           when 'monthly' then d.tenor_months
           when 'quarterly' then ceil(d.tenor_months / 3.0)::integer
           else 1 end;
  v_step := case d.repayment_frequency when 'monthly' then 1 when 'quarterly' then 3 else 0 end;
  v_interest := round(d.amount_disbursed * d.interest_rate_monthly / 100 * d.tenor_months, 2);

  for k in 1 .. v_n loop
    v_due := (d.first_repayment_date + make_interval(months => (k - 1) * v_step))::date;
    if k < v_n then
      v_p := round(d.amount_disbursed / v_n, 2);
      v_i := round(v_interest / v_n, 2);
    else
      v_p := d.amount_disbursed - round(d.amount_disbursed / v_n, 2) * (v_n - 1);
      v_i := v_interest - round(v_interest / v_n, 2) * (v_n - 1);
    end if;
    insert into public.repayment_schedules (deal_id, instalment_no, due_date, principal_due, interest_due, total_due)
    values (p_deal_id, k, v_due, v_p, v_i, v_p + v_i)
    returning id into v_id;
    perform public.refresh_schedule_status(v_id);
  end loop;

  update public.deals set maturity_date = v_due where id = p_deal_id;
  return v_n;
end;
$$;
