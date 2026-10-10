INSERT INTO public.categories (name, icon)
VALUES
  ('Floss', 'bi-palette'),
  ('Fabric', 'bi-grid-3x3'),
  ('Needles', 'bi-bezier2'),
  ('Hoops', 'bi-circle'),
  ('Beads', 'bi-stars'),
  ('Stabilizer', 'bi-layers'),
  ('Tools', 'bi-scissors'),
  ('Other', 'bi-three-dots')
ON CONFLICT (name) DO NOTHING;