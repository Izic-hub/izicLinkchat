-- =====================================================================
-- same transaction that added it — splitting into two files sidesteps
-- that entirely rather than fighting with transaction boundaries.)
-- =====================================================================

alter type notification_type add value if not exists 'group_updated';
alter type notification_type add value if not exists 'member_removed';
