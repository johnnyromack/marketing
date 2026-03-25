-- Add column for "Anúncio Volante" (floating ads like sound cars, magazines, newspapers)
ALTER TABLE public.midia_off 
ADD COLUMN anuncio_volante BOOLEAN NOT NULL DEFAULT false;