
-- 1) team_members: prevent anon from reading email/phone columns
REVOKE SELECT ON public.team_members FROM anon;
GRANT SELECT (id, name, position, bio, photo_url, sort_order, is_published, created_at, updated_at)
  ON public.team_members TO anon;

-- 2) site_settings: restrict anon SELECT to an allow-list of public-safe keys
DROP POLICY IF EXISTS "Public read settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;

CREATE POLICY "Public read public settings"
  ON public.site_settings
  FOR SELECT
  TO anon
  USING (
    key IN (
      -- branding
      'site_name','site_tagline',
      'header_logo_url','footer_logo_url','footer_tagline','footer_copyright',
      'footer_credit_label','footer_credit_url',
      -- hero
      'hero_title','hero_subtitle',
      'hero_bg_1','hero_bg_2','hero_bg_3',
      'hero_cta_primary_label','hero_cta_primary_url',
      'hero_cta_secondary_label','hero_cta_secondary_url',
      -- loading screen
      'loading_tagline','loading_welcome_text',
      -- socials
      'social_facebook','social_instagram','social_linkedin','social_tiktok','social_twitter',
      -- contact
      'contact_address','contact_email','contact_phone',
      -- google / reviews / maps
      'google_analytics_id','google_maps_url','google_qr_image_url',
      'google_rating_count','google_rating_value','google_review_url',
      'google_reviews_current','google_reviews_goal',
      -- whatsapp
      'whatsapp_number','whatsapp_default_message',
      -- meta / cache
      'default_meta_description','content_version'
    )
  );

-- Signed-in users can also read the same public keys (plus editors keep full ALL policy)
CREATE POLICY "Authenticated read public settings"
  ON public.site_settings
  FOR SELECT
  TO authenticated
  USING (
    key IN (
      'site_name','site_tagline',
      'header_logo_url','footer_logo_url','footer_tagline','footer_copyright',
      'footer_credit_label','footer_credit_url',
      'hero_title','hero_subtitle',
      'hero_bg_1','hero_bg_2','hero_bg_3',
      'hero_cta_primary_label','hero_cta_primary_url',
      'hero_cta_secondary_label','hero_cta_secondary_url',
      'loading_tagline','loading_welcome_text',
      'social_facebook','social_instagram','social_linkedin','social_tiktok','social_twitter',
      'contact_address','contact_email','contact_phone',
      'google_analytics_id','google_maps_url','google_qr_image_url',
      'google_rating_count','google_rating_value','google_review_url',
      'google_reviews_current','google_reviews_goal',
      'whatsapp_number','whatsapp_default_message',
      'default_meta_description','content_version'
    )
    OR private.can_edit(auth.uid())
  );
