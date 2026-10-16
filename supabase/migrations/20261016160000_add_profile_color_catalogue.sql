-- Per-user color catalogue preference. The allowlist mirrors the catalogue ids
-- in src/utils/catalogues.js; keep both in sync when a catalogue is added.
alter table public.profiles
  add column color_catalogue text not null default 'dmc',
  add constraint profiles_color_catalogue_check check (
    color_catalogue in (
      'anchor', 'appleton', 'artkal', 'bernat', 'caron', 'classic-colorworks',
      'cosmo', 'cxc', 'diamond-dotz', 'diamond-painting', 'dmc', 'hama',
      'jp-coats', 'kreinik', 'madeira', 'needlepoint-silks', 'perler',
      'presencia', 'red-heart', 'sullivans', 'gentle-art', 'unitas',
      'weeks-dye-works'
    )
  );
