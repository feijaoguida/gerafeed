# News Curator. Specs

*(Fases 1 a 7 já concluídas e omitidas aqui para brevidade, mas o sistema mantém todas as funcionalidades)*

---

# News Curator. Phase 8: Múltiplos WordPress e Filtros

## 1. Objetivo
Permitir que um único Workspace (Empresa) gerencie múltiplos sites WordPress, distribuindo as fontes RSS (Feeds) entre eles, e melhorando a interface de curadoria com filtros avançados.

## 2. Múltiplos WordPress e Feeds
- O sistema deixará de ter uma única configuração WP no JSON `Configuration` e passará a ter a tabela `WordPressSite`.
- Cada `WordPressSite` terá suas credenciais (URL, User, AppPassword criptografada) e **opcionalmente** suas próprias configurações de Prompt de IA.
- Na hora de cadastrar um Feed (Source), o usuário poderá vinculá-lo a um `WordPressSite` específico.
- A tela de Configuração do WordPress passará a ser um CRUD (Lista de sites, Adicionar, Editar, Remover). Dentro da edição de um WP, será possível escolher/cadastrar feeds vinculados a ele, além do prompt específico.

## 3. Tela de Curadoria (Artigos)
- Inclusão de filtros no topo da listagem: Data, Fonte (Feed) e WordPress de Destino.
- No card de exibição de cada notícia capturada, deve constar visivelmente a "Data do Feed" (quando a matéria original foi publicada).

## 4. Definition of Done global (Phase 8)
- [ ] Schema atualizado com `WordPressSite` (1:N com `Source`).
- [ ] CRUD de WordPress Sites finalizado (incluindo prompt por site).
- [ ] Cadastro de RSS com vinculação ao WP Site.
- [ ] Filtros operacionais na tela de artigos (Data, Fonte, WP).
- [ ] Card de artigo exibe a data original.

---

# News Curator. Phase 9: Backoffice (SaaS Admin)

## 1. Objetivo
Criar a área administrativa (Backoffice) independente para o Super Admin do sistema gerenciar Planos, Features e as Empresas (Workspaces) cadastradas.

## 2. Acesso e Segurança
- Apenas usuários com a flag `isSuperAdmin` (tabela `User`) podem acessar as rotas `/admin` (ou `/backoffice`).
- Middleware deve bloquear ativamente acessos não autorizados.
- Criar um Seed Script (`prisma/seed.ts`) para injetar o primeiro super admin.

## 3. Gestão de Planos
- CRUD de Planos.
- Definição de Features do plano, limites (ex: Qtd Artigos, Qtd WordPress permitidos) e valores.

## 4. Gestão de Empresas (Workspaces)
- Menu "Empresas" com listagem de Workspaces.
- Na listagem: Nome, Plano Atual, Créditos/Consumo, Status (Ativo/Inativo).
- Botão "Mais opções" que abre o detalhamento da Empresa.

## 5. Edição Avançada da Empresa
- Na tela de "Mais opções", o Super Admin deve visualizar e conseguir alterar: Informações básicas, associar um novo plano, e alterar configurações inerentes àquele Workspace (Feeds cadastrados, configuração de IA, Prompts).

## 6. Definition of Done global (Phase 9)
- [ ] Seed script para Super Admin criado.
- [ ] Middleware protegendo `/admin`.
- [ ] CRUD de Planos concluído.
- [ ] Listagem de Empresas (Workspaces) com status, limites e botão inativar.
- [ ] Tela de Detalhes da Empresa operante, permitindo alteração profunda pelo Super Admin.
