-- Personal productivity dashboard schema.
-- Safe to run repeatedly: every statement is idempotent.

create table if not exists tasks (
  id           bigserial primary key,
  title        text not null check (length(trim(title)) > 0),
  notes        text,
  priority     smallint not null default 2 check (priority between 1 and 3),
  due_date     date,
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists tasks_completed_at_idx on tasks (completed_at);
create index if not exists tasks_due_date_idx     on tasks (due_date);

create table if not exists habits (
  id          bigserial primary key,
  name        text not null check (length(trim(name)) > 0),
  created_at  timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists habit_entries (
  habit_id   bigint not null references habits (id) on delete cascade,
  entry_date date not null,
  created_at timestamptz not null default now(),
  primary key (habit_id, entry_date)
);

create index if not exists habit_entries_date_idx on habit_entries (entry_date);
