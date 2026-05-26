create table if not exists public.fahrten (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  fahrer_name text not null,
  fahrzeug text not null,
  tour text not null,
  datum date not null,
  startzeit time not null,
  endzeit time not null,
  km_start integer not null,
  km_ende integer not null,
  probleme text[] not null default '{}',
  bemerkung text
);

alter table public.fahrten disable row level security;
