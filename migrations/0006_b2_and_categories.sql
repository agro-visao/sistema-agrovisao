-- Migration 0006: Suporte a Backblaze B2 e tabela de categorias
-- Remove dependência de Cloudinary, adiciona categorias dinâmicas.

-- Adicionar colunas B2 aos produtos
ALTER TABLE products ADD COLUMN b2_file_key TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN b2_file_id TEXT NOT NULL DEFAULT '';

-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Adicionar FK de categoria aos produtos (ainda permite NULL para compatibilidade com dados antigos)
ALTER TABLE products ADD COLUMN category_id INTEGER;

-- Semear categorias padrão
INSERT INTO categories (key, label, description, sort_order, active) VALUES
  ('mudas', 'Mudas', 'Produtos de mudas e plantas', 1, 1),
  ('insumos', 'Insumos', 'Insumos e acessórios agrícolas', 2, 1)
ON CONFLICT(key) DO NOTHING;

-- Índice para buscar produtos por categoria
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_key ON categories(key);
