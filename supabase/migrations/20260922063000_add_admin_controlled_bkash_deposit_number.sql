create table if not exists public.app_settings (
  id boolean primary key default true,
  deposit_bkash_number text not null default '+8801328594782',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint app_settings_single_row check (id = true),
  constraint app_settings_bkash_number_format check (deposit_bkash_number ~ '^[+]?[0-9]{10,15}$')
);

alter table public.app_settings enable row level security;

revoke all on public.app_settings from anon;
grant select on public.app_settings to authenticated;

drop policy if exists "authenticated_can_read_payment_settings" on public.app_settings;
create policy "authenticated_can_read_payment_settings"
on public.app_settings
for select
to authenticated
using (id = true);

insert into public.app_settings (id, deposit_bkash_number)
values (true, '+8801328594782')
on conflict (id) do nothing;

create or replace function public.admin_update_deposit_bkash_number(p_bkash_number text)
returns public.app_settings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.app_settings;
  v_admin_role text;
  v_number text := regexp_replace(trim(coalesce(p_bkash_number, '')), '[^0-9+]', '', 'g');
begin
  select role into v_admin_role
  from public.profiles
  where id = auth.uid();

  if v_admin_role <> 'ADMIN' then
    raise exception 'Admin access required.';
  end if;

  if v_number !~ '^[+]?[0-9]{10,15}$' then
    raise exception 'Enter a valid bKash number.';
  end if;

  update public.app_settings
  set deposit_bkash_number = v_number,
      updated_at = now(),
      updated_by = auth.uid()
  where id = true
  returning * into v_row;

  if not found then
    insert into public.app_settings (id, deposit_bkash_number, updated_by)
    values (true, v_number, auth.uid())
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

revoke all on function public.admin_update_deposit_bkash_number(text) from public;
grant execute on function public.admin_update_deposit_bkash_number(text) to authenticated;