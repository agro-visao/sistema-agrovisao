-- Fotos complementares de um registro da galeria.
--
-- Antes desta migration cada linha de project_images era um card independente
-- no painel. Agora um registro da galeria pode ter várias fotos: a linha com
-- parent_id nulo é o registro (guarda a breve descrição, a descrição completa e
-- o destaque) e as linhas com parent_id apontando para ela são as fotos
-- complementares, que só carregam uma breve descrição opcional.
--
-- Idempotente: pode ser reexecutada sem efeito colateral.

alter table project_images
  add column if not exists parent_id bigint references project_images(id) on delete cascade;

create index if not exists idx_project_images_parent on project_images (parent_id);
