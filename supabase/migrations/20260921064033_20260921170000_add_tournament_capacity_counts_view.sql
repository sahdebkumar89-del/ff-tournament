create or replace view public.tournament_capacity_counts as
select
  t.id as tournament_id,
  count(tp.id) filter (where tp.status = 'JOINED')::bigint as player_count,
  count(distinct tp.team_id) filter (
    where tp.status = 'JOINED' and tp.team_id is not null
  )::bigint as team_count
from public.tournaments t
left join public.tournament_participants tp on tp.tournament_id = t.id
group by t.id;

grant select on public.tournament_capacity_counts to authenticated;
