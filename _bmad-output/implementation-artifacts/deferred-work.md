- source_spec: `_bmad-output/implementation-artifacts/spec-auth-cleanup-failure-logging.md`
  summary: Corrigir o script de lint para funcionar com Next.js 16.
  evidence: `npm run lint` falha porque `next lint` interpreta `lint` como diretório; não foi alterado nesta tarefa.
- source_spec: `_bmad-output/implementation-artifacts/spec-auth-cleanup-failure-logging.md`
  summary: Tratar rejeições inesperadas da Server Action no formulário de cadastro.
  evidence: Uma exceção fora do fluxo tratado impede a restauração de `isSubmitting` em `src/app/cadastro/page.tsx`.
- source_spec: `_bmad-output/implementation-artifacts/spec-auth-cleanup-failure-logging.md`
  summary: Orientar o próximo passo quando o cadastro exige confirmação de e-mail.
  evidence: O contexto da Story 1.1 pede orientação após cadastro, mas o fluxo sempre mostra mensagem de sucesso sem distinguir sessão de confirmação pendente.
- source_spec: `_bmad-output/implementation-artifacts/spec-auth-cleanup-failure-logging.md`
  summary: Criar e validar o schema persistente de perfis Supabase.
  evidence: `src/app/actions/auth.ts` depende de `profiles` e colunas específicas; não foi encontrada migração ou definição do schema.
- source_spec: `_bmad-output/implementation-artifacts/spec-auth-cleanup-failure-logging.md`
  summary: Implementar as políticas RLS requeridas para os dados de perfil.
  evidence: O contexto do Epic 1 exige políticas de banco, mas não foram encontradas políticas ou migrações correspondentes.
- source_spec: `_bmad-output/implementation-artifacts/spec-auth-cleanup-failure-logging.md`
  summary: Ampliar os testes do cadastro para sucesso, UUID, e-mail já usado e limites de validação.
  evidence: A suíte cobre validação básica e falha de cleanup, mas não cobre esses cenários da Story 1.1.
- source_spec: `_bmad-output/implementation-artifacts/spec-auth-cleanup-failure-logging.md`
  summary: Sincronizar o status e checklist da especificação da Story 1.1 com o estado implementado.
  evidence: A especificação existente ainda está `in-progress` e mantém todas as tarefas desmarcadas.
- source_spec: `_bmad-output/implementation-artifacts/spec-auth-cleanup-failure-logging.md`
  summary: Anunciar mensagens de sucesso do cadastro com uma região acessível.
  evidence: A mensagem de sucesso atual não usa `role="status"` nem `aria-live`.