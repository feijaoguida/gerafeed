import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Rss, Settings, BrainCircuit, Image as ImageIcon, ShoppingCart, Send, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function OnboardingPage() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Bem-vindo ao GeraFeed! 🎉</h1>
        <p className="text-muted-foreground text-lg">
          Siga este passo a passo para configurar sua conta e começar a publicar notícias automaticamente.
        </p>
      </div>

      <div className="space-y-6">
        {/* Step 1 */}
        <Card>
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="bg-primary/10 p-3 rounded-full text-primary">
              <Rss className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">1. Configurar Fonte RSS</CardTitle>
              <CardDescription className="text-base mt-2">
                Comece adicionando as fontes de notícias (Feeds RSS) que você deseja curar e processar.
              </CardDescription>
            </div>
            <Link href="/settings/sources" className={buttonVariants({ variant: "outline" })}>
              Configurar RSS
            </Link>
          </CardHeader>
        </Card>

        {/* Step 2 */}
        <Card>
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="bg-primary/10 p-3 rounded-full text-primary">
              <Settings className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">2. Configurar o WordPress</CardTitle>
              <CardDescription className="text-base mt-2">
                Conecte seu site WordPress para que os artigos possam ser publicados diretamente como rascunhos ou publicados.
              </CardDescription>
            </div>
            <Link href="/settings/integrations" className={buttonVariants({ variant: "outline" })}>
              Conectar WordPress
            </Link>
          </CardHeader>
        </Card>

        {/* Step 3 */}
        <Card>
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="bg-primary/10 p-3 rounded-full text-primary">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">3. Inteligência Artificial</CardTitle>
              <CardDescription className="text-base mt-2">
                Configure as suas chaves de API de IA (OpenAI, Gemini, Claude, etc.) para reescrever as notícias e criar o seu conteúdo.
                Precisa de ajuda? <Link href="/help" className="text-primary underline">Veja o nosso guia</Link>.
              </CardDescription>
            </div>
            <Link href="/settings/ai" className={buttonVariants({ variant: "outline" })}>
              Configurar IA
            </Link>
          </CardHeader>
        </Card>

        {/* Step 4 */}
        <Card>
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="bg-primary/10 p-3 rounded-full text-primary">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">4. Estratégia de Imagens</CardTitle>
              <CardDescription className="text-base mt-2">
                Defina como as imagens dos seus posts serão geradas ou importadas (via IA, banco de imagens, ou originais do RSS).
              </CardDescription>
            </div>
            <Link href="/settings/images" className={buttonVariants({ variant: "outline" })}>
              Configurar Imagens
            </Link>
          </CardHeader>
        </Card>

        {/* Step 5 (Optional Affiliates) */}
        <Card className="border-green-200 bg-green-50/30 dark:bg-green-950/10 dark:border-green-900">
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="bg-green-100 p-3 rounded-full text-green-600 dark:bg-green-900 dark:text-green-400">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">5. Catálogo e Afiliados (Opcional)</CardTitle>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium dark:bg-green-900 dark:text-green-300">
                  Para planos Pro
                </span>
              </div>
              <CardDescription className="text-base mt-2">
                Se o seu plano permite Afiliados, você pode importar produtos, criar ofertas, e o sistema pode inserir automaticamente um botão de compra de afiliado nos seus posts.
              </CardDescription>
            </div>
            <Link href="/affiliates" className={buttonVariants({ variant: "outline", className: "border-green-200 text-green-700 hover:bg-green-100 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-900" })}>
              Importar Produtos
            </Link>
          </CardHeader>
        </Card>

        {/* Step 6 */}
        <Card className="border-primary/50 border-2">
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="bg-primary p-3 rounded-full text-primary-foreground">
              <Send className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">6. Publicar Posts</CardTitle>
              <CardDescription className="text-base mt-2">
                Tudo pronto! Agora vá para a aba de Publicação para revisar, gerar com a IA e enviar o conteúdo curado diretamente para o seu blog.
              </CardDescription>
            </div>
            <Link href="/publishing" className={buttonVariants({ variant: "default", className: "flex items-center gap-2" })}>
              Começar a Publicar <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
