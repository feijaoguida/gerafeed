# Guia: Como Configurar a Integração com o WordPress no GeraFeed

Este guia orienta o passo a passo completo para conectar seu site WordPress ao GeraFeed utilizando **Senhas de Aplicação (Application Passwords)** da REST API nativa do WordPress.

---

## 1. O que é a Senha de Aplicação?
A Senha de Aplicação permite que o GeraFeed publique matérias, envie mídias destacadas e sincronize categorias diretamente no seu WordPress via REST API oficial de forma segura, sem expor sua senha pessoal de login e podendo ser revogada a qualquer momento no painel do WordPress.

---

## 2. Passo a Passo no Painel do WordPress

### Passo 1: Cadastro ou Seleção do Usuário
1. Acesse o painel de administração do seu WordPress (`https://seusite.com.br/wp-admin`).
2. No menu lateral esquerdo, clique em **Usuários** → **Adicionar usuário** (ou acesse um usuário existente).
3. **Recomendação**: Crie um usuário dedicado exclusivamente para a API do GeraFeed (ex: usuário `gerafeed_api`), com a função de **Administrador** ou **Editor**.

### Passo 2: Gerar a Senha de Aplicação
1. Na tela de edição do usuário, role até a seção **"Senhas da aplicação"**.
2. No campo **"Novo nome de senha da aplicação"**, digite: `GeraFeed`.
3. Clique no botão **"Adicionar senha de aplicativo"**.

![Gerando senha de aplicação no WordPress](/help/wordpress/wp-pass-1.png)

### Passo 3: Copiar a Senha Gerada
1. O WordPress exibirá a confirmação: *"Sua nova senha para GeraFeed é: xxxx xxxx xxxx xxxx"*.
2. Clique no botão **"Copiar"** (ou copie os caracteres gerados).
3. **Atenção**: Guarde essa senha imediatamente em local seguro. O WordPress não a exibirá novamente após recarregar a página.

![Copiando senha de aplicação](/help/wordpress/wp-pass-2.png)

---

## 3. Passo a Passo no Painel do GeraFeed

### Passo 4: Cadastrar o Destino WordPress
1. No GeraFeed, acesse o menu lateral **WordPress** (ou **Configurações → WordPress**).
2. Clique no botão **"+ Adicionar Novo Site WordPress"**.
3. Preencha os campos do modal:
   - **Nome do Destino**: Nome de identificação (ex: *Portal Principal*, *Tech News*).
   - **URL Base do WordPress**: A URL completa do site (ex: `https://seusite.com.br`).
   - **Usuário REST API**: O mesmo nome de usuário configurado no WordPress (ex: `admin` ou `gerafeed_api`).
   - **Application Password**: Cole a senha gerada no Passo 3.
   - *(Opcional)* **Prompt Padrão do Site**: Instruções adicionais de tom e estilo para matérias desse portal.
   - *(Opcional)* **Definir como Destino Padrão**: Ative para ser o site selecionado por padrão na fila de revisão.
4. Clique em **"Criar Destino"**.

![Modal de cadastro de site WordPress no GeraFeed](/help/wordpress/wp-pass-3.png)

---

## 4. Requisitos e Boas Práticas
- **SSL Ativo (`https://`)**: A REST API do WordPress exige conexão segura para autenticar senhas de aplicativo.
- **Links Permanentes (Permalinks)**: Acesse **Configurações → Links Permanentes** no WordPress e certifique-se de que a estrutura esteja configurada como "Nome do post" (nunca "Simples" `?p=123`).
- **Plugins de Segurança**: Se você utiliza plugins como Wordfence, iThemes Security ou Cloudflare, garanta que requisições autorizadas para `/wp-json/wp/v2/` não sejam bloqueadas.
