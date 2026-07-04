
CREATE POLICY "Editors read admin-uploads"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'admin-uploads' AND public.can_edit(auth.uid()));
CREATE POLICY "Editors insert admin-uploads"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'admin-uploads' AND public.can_edit(auth.uid()));
CREATE POLICY "Editors update admin-uploads"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'admin-uploads' AND public.can_edit(auth.uid()))
  WITH CHECK (bucket_id = 'admin-uploads' AND public.can_edit(auth.uid()));
CREATE POLICY "Editors delete admin-uploads"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'admin-uploads' AND public.can_edit(auth.uid()));
