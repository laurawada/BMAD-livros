# Epic 1 Context: Conta e acesso seguro

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Este épico entrega o cadastro inicial e a autenticação por e-mail e senha para que a pessoa consiga criar uma conta, associar um perfil seguro e entrar na parte pessoal do produto. O foco é a identidade do usuário no Supabase Auth e a separação correta entre credenciais e dados de perfil.

## Stories

- Story 1.1: Criar conta e perfil
- Story 1.2: Entrar com e-mail e senha

## Requirements & Constraints

- O cadastro usa nome, e-mail e senha válidos, com identidade gerada pelo Supabase Auth.
- O perfil associado usa o mesmo UUID do usuário autenticado e guarda apenas nome e imagem opcional, sem duplicar e-mail ou senha.
- Operações de leitura/alteração de dados pessoais precisam ser protegidas pelo servidor e por políticas de banco.
- O ambiente deve respeitar projetos Supabase separados por preview/desenvolvimento e produção, sem misturar credenciais entre ambientes.
- Login social não entra no escopo; o MVP suporta apenas e-mail e senha.

## Technical Decisions

- O fluxo de identidade é tratado por Supabase Auth, não pelo perfil da aplicação.
- O perfil armazenado na aplicação usa a chave primária `id` do Auth, além de nome obrigatório e `profileImageUrl` opcional.
- Browser code não deve escrever tabelas diretamente; as ações e consultas sensíveis devem passar por server-side logic e RLS.
- O banco é o ponto de verdade para os dados do produto, enquanto a autenticação do usuário é federada no Auth do Supabase.

## UX & Interaction Patterns

- Cadastro com formulário simples de nome, e-mail e senha.
- Erros de e-mail em uso ou senha inválida devem ser tratados com mensagens seguras, sem vazar se a conta existe.
- A página de cadastro deve orientar o usuário para o próximo passo da sessão autenticada, sem expor dados sensíveis do auth.

## Cross-Story Dependencies

- A identidade e o contrato de UUID entre Auth e perfil precisam estar alinhados antes da criação do restante do fluxo de conta.
- O Epic 2 e o Epic 3 dependem do contrato de usuário e do perfil para operações com livros e avaliações.
- As políticas de RLS e a projeção pública dos dados dependem da estrutura do perfil criada neste épico.
