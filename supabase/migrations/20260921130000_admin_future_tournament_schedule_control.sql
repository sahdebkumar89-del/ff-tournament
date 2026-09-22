create or replace function public.admin_update_tournament_schedule(
  p_tournament_id bigint,
  p_tournament_date date,
  p_scheduled_start_time time
)
returns public.tournaments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.tournaments;
  v_slot public.tournament_slots%rowtype;
  v_today date := (now() at time zone 'Asia/Dhaka')::date;
  v_open_at timestamptz;
  v_prev public.tournaments%rowtype;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  ) then
    raise exception 'Admin access required';
  end if;

  if p_tournament_date < v_today + 1 then
    raise exception 'Only tomorrow or a later future date can be changed';
  end if;

  if extract(minute from p_scheduled_start_time) not in (0,30)
     or extract(second from p_scheduled_start_time) <> 0 then
    raise exception 'Tournament time must be on a 30-minute slot';
  end if;

  select * into v_row
  from public.tournaments
  where id = p_tournament_id
  for update;

  if not found then
    raise exception 'Tournament not found';
  end if;

  if v_row.status not in ('REGISTRATION','FULL') then
    raise exception 'Only upcoming tournaments can be rescheduled';
  end if;

  select * into v_slot
  from public.tournament_slots
  where start_time = p_scheduled_start_time
    and is_enabled = true
  order by slot_number
  limit 1;

  if not found then
    raise exception 'Selected time is not an enabled main schedule slot';
  end if;

  if v_slot.mode <> v_row.mode then
    raise exception 'Selected time belongs to % mode. Keep the tournament mode aligned with the main schedule.', v_slot.mode;
  end if;

  if exists (
    select 1
    from public.tournaments t
    where t.id <> p_tournament_id
      and t.tournament_date = p_tournament_date
      and t.scheduled_start_time = p_scheduled_start_time
  ) then
    raise exception 'Another tournament already uses this date and time';
  end if;

  if p_tournament_date = v_today + 1 then
    select * into v_prev
    from public.tournaments
    where slot_id = v_slot.id
      and tournament_date = v_today
    order by id desc
    limit 1;

    v_open_at := greatest(
      coalesce(v_prev.completed_at, now()) + interval '1 hour',
      (((v_prev.tournament_date + v_prev.scheduled_end_time
        + case
            when v_prev.scheduled_end_time <= v_prev.scheduled_start_time
            then interval '1 day'
            else interval '0'
          end) at time zone 'Asia/Dhaka') + interval '1 hour')
    );
  else
    v_open_at := now();
  end if;

  update public.tournaments
  set tournament_date = p_tournament_date,
      slot_id = v_slot.id,
      scheduled_start_time = v_slot.start_time,
      scheduled_end_time = v_slot.end_time,
      registration_opens_at = v_open_at
  where id = p_tournament_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.admin_update_tournament_schedule(bigint,date,time) from public;
grant execute on function public.admin_update_tournament_schedule(bigint,date,time) to authenticated;
