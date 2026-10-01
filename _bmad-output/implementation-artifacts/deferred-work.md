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
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-entrar-com-e-mail-e-senha.md`
  summary: Antes de abrir o sistema para usuários reais, versionar o schema de perfis e aplicar/testar políticas RLS de propriedade.
  evidence: Por decisão registrada na Story 1.2, esta entrega negará acesso não autenticado no servidor, mas não criará migrations nem protegerá o banco com RLS; não liberar dados pessoais a usuários reais antes de concluir esta pendência.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-entrar-com-e-mail-e-senha.md`
  summary: Implementar uma ação explícita de saída que invalide a sessão Supabase e limpe os cookies de autenticação.
  evidence: A Story 1.2 entrega entrada com sessão persistente, mas não define fluxo de saída; nenhum controle ou Server Action de logout existe.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-entrar-com-e-mail-e-senha.md`
  summary: Adicionar teste de interface para a mensagem de erro genérica visível na tela de entrada.
  evidence: A suíte atual verifica o retorno seguro da Server Action, mas não renderiza componentes React nem verifica o alerta; o projeto não possui infraestrutura de teste de UI.
- source_spec: `_bmad-output/implementation-artifacts/spec-global-app-styling.md`
  summary: Adicionar tokens autocomplete aos campos de nome, e-mail e senha do cadastro.
  evidence: Os campos existentes não identificam seu propósito para navegadores e gerenciadores de senha; essa alteração de formulário não faz parte da solicitação de CSS.
- source_spec: `_bmad-output/implementation-artifacts/spec-global-app-styling.md`
  summary: Adicionar link de retorno ao login na página de cadastro.
  evidence: A tela de cadastro não oferece retorno direto para `/entrar`; trata-se de uma melhoria de navegação anterior e não necessária para o stylesheet.
- source_spec: `_bmad-output/implementation-artifacts/spec-global-app-styling.md`
  summary: Anunciar dinamicamente o sucesso do cadastro com uma região acessível.
  evidence: A mensagem de sucesso não tem `role="status"` nem `aria-live`; a revisão identificou esta melhoria fora do escopo de estilo visual.
