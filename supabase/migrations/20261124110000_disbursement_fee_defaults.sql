-- Task 3.2: create the configured deal fees at disbursement, then let the existing
-- disbursement/first-repayment triggers recognise them through recognise_fee().
-- Existing fee rows win, so deal-specific terms and seeded data are not overwritten.

create or replace function public.ensure_disbursement_fees(p_deal_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_defaults jsonb;
  v_client numeric;
  v_provider numeric;
  v_collateral jsonb;
  v_collateral_basis public.fee_basis;
  v_collateral_value numeric;
begin
  select coalesce(value, '{}'::jsonb) -> 'fee_defaults'
    into v_defaults
  from public.settings
  where key = 'fee_defaults';

  v_defaults := coalesce(v_defaults, '{}'::jsonb);
  v_client := coalesce(nullif(v_defaults ->> 'client_fee_pct', '')::numeric, 1.5);
  v_provider := coalesce(nullif(v_defaults ->> 'provider_commission_pct', '')::numeric, 1);
  v_collateral := coalesce(v_defaults -> 'collateral_fee', '{}'::jsonb);
  v_collateral_basis := case when v_collateral ->> 'basis' = 'flat' then 'flat' else 'percent' end;
  v_collateral_value := coalesce(nullif(v_collateral ->> 'value', '')::numeric, 0);

  if v_client > 0 and not exists (
    select 1 from public.deal_fees where deal_id = p_deal_id and fee_kind = 'client_fee' and status <> 'cancelled'
  ) then
    insert into public.deal_fees (deal_id, fee_kind, basis, value, trigger)
    values (p_deal_id, 'client_fee', 'percent', v_client, 'on_disbursement');
  end if;

  if v_collateral_value > 0 and not exists (
    select 1 from public.deal_fees where deal_id = p_deal_id and fee_kind = 'collateral_fee' and status <> 'cancelled'
  ) then
    insert into public.deal_fees (deal_id, fee_kind, basis, value, trigger)
    values (p_deal_id, 'collateral_fee', v_collateral_basis, v_collateral_value, 'on_disbursement');
  end if;

  if v_provider > 0 and not exists (
    select 1 from public.deal_fees where deal_id = p_deal_id and fee_kind = 'provider_commission' and status <> 'cancelled'
  ) then
    insert into public.deal_fees (deal_id, fee_kind, basis, value, trigger)
    values (p_deal_id, 'provider_commission', 'percent', v_provider, 'on_first_repayment');
  end if;
end;
$$;

create or replace function public.disburse_deal(
  p_deal_id uuid,
  p_amount numeric,
  p_disbursed_on date,
  p_first_repayment_date date,
  p_frequency public.repayment_frequency,
  p_at timestamptz default null
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  d public.deals%rowtype;
  v_fee uuid;
  v_instalments integer;
begin
  perform public.assert_role('ceo');
  select * into d from public.deals where id = p_deal_id for update;
  if not found then raise exception 'Deal not found' using errcode = 'P0002'; end if;
  if d.disbursement_date is not null then
    raise exception 'Deal % is already disbursed', d.reference using errcode = '22023';
  end if;
  if d.outcome not in ('open', 'negotiating') then
    raise exception 'Deal % is %, not open', d.reference, d.outcome using errcode = '22023';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Disbursed amount must be greater than zero' using errcode = '22023';
  end if;

  update public.deals
  set amount_disbursed = round(p_amount, 2),
      disbursement_date = p_disbursed_on,
      first_repayment_date = p_first_repayment_date,
      repayment_frequency = p_frequency,
      outcome = 'open'
  where id = p_deal_id;

  perform public.ensure_disbursement_fees(p_deal_id);
  v_instalments := public.generate_repayment_schedule(p_deal_id);
  perform public.move_deal_stage(p_deal_id, 'Disbursed', null,
                                 coalesce(p_at, public.lagos_noon(p_disbursed_on)));

  for v_fee in select id from public.deal_fees
               where deal_id = p_deal_id and status = 'pending' and trigger = 'on_disbursement' loop
    perform public.recognise_fee(v_fee, p_disbursed_on);
  end loop;
  return v_instalments;
end;
$$;

revoke all on function public.ensure_disbursement_fees(uuid) from public, anon;
