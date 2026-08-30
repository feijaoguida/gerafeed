# GeraFeed. Playbook Google + Redes Orgânicas

## Ordem de execução

1. Google Search Console.
2. GA4.
3. Google Tag Manager.
4. Deploy da Phase 28 técnica.
5. Sitemap no Search Console.
6. Validação GA4/GTM.
7. Landing pages e blog.
8. Distribuição social semanal.

# Frente 1. Google

## 1. Conta Google de gestão

- Usar uma conta Google controlada pela empresa, não uma conta pessoal descartável.
- Ativar 2FA.
- Adicionar um segundo proprietário/administrador de confiança onde o produto permitir.
- Registrar quem possui acesso a Search Console, GA4 e GTM.

## 2. Google Search Console

### Criar propriedade

1. Acessar https://search.google.com/search-console
2. Escolher `Adicionar propriedade`.
3. Escolher `Domínio`.
4. Informar somente `gerafeed.com.br`.
5. Copiar o registro TXT fornecido pelo Google.
6. Abrir o provedor DNS do domínio.
7. Criar o TXT exatamente como fornecido.
8. Manter host/root conforme regra do provedor, normalmente `@` ou vazio.
9. Salvar.
10. Voltar ao Search Console e clicar em `Verificar`.
11. Não remover o TXT depois da verificação.

### Depois do deploy técnico

1. Abrir `Sitemaps`.
2. Informar `sitemap.xml`.
3. Enviar.
4. Confirmar que o status ficou processado/aceito.
5. Abrir `Inspeção de URL`.
6. Inspecionar `https://www.gerafeed.com.br/`.
7. Testar a URL publicada.
8. Solicitar indexação quando a opção estiver disponível.
9. Repetir para as principais landing pages depois que forem publicadas.

### Checklist Search Console

- [ ] Domain property criada
- [ ] DNS TXT validado
- [ ] sitemap enviado
- [ ] home inspecionada
- [ ] landing pages principais inspecionadas
- [ ] Pages/Indexing revisado
- [ ] Core Web Vitals revisado
- [ ] Performance revisado semanalmente
- [ ] segundo owner/admin configurado

## 3. Google Analytics 4

1. Acessar https://analytics.google.com
2. Criar conta `GeraFeed` se necessário.
3. Criar propriedade `GeraFeed`.
4. Definir timezone do Brasil coerente com a operação.
5. Definir moeda BRL.
6. Criar Data Stream `Web`.
7. URL: `https://www.gerafeed.com.br`.
8. Nome: `GeraFeed Web`.
9. Copiar o Measurement ID `G-XXXXXXXXXX`.
10. Não instalar o snippet diretamente no site se GA4 será entregue pelo GTM.
11. Revisar Enhanced Measurement.
12. Depois do deploy, validar Realtime e DebugView quando aplicável.

### Eventos que devem virar conversões/eventos-chave depois de confirmados

- sign_up_completed
- wordpress_connected
- rss_source_added
- first_article_generated
- first_article_published
- begin_checkout

Não marcar clique em CTA como venda.

## 4. Google Tag Manager

1. Acessar https://tagmanager.google.com
2. Criar conta `GeraFeed`.
3. País: Brasil.
4. Criar container `www.gerafeed.com.br`.
5. Target: `Web`.
6. Copiar o ID `GTM-XXXXXXX`.
7. Preencher o handoff do pacote Phase 28.
8. Depois da Task 233, usar Preview/Tag Assistant.
9. Dentro do GTM criar a Google Tag/GA4 usando o Measurement ID.
10. Trigger base: All Pages, respeitando consentimento.
11. Criar triggers para os eventos dataLayer da Task 234 quando necessário.
12. Publicar uma versão nomeada, por exemplo `GA4 base + consent + organic events`.

## 5. Consentimento

- Banner deve permitir aceitar ou recusar analytics.
- Necessary sempre fica ativo.
- Analytics depende da escolha.
- Marketing permanece reservado/desligado se não houver uso.
- Usuário deve conseguir reabrir preferências.
- Política de Privacidade deve descrever o tratamento real.
- Não declarar conformidade legal absoluta apenas porque existe um banner.

## 6. Vincular Search Console ao GA4

Depois que ambos estiverem funcionando:

1. GA4 > Admin.
2. Procurar integração/link com Search Console.
3. Selecionar a propriedade `gerafeed.com.br`.
4. Selecionar o Web Stream do GeraFeed.
5. Concluir.
6. Validar os relatórios de busca orgânica depois que houver dados.

## 7. Google Business Profile

Não criar para um SaaS exclusivamente online só para tentar obter SEO local. Criar apenas se a operação realmente for elegível segundo as regras do Google para empresas que mantêm contato presencial com clientes.

# Frente 3. Redes Sociais

## Prioridade de canais

1. LinkedIn. Founder-led e B2B.
2. YouTube Shorts. Demonstração de produto e busca de longo prazo.
3. Instagram. Reels e carrosséis.
4. Reddit/comunidades WordPress. Autoridade por respostas.
5. TikTok. Reaproveitamento de vídeos que já funcionaram.

## Configuração inicial de perfis

Em cada canal:

- [ ] handle consistente com GeraFeed
- [ ] logo oficial
- [ ] bio explicando WordPress + RSS + curadoria + IA
- [ ] URL oficial
- [ ] CTA único
- [ ] visual Blue/Purple com Accent Teal pontual
- [ ] banner/capa quando existir
- [ ] link com UTM

### Bio curta sugerida

`Curadoria editorial assistida por IA para WordPress. Monitore RSS, revise conteúdos e publique em múltiplos sites com mais controle.`

## Pilares de conteúdo

### Pilar A. Automação WordPress

- processos manuais que podem ser eliminados
- múltiplos sites
- publicação
- produtividade editorial

### Pilar B. RSS e curadoria

- como feeds funcionam
- diferença entre agregador, importador e curadoria
- organização de fontes

### Pilar C. IA + SEO sem lixo em escala

- como revisar IA
- people-first
- o que automatizar e o que não automatizar
- erros de conteúdo genérico

### Pilar D. Produto na prática

- demos
- bastidores
- antes/depois
- fluxo real
- novas features

### Pilar E. Agências e portais

- gestão de vários clientes
- padronização
- ganho operacional
- processos editoriais

## Regra de distribuição

Um artigo do blog deve virar:

- 1 post LinkedIn
- 1 carrossel Instagram/LinkedIn
- 1 Short/Reel
- 3 micro-posts
- 2 respostas de comunidade usando o conhecimento do artigo

Não publicar o mesmo texto cru em cinco canais.

## Convenção UTM

Exemplo:

`?utm_source=linkedin&utm_medium=organic_social&utm_campaign=wordpress_automation&utm_content=post_demo_01`

### Sources

- linkedin
- instagram
- youtube
- tiktok
- reddit

### Medium

- organic_social
- community

### Campaign

Usar nomes por tema, não por data aleatória:

- wordpress_automation
- rss_wordpress
- ai_seo
- agencies
- news_portals
- gerafeed_launch

## Checklist semanal

### Segunda

- [ ] revisar Search Console
- [ ] escolher uma pergunta/keyword
- [ ] publicar LinkedIn educativo
- [ ] responder 3 comentários relevantes de outras pessoas

### Terça

- [ ] gravar 1 demo vertical de 30 a 60 segundos
- [ ] publicar Short/Reel
- [ ] responder comentários

### Quarta

- [ ] escrever/atualizar artigo SEO
- [ ] participar de 3 discussões em comunidades
- [ ] sem link se o link não for realmente necessário

### Quinta

- [ ] criar carrossel do tema do artigo
- [ ] publicar no LinkedIn ou Instagram
- [ ] testar novo hook

### Sexta

- [ ] publicar case, número real ou bastidor do produto
- [ ] contatar 2 parceiros/agências/creators
- [ ] registrar respostas e oportunidades

### Sábado

- [ ] reaproveitar melhor conteúdo da semana em vídeo curto
- [ ] coletar dúvidas dos comentários para novas pautas

### Domingo

- [ ] medir cliques orgânicos
- [ ] medir cadastros orgânicos
- [ ] medir first_article_published quando disponível
- [ ] identificar top 3 posts
- [ ] decidir o que repetir na semana seguinte

# Prompts operacionais

## Prompt 1. LinkedIn

```text
Atue como estrategista de conteúdo B2B para um SaaS chamado GeraFeed.
Público: donos de blogs WordPress, portais, agências e profissionais que administram múltiplos sites.
Posicionamento: curadoria editorial assistida por IA, RSS, revisão e publicação WordPress.
Evite hype de IA, promessas de ranking e linguagem de anti-plágio.

Transforme o material abaixo em um post de LinkedIn.

Objetivo: gerar conversa e levar o leitor a querer conhecer o fluxo do GeraFeed.
Estrutura:
1. hook de até 2 linhas;
2. problema real;
3. insight prático;
4. exemplo ou processo;
5. conclusão;
6. CTA leve.

Não use mais de 3 hashtags.
Não invente números.
Material:
[COLE AQUI]
```

## Prompt 2. Carrossel

```text
Crie um roteiro de carrossel de 8 slides para LinkedIn/Instagram.
Marca: GeraFeed.
Público: donos de sites WordPress, blogs, agências e portais.
Tema: [TEMA].

Regras:
- slide 1: afirmação forte e específica;
- slides 2 a 6: uma ideia por slide;
- slide 7: checklist resumido;
- slide 8: CTA para ler o guia no GeraFeed;
- linguagem direta;
- nada de prometer resultado garantido;
- nada de "anti-plágio";
- usar a ideia de curadoria editorial assistida por IA.

Entregue título + texto de cada slide + legenda final.
```

## Prompt 3. Short/Reel

```text
Crie um roteiro de vídeo vertical de 45 segundos para o GeraFeed.
Tema: [TEMA].
Público: quem administra WordPress.

Estrutura:
0-3s: hook visual/verbal.
3-12s: problema.
12-32s: demonstração ou explicação prática.
32-40s: resultado/benefício sem inventar números.
40-45s: CTA.

O vídeo deve poder ser gravado mostrando a tela do produto.
Evite abertura genérica como "você sabia que a IA...".
Entregue fala, texto na tela e lista de cenas.
```

## Prompt 4. Reddit/comunidade

```text
Ajude a responder uma pergunta em uma comunidade de WordPress/SEO/automação.

Pergunta original:
[COLE]

Escreva como alguém técnico tentando resolver o problema, não como vendedor.
Primeiro responda a dúvida completamente.
Depois mostre opções e trade-offs.
Só mencione o GeraFeed se ele realmente resolver parte do problema.
Se mencionar, faça em uma frase transparente dizendo que é uma ferramenta que estou desenvolvendo/usando.
Não inclua link se não for necessário.
Não faça propaganda disfarçada.
```

## Prompt 5. Case real

```text
Transforme os dados abaixo em um mini case do GeraFeed.
Não invente nenhuma métrica.
Separe claramente fato, contexto e conclusão.

Dados reais:
[COLE]

Estrutura:
- cenário anterior;
- gargalo;
- fluxo implantado;
- resultado medido;
- o que ainda não sabemos;
- aprendizado;
- CTA para ver como funciona.
```

## Prompt 6. Planejamento semanal

```text
Atue como editor-chefe do GeraFeed.
Público: donos de blogs WordPress, agências e portais.
Objetivos: tráfego orgânico qualificado, cadastro e ativação até primeira publicação.

Dados da última semana:
Search Console: [DADOS]
GA4: [DADOS]
Posts sociais: [DADOS]
Dúvidas/comentários recebidos: [DADOS]

Crie o plano da próxima semana com:
- 1 tema SEO principal;
- 1 artigo;
- 2 posts LinkedIn;
- 2 vídeos curtos;
- 1 carrossel;
- 3 perguntas de comunidade para responder;
- hipótese que estamos testando;
- métrica para decidir se repetimos o tema.

Priorize intenção de compra/problema real. Não escolha temas apenas porque estão em alta.
```

## Prompt 7. Análise de performance

```text
Analise o desempenho orgânico do GeraFeed sem se deixar enganar por métricas de vaidade.

Dados:
[COLE SEARCH CONSOLE + GA4 + REDES]

Prioridade das métricas:
1. cliques orgânicos qualificados;
2. cadastro;
3. WordPress conectado;
4. RSS adicionado;
5. primeiro artigo gerado;
6. primeira publicação;

Identifique:
- o que cresceu;
- o que caiu;
- páginas com impressões mas CTR fraco;
- páginas na posição 8-30 que merecem atualização;
- canal social que trouxe tráfego de melhor qualidade;
- 3 ações da próxima semana.

Não conclua causalidade sem dados suficientes.
```
