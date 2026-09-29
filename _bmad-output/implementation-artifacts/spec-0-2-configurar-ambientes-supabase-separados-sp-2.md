---
title: 'SP-2: Configurar ambientes Supabase separados'
type: 'chore'
created: '2026-09-27'
status: 'done'
route: 'dispatch'
baseline_commit: '847fc9d575df7bcfe51b2dd2100a4449c89bebe0'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-0-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-Projeto teste-2026-09-27/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Os projetos Supabase de desenvolvimento/preview e produção já existem, mas o repositório ainda não define um contrato de variáveis seguro para apontar a aplicação a cada um sem misturar usuários e dados.

**Approach:** Definir variáveis públicas de URL e chave anon por ambiente, documentar o mapeamento de desenvolvimento/preview e produção, proteger arquivos locais e segredos no Git e fornecer uma verificação de leitura das APIs Auth e Data do projeto configurado.

## Boundaries & Constraints

**Always:** Usar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`; configurar os dois valores do projeto de desenvolvimento em `.env.local` e no ambiente Development/Preview, e os valores do outro projeto em Production; manter URLs e chaves reais fora do repositório e dos logs; deixar `.env.example` apenas com placeholders; executar verificações somente contra o URL configurado.

**Never:** Alterar ou imprimir valores de `.env.local`; criar ou alterar projetos Supabase; incluir service-role key em exemplo, cliente ou bundle; provisionar schema, usuários, migrations ou fluxos de produto nesta story.

## I/O & Edge-Case Matrix

| Cenário | Entrada/Estado | Resultado esperado | Tratamento de erro |
|---|---|---|---|
| Configuração válida | URL e chave anon do ambiente ativo | Verificador alcança Auth e Data API do mesmo projeto e confirma sucesso sem exibir valores | Nenhum |
| Configuração ausente ou inválida | Variável ausente, URL inválida ou endpoint indisponível | Verificador termina com falha clara indicando qual categoria precisa de atenção | Não imprimir URL, chave ou corpo da resposta |

</frozen-after-approval>

## Code Map

- `.gitignore` -- já ignora `.env`, `.env.local` e `.env*.local`; ampliar para ignorar arquivos de ambiente/segredos mantendo `.env.example` como exceção.
- `README.md` -- documentação atual de setup; acrescentar cópia do exemplo, mapeamento por ambiente e verificação das APIs.
- `package.json` -- scripts npm existentes; adicionar comando de verificação se necessário, sem dependência Supabase nesta story.
- `.env.local` -- existe e está ignorado; nunca ler, editar ou incluir no commit.
- `epic-0-context.md` e `epics.md` -- definem ambientes distintos e os critérios da SP-2; os projetos foram criados manualmente pelo usuário.

## Tasks & Acceptance

**Execution:**
- [x] `.gitignore` -- ignorar `.env*` e arquivos locais de segredos, permitindo apenas `.env.example` -- evitar commits acidentais.
- [x] `.env.example` -- incluir somente placeholders para URL e chave pública -- oferecer contrato seguro para setup local.
- [x] `scripts/verify-supabase-env.mjs` -- validar variáveis e consultar Auth/Data API usando somente o projeto configurado, sem registrar valores -- verificar conectividade sem introduzir SDK ou serviço.
- [x] `README.md` -- documentar instalação local, configuração independente de Development/Preview e Production e comandos de verificação -- tornar a separação reproduzível.

**Acceptance Criteria:**
- Given ambientes local/Preview e Production configurados, when cada ambiente inicia, then URL e chave pública apontam para projetos Supabase distintos com Auth e banco independentes.
- Given a configuração de um ambiente, when o verificador consulta Auth e Data API, then ambas as respostas vêm do único URL definido para aquele ambiente e nenhum valor de configuração é impresso.
- Given o repositório e o bundle do navegador, when arquivos e código são inspecionados, then `.env.local` e arquivos de segredo estão ignorados, `.env.example` contém apenas placeholders e nenhuma service-role key é incluída ou exposta.

## Implementation Notes

O `.env.local` existente foi preservado sem leitura de conteúdo ou edição. A inspeção de nomes confirmou pares primário e `_2`; somente os dois hosts foram comparados (origens distintas), sem imprimir valores. `.gitignore` ignora `.env*` com exceção de `.env.example`; o exemplo contém apenas placeholders. README documenta o mapeamento local/Vercel e os comandos de smoke test. O script faz somente GET para Auth health e `profiles?select=id&limit=1`, aceita `404 PGRST205` para tabela ainda inexistente, e não imprime URL, chave nem corpo de resposta. Rejeita chaves secret antes de qualquer requisição; `.env.local` usa valores publicáveis.

Validação final: `npm run lint`, `npm run test:supabase-env` (11 testes), `npm run build`, `npm run verify:supabase` para o ambiente padrão e uma chamada isolada ao segundo par passaram. Nenhum valor secreto foi impresso. `git check-ignore` confirma `.env.local` ignorado e `.env.example` não ignorado. O mapeamento de variáveis no painel Vercel ainda precisa de confirmação manual.

Não foi possível inspecionar as variáveis dos ambientes Vercel; o README descreve o mapeamento esperado, que precisa ser confirmado no painel.

Após a revisão, o checker passou a exigir HTTPS, remover espaços externos da chave, usar uma consulta limitada à tabela `profiles` e aceitar somente `200` ou `404 PGRST205` da Data API. Chaves secret são recusadas antes da rede.

O checker original da Data API consultava a raiz `/rest/v1/`, que não é o endpoint de smoke check compatível com a chave pública neste setup e retornava `401`. A consulta a `profiles` corrigiu o problema e passou em ambos os projetos.

## Review Triage Log

- false — A revisão alegou que o diff terminava com o teste sintaticamente incompleto; o arquivo-fonte contém os fechamentos e a suíte rodou com sucesso.
- low — URLs HTTP eram aceitos pelo checker; restringido a HTTPS para que uma resposta interceptada não valide falsamente o ambiente Supabase hospedado.
- low — Espaços externos na chave eram aceitos na validação mas enviados sem normalização; a chave agora é aparada antes da requisição.
- medium — Blind Hunter apontou falta de cobertura para Data API não OK e falha de rede; adicionados testes separados para ambos, e ambos passam.
- medium — Verification Gap Reviewer confirmou que o teste original de Auth 401 não cobria a falha da Data API após Auth bem-sucedida; adicionado caso específico que verifica o erro Data API e duas requisições.
- medium — O checker original consultava a raiz `/rest/v1/` e recebia HTTP 401; substituído pela consulta real e limitada a `profiles`, com aceitação específica de `PGRST205`; smoke check passou nos dois projetos.
- medium — Duas tentativas iniciais do build encontraram EPERM antes de compilar, mas a tentativa final passou; confirmado como bloqueio transitório, sem pendência restante.
- maybe-false — O mapeamento Vercel não pôde ser verificado; confirmar no painel os valores por Development/Preview/Production para determinar se há risco de mistura de dados; diferido até essa evidência.

## Design Notes

A chave anon/pública é própria para acesso cliente e não substitui autorização: policies RLS continuam sendo a fronteira de dados. Esta story não cria clientes de aplicação; a verificação de smoke test usa somente requisições GET às APIs do projeto selecionado.

## Verification

**Commands:**
- `git check-ignore -v .env.local` -- esperado: regra de ignore explícita.
- `node --env-file=.env.local scripts/verify-supabase-env.mjs` -- esperado: Auth e Data API respondem; saída não contém URL nem chave.
- `npm run lint` e `npm run build` -- esperado: lint do código da aplicação e build passam.

**Manual checks:**
- Conferir no painel de deploy que Development/Preview compartilham o URL/chave do projeto de desenvolvimento e Production usa os valores do outro projeto; confirmar que os URLs/projetos são distintos.
- Inspecionar `.env.example` e o bundle para confirmar ausência de valores reais e service-role key.
