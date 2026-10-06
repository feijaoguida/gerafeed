# Como criar sua chave de IA e cadastrar no GeraFeed

Revisado em **6 de outubro de 2026**. Os nomes dos menus e os modelos disponíveis podem mudar; os links oficiais acompanham cada orientação.

Para usar sua conta de inteligência artificial no GeraFeed, você precisa de uma **chave de API**, também chamada de **API Key**. Ela autoriza o sistema a solicitar textos ao serviço escolhido. Crie a chave no painel do provedor e cadastre-a em **Configurações → Inteligência Artificial → Conexão & Provedor**.

Este guia cobre a configuração de IA para textos. Você precisa configurar apenas o serviço que pretende usar; a configuração ativa é compartilhada no seu espaço de trabalho do GeraFeed.

## Antes de começar

- Tenha acesso à conta e ao painel de API do provedor escolhido.
- Confira os créditos, as cotas e a forma de cobrança nesse painel. O consumo da sua chave é acompanhado no provedor, separadamente do plano do GeraFeed.
- Verifique quais provedores seu plano do GeraFeed permite. Gemini e Anthropic dependem do recurso de provedores avançados; OpenAI e OpenAI-Compatible são as opções disponíveis sem esse recurso.
- Assinar um aplicativo de chat não significa ter créditos para API. Isso vale, por exemplo, para [ChatGPT e API OpenAI](https://help.openai.com/en/articles/9039756-managing-billing-settings-on-chatgpt-web-and-platform) e para [assinaturas Claude e Claude API](https://support.claude.com/en/articles/9876003-i-have-a-paid-claude-subscription-pro-max-team-or-enterprise-plans-why-do-i-have-to-pay-separately-to-use-the-claude-api-and-console).

## Escolha o seu serviço

| Serviço | Opção em “Selecione o Provedor de IA” | Base URL no GeraFeed | Passo a passo |
| --- | --- | --- | --- |
| OpenAI | OpenAI | Deixe em branco para a API oficial | [Criar chave OpenAI](#openai) |
| Google Gemini | Google Gemini | Não precisa preencher | [Criar chave Gemini](#google-gemini) |
| Anthropic Claude | Anthropic Claude | Não precisa preencher | [Criar chave Claude](#anthropic-claude) |
| OpenRouter | OpenAI-Compatible | `https://openrouter.ai/api/v1` | [Criar chave OpenRouter](#openrouter) |
| DeepSeek | OpenAI-Compatible | `https://api.deepseek.com` | [Criar chave DeepSeek](#deepseek) |
| Kimi / Moonshot | OpenAI-Compatible | `https://api.moonshot.ai/v1` | [Criar chave Kimi](#kimi--moonshot) |

**OpenAI-Compatible** é o nome da opção de conexão. Para OpenRouter, DeepSeek e Kimi, use a chave emitida pelo próprio serviço escolhido.

## OpenAI

1. Entre na [plataforma OpenAI](https://platform.openai.com/) e selecione o projeto que usará com o GeraFeed.
2. Abra [API keys](https://platform.openai.com/api-keys) e escolha **Create new secret key**.
3. Identifique a chave como `GeraFeed`. Se definir permissões restritas, permita a geração por **Chat Completions**, usada pela integração de texto.
4. Copie a chave completa na criação e guarde-a em local seguro. Se perder o valor, será necessário criar outra chave.
5. Confira a [configuração de cobrança da API](https://platform.openai.com/settings/organization/billing/overview) e habilite o pagamento ou saldo necessário.

No GeraFeed, selecione **OpenAI**, cole a chave em **API Key** e deixe **Base URL** vazia. Em **Modelo de IA (Model)**, informe o identificador de um modelo de texto disponível para sua conta e compatível com Chat Completions. Depois, [salve e teste a conexão](#cadastrar-e-testar-no-gerafeed).

Referências: [criação de chaves](https://help.openai.com/en/articles/4936850-where-do-i-find-my-op), [projetos e permissões](https://help.openai.com/en/articles/9186755-managin) e [catálogo de modelos](https://platform.openai.com/docs/models).

## Google Gemini

1. Entre no [Google AI Studio](https://aistudio.google.com/) com sua conta Google e conclua o aceite dos termos, se solicitado.
2. Abra [API Keys](https://aistudio.google.com/api-keys) e escolha **Create API key**.
3. Selecione ou crie um projeto. Se o projeto existente não aparecer, use a opção de importar projetos do AI Studio.
4. Dê um nome à chave, como `GeraFeed`, e copie o valor gerado. Se faltar permissão para criar a chave, solicite acesso ao administrador do projeto.
5. Confira as cotas e, caso precise de uso pago, configure o faturamento do projeto. A disponibilidade de uso gratuito depende do modelo e das condições da conta; consulte a [cobrança da Gemini API](https://ai.google.dev/gemini-api/docs/billing).

No GeraFeed, selecione **Google Gemini**, cole a chave e informe o ID de um modelo de texto disponível no [catálogo Gemini](https://ai.google.dev/gemini-api/docs/models). Não é necessário preencher Base URL. [Salve e teste](#cadastrar-e-testar-no-gerafeed).

Referência: [criar e gerenciar chaves Gemini](https://ai.google.dev/gemini-api/docs/api-key).

## Anthropic Claude

1. Entre na [Claude Console](https://platform.claude.com/).
2. Abra [Settings → API keys](https://platform.claude.com/settings/keys) e escolha a opção de criar uma chave.
3. Identifique-a como `GeraFeed` e escolha acesso ao workspace que utilizará para a API. Para esta integração, use uma chave vinculada a um único workspace.
4. Copie a chave e guarde-a em local seguro.
5. Confira **Billing** na Console e habilite os créditos ou o faturamento necessários à sua conta.

No GeraFeed, selecione **Anthropic Claude**, cole a chave e informe o ID de um modelo de texto disponível no [catálogo Claude](https://platform.claude.com/docs/en/about-claude/models/overview). Não é necessário preencher Base URL. [Salve e teste](#cadastrar-e-testar-no-gerafeed).

Referências: [obter uma chave Claude](https://platform.claude.com/docs/en/get-api-key) e [autenticação e workspaces](https://platform.claude.com/docs/en/api/overview). A integração atual do GeraFeed não oferece seleção adicional de workspace da Anthropic.

## OpenRouter

1. Entre no [OpenRouter](https://openrouter.ai/).
2. Abra [Keys](https://openrouter.ai/settings/keys) e crie uma chave para uso com modelos, com o nome `GeraFeed`.
3. Defina um limite de uso, se desejar, e copie a chave. Use uma chave de inferência comum: as [Management API Keys](https://openrouter.ai/docs/guides/overview/auth/management-api-keys) são destinadas à administração e não geram textos.
4. Confira o saldo em [Credits](https://openrouter.ai/settings/credits). Modelos gratuitos, quando disponíveis, também têm limites de uso.
5. Abra o [catálogo de modelos](https://openrouter.ai/models) e copie o identificador completo do modelo de texto escolhido, incluindo o prefixo do provedor quando houver.

No GeraFeed, selecione **OpenAI-Compatible**, preencha **Base URL** com `https://openrouter.ai/api/v1`, informe o identificador em **Modelo de IA (Model)** e cole a chave OpenRouter em **API Key**. [Salve e teste](#cadastrar-e-testar-no-gerafeed).

Referências: [início rápido e conexão](https://openrouter.ai/docs/quickstart) e [créditos e limites](https://openrouter.ai/docs/faq).

## DeepSeek

1. Entre na [plataforma DeepSeek](https://platform.deepseek.com/).
2. Abra a área **API keys** e selecione a opção de criar uma chave.
3. Identifique-a como `GeraFeed` e copie o valor gerado.
4. Confira o saldo e as opções de recarga no painel da plataforma. Consulte [modelos e preços](https://api-docs.deepseek.com/quick_start/pricing) antes de usar.

No GeraFeed, selecione **OpenAI-Compatible** e use **Base URL** `https://api.deepseek.com`. Cole a chave DeepSeek e informe, em **Modelo de IA (Model)**, o ID atual de um modelo de texto listado na documentação. [Salve e teste](#cadastrar-e-testar-no-gerafeed).

Referência: [primeira chamada à API DeepSeek](https://api-docs.deepseek.com/). A URL acima é a base oficial de Chat Completions indicada nessa documentação; não use o endereço do aplicativo de chat.

## Kimi / Moonshot

1. Entre na [Kimi API Platform](https://platform.kimi.ai/).
2. Abra [API Keys](https://platform.kimi.ai/console/api-keys) e crie uma chave para o GeraFeed.
3. Copie o valor e guarde-o em local seguro.
4. Confira o acesso aos modelos e as condições de saldo e cobrança mostradas na sua conta.
5. Consulte a lista de modelos acessível pelo [guia oficial Kimi](https://platform.kimi.ai/docs/overview) e copie o ID do modelo de texto escolhido.

No GeraFeed, selecione **OpenAI-Compatible**, use **Base URL** `https://api.moonshot.ai/v1`, informe o modelo e cole a chave da Kimi API Platform. [Salve e teste](#cadastrar-e-testar-no-gerafeed).

A URL acima corresponde à plataforma internacional descrita no [guia oficial](https://platform.kimi.ai/docs/overview). Mantenha chave e endpoint da mesma plataforma. A seleção de um modelo no catálogo, por si só, não comprova compatibilidade com o GeraFeed.

## Cadastrar e testar no GeraFeed

1. Acesse seu espaço de trabalho no GeraFeed.
2. Abra **Configurações → Inteligência Artificial**, na rota `/settings/ai`.
3. Na aba **Conexão & Provedor**, selecione a opção indicada na tabela deste guia.
4. Preencha **Modelo de IA (Model)** com o identificador exato do modelo escolhido. Use o ID da API, não apenas o nome comercial exibido no chat.
5. Para **OpenAI-Compatible**, preencha a **Base URL** indicada para seu serviço.
6. Cole somente a chave completa em **API Key**, sem aspas, sem a palavra `Bearer` e sem espaços adicionais.
7. Clique em **Salvar Configurações de Conexão** e aguarde a confirmação.
8. Clique em **Testar Conexão**. O botão usa a configuração já salva; alterações ainda não salvas não participam do teste.

O teste faz uma solicitação ao provedor e pode consumir cota ou saldo. Salvar a configuração não valida a chave no provedor. Depois de um teste bem-sucedido, faça uma geração de texto e revise o resultado para conferir o uso editorial, que também pode consumir saldo.

**Sobre o modelo:** preencha-o explicitamente, mesmo que a tela permita deixá-lo em branco. Os exemplos exibidos na interface podem ficar antigos. Consulte o catálogo oficial e confirme a disponibilidade na sua conta. Uma chave válida não libera automaticamente todos os modelos, e o GeraFeed não garante compatibilidade com todo modelo listado por um provedor.

## Trocar de serviço ou substituir uma chave

Para trocar de serviço, atualize juntos **Provedor**, **Modelo**, **Base URL**, quando aplicável, e **API Key**. Ao voltar para a API oficial OpenAI, limpe uma Base URL que tenha sido preenchida para outro serviço.

Deixar **API Key** em branco mantém a chave já cadastrada. Isso serve para alterar outras configurações do mesmo serviço; ao trocar de serviço, cole a nova chave para não reutilizar a anterior por engano.

Para uma troca planejada de chave, crie a substituta, cadastre-a, salve, teste e então revogue a antiga no painel do provedor. Se uma chave tiver sido exposta, revogue-a prontamente e confira o histórico de uso. A chave salva fica criptografada no GeraFeed e não é exibida novamente em texto aberto.

## Resolver problemas comuns

As mensagens e os códigos variam entre provedores. Use estas verificações conforme o erro recebido:

| Situação | O que conferir |
| --- | --- |
| “API Key obrigatória” | Cole a chave completa no primeiro cadastro e salve. |
| Chave inválida, revogada ou erro 401 | Confira se a chave foi copiada inteira e pertence ao serviço da Base URL. Se necessário, gere outra. |
| Provedor bloqueado pelo plano do GeraFeed | Verifique se o plano inclui provedores avançados ou selecione uma opção permitida. Criar outra chave não altera o plano. |
| Acesso negado pelo provedor ou erro 403 | Confira permissões da chave, projeto, acesso ao modelo e disponibilidade da API para a conta. |
| Saldo insuficiente ou cota esgotada | Consulte Billing/Usage no provedor. Confira saldo, faturamento e limites; não é necessário recriar a chave só por falta de saldo. |
| Muitas solicitações ou erro 429 | Aguarde e confira os limites da conta. Alguns provedores também usam esse código para cota esgotada. |
| Modelo não encontrado ou erro 404 | Verifique o ID atual no catálogo e o acesso da conta. Confira também a Base URL. |
| Parâmetro não aceito ou erro 400 | O modelo pode exigir opções que a integração atual não oferece. Guarde a mensagem e consulte o suporte sobre compatibilidade. |
| Alterei os campos, mas o teste continua igual | Clique em **Salvar Configurações de Conexão** antes de testar novamente. |
| “Configurado” aparece, mas a geração falha | Esse estado indica cadastro, não validação completa. Confira modelo, chave, saldo e o resultado do teste. |
| Falha de conexão sem detalhes | Anote serviço, modelo e horário e contate o suporte. Não envie a chave. |

## Dúvidas frequentes

### Preciso criar uma chave em todos os serviços?

Não. Crie a chave do serviço que você vai usar. O GeraFeed mantém uma configuração de IA de texto ativa por espaço de trabalho.

### Posso usar um modelo Claude ou Gemini pelo OpenRouter?

Se ele estiver disponível no catálogo e for compatível com a integração de texto, configure **OpenAI-Compatible**, com chave e Base URL do OpenRouter. Use o identificador completo do catálogo. As credenciais são do serviço que recebe a solicitação. Veja o [guia de conexão OpenRouter](https://openrouter.ai/docs/quickstart).

### Preciso editar arquivos ou instalar algo?

Não. Para cadastrar sua chave no GeraFeed, use a tela de configuração indicada neste guia.

### Posso enviar minha chave ao suporte?

Não envie chaves em mensagens, capturas de tela ou documentos públicos. Compartilhe somente a mensagem de erro sem credenciais, o serviço, o modelo e o horário. Confira também as [orientações de proteção de chaves da OpenAI](https://help.openai.com/en/articles/5112595-best-practices-for-api).

### Posso limitar os gastos?

Confira limites, alertas e histórico de uso no painel do seu provedor. Não presuma que todo orçamento interrompa cobranças: por exemplo, os [orçamentos de projeto da OpenAI](https://help.openai.com/en/articles/9186755-managin) funcionam como alertas, sem impor um teto rígido.
