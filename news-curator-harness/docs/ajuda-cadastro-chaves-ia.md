# Textos de ajuda para o cadastro de chaves de IA

Revisado em **6 de outubro de 2026**. Material para futura inclusão no site e em
**Configurações → Inteligência Artificial → Conexão & Provedor**.
Este arquivo não altera a interface. Os destinos internos abaixo apontam para
o [guia completo](guia-chaves-ia.md); ao publicar, substitua-os pela URL real do guia.

## Chamada no site

**Título:** Como criar sua chave de inteligência artificial

**Descrição:** Aprenda a obter uma chave na OpenAI, Google Gemini, Anthropic,
OpenRouter, DeepSeek ou Kimi e conectá-la ao GeraFeed.

**Link:** [Ver o passo a passo](guia-chaves-ia.md).

## Ajuda na tela de configuração

**Título:** Precisa de ajuda para criar sua chave?

**Texto:** Crie a chave no painel do serviço escolhido e cole-a em API Key.
Depois, salve as configurações e teste a conexão. Você só precisa cadastrar
o serviço que vai usar.

**Link:** [Como criar e cadastrar minha chave](guia-chaves-ia.md).

## Ajuda por campo

| Local | Texto sugerido |
| --- | --- |
| Provedor | Escolha o serviço que emitiu sua chave. Para OpenRouter, DeepSeek ou Kimi, selecione OpenAI-Compatible. |
| Modelo de IA (Model) | Informe o identificador exato de um modelo de texto disponível na sua conta. Consulte o catálogo oficial; os exemplos da tela podem estar desatualizados. |
| Base URL — OpenAI | Deixe em branco para usar a API oficial OpenAI. Se estiver trocando de serviço, remova a URL anterior. |
| Base URL — OpenAI-Compatible | Informe o endereço da API do serviço que emitiu sua chave, conforme o guia. |
| API Key — primeiro cadastro | Cole somente a chave completa, sem aspas e sem a palavra Bearer. Ela será armazenada criptografada. |
| API Key — chave existente | Deixe em branco para manter a chave atual. Ao trocar de serviço, cole a nova chave. |
| Salvar configurações | Salvar cadastra as credenciais. Use Testar Conexão para verificar o acesso ao provedor. |
| Testar Conexão | Salve antes de testar. O teste usa a configuração salva e pode consumir cota ou saldo no provedor. |

## Ajuda por serviço

| Serviço selecionado | Texto sugerido | Destino do link “Como criar minha chave” |
| --- | --- | --- |
| OpenAI | Crie uma chave no painel de API da OpenAI. A cobrança da API é separada da assinatura ChatGPT. | [Guia OpenAI](guia-chaves-ia.md#openai) |
| Google Gemini | Crie sua chave no Google AI Studio e confira o projeto e as cotas. O uso deste provedor depende do seu plano GeraFeed. | [Guia Gemini](guia-chaves-ia.md#google-gemini) |
| Anthropic Claude | Crie uma chave na Claude Console. A assinatura do chat Claude não inclui o consumo da API. Este provedor depende do seu plano GeraFeed. | [Guia Claude](guia-chaves-ia.md#anthropic-claude) |
| OpenRouter | Use uma chave OpenRouter, a Base URL indicada no guia e o identificador completo do modelo escolhido. | [Guia OpenRouter](guia-chaves-ia.md#openrouter) |
| DeepSeek | Crie uma chave na plataforma DeepSeek e configure-a como OpenAI-Compatible. Confira o saldo e o ID atual do modelo. | [Guia DeepSeek](guia-chaves-ia.md#deepseek) |
| Kimi / Moonshot | Crie uma chave na Kimi API Platform e configure-a como OpenAI-Compatible, usando chave e endpoint da mesma plataforma. | [Guia Kimi](guia-chaves-ia.md#kimi--moonshot) |

Na interface atual, OpenRouter, DeepSeek e Kimi compartilham a opção
**OpenAI-Compatible**. Para essa opção, os três links podem ser apresentados
juntos, sem presumir qual serviço o usuário escolheu.

## Aviso de cobrança

O uso da sua chave está sujeito à cobrança e às cotas do provedor de IA,
separadamente do plano GeraFeed. Confira saldo e limites antes de gerar textos.

## Orientação de segurança

Sua chave autoriza o uso da sua conta de IA. Não a envie em mensagens ou
capturas de tela. Se houver exposição, revogue-a no provedor e cadastre outra.

## Ajuda em caso de falha

Confira o serviço, a chave, o modelo e o saldo. Se alterou algum campo, salve
antes de testar novamente. Persistindo o erro, informe ao suporte a mensagem,
o modelo e o horário, sem enviar sua chave.

**Link:** [Resolver problemas de conexão](guia-chaves-ia.md#resolver-problemas-comuns).

## Referência editorial

Os passos e as fontes oficiais estão no [guia completo](guia-chaves-ia.md).
Antes da publicação, revise os links externos, os menus dos provedores e a
correspondência com a versão da tela disponível aos usuários. Não apresentar
estes textos como validação de uma chave ou confirmação de integração já feita.
