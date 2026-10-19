-- Planning Atlas : base Supabase. À coller dans SQL Editor → New query → Run (une seule fois).
-- Avant : Authentication → Sign In / Providers → activer « Allow anonymous sign-ins ».

-- membres admis (ceux qui ont donné le bon code du groupe)
create table if not exists public.adherents (
  uid uuid primary key references auth.users on delete cascade,
  cree timestamptz not null default now()
);
-- réglages privés (le code du groupe) : aucune règle d'accès, donc illisibles depuis le site
create table if not exists public.reglages (cle text primary key, valeur text not null);
-- toutes les données du site : une ligne par document (collection, id, contenu)
create table if not exists public.docs (
  col text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  maj timestamptz not null default now(),
  primary key (col, id)
);

-- accès des comptes connectés (les règles RLS ci-dessous filtrent ensuite qui voit quoi)
grant select on public.adherents to authenticated;
grant select, insert, update, delete on public.docs to authenticated;

alter table public.adherents enable row level security;
alter table public.reglages enable row level security;
alter table public.docs enable row level security;

create or replace function public.est_membre() returns boolean
language sql security definer set search_path = public stable
as $$ select exists (select 1 from public.adherents where uid = auth.uid()) $$;

drop policy if exists "je me vois" on public.adherents;
create policy "je me vois" on public.adherents for select to authenticated using (uid = auth.uid());

-- tout le monde est admin : chaque membre lit, ajoute, modifie et supprime tout
drop policy if exists "membres lisent" on public.docs;
drop policy if exists "membres ajoutent" on public.docs;
drop policy if exists "membres modifient" on public.docs;
drop policy if exists "membres suppriment" on public.docs;
create policy "membres lisent" on public.docs for select to authenticated using (public.est_membre());
create policy "membres ajoutent" on public.docs for insert to authenticated with check (public.est_membre());
create policy "membres modifient" on public.docs for update to authenticated using (public.est_membre()) with check (public.est_membre());
create policy "membres suppriment" on public.docs for delete to authenticated using (public.est_membre());

-- entrer dans le groupe : bon code → membre + identifiant
create or replace function public.rejoindre(code text, pseudo text) returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  if code is distinct from (select valeur from public.reglages where cle = 'code_groupe') then return false; end if;
  insert into public.adherents (uid) values (auth.uid()) on conflict do nothing;
  insert into public.docs (col, id, data)
    values ('membres', auth.uid()::text, jsonb_build_object('pseudo', left(pseudo, 30), 'par', auth.uid()::text,
            'maj', (extract(epoch from now()) * 1000)::bigint, 'cree', (extract(epoch from now()) * 1000)::bigint))
    on conflict (col, id) do update set data = public.docs.data || jsonb_build_object('pseudo', left(pseudo, 30));
  return true;
end $$;
revoke all on function public.rejoindre(text, text) from public;
grant execute on function public.rejoindre(text, text) to authenticated;

-- mises à jour en direct
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

-- photos : lisibles par lien (noms aléatoires), envoi et suppression réservés aux membres
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('photos', 'photos', true, 20971520, array['image/jpeg', 'image/png', 'image/webp'])
  on conflict (id) do nothing;
drop policy if exists "membres envoient des photos" on storage.objects;
drop policy if exists "membres suppriment des photos" on storage.objects;
create policy "membres envoient des photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.est_membre());
create policy "membres suppriment des photos" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.est_membre());

-- LE CODE DU GROUPE : remplace CHANGE-MOI avant de lancer (ou plus tard avec la même ligne)
insert into public.reglages (cle, valeur) values ('code_groupe', 'CHANGE-MOI')
  on conflict (cle) do update set valeur = excluded.valeur;
