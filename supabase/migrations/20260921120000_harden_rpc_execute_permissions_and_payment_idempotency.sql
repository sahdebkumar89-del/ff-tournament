-- Restrict SECURITY DEFINER RPC execution to authenticated users where needed.
-- Scheduler/trigger-only functions are not exposed through the Data API.

revoke execute on function public.admin_create_tournament(text,date,time,numeric,numeric,numeric,numeric,numeric,integer,integer) from public, anon;
grant execute on function public.admin_create_tournament(text,date,time,numeric,numeric,numeric,numeric,numeric,integer,integer) to authenticated;
revoke execute on function public.admin_set_tournament_enabled(bigint,boolean) from public, anon;
grant execute on function public.admin_set_tournament_enabled(bigint,boolean) to authenticated;

revoke execute on function public.auto_complete_finished_tournaments() from public, anon, authenticated;
revoke execute on function public.auto_release_tournament_rooms() from public, anon, authenticated;
revoke execute on function public.auto_start_full_tournaments() from public, anon, authenticated;
revoke execute on function public.generate_automatic_tournament_notifications() from public, anon, authenticated;
revoke execute on function public.generate_ready_next_day_tournaments() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.join_tournament(bigint) from public, anon, authenticated;
revoke execute on function public.notify_payment_transaction_status() from public, anon, authenticated;
revoke execute on function public.notify_published_tournament_result() from public, anon, authenticated;
revoke execute on function public.notify_wallet_transaction() from public, anon, authenticated;

revoke execute on function public.admin_approve_result_payout(bigint) from public, anon;
grant execute on function public.admin_approve_result_payout(bigint) to authenticated;
revoke execute on function public.admin_cancel_tournament(bigint,text) from public, anon;
grant execute on function public.admin_cancel_tournament(bigint,text) to authenticated;
revoke execute on function public.admin_complete_tournament(bigint) from public, anon;
grant execute on function public.admin_complete_tournament(bigint) to authenticated;
revoke execute on function public.admin_create_tournament_result(bigint,bigint,integer,integer,text) from public, anon;
grant execute on function public.admin_create_tournament_result(bigint,bigint,integer,integer,text) to authenticated;
revoke execute on function public.admin_get_tournament_participants(bigint) from public, anon;
grant execute on function public.admin_get_tournament_participants(bigint) to authenticated;
revoke execute on function public.admin_get_tournament_room(bigint) from public, anon;
grant execute on function public.admin_get_tournament_room(bigint) to authenticated;
revoke execute on function public.admin_release_tournament_room(bigint) from public, anon;
grant execute on function public.admin_release_tournament_room(bigint) to authenticated;
revoke execute on function public.admin_review_payment_transaction(bigint,text,text) from public, anon;
grant execute on function public.admin_review_payment_transaction(bigint,text,text) to authenticated;
revoke execute on function public.admin_send_notification(text,text,text,text,text,bigint,uuid[]) from public, anon;
grant execute on function public.admin_send_notification(text,text,text,text,text,bigint,uuid[]) to authenticated;
revoke execute on function public.admin_set_result_verification(bigint,text,text) from public, anon;
grant execute on function public.admin_set_result_verification(bigint,text,text) to authenticated;
revoke execute on function public.admin_start_tournament(bigint) from public, anon;
grant execute on function public.admin_start_tournament(bigint) to authenticated;
revoke execute on function public.admin_upsert_tournament_room(bigint,text,text) from public, anon;
grant execute on function public.admin_upsert_tournament_room(bigint,text,text) to authenticated;
revoke execute on function public.confirm_tournament_join(bigint) from public, anon;
grant execute on function public.confirm_tournament_join(bigint) to authenticated;
revoke execute on function public.get_my_published_tournament_results(bigint) from public, anon;
grant execute on function public.get_my_published_tournament_results(bigint) to authenticated;
revoke execute on function public.get_tournament_room(bigint) from public, anon;
grant execute on function public.get_tournament_room(bigint) to authenticated;
revoke execute on function public.mark_notification_read(bigint) from public, anon;
grant execute on function public.mark_notification_read(bigint) to authenticated;
revoke execute on function public.publish_tournament_result(bigint) from public, anon;
grant execute on function public.publish_tournament_result(bigint) to authenticated;
revoke execute on function public.request_deposit(numeric,text,text) from public, anon;
grant execute on function public.request_deposit(numeric,text,text) to authenticated;
revoke execute on function public.request_tournament_join(bigint,jsonb) from public, anon;
grant execute on function public.request_tournament_join(bigint,jsonb) to authenticated;
revoke execute on function public.request_withdrawal(numeric,text,text) from public, anon;
grant execute on function public.request_withdrawal(numeric,text,text) to authenticated;

-- Prevent accidental duplicate reuse of the same payment reference for a user/type.
create unique index if not exists payment_transactions_user_type_reference_uidx
on public.payment_transactions(user_id, transaction_type, payment_reference)
where payment_reference is not null;
