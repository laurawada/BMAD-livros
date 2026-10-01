- source_spec: `_bmad-output/implementation-artifacts/spec-0-2-configurar-ambientes-supabase-separados-sp-2.md`
  summary: Corrigir o pareamento das chaves públicas com os URLs Supabase ou habilitar a Data API até o smoke check passar nos dois projetos.
  evidence: O smoke check read-only retornou HTTP 401 na Data API para os dois pares locais; confirmar no painel que cada chave publishable pertence ao URL correspondente e que a Data API está habilitada, sem compartilhar valores.
- source_spec: `_bmad-output/implementation-artifacts/spec-0-2-configurar-ambientes-supabase-separados-sp-2.md`
  summary: Confirmar no painel Vercel o mapeamento de Development/Preview para o projeto Supabase de desenvolvimento e Production para o projeto de produção.
  evidence: Os URLs locais têm origens distintas, mas os valores dos ambientes Vercel não estavam acessíveis para inspeção; uma configuração incorreta pode misturar usuários e dados, e a verificação requer conferir as variáveis por ambiente no painel.
- source_spec: Epic 4 / Story 4.1 (Consultar perfil e atividade pública)
  summary: Substituir o adapter de perfil por fixtures por um adapter Supabase com RLS quando os Epics 1 (User/perfil, UUID de Auth) e 3 (Review, Shelf, médias) estiverem implementados; ligar `getPublicProfile` ao banco real.
  evidence: A Epic 4 foi construída em modo ISOLADO — domain port `ProfileReadPort` + adapter de fixtures em memória + rota `/perfil/[id]`. A projeção pública Lido (perfil+livro+data), a contagem de Lido, a média derivada das reviews e as reviews públicas funcionam contra dados de fixture; a enforcement real por RLS (AD-6) e as tabelas de origem (Epics 1 e 3) ainda não existem, então a integração final aguarda esses dados/contratos.
