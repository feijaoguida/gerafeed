"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Send,
  Sparkles,
  ExternalLink,
  Plus,
  ArrowRight,
  TrendingUp,
  Globe,
  Newspaper,
  Search,
  Layers,
  Palette,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand/logo";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Display,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Text,
  Caption,
  Overline,
} from "@/components/design-system/typography";
import { PageHeader } from "@/components/design-system/page-header";
import { SectionHeader } from "@/components/design-system/section-header";
import { StatCard } from "@/components/design-system/stat-card";
import { StatusIndicator } from "@/components/design-system/status-indicator";
import { FormField } from "@/components/design-system/form-field";
import { BrandDecoration } from "@/components/design-system/brand-decoration";

function useIsClient() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function DesignSystemShowcasePage() {
  const { theme, setTheme } = useTheme();
  const isClient = useIsClient();
  const [switchState, setSwitchState] = React.useState(true);
  const [loadingBtn, setLoadingBtn] = React.useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground p-6 sm:p-10 space-y-12">
      {/* Top Header & Theme Switcher com PageHeader */}
      <PageHeader
        title="Design System GeraFeed"
        description="Vitrine oficial de tokens semânticos, tipografia Sora/Inter e componentes primitivos."
        icon={<Palette className="h-5 w-5" />}
        badge={<Badge variant="purple">v1.0 Oficial</Badge>}
        actions={
          isClient ? (
            <div className="flex items-center gap-2 bg-surface p-1.5 rounded-xl border border-border shadow-xs">
              <Button
                variant={theme === "light" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTheme("light")}
                leadingIcon={<Sun className="h-4 w-4" />}
              >
                Claro
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTheme("dark")}
                leadingIcon={<Moon className="h-4 w-4" />}
              >
                Escuro
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Seção 1: Identidade & Cores */}
      <section className="space-y-6">
        <SectionHeader
          title="1. Paleta de Cores & Tokens de Marca"
          description="Valores semânticos com suporte unificado a Light e Dark Mode."
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          <div className="p-4 rounded-xl bg-[#2563EB] text-white shadow-sm">
            <div className="text-xs font-semibold uppercase opacity-80">Primary Blue</div>
            <div className="font-heading font-bold text-lg">#2563EB</div>
            <div className="text-[11px] opacity-75 font-mono">--primary</div>
          </div>

          <div className="p-4 rounded-xl bg-[#7C3AED] text-white shadow-sm">
            <div className="text-xs font-semibold uppercase opacity-80">Primary Purple</div>
            <div className="font-heading font-bold text-lg">#7C3AED</div>
            <div className="text-[11px] opacity-75 font-mono">--primary-purple</div>
          </div>

          <div className="p-4 rounded-xl bg-[#00C2A8] text-slate-900 shadow-sm">
            <div className="text-xs font-semibold uppercase opacity-80">Accent Teal</div>
            <div className="font-heading font-bold text-lg">#00C2A8</div>
            <div className="text-[11px] opacity-75 font-mono">--accent</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0F172A] text-white shadow-sm">
            <div className="text-xs font-semibold uppercase opacity-80">Dark / Ink</div>
            <div className="font-heading font-bold text-lg">#0F172A</div>
            <div className="text-[11px] opacity-75 font-mono">--foreground (Light)</div>
          </div>

          <div className="p-4 rounded-xl bg-[#64748B] text-white shadow-sm">
            <div className="text-xs font-semibold uppercase opacity-80">Muted</div>
            <div className="font-heading font-bold text-lg">#64748B</div>
            <div className="text-[11px] opacity-75 font-mono">--muted-foreground</div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white shadow-sm">
            <div className="text-xs font-semibold uppercase opacity-80">Brand Gradient</div>
            <div className="font-heading font-bold text-base">Blue → Purple</div>
            <div className="text-[11px] opacity-75 font-mono">--gradient-brand</div>
          </div>
        </div>

        {/* Superfícies */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-surface border border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase font-mono">
              Surface (Card & Panel)
            </span>
            <div className="text-sm font-semibold text-foreground mt-1">Superfície Padrão</div>
          </div>
          <div className="p-4 rounded-xl bg-surface-elevated border border-border shadow-md">
            <span className="text-xs font-medium text-muted-foreground uppercase font-mono">
              Surface Elevated
            </span>
            <div className="text-sm font-semibold text-foreground mt-1">Superfície Elevada / Destaque</div>
          </div>
          <div className="p-4 rounded-xl bg-surface-muted border border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase font-mono">
              Surface Muted
            </span>
            <div className="text-sm font-semibold text-foreground mt-1">Fundo de Inputs & Cabeçalhos</div>
          </div>
        </div>

        {/* Ativos Oficiais da Logo GeraFeed */}
        <div className="pt-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
            Ativos Oficiais da Marca (GeraFeed)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-surface border border-border flex flex-col justify-between items-center text-center space-y-4">
              <span className="text-[11px] font-mono text-muted-foreground uppercase">Logo Dinâmica (Tema Atual)</span>
              <Logo size="md" />
              <Badge variant="outline" size="sm">Auto Light/Dark</Badge>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between items-center text-center space-y-4 text-slate-900">
              <span className="text-[11px] font-mono text-slate-500 uppercase">Fundo Claro (Light)</span>
              <Logo size="md" forceLight />
              <Badge variant="secondary" size="sm">forceLight</Badge>
            </div>

            <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 flex flex-col justify-between items-center text-center space-y-4 text-white">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Fundo Escuro (Dark)</span>
              <Logo size="md" forceDark />
              <Badge variant="purple" size="sm">forceDark</Badge>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border flex flex-col justify-between items-center text-center space-y-4">
              <span className="text-[11px] font-mono text-muted-foreground uppercase">Ícone / Símbolo G</span>
              <Logo variant="icon" size="lg" />
              <Badge variant="success" size="sm">Favicon / App Icon</Badge>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Seção 2: Tipografia */}
      <section className="space-y-6">
        <SectionHeader
          title="2. Tipografia Sora (Títulos) & Inter (Interface)"
          description="Hierarquia tipográfica padronizada carregada via Google Fonts."
        />

        <div className="space-y-4 bg-surface p-6 rounded-xl border border-border">
          <div>
            <Overline>Display — Sora Bold</Overline>
            <Display>Conteúdo que flui. Inteligência que publica.</Display>
          </div>
          <Separator />
          <div>
            <Overline>Heading 1 — Sora Bold</Overline>
            <Heading1>Curadoria Inteligente de Notícias RSS</Heading1>
          </div>
          <div>
            <Overline>Heading 2 — Sora SemiBold</Overline>
            <Heading2>Reescrita Assistida por IA com Anti-Plágio</Heading2>
          </div>
          <div>
            <Overline>Heading 3 — Sora SemiBold</Overline>
            <Heading3>Publicação Automática e Gestão de Portais WordPress</Heading3>
          </div>
          <div>
            <Overline>Heading 4 — Sora SemiBold</Overline>
            <Heading4>Métricas de Desempenho e Catálogo de Afiliados</Heading4>
          </div>
          <Separator />
          <div>
            <Overline>Text Body — Inter Regular</Overline>
            <Text variant="body">
              O GeraFeed unifica o monitoramento contínuo de feeds RSS com agentes de inteligência
              artificial para produzir matérias jornalísticas ricas, formatadas e prontas para publicação.
            </Text>
          </div>
          <div>
            <Overline>Text Caption — Inter Regular</Overline>
            <Caption>Atualizado pela última vez em 28 de agosto de 2026 às 18:44.</Caption>
          </div>
        </div>
      </section>

      <Separator />

      {/* Seção 3: Botões */}
      <section className="space-y-6">
        <SectionHeader
          title="3. Botões (Button & IconButton)"
          description="Variantes CVA, estados de carregamento e suporte a ícones Lucide."
        />

        <div className="space-y-4 bg-surface p-6 rounded-xl border border-border">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="gradient" leadingIcon={<Send className="h-4 w-4" />}>
              Publicar agora
            </Button>
            <Button variant="default" leadingIcon={<Sparkles className="h-4 w-4" />}>
              Reescrever com IA
            </Button>
            <Button variant="secondary" leadingIcon={<ExternalLink className="h-4 w-4" />}>
              Ver prévia
            </Button>
            <Button variant="outline">Cancelar</Button>
            <Button variant="ghost">Salvar Rascunho</Button>
            <Button variant="destructive">Excluir Artigo</Button>
            <Button variant="link">Saiba mais →</Button>
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm" variant="gradient">Tamanho SM</Button>
            <Button size="md" variant="gradient">Tamanho MD (Padrão)</Button>
            <Button size="lg" variant="gradient">Tamanho LG (CTA)</Button>
            <Button
              variant="default"
              isLoading={loadingBtn}
              onClick={() => {
                setLoadingBtn(true);
                setTimeout(() => setLoadingBtn(false), 2000);
              }}
            >
              {loadingBtn ? "Processando..." : "Clique para testar loading"}
            </Button>
            <IconButton
              aria-label="Adicionar item"
              variant="outline"
              size="md"
            >
              <Plus className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      </section>

      <Separator />

      {/* Seção 4: Badges e Indicadores de Status */}
      <section className="space-y-6">
        <SectionHeader
          title="4. Badges & Indicadores de Status"
          description="Status do sistema mapeados semanticamente para manter consistência em todas as telas."
        />

        <div className="space-y-6 bg-surface p-6 rounded-xl border border-border">
          <div>
            <Overline className="block mb-3">Badges de Status do Sistema</Overline>
            <div className="flex flex-wrap gap-2.5">
              <Badge status="PUBLISHED" dot>Publicado</Badge>
              <Badge status="CONNECTED" dot>Site Conectado</Badge>
              <Badge status="ACTIVE" dot>Ativo</Badge>
              <Badge status="PROCESSING" dot>Processando</Badge>
              <Badge status="REWRITTEN" dot>Reescrito</Badge>
              <Badge status="PENDING" dot>Pendente</Badge>
              <Badge status="PAST_DUE" dot>Atrasado</Badge>
              <Badge status="REJECTED" dot>Rejeitado</Badge>
              <Badge status="FAILED" dot>Falha na API</Badge>
              <Badge status="DISCONNECTED" dot>Desconectado</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <Overline className="block mb-3">Status Indicators (com pulso animado)</Overline>
            <div className="flex flex-wrap gap-6 items-center">
              <StatusIndicator status="CONNECTED" />
              <StatusIndicator status="PROCESSING" pulse />
              <StatusIndicator status="ACTIVE" />
              <StatusIndicator status="PENDING" />
              <StatusIndicator status="FAILED" />
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Seção 5: Cards e Métricas */}
      <section className="space-y-6">
        <SectionHeader
          title="5. Cards & Métricas (StatCard & Card Primitives)"
          description="Containers responsivos para dashboards e painéis de dados."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Artigos Pendentes"
            value="12"
            description="aguardando revisão"
            icon={<Newspaper className="h-5 w-5" />}
            trend="+18%"
            trendDirection="up"
            trendPeriod="vs semana passada"
          />

          <StatCard
            title="Publicados no Portal"
            value="532"
            description="artigos publicados"
            icon={<Globe className="h-5 w-5" />}
            trend="+24%"
            trendDirection="up"
            trendPeriod="vs 7 dias"
          />

          <StatCard
            title="Catálogo de Afiliados"
            value="148"
            description="produtos sincronizados"
            icon={<Layers className="h-5 w-5" />}
            trend="Estável"
            trendDirection="neutral"
          />

          <StatCard
            title="Cliques de Afiliados"
            value="1.248"
            description="últimos 30 dias"
            icon={<TrendingUp className="h-5 w-5" />}
            trend="-3%"
            trendDirection="down"
            trendPeriod="este mês"
          />
        </div>

        {/* Card Primitive Example */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="default">
            <CardHeader>
              <CardTitle>Publicação no WordPress</CardTitle>
              <CardDescription>
                Selecione o portal de destino e a categoria para publicação direta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-muted border border-border">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    W
                  </div>
                  <div>
                    <div className="text-sm font-semibold">eudominio.com.br</div>
                    <div className="text-xs text-muted-foreground">Portal de Tecnologia</div>
                  </div>
                </div>
                <StatusIndicator status="CONNECTED" />
              </div>

              <div className="space-y-2">
                <Progress
                  value={18}
                  max={25}
                  label="Cota de artigos hoje"
                  showValue
                  variant="gradient"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm">Configurações</Button>
              <Button variant="gradient" size="sm" leadingIcon={<Send className="h-3.5 w-3.5" />}>
                Publicar agora
              </Button>
            </CardFooter>
          </Card>

          <Card variant="highlighted" className="relative overflow-hidden">
            <BrandDecoration variant="waves" />
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>Score de Originalidade com IA</CardTitle>
              </div>
              <CardDescription>
                Validação automática contra plágio e estilo editorial.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full border-4 border-emerald-500 flex items-center justify-center shrink-0">
                  <span className="font-heading text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    98%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold">Conteúdo Verificado & Único</div>
                  <Text variant="caption">
                    Texto totalmente reescrito com estrutura própria, subtítulos enriquecidos e sem repetição.
                  </Text>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="link" size="sm" trailingIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                Ver relatório completo de originalidade
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Seção 6: Formulários */}
      <section className="space-y-6">
        <SectionHeader
          title="6. Controles de Formulário (Form Controls & FormField)"
          description="Inputs, Select, Switch, Textarea com associação acessível e feedback de erro."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface p-6 rounded-xl border border-border">
          <FormField
            label="Título do Artigo"
            required
            description="Título principal que será publicado no WordPress."
          >
            <Input placeholder="Ex: IA transforma criação de conteúdo em escala" />
          </FormField>

          <FormField
            label="Categoria do Portal"
            required
            description="Categoria mapeada na instalação WordPress de destino."
          >
            <Select>
              <option value="tech">Tecnologia & Inovação</option>
              <option value="business">Negócios & Mercado</option>
              <option value="ai">Inteligência Artificial</option>
            </Select>
          </FormField>

          <FormField
            label="Campo com Erro de Validação"
            required
            error="O feed RSS informado não respondeu ao teste de ping."
          >
            <Input defaultValue="https://rss.invalido.com/feed" />
          </FormField>

          <div className="space-y-3">
            <Text variant="label" as="div">
              Opções de Publicação Automática
            </Text>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-muted/50">
              <div className="space-y-0.5">
                <span className="text-sm font-medium text-foreground">
                  Habilitar Reescrita Automática
                </span>
                <p className="text-xs text-muted-foreground">
                  Processar novos artigos do feed com OpenAI assim que forem coletados.
                </p>
              </div>
              <Switch checked={switchState} onCheckedChange={setSwitchState} />
            </div>
          </div>

          <div className="md:col-span-2">
            <FormField
              label="Prompt Adicional para este Artigo"
              description="Instruções editoriais específicas para orientar a IA."
            >
              <Textarea placeholder="Ex: Foque no impacto prático para criadores de conteúdo..." />
            </FormField>
          </div>
        </div>
      </section>

      <Separator />

      {/* Seção 7: Feedback, Alertas & Empty State */}
      <section className="space-y-6">
        <SectionHeader
          title="7. Feedback, Alertas & Estados Vazios"
          description="Componentes de resposta ao usuário e tratamento de listas sem dados."
        />

        <div className="space-y-4">
          <Alert variant="info" title="Sincronização em Andamento">
            Coletando as matérias mais recentes de 8 feeds RSS cadastrados.
          </Alert>

          <Alert variant="success" title="Artigo Publicado com Sucesso">
            A matéria foi enviada para o site Tecnologia.com.br sob o ID #1042.
          </Alert>

          <Alert variant="warning" title="Consumo Próximo ao Limite">
            Seu plano atual atingiu 85% do limite mensal de artigos processados.
          </Alert>

          <Alert variant="destructive" title="Falha de Autenticação no WordPress">
            A senha de aplicativo configurada expirou ou foi revogada.
          </Alert>
        </div>

        <div className="pt-4">
          <EmptyState
            title="Nenhuma notícia encontrada"
            description="Não há artigos correspondentes aos filtros selecionados neste destino editorial."
            action={
              <Button variant="gradient" leadingIcon={<Search className="h-4 w-4" />}>
                Buscar novas notícias nos Feeds
              </Button>
            }
            secondaryAction={
              <Button variant="outline">Limpar Filtros</Button>
            }
          />
        </div>

        <div className="pt-4 space-y-3">
          <Overline className="block">Placeholders de Carregamento (Skeleton)</Overline>
          <div className="p-4 rounded-xl border border-border bg-surface space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </section>
    </div>
  );
}
