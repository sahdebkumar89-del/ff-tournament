create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('PAYMENT','TOURNAMENT','ROOM','RESULT','WITHDRAWAL','OTHER')),
  subject text not null,
  status text not null default 'OPEN' check (status in ('OPEN','REPLIED','CLOSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_user_id uuid not null references public.profiles(id) on delete cascade,
  sender_role text not null check (sender_role in ('USER','ADMIN')),
  message text not null check (char_length(trim(message)) between 1 and 2000),
  read_by_user boolean not null default false,
  read_by_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists support_tickets_user_id_idx on public.support_tickets(user_id);
create index if not exists support_tickets_updated_at_idx on public.support_tickets(updated_at desc);
create index if not exists support_messages_ticket_id_idx on public.support_messages(ticket_id, created_at);

alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

create policy "support tickets select own or admin" on public.support_tickets
for select to authenticated using ((select auth.uid()) = user_id or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'ADMIN'));

create policy "support tickets insert own" on public.support_tickets
for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "support tickets update own or admin" on public.support_tickets
for update to authenticated
using ((select auth.uid()) = user_id or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'ADMIN'))
with check ((select auth.uid()) = user_id or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'ADMIN'));

create policy "support messages select ticket access" on public.support_messages
for select to authenticated using (exists (select 1 from public.support_tickets t where t.id = ticket_id and (t.user_id = (select auth.uid()) or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'ADMIN'))));

create policy "support messages insert user or admin" on public.support_messages
for insert to authenticated with check (
  sender_user_id = (select auth.uid()) and (
    (sender_role = 'USER' and exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = (select auth.uid())))
    or
    (sender_role = 'ADMIN' and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'ADMIN'))
  )
);

create policy "support messages mark read" on public.support_messages
for update to authenticated
using (
  (sender_role = 'ADMIN' and exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = (select auth.uid())))
  or
  (sender_role = 'USER' and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'ADMIN'))
)
with check (
  (sender_role = 'ADMIN' and exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = (select auth.uid())))
  or
  (sender_role = 'USER' and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'ADMIN'))
);

create or replace function public.support_touch_ticket()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  update public.support_tickets
  set updated_at = now(), last_message_at = new.created_at,
      status = case when new.sender_role = 'ADMIN' then 'REPLIED' else 'OPEN' end
  where id = new.ticket_id;
  return new;
end;
$$;

drop trigger if exists support_messages_touch_ticket on public.support_messages;
create trigger support_messages_touch_ticket after insert on public.support_messages
for each row execute function public.support_touch_ticket();

create or replace function public.support_set_updated_at()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists support_tickets_updated_at on public.support_tickets;
create trigger support_tickets_updated_at before update on public.support_tickets
for each row execute function public.support_set_updated_at();

grant select, insert, update on public.support_tickets to authenticated;
grant select, insert, update on public.support_messages to authenticated;