-- Migration 0005: Referência das imagens enviadas ao Cloudinary.
-- O D1 guarda apenas a URL pública e os metadados da imagem — o binário fica no
-- Cloudinary. Nada de base64/BLOB nem credenciais no banco.

ALTER TABLE products ADD COLUMN cloudinary_public_id TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN mime_type TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN width INTEGER;
ALTER TABLE products ADD COLUMN height INTEGER;
