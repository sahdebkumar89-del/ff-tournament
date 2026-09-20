-- Approved tournament controls and lifecycle hardening.
alter table public.tournaments
  add column if not exists is_enabled boolean not null default true;

create or replace function public.get_my_published_tournament_results(
  p_tournament_id bigint
)
returns table(
  result_id bigint,
  result_position integer,
  result_kills integer,
  position_prize numeric,
  kill_reward numeric,
  total_payout numeric,
  published_at timestamptz,
  payout_approved boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return query
  select
    r.id,
    r.position,
    r.kills,
    r.position_prize,
    r.kill_reward,
    r.total_payout,
    r.published_at,
    exists (
      select 1
      from public.wallet_transactions wt
      join public.wallets w on w.id = wt.wallet_id
      where w.user_id = auth.uid()
        and wt.transaction_type in ('POSITION_PRIZE','KILL_REWARD')
        and wt.description like 'RESULT_PAYOUT:' || r.id::text || ':%'
    )
  from public.tournament_results r
  join public.tournament_participants p on p.id = r.participant_id
  where r.tournament_id = p_tournament_id
    and p.user_id = auth.uid()
    and r.verification_status = 'VERIFIED'
    and r.published_at is not null
  order by r.position;
end;
$function$;

create or replace function public.auto_complete_finished_tournaments()
returns integer
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_count integer := 0;
begin
  update public.tournaments t
  set status = 'COMPLETED',
      completed_at = coalesce(t.completed_at, now()),
      updated_at = now()
  where t.status = 'STARTED'
    and now() >= (
      (
        t.tournament_date
        + t.scheduled_end_time
        + case
            when t.scheduled_end_time <= t.scheduled_start_time
              then interval '1 day'
            else interval '0'
          end
      ) at time zone 'Asia/Dhaka'
    );

  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

select cron.schedule(
  'auto-complete-finished-tournaments',
  '* * * * *',
  'select public.auto_complete_finished_tournaments();'
)
where not exists (
  select 1 from cron.job
  where jobname = 'auto-complete-finished-tournaments'
);

create or replace function public.admin_set_tournament_enabled(
  p_tournament_id bigint,
  p_enabled boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_admin uuid := auth.uid();
begin
  if v_admin is null or not exists (
    select 1 from public.profiles
    where id = v_admin and role = 'ADMIN'
  ) then
    raise exception 'Admin access required';
  end if;

  update public.tournaments
  set is_enabled = p_enabled,
      updated_at = now()
  where id = p_tournament_id;

  if not found then
    raise exception 'Tournament not found';
  end if;

  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, details)
  values (
    v_admin,
    case when p_enabled then 'TOURNAMENT_ENABLED' else 'TOURNAMENT_DISABLED' end,
    'TOURNAMENT',
    p_tournament_id,
    jsonb_build_object('is_enabled', p_enabled)
  );

  return p_enabled;
end;
$function$;

create or replace function public.admin_create_tournament(
  p_mode text,
  p_tournament_date date,
  p_scheduled_start_time time,
  p_entry_fee numeric default null,
  p_first_prize numeric default null,
  p_second_prize numeric default null,
  p_third_prize numeric default null,
  p_kill_reward numeric default null,
  p_max_players integer default null,
  p_max_teams integer default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_admin uuid := auth.uid();
  v_template public.tournament_templates%rowtype;
  v_slot public.tournament_slots%rowtype;
  v_id bigint;
begin
  if v_admin is null or not exists (
    select 1 from public.profiles
    where id = v_admin and role = 'ADMIN'
  ) then
    raise exception 'Admin access required';
  end if;

  if p_mode not in ('SOLO','DUO','SQUAD') then
    raise exception 'Invalid tournament mode';
  end if;

  select * into v_template
  from public.tournament_templates
  where mode = p_mode;

  if not found then
    raise exception 'Tournament template not found';
  end if;

  select * into v_slot
  from public.tournament_slots
  where mode = p_mode
    and start_time = p_scheduled_start_time
  limit 1;

  if not found then
    raise exception 'Start time does not match a configured BR slot';
  end if;

  insert into public.tournaments(
    template_id, slot_id, tournament_date, mode,
    scheduled_start_time, scheduled_end_time,
    entry_fee, first_prize, second_prize, third_prize,
    kill_reward, max_players, max_teams,
    status, registration_opens_at, is_enabled
  )
  values(
    v_template.id, v_slot.id, p_tournament_date, p_mode,
    v_slot.start_time, v_slot.end_time,
    coalesce(p_entry_fee, v_template.entry_fee),
    coalesce(p_first_prize, v_template.first_prize),
    coalesce(p_second_prize, v_template.second_prize),
    coalesce(p_third_prize, v_template.third_prize),
    coalesce(p_kill_reward, v_template.kill_reward),
    coalesce(p_max_players, v_template.max_players),
    coalesce(p_max_teams, v_template.max_teams),
    'REGISTRATION', now(), true
  )
  on conflict (slot_id, tournament_date) do update
    set is_enabled = excluded.is_enabled,
        updated_at = now()
  returning id into v_id;

  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, details)
  values(
    v_admin,
    'TOURNAMENT_CREATED',
    'TOURNAMENT',
    v_id,
    jsonb_build_object(
      'mode',p_mode,
      'tournament_date',p_tournament_date,
      'scheduled_start_time',p_scheduled_start_time
    )
  );

  return v_id;
end;
$function$;

drop policy if exists "Authenticated users can view ready enabled tournaments"
  on public.tournaments;

create policy "Authenticated users can view ready enabled tournaments"
on public.tournaments
for select
to authenticated
using (
  is_enabled = true
  and registration_opens_at <= now()
  and exists (
    select 1
    from public.tournament_slots
    where tournament_slots.id = tournaments.slot_id
      and tournament_slots.is_enabled = true
  )
);
