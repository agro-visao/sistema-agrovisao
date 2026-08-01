-- Migration 0003: Área administrativa — usuários, sessões, recuperação de senha
-- e colunas extras para produtos (categoria, estoque, destaque, novo).

ALTER TABLE products ADD COLUMN category TEXT NOT NULL DEFAULT 'mudas';
ALTER TABLE products ADD COLUMN category_label TEXT NOT NULL DEFAULT 'Mudas';
ALTER TABLE products ADD COLUMN stock INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN featured INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN is_new INTEGER NOT NULL DEFAULT 0;

-- Administradores — a senha é armazenada apenas como hash PBKDF2 (nunca em texto puro).
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sessões — guardamos apenas o hash SHA-256 do token; o token cru vai só para o cookie HttpOnly.
-- expires_at é um timestamp Unix em segundos.
CREATE TABLE IF NOT EXISTS admin_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- Tokens de recuperação de senha — temporários, hash SHA-256, uso único.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
