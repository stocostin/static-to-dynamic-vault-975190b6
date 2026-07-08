
-- Enum for doc type
DO $$ BEGIN
  CREATE TYPE public.doc_type AS ENUM ('invoice', 'quotation', 'receipt', 'estimate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.doc_status AS ENUM ('draft', 'issued', 'paid', 'void');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Counters table
CREATE TABLE public.document_counters (
  doc_type public.doc_type PRIMARY KEY,
  last_number integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.document_counters TO authenticated;
GRANT ALL ON public.document_counters TO service_role;

ALTER TABLE public.document_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Editors read counters" ON public.document_counters
  FOR SELECT TO authenticated USING (public.can_edit(auth.uid()));

INSERT INTO public.document_counters (doc_type, last_number) VALUES
  ('invoice', 0), ('quotation', 0), ('receipt', 0), ('estimate', 0);

-- Sequential number function
CREATE OR REPLACE FUNCTION public.next_document_number(_type public.doc_type)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _next integer;
BEGIN
  IF NOT public.can_edit(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.document_counters
    SET last_number = last_number + 1, updated_at = now()
    WHERE doc_type = _type
    RETURNING last_number INTO _next;
  RETURN _next;
END;
$$;

REVOKE ALL ON FUNCTION public.next_document_number(public.doc_type) FROM public;
GRANT EXECUTE ON FUNCTION public.next_document_number(public.doc_type) TO authenticated;

-- Documents table
CREATE TABLE public.business_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type public.doc_type NOT NULL,
  doc_number text,
  status public.doc_status NOT NULL DEFAULT 'draft',
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  client_name text NOT NULL DEFAULT '',
  client_reg_no text,
  client_kra_pin text,
  client_address text,
  client_email text,
  client_phone text,
  project_name text,
  location text,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  currency text NOT NULL DEFAULT 'KES',
  subtotal_cents bigint NOT NULL DEFAULT 0,
  tax_enabled boolean NOT NULL DEFAULT false,
  tax_rate numeric(6,3) NOT NULL DEFAULT 0,
  tax_label text NOT NULL DEFAULT 'VAT',
  tax_cents bigint NOT NULL DEFAULT 0,
  total_cents bigint NOT NULL DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX business_documents_type_idx ON public.business_documents (doc_type, created_at DESC);
CREATE UNIQUE INDEX business_documents_type_number_uidx ON public.business_documents (doc_type, doc_number) WHERE doc_number IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_documents TO authenticated;
GRANT ALL ON public.business_documents TO service_role;

ALTER TABLE public.business_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Editors read documents" ON public.business_documents
  FOR SELECT TO authenticated USING (public.can_edit(auth.uid()));
CREATE POLICY "Editors insert documents" ON public.business_documents
  FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Editors update documents" ON public.business_documents
  FOR UPDATE TO authenticated USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Editors delete documents" ON public.business_documents
  FOR DELETE TO authenticated USING (public.can_edit(auth.uid()));

CREATE TRIGGER update_business_documents_updated_at
  BEFORE UPDATE ON public.business_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed document/tax site_settings (only if missing)
INSERT INTO public.site_settings (key, value) VALUES
  ('tax_enabled', to_jsonb(false)),
  ('tax_rate', to_jsonb('16'::text)),
  ('tax_label', to_jsonb('VAT'::text)),
  ('document_notes_default', to_jsonb('Prices are valid for 14 days from the date of this document.
Payment terms: 50% deposit, balance on delivery.
Goods once sold are not returnable.
Delivery time: 2 – 3 working days upon confirmation.'::text)),
  ('document_footer_tagline', to_jsonb('SAWN TIMBER | TREATED TIMBER | PLYWOOD | HARDWARE | DELIVERY'::text)),
  ('document_bank_details', to_jsonb(''::text)),
  ('document_prepared_by', to_jsonb('Shachavir Timber Limited'::text))
ON CONFLICT (key) DO NOTHING;
