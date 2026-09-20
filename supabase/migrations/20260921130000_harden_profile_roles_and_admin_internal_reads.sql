-- Harden profile role changes and add safe admin-only visibility
-- for internal configuration/audit tables.

create or replace function public.prevent_user_role_escalation()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  if auth.uid() = old.id
     and new.role is distinct from old.role
     and old.role <> 'ADMIN' then
    raise exception 'Users cannot change their own role.';
  end if;

  return new;
end;
$function$;

drop trigger if exists prevent_user_role_escalation on public.profiles;

create trigger prevent_user_role_escalation
before update on public.profiles
for each row
execute function public.prevent_user_role_escalation();

drop policy if exists "Admins can view tournament templates" on public.tournament_templates;

create policy "Admins can view tournament templates"
on public.tournament_templates
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'ADMIN'
  )
);

drop policy if exists "Admins can view audit logs" on public.audit_logs;

create policy "Admins can view audit logs"
on public.audit_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'ADMIN'
  )
);
