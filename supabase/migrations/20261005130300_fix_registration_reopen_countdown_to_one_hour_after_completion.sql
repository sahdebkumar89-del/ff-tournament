create or replace function public.generate_ready_next_day_tournaments()
returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_created integer := 0;
  v_t public.tournaments%rowtype;
  v_open_at timestamptz;
  v_new_id bigint;
begin
  for v_t in
    select t.*
    from public.tournaments t
    where t.status = 'COMPLETED'
      and not exists (
        select 1 from public.tournaments n
        where n.slot_id = t.slot_id
          and n.tournament_date = t.tournament_date + 1
      )
    order by t.tournament_date, t.slot_id
  loop
    v_open_at := coalesce(v_t.completed_at, now()) + interval '1 hour';

    if v_open_at > now() then
      continue;
    end if;

    insert into public.tournaments (
      template_id, slot_id, tournament_date, mode,
      scheduled_start_time, scheduled_end_time,
      entry_fee, first_prize, second_prize, third_prize,
      kill_reward, max_players, max_teams, status,
      registration_opens_at, is_enabled
    )
    values (
      v_t.template_id, v_t.slot_id, v_t.tournament_date + 1, v_t.mode,
      v_t.scheduled_start_time, v_t.scheduled_end_time,
      v_t.entry_fee, v_t.first_prize, v_t.second_prize, v_t.third_prize,
      v_t.kill_reward, v_t.max_players, v_t.max_teams, 'REGISTRATION',
      v_open_at, true
    )
    on conflict (slot_id, tournament_date) do nothing
    returning id into v_new_id;

    if v_new_id is not null then
      v_created := v_created + 1;
    end if;
    v_new_id := null;
  end loop;

  return v_created;
end;
$function$;

create or replace function public.ensure_future_tournaments()
returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_created integer := 0;
  v_today date := (now() at time zone 'Asia/Dhaka')::date;
  v_day date;
  v_slot public.tournament_slots%rowtype;
  v_template public.tournament_templates%rowtype;
  v_today_t public.tournaments%rowtype;
  v_open_at timestamptz;
begin
  for v_day in select v_today union all select v_today + 1 loop
    for v_slot in
      select * from public.tournament_slots
      where is_enabled = true
      order by slot_number
    loop
      select * into v_template
      from public.tournament_templates
      where mode = v_slot.mode
      limit 1;

      if not found then
        continue;
      end if;

      v_open_at := now();

      if v_day = v_today + 1 then
        select * into v_today_t
        from public.tournaments
        where slot_id = v_slot.id
          and tournament_date = v_today
        limit 1;

        if found then
          if v_today_t.status = 'COMPLETED' and v_today_t.completed_at is not null then
            v_open_at := v_today_t.completed_at + interval '1 hour';
          else
            v_open_at := '9999-12-31 00:00:00+00'::timestamptz;
          end if;
        end if;
      end if;

      update public.tournaments n
      set registration_opens_at = v_open_at,
          updated_at = now()
      where n.slot_id = v_slot.id
        and n.tournament_date = v_day
        and v_day = v_today + 1
        and n.is_enabled = true
        and exists (
          select 1
          from public.tournaments t
          where t.slot_id = v_slot.id
            and t.tournament_date = v_today
        );

      insert into public.tournaments (
        template_id, slot_id, tournament_date, mode,
        scheduled_start_time, scheduled_end_time,
        entry_fee, first_prize, second_prize, third_prize,
        kill_reward, max_players, max_teams, status,
        registration_opens_at, is_enabled
      )
      values (
        v_template.id, v_slot.id, v_day, v_slot.mode,
        v_slot.start_time, v_slot.end_time,
        v_template.entry_fee, v_template.first_prize, v_template.second_prize,
        v_template.third_prize, v_template.kill_reward, v_template.max_players,
        v_template.max_teams, 'REGISTRATION', v_open_at, true
      )
      on conflict (slot_id, tournament_date) do nothing;

      if found then
        v_created := v_created + 1;
      end if;
    end loop;
  end loop;

  return v_created;
end;
$function$;

update public.tournaments n
set registration_opens_at = t.completed_at + interval '1 hour',
    updated_at = now()
from public.tournaments t
where n.tournament_date = t.tournament_date + 1
  and n.slot_id = t.slot_id
  and t.status = 'COMPLETED'
  and t.completed_at is not null;

update public.tournaments n
set registration_opens_at = '9999-12-31 00:00:00+00'::timestamptz,
    updated_at = now()
from public.tournaments t
where n.tournament_date = t.tournament_date + 1
  and n.slot_id = t.slot_id
  and t.status <> 'COMPLETED'
  and n.is_enabled = true;