-- Records which catalogue a supply's color code was picked from. Null means the
-- color was typed manually. The allowlist mirrors src/utils/catalogues.js.
alter table public.supplies
  add column color_catalogue text,
  add constraint supplies_color_catalogue_check check (
    color_catalogue is null or color_catalogue in (
      'anchor', 'appleton', 'artkal', 'bernat', 'caron', 'classic-colorworks',
      'cosmo', 'cxc', 'diamond-dotz', 'diamond-painting', 'dmc', 'hama',
      'jp-coats', 'kreinik', 'madeira', 'needlepoint-silks', 'perler',
      'presencia', 'red-heart', 'sullivans', 'gentle-art', 'unitas',
      'weeks-dye-works'
    )
  );
