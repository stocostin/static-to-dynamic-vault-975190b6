ALTER TABLE public.shop_products ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.portfolio_projects ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}';