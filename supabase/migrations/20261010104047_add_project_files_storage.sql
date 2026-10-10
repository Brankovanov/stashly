INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'project-files',
  'project-files',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "project_files_read_own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    OR public.is_admin()
  )
);

CREATE POLICY "project_files_upload_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    OR public.is_admin()
  )
);

CREATE POLICY "project_files_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-files'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    OR public.is_admin()
  )
)
WITH CHECK (
  bucket_id = 'project-files'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    OR public.is_admin()
  )
);

CREATE POLICY "project_files_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-files'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    OR public.is_admin()
  )
);