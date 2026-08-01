-- Migration 0004: Obriga a troca da senha inicial após o primeiro login.
-- O usuário de bootstrap é criado com must_change_password = 1 e só consegue
-- usar o painel depois de definir uma senha própria (endpoint change-password).

ALTER TABLE admin_users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;
