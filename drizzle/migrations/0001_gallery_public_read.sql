DROP POLICY IF EXISTS "Admins read gallery objects" ON storage.objects;
CREATE POLICY "Anyone reads gallery objects" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'gallery');