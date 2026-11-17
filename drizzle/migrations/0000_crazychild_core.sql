-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Admin allowlist
CREATE TABLE public.admin_allowlist (
  email text PRIMARY KEY CHECK (email = lower(email) AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.admin_allowlist TO authenticated;
GRANT ALL ON public.admin_allowlist TO service_role;
ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read allowlist" ON public.admin_allowlist
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins add allowlist" ON public.admin_allowlist
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins remove allowlist" ON public.admin_allowlist
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Claim admin: only verified email on the allowlist
CREATE OR REPLACE FUNCTION public.claim_admin()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _confirmed timestamptz;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  SELECT lower(u.email), u.email_confirmed_at INTO _email, _confirmed FROM auth.users u WHERE u.id = _uid;
  IF _email IS NULL OR _confirmed IS NULL THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.admin_allowlist a WHERE a.email = _email) THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'admin') ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin() TO authenticated;

-- Removing an email from the allowlist revokes that user's admin role
CREATE OR REPLACE FUNCTION public.revoke_admin_on_allowlist_delete()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth
AS $$
BEGIN
  DELETE FROM public.user_roles r
  USING auth.users u
  WHERE r.user_id = u.id AND lower(u.email) = OLD.email AND r.role = 'admin';
  RETURN OLD;
END;
$$;
CREATE TRIGGER admin_allowlist_revoke
  AFTER DELETE ON public.admin_allowlist
  FOR EACH ROW EXECUTE FUNCTION public.revoke_admin_on_allowlist_delete();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Site settings (single row)
CREATE TABLE public.site_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  headline text NOT NULL DEFAULT 'SMALL HUMAN. BIG CHAOS.' CHECK (char_length(headline) BETWEEN 1 AND 120),
  slogan text NOT NULL DEFAULT 'TOO CRAZY TO GROW UP!' CHECK (char_length(slogan) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 1500),
  contract_address text CHECK (contract_address IS NULL OR contract_address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'),
  hero_image_path text CHECK (hero_image_path IS NULL OR char_length(hero_image_path) <= 300),
  telegram_url text CHECK (telegram_url IS NULL OR (telegram_url ~ '^https://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(/\S*)?$' AND char_length(telegram_url) <= 500)),
  x_url text CHECK (x_url IS NULL OR (x_url ~ '^https://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(/\S*)?$' AND char_length(x_url) <= 500)),
  instagram_url text CHECK (instagram_url IS NULL OR (instagram_url ~ '^https://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(/\S*)?$' AND char_length(instagram_url) <= 500)),
  tiktok_url text CHECK (tiktok_url IS NULL OR (tiktok_url ~ '^https://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(/\S*)?$' AND char_length(tiktok_url) <= 500)),
  dexscreener_url text CHECK (dexscreener_url IS NULL OR (dexscreener_url ~ '^https://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(/\S*)?$' AND char_length(dexscreener_url) <= 500)),
  pumpfun_url text CHECK (pumpfun_url IS NULL OR (pumpfun_url ~ '^https://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(/\S*)?$' AND char_length(pumpfun_url) <= 500)),
  buy_url text CHECK (buy_url IS NULL OR (buy_url ~ '^https://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(/\S*)?$' AND char_length(buy_url) <= 500)),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads site settings" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins update site settings" ON public.site_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER site_settings_touch BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.site_settings (id, headline, slogan, description) VALUES (
  1,
  'SMALL HUMAN. BIG CHAOS.',
  'TOO CRAZY TO GROW UP!',
  'Meet CraZyChilD ($CRZKD) — the little legend with unstoppable chaos energy! Born to break boring rules, powered by memes, and raised by a community that refuses to grow up. No boring vibes, just crazy adventures, wild faces, and endless fun. Stay crazy. Stay legendary!'
);

-- Gallery
CREATE TABLE public.gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_path text NOT NULL CHECK (char_length(image_path) BETWEEN 1 AND 300),
  caption text NOT NULL DEFAULT '' CHECK (char_length(caption) <= 140),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gallery_items_sort_idx ON public.gallery_items (sort_order, created_at);
GRANT SELECT ON public.gallery_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated;
GRANT ALL ON public.gallery_items TO service_role;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views gallery" ON public.gallery_items
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins add gallery" ON public.gallery_items
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins edit gallery" ON public.gallery_items
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete gallery" ON public.gallery_items
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER gallery_items_touch BEFORE UPDATE ON public.gallery_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage policies for the public "gallery" bucket (admin-only writes, images only)
CREATE POLICY "Admins read gallery objects" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins upload gallery objects" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'gallery'
    AND public.has_role(auth.uid(), 'admin')
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
  );
CREATE POLICY "Admins update gallery objects" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (
    bucket_id = 'gallery'
    AND public.has_role(auth.uid(), 'admin')
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
  );
CREATE POLICY "Admins delete gallery objects" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));