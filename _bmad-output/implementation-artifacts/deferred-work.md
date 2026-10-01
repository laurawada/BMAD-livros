- source_spec: `_bmad-output/implementation-artifacts/spec-0-2-configurar-ambientes-supabase-separados-sp-2.md`
  summary: Corrigir o pareamento das chaves públicas com os URLs Supabase ou habilitar a Data API até o smoke check passar nos dois projetos.
  evidence: O smoke check read-only retornou HTTP 401 na Data API para os dois pares locais; confirmar no painel que cada chave publishable pertence ao URL correspondente e que a Data API está habilitada, sem compartilhar valores.
- source_spec: `_bmad-output/implementation-artifacts/spec-0-2-configurar-ambientes-supabase-separados-sp-2.md`
  summary: Confirmar no painel Vercel o mapeamento de Development/Preview para o projeto Supabase de desenvolvimento e Production para o projeto de produção.
  evidence: Os URLs locais têm origens distintas, mas os valores dos ambientes Vercel não estavam acessíveis para inspeção; uma configuração incorreta pode misturar usuários e dados, e a verificação requer conferir as variáveis por ambiente no painel.
- source_spec: `_bmad-output/implementation-artifacts/spec-3-1-adicionar-livros-e-organizar-a-estante.md`
  summary: Implementar a página `/login` do Epic 1 para receber usuários redirecionados da estante privada.
  evidence: A Story 3.1 redireciona sessões ausentes para `/login`, mas cadastro/login e suas rotas foram explicitamente excluídos desta entrega e pertencem ao Epic 1.
