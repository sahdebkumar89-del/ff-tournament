drop view if exists public.tournament_capacity_counts;

create or replace function public.get_tournament_capacity_counts(p_tournament_ids bigint[])
returns table (
  tournament_id bigint,
  player_count bigint,
  team_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    t.id,
    count(tp.id) filter (where tp.status = 'JOINED')::bigint,
    count(distinct tp.team_id) filter (
      where tp.status = 'JOINED' and tp.team_id is not null
    )::bigint
  from unnest(coalesce(p_tournament_ids, array[]::bigint[])) requested(id)
  join public.tournaments t on t.id = requested.id
  left join public.tournament_participants tp on tp.tournament_id = t.id
  group by t.id
  order by t.id;
$$;

revoke all on function public.get_tournament_capacity_counts(bigint[]) from public;
grant execute on function public.get_tournament_capacity_counts(bigint[]) to authenticated;
