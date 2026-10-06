import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Globe,
  Key,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function HelpPage() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Central de Ajuda</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Tire suas dúvidas de como usar o GeraFeed e confira os guias passo a passo de integração com o WordPress e configuração de IA.
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="text-3xl font-semibold border-b pb-2">Guia Rápido de Uso do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Configurando sua Fonte RSS</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Vá para <strong>Configurações &gt; Fontes RSS</strong>. Adicione a URL do Feed que você deseja acompanhar. O sistema buscará as notícias automaticamente e elas aparecerão na sua aba de &quot;Artigos&quot;.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>2. Conectando ao WordPress</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Acesse o menu <strong>WordPress</strong> no GeraFeed. Cadastre seu site informando a URL base, o usuário e a <strong>Senha de Aplicação (Application Password)</strong> gerada no painel do WordPress.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>3. Publicação e Inteligência Artificial</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Na aba <strong>Publicar Posts</strong>, você verá as notícias coletadas. Selecione uma notícia, clique em gerar com IA (a IA reescreverá o artigo para torná-lo único e otimizado), e depois clique em &quot;Publicar no WordPress&quot;.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>4. Afiliados e Produtos (Planos Pro)</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Seu plano permite gerenciar um catálogo de produtos? Vá para <strong>Afiliados</strong>. Importe seus produtos e ofertas. Ao gerar uma notícia, o sistema poderá inserir automaticamente um botão de venda para o seu produto dentro do post!
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* GUIA ILUSTRADO DE CONFIGURAÇÃO DO WORDPRESS */}
      <section className="space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="purple" className="flex items-center gap-1.5">
              <Globe className="w-3 h-3" />
              Integração WordPress REST API
            </Badge>
            <Badge variant="outline">Oficial & Seguro</Badge>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight">
            Guia Ilustrado: Como Conectar seu Site WordPress
          </h2>
          <p className="text-muted-foreground text-sm mt-1 max-w-3xl">
            Siga o passo a passo abaixo para criar a <strong>Senha de Aplicação (Application Password)</strong> no WordPress e cadastrar seu site no GeraFeed para publicar artigos e mídias automaticamente com 1 clique.
          </p>
        </div>

        {/* Dica de Segurança e Recomendação */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-foreground">
              Recomendação Importante de Segurança
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Nunca use a sua senha pessoal de login do WordPress no GeraFeed!</strong> O WordPress possui um sistema nativo de <strong>Senhas da Aplicação</strong> criado especificamente para APIs. O recomendado é criar um usuário exclusivo no WordPress apenas para a automação do GeraFeed (por exemplo: <code>api_gerafeed</code>) com a função de Administrador ou Editor.
            </p>
          </div>
        </div>

        {/* PASSO 1 E 2 */}
        <Card className="border border-border shadow-xs overflow-hidden">
          <CardHeader className="bg-surface-muted/30 border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  1
                </span>
                No WordPress: Acesse Usuários e Crie a Senha de Aplicação
              </CardTitle>
              <Badge variant="outline" size="sm">Painel do WordPress</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
              <li>
                Acesse o painel do seu WordPress (<code>seu-site.com.br/wp-admin</code>).
              </li>
              <li>
                No menu lateral esquerdo, vá em <strong>Usuários → Adicionar usuário</strong> (ou clique em <strong>Perfil</strong> / <strong>Todos os usuários</strong> para editar um usuário já existente).
              </li>
              <li>
                <strong>Role a tela para baixo</strong> até a seção <strong>&quot;Senhas da aplicação&quot;</strong>.
              </li>
              <li>
                No campo <strong>&quot;Novo nome de senha da aplicação&quot;</strong>, digite: <code className="text-primary font-mono bg-surface-muted px-1.5 py-0.5 rounded">GeraFeed</code>.
              </li>
              <li>
                Clique no botão azul <strong>&quot;Adicionar senha de aplicativo&quot;</strong>.
              </li>
            </ol>

            <div className="mt-4 pt-2 border-t border-border/60">
              <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary" />
                Localização do campo no painel do WordPress:
              </p>
              <div className="rounded-xl overflow-hidden border border-border bg-black/5 dark:bg-white/5 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/help/wordpress/wp-pass-1.png"
                  alt="Tela do WordPress - Seção Senhas da Aplicação e botão Adicionar Senha de Aplicativo"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PASSO 3 */}
        <Card className="border border-border shadow-xs overflow-hidden">
          <CardHeader className="bg-surface-muted/30 border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  2
                </span>
                No WordPress: Copie a Senha Gerada
              </CardTitle>
              <Badge variant="outline" size="sm">Painel do WordPress</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Assim que você clicar em adicionar, o WordPress exibirá uma caixa verde com a mensagem:
              <br />
              <strong className="text-foreground">
                &quot;Sua nova senha para GeraFeed é: xxxx xxxx xxxx xxxx&quot;
              </strong>.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              <li>
                Clique no botão <strong>&quot;Copiar&quot;</strong> ao lado da senha gerada.
              </li>
              <li>
                <strong className="text-amber-600 dark:text-amber-400">Atenção:</strong> Guarde essa senha em um local seguro temporariamente, pois o WordPress <strong>não exibirá essa senha novamente</strong> depois que você fechar ou recarregar a página.
              </li>
            </ul>

            <div className="mt-4 pt-2 border-t border-border/60">
              <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-500" />
                Senha gerada com sucesso e botão Copiar:
              </p>
              <div className="rounded-xl overflow-hidden border border-border bg-black/5 dark:bg-white/5 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/help/wordpress/wp-pass-2.png"
                  alt="Tela do WordPress - Senha de aplicação gerada com botão Copiar"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PASSO 4 */}
        <Card className="border border-border shadow-xs overflow-hidden">
          <CardHeader className="bg-surface-muted/30 border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  3
                </span>
                No GeraFeed: Cadastre seu Site no Menu WordPress
              </CardTitle>
              <Badge variant="purple" size="sm">Painel do GeraFeed</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Agora volte ao painel do <strong>GeraFeed</strong> e cadastre seu site para finalizar a integração:
            </p>
            <ol className="list-decimal pl-5 space-y-2.5 text-sm text-muted-foreground">
              <li>
                No menu lateral do GeraFeed, clique em <strong>WordPress</strong> (ou vá em <strong>Configurações → WordPress</strong>).
              </li>
              <li>
                Clique no botão <strong>&quot;+ Adicionar Novo Site WordPress&quot;</strong>.
              </li>
              <li>
                Preencha os campos da janela modal:
                <ul className="list-disc pl-5 mt-1.5 space-y-1 text-xs text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Nome do Destino:</strong> Um nome para você reconhecer seu site (ex: <em>Portal de Notícias</em>, <em>Meu Blog</em>).
                  </li>
                  <li>
                    <strong className="text-foreground">URL Base do WordPress:</strong> A URL completa do site com HTTPS (ex: <code>https://seusite.com.br</code>).
                  </li>
                  <li>
                    <strong className="text-foreground">Usuário REST API:</strong> O <strong>mesmo nome de usuário</strong> cadastrado no WordPress no Passo 1 (ex: <code>admin</code> ou <code>api_gerafeed</code>).
                  </li>
                  <li>
                    <strong className="text-foreground">Application Password:</strong> A senha de aplicação que você gerou e copiou no Passo 2.
                  </li>
                  <li>
                    <strong className="text-foreground">Prompt Padrão do Site (Opcional):</strong> Se desejar, informe a diretriz editorial ou tom de voz deste portal.
                  </li>
                  <li>
                    <strong className="text-foreground">Definir como Destino Padrão:</strong> Marque para selecionar este site automaticamente nas revisões de notícias.
                  </li>
                </ul>
              </li>
              <li>
                Clique no botão <strong>&quot;Criar Destino&quot;</strong>. O GeraFeed testará a conexão na hora e sincronizará as categorias do seu WordPress!
              </li>
            </ol>

            <div className="mt-4 pt-2 border-t border-border/60">
              <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary" />
                Modal de cadastro no GeraFeed:
              </p>
              <div className="rounded-xl overflow-hidden border border-border bg-black/5 dark:bg-white/5 shadow-sm max-w-2xl mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/help/wordpress/wp-pass-3.png"
                  alt="Modal Adicionar Novo Site WordPress no GeraFeed"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CHECKLIST E REQUISITOS TÉCNICOS */}
        <div className="p-5 rounded-xl border border-border bg-surface-muted/20 space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Checklist para Garantir a Conexão Perfeita
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
              <p className="font-semibold text-foreground">1. SSL Ativo (HTTPS)</p>
              <p>O WordPress bloqueia o uso de senhas de aplicação em conexões HTTP inseguras. Seu site deve carregar com <code>https://</code>.</p>
            </div>
            <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
              <p className="font-semibold text-foreground">2. Links Permanentes</p>
              <p>Em <strong>Configurações → Links Permanentes</strong> no WordPress, selecione &quot;Nome do post&quot;. A API REST não funciona com URLs simples (<code>?p=123</code>).</p>
            </div>
            <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
              <p className="font-semibold text-foreground">3. Firewalls e Plugins</p>
              <p>Se utilizar Cloudflare, Wordfence ou iThemes Security, confirme que requisições autorizadas para a rota <code>/wp-json/wp/v2/</code> não estejam bloqueadas.</p>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-6 prose prose-slate dark:prose-invert max-w-none">
        <h2 className="text-3xl font-semibold border-b pb-2 not-prose">Guia: Como criar sua chave de IA</h2>
        <p>
          Revisado em <strong>6 de outubro de 2026</strong>. Os nomes dos menus e os modelos disponíveis podem mudar; os links oficiais acompanham cada orientação.
        </p>
        <p>
          Para usar sua conta de inteligência artificial no GeraFeed, você precisa de uma <strong>chave de API</strong>, também chamada de <strong>API Key</strong>. Ela autoriza o sistema a solicitar textos ao serviço escolhido. Crie a chave no painel do provedor e cadastre-a em <strong>Configurações → Inteligência Artificial → Conexão & Provedor</strong>.
        </p>

        <h3>Antes de começar</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Tenha acesso à conta e ao painel de API do provedor escolhido.</li>
          <li>Confira os créditos, as cotas e a forma de cobrança nesse painel. O consumo da sua chave é acompanhado no provedor, separadamente do plano do GeraFeed.</li>
          <li>Assinar um aplicativo de chat (ex: ChatGPT Plus) não significa ter créditos para API.</li>
        </ul>

        <div className="overflow-x-auto my-6 not-prose">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="p-3 border">Serviço</th>
                <th className="p-3 border">Opção em &quot;Selecione o Provedor&quot;</th>
                <th className="p-3 border">Base URL no GeraFeed</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 border font-medium">OpenAI</td>
                <td className="p-3 border">OpenAI</td>
                <td className="p-3 border text-muted-foreground italic">Deixe em branco</td>
              </tr>
              <tr>
                <td className="p-3 border font-medium">Google Gemini</td>
                <td className="p-3 border">Google Gemini</td>
                <td className="p-3 border text-muted-foreground italic">Deixe em branco</td>
              </tr>
              <tr>
                <td className="p-3 border font-medium">Anthropic Claude</td>
                <td className="p-3 border">Anthropic Claude</td>
                <td className="p-3 border text-muted-foreground italic">Deixe em branco</td>
              </tr>
              <tr>
                <td className="p-3 border font-medium">OpenRouter</td>
                <td className="p-3 border">OpenAI-Compatible</td>
                <td className="p-3 border font-mono text-sm">https://openrouter.ai/api/v1</td>
              </tr>
              <tr>
                <td className="p-3 border font-medium">DeepSeek</td>
                <td className="p-3 border">OpenAI-Compatible</td>
                <td className="p-3 border font-mono text-sm">https://api.deepseek.com</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-2xl font-semibold mt-8">Passo a Passo por Provedor</h3>

        <div className="space-y-8 not-prose">
          <Card>
            <CardHeader>
              <CardTitle>OpenAI (ChatGPT API)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Entre na <a href="https://platform.openai.com/" target="_blank" className="text-primary underline">plataforma OpenAI</a>.</li>
                <li>Abra <strong>API keys</strong> e escolha <strong>Create new secret key</strong>.</li>
                <li>Identifique a chave como <code>GeraFeed</code>.</li>
                <li>Copie a chave completa. Guarde-a em local seguro.</li>
                <li>No GeraFeed, selecione <strong>OpenAI</strong>, cole a chave e deixe a <strong>Base URL</strong> vazia. Indique o modelo (ex: <code>gpt-4o-mini</code>) e salve.</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Google Gemini</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Entre no <a href="https://aistudio.google.com/" target="_blank" className="text-primary underline">Google AI Studio</a>.</li>
                <li>Abra <strong>API Keys</strong> e escolha <strong>Create API key</strong>.</li>
                <li>Dê o nome <code>GeraFeed</code> e copie o valor gerado.</li>
                <li>No GeraFeed, selecione <strong>Google Gemini</strong>, cole a chave e informe o modelo (ex: <code>gemini-1.5-flash</code>). Não precisa preencher Base URL.</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Anthropic Claude</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Entre na <a href="https://platform.claude.com/" target="_blank" className="text-primary underline">Claude Console</a>.</li>
                <li>Abra <strong>Settings → API keys</strong> e crie a chave.</li>
                <li>Identifique-a como <code>GeraFeed</code> e copie a chave.</li>
                <li>No GeraFeed, selecione <strong>Anthropic Claude</strong>, cole a chave e informe o modelo (ex: <code>claude-3-5-sonnet-20240620</code>). Salve e teste.</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>OpenRouter / DeepSeek</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Gere a chave na sua plataforma de preferência.</li>
                <li>No GeraFeed, selecione <strong>OpenAI-Compatible</strong>.</li>
                <li>Para OpenRouter, use Base URL <code>https://openrouter.ai/api/v1</code>. Para DeepSeek, use <code>https://api.deepseek.com</code>.</li>
                <li>Cole a chave e indique o identificador completo do modelo.</li>
              </ol>
            </CardContent>
          </Card>
        </div>

        <h3 className="mt-8">Cadastrar e testar no GeraFeed</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Acesse <strong>Configurações → Inteligência Artificial</strong>.</li>
          <li>Preencha a opção, cole sua API Key e digite o ID exato do Modelo.</li>
          <li>Clique em <strong>Salvar Configurações de Conexão</strong> e depois em <strong>Testar Conexão</strong>.</li>
        </ul>
      </section>
    </div>
  );
}
