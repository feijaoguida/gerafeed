"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Save,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  Globe,
  Tag,
  Image as ImageIcon,
} from "lucide-react";

import {
  AffiliateArticleEditor,
  ArticleProductItem,
} from "@/components/affiliate/affiliate-article-editor";
import { AffiliateBlockManager } from "@/components/affiliate/affiliate-block-manager";
import { CanonicalDocument } from "@/lib/affiliate/canonical-document";
import { documentToEditorHtml, editorHtmlToDocument } from "@/lib/affiliate/editor-document";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/design-system/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trackEvent } from "@/lib/analytics";

interface Category {
  id: string;
  name: string;
  slug: string;
  wordpressId: number;
  wordpressSiteId?: string;
}

interface WordPressSite {
  id: string;
  name: string;
  isDefault: boolean;
}

interface ArticleDetail {
  id: string;
  originalTitle: string;
  originalDescription: string | null;
  originalUrl: string;
  originalPublishedAt: string | null;
  title: string | null;
  summary: string | null;
  content: string | null;
  commercialType?: string | null;
  canonicalContent?: CanonicalDocument | null;
  suggestedCategoryId: string | null;
  categoryId: string | null;
  tags: string[];
  seoFocusKeyword: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  aiScore: number | null;
  status: "PENDING" | "PUBLISHED" | "REJECTED";
  needsRepublish?: boolean;
  wordpressPostId: number | null;
  wordpressSiteId?: string | null;
  originalImageUrl?: string | null;
  modifiedImageUrl?: string | null;
  generatedImageUrl?: string | null;
  imagePrompt?: string | null;
  selectedImage?: string | null;
  source?: { id: string; name: string; rssUrl?: string } | null;
  suggestedCategory: Category | null;
  category: Category | null;
  articleProducts?: ArticleProductItem[];
}

export default function ReviewArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sites, setSites] = useState<WordPressSite[]>([]);

  // Editable Form Fields
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [wordpressSiteId, setWordpressSiteId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [tagsInput, setTagsInput] = useState("");
  const [seoFocusKeyword, setSeoFocusKeyword] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<"ORIGINAL" | "MODIFIED" | "AI_GENERATED">("ORIGINAL");

  // Loading & Action states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [relevanceWarning, setRelevanceWarning] = useState<{
    message: string;
    score: number;
    aiResult?: unknown;
  } | null>(null);

  useEffect(() => {
    let active = true;

    async function loadArticleAndCategories() {
      try {
        const [articleRes, categoriesRes, sitesRes] = await Promise.all([
          fetch(`/api/articles/${id}`),
          fetch("/api/wordpress/categories"),
          fetch("/api/wordpress/sites")
        ]);

        if (!active) return;

        if (articleRes.ok) {
          const artData: ArticleDetail = await articleRes.json();
          setArticle(artData);
          setTitle(artData.title || artData.originalTitle || "");
          setSummary(artData.summary || "");
          if (artData.content && artData.content.includes("gerafeed-block:")) {
            setContent(artData.content);
          } else if (artData.canonicalContent && Array.isArray(artData.canonicalContent.blocks)) {
            setContent(documentToEditorHtml(artData.canonicalContent));
          } else {
            setContent(artData.content || "");
          }
          setWordpressSiteId(artData.wordpressSiteId || "");
          setCategoryId(artData.categoryId || artData.suggestedCategoryId || "");
          setTagsInput((artData.tags || []).join(", "));
          setSeoFocusKeyword(artData.seoFocusKeyword || "");
          setSeoTitle(artData.seoTitle || "");
          setSeoDescription(artData.seoDescription || "");
          setSelectedImage((artData.selectedImage as "ORIGINAL" | "MODIFIED" | "AI_GENERATED") || "ORIGINAL");
        } else {
          setErrorMessage("Erro ao carregar os dados da notícia.");
        }

        if (categoriesRes.ok) {
          const cats: Category[] = await categoriesRes.json();
          setCategories(cats);
        }

        if (sitesRes.ok) {
          const sitesData = await sitesRes.json();
          const loadedSites = sitesData.sites || [];
          setSites(loadedSites);
          
          // If no site is set yet on the article, try to set the default site
          setWordpressSiteId(prev => {
            if (!prev) {
              const defaultSite = loadedSites.find((s: WordPressSite) => s.isDefault);
              return defaultSite ? defaultSite.id : (loadedSites[0]?.id || "");
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Error loading review page:", err);
        setErrorMessage("Erro ao conectar à API.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadArticleAndCategories();

    return () => {
      active = false;
    };
  }, [id]);

  // Action: Save Draft
  const handleSaveDraft = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const tagsArray = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const hasBlocks = content.includes("gerafeed-block:");
    let canonicalPayload: unknown = undefined;
    if (hasBlocks) {
      try {
        canonicalPayload = editorHtmlToDocument(content);
      } catch (err) {
        console.warn("Falha ao gerar canonicalContent do HTML editado:", err);
      }
    }

    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          content,
          canonicalContent: canonicalPayload,
          wordpressSiteId: wordpressSiteId || null,
          categoryId: categoryId || null,
          tags: tagsArray,
          seoFocusKeyword,
          seoTitle,
          seoDescription,
          selectedImage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar rascunho.");

      setArticle((prev) => (prev ? { ...prev, ...data } : null));
      setSuccessMessage("Rascunho salvo com sucesso!");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  // Action: Process with AI
  const handleProcessAi = async (force = false) => {
    setIsProcessingAi(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!force) {
      setRelevanceWarning(null);
    }

    try {
      const payload: { force?: boolean; aiResult?: unknown } = {};
      if (force) {
        payload.force = true;
        if (relevanceWarning?.aiResult) {
          payload.aiResult = relevanceWarning.aiResult;
        }
      }

      const res = await fetch(`/api/articles/${id}/process-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.notRelevant || data.message) {
          setRelevanceWarning({
            message: data.message || `Notícia considerada irrelevante para a área de atuação do portal. Os campos foram preservados.`,
            score: data.score,
            aiResult: data.aiResult,
          });
          return;
        }
        throw new Error(data.error || "Erro no processamento da IA.");
      }

      setRelevanceWarning(null);

      // API returns { success, article, aiResult }
      const updated = data.article;
      if (updated) {
        setTitle(updated.title || "");
        setSummary(updated.summary || "");
        setContent(updated.content || "");
        if (updated.suggestedCategoryId) setCategoryId(updated.suggestedCategoryId);
        if (updated.tags) setTagsInput(updated.tags.join(", "));
        if (updated.seoFocusKeyword) setSeoFocusKeyword(updated.seoFocusKeyword);
        if (updated.seoTitle) setSeoTitle(updated.seoTitle);
        if (updated.seoDescription) setSeoDescription(updated.seoDescription);
        if (updated.selectedImage) setSelectedImage(updated.selectedImage);

        setArticle((prev) => (prev ? { ...prev, ...updated } : null));
      }
      setSuccessMessage(
        force
          ? "Notícia processada e campos atualizados com sucesso!"
          : "Conteúdo e mídia reescritos com sucesso pela IA!"
      );
      trackEvent("article_generated", { content_type: "rss_rewrite" });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro na IA.");
    } finally {
      setIsProcessingAi(false);
    }
  };

  // Action: Generate or Regenerate Image with AI on-demand
  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/articles/${id}/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar imagem com IA.");

      setSelectedImage("AI_GENERATED");
      if (data.article) {
        setArticle((prev) => (prev ? { ...prev, ...data.article } : null));
      } else if (data.imageUrl) {
        setArticle((prev) =>
          prev
            ? {
                ...prev,
                generatedImageUrl: data.imageUrl,
                imagePrompt: data.prompt,
                selectedImage: "AI_GENERATED",
              }
            : null
        );
      }

      setSuccessMessage("Nova imagem gerada com sucesso pela IA!");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao gerar imagem com IA.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Action: Reject Article
  const handleReject = async () => {
    if (!confirm("Tem certeza que deseja rejeitar esta notícia?")) return;

    setIsRejecting(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/articles/${id}/reject`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao rejeitar notícia.");

      setSuccessMessage("Notícia marcada como REJEITADA.");
      router.push("/dashboard");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao rejeitar notícia.");
      setIsRejecting(false);
    }
  };

  // Action: Approve & Publish Article
  const handleApprove = async () => {
    if (!title.trim()) {
      setErrorMessage("O Título é obrigatório para aprovação.");
      return;
    }
    if (!content.trim()) {
      setErrorMessage("O Conteúdo do artigo é obrigatório para aprovação.");
      return;
    }
    if (!wordpressSiteId) {
      setErrorMessage("Selecione um Site WordPress antes de aprovar.");
      return;
    }
    if (!categoryId) {
      setErrorMessage("Selecione uma Categoria do WordPress antes de aprovar.");
      return;
    }

    setIsApproving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    await handleSaveDraft();

    try {
      const res = await fetch(`/api/articles/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedImage }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao aprovar e publicar no WordPress.");

      setSuccessMessage("Artigo APROVADO e publicado com sucesso no WordPress!");
      trackEvent("article_published", { destination_type: "wordpress" });
      setArticle((prev) => (prev ? { ...prev, status: "PUBLISHED" } : null));

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao publicar.");
    } finally {
      setIsApproving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <Card className="p-8 text-center max-w-md space-y-4">
          <h2 className="font-heading text-lg font-bold text-foreground">Notícia não encontrada</h2>
          <p className="font-sans text-xs text-muted-foreground">O artigo pode ter sido excluído ou você não possui permissão para visualizá-lo.</p>
          <Link href="/dashboard">
            <Button variant="default">Voltar ao Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // If this is an affiliate/commercial article, render AffiliateArticleEditor
  if (article.commercialType && article.commercialType !== "STANDARD") {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans pb-16 transition-colors duration-200">
        <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-lg hover:bg-surface-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-heading text-base font-bold text-foreground">Editor de Artigo Comercial</h1>
              <p className="text-xs text-muted-foreground">Tipo: {article.commercialType}</p>
            </div>
          </div>
          <div>
            <Badge variant="purple">
              Módulo Comercial & Afiliados
            </Badge>
          </div>
        </div>

        <AffiliateArticleEditor
          articleId={article.id}
          initialTitle={article.title || article.originalTitle || ""}
          initialSummary={article.summary || ""}
          initialContent={
            article.content && article.content.includes("gerafeed-block:")
              ? article.content
              : article.canonicalContent
              ? documentToEditorHtml(article.canonicalContent)
              : article.content || ""
          }
          initialCommercialType={article.commercialType}
          initialStatus={article.status}
          initialSeoFocusKeyword={article.seoFocusKeyword || ""}
          initialSeoTitle={article.seoTitle || ""}
          initialSeoDescription={article.seoDescription || ""}
          initialTags={article.tags || []}
          initialProducts={article.articleProducts || []}
          initialCanonicalDocument={article.canonicalContent || null}
          initialNeedsRepublish={article.needsRepublish || false}
          initialWordpressSiteId={article.wordpressSiteId}
          initialCategoryId={article.categoryId || article.suggestedCategoryId}
          initialOriginalImageUrl={article.originalImageUrl || article.modifiedImageUrl || null}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-16 transition-colors duration-200">
      {/* Header Sticky */}
      <header className="border-b border-border bg-surface/90 backdrop-blur sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl bg-surface-muted hover:bg-muted text-foreground transition-colors"
              title="Voltar ao Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-lg font-bold text-foreground tracking-tight">Revisão Editorial</h1>
                {article.status === "PENDING" && (
                  <Badge variant="warning" size="sm">
                    Pendente
                  </Badge>
                )}
                {article.status === "PUBLISHED" && (
                  <Badge variant="success" size="sm">
                    Publicada
                  </Badge>
                )}
                {article.status === "REJECTED" && (
                  <Badge variant="danger" size="sm">
                    Rejeitada
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>Fonte: {article.source?.name || "Fonte RSS"}</span>
                <span>•</span>
                <span>
                  Publicação:{" "}
                  {article.originalPublishedAt
                    ? new Date(article.originalPublishedAt).toLocaleDateString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Data não informada pela fonte"}
                </span>
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleProcessAi(false)}
              isLoading={isProcessingAi}
              leadingIcon={<Sparkles className="w-3.5 h-3.5 text-primary" />}
            >
              Reescrever com IA
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveDraft}
              isLoading={isSaving}
              leadingIcon={<Save className="w-3.5 h-3.5" />}
            >
              Salvar Rascunho
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleReject}
              isLoading={isRejecting}
              className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
              leadingIcon={<XCircle className="w-3.5 h-3.5" />}
            >
              Rejeitar
            </Button>

            <Button
              variant="gradient"
              size="sm"
              onClick={handleApprove}
              isLoading={isApproving}
              leadingIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Aprovar e Publicar
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Alerts */}
        {relevanceWarning && (
          <Alert
            variant="warning"
            title="Classificação de Relevância Baixa pela IA"
            onClose={() => setRelevanceWarning(null)}
          >
            <div className="space-y-3">
              <p>{relevanceWarning.message}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleProcessAi(true)}
                  isLoading={isProcessingAi}
                  className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600 border-none text-xs font-semibold"
                >
                  Processar mesmo assim
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setRelevanceWarning(null)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive" onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {/* 2-Column Editor Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editorial Form (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-5 shadow-xs">
              <CardHeader className="p-0 border-b border-border pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Conteúdo Editorial
                </CardTitle>
              </CardHeader>

              {/* Title Input */}
              <FormField label="Título Editorial" required>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título atraente para publicação..."
                />
              </FormField>

              {/* Site WordPress Select */}
              <FormField label="Site WordPress Destino" required>
                <Select
                  value={wordpressSiteId}
                  onChange={(e) => {
                    setWordpressSiteId(e.target.value);
                    setCategoryId(""); // Reset category when site changes
                  }}
                >
                  <option value="">-- Selecione um Site --</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name} {site.isDefault ? "(Padrão)" : ""}
                    </option>
                  ))}
                </Select>
              </FormField>

              {/* Category Select */}
              <FormField label="Categoria no WordPress" required>
                <Select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">-- Selecione uma Categoria --</option>
                  {categories
                    .filter((cat) => !wordpressSiteId || cat.wordpressSiteId === wordpressSiteId)
                    .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} (slug: {cat.slug})
                    </option>
                  ))}
                </Select>
                {article.suggestedCategory && (
                  <p className="text-[11px] text-primary mt-1 font-medium">
                    Sugestão da IA: <strong>{article.suggestedCategory.name}</strong>
                  </p>
                )}
              </FormField>

              {/* Summary Input */}
              <FormField label="Resumo / Excerpt">
                <Textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Resumo curto da notícia..."
                />
              </FormField>

              {/* Content Input */}
              <FormField label="Corpo do Artigo (HTML)" required>
                <AffiliateBlockManager
                  content={content}
                  onChangeContent={setContent}
                  textareaRef={contentRef}
                  articleProducts={article.articleProducts}
                />
                <Textarea
                  ref={contentRef}
                  rows={12}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="<p>Conteúdo do artigo em HTML...</p>"
                  className="font-mono"
                />
              </FormField>

              {/* Tags Input */}
              <FormField label="Tags (separadas por vírgula)">
                <Input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="tecnologia, inovacao, ai"
                  leadingIcon={<Tag className="w-3.5 h-3.5 text-primary" />}
                />
              </FormField>
            </Card>
          </div>

          {/* SEO & Reference Column (1/3) */}
          <div className="space-y-6">
            {/* SEO Settings Panel */}
            <Card className="p-6 space-y-5 shadow-xs">
              <CardHeader className="p-0 border-b border-border pb-3">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-primary" />
                  Configurações de SEO (Yoast)
                </CardTitle>
              </CardHeader>

              <FormField label="Palavra-Chave Foco (Focus Keyword)">
                <Input
                  type="text"
                  value={seoFocusKeyword}
                  onChange={(e) => setSeoFocusKeyword(e.target.value)}
                  placeholder="Palavra-chave principal..."
                />
              </FormField>

              <FormField label="Título SEO (Meta Title)">
                <Input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Título para ferramentas de busca..."
                />
              </FormField>

              <FormField label="Meta Descrição">
                <Textarea
                  rows={4}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Descrição exibida no Google (120-155 caracteres)..."
                />
              </FormField>
            </Card>

            {/* Featured Media Selection Panel */}
            <Card className="p-6 space-y-4 shadow-xs">
              <CardHeader className="p-0 border-b border-border pb-3 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    Mídia Destacada
                  </CardTitle>
                  <Badge variant="outline" size="sm">
                    Ativa: <strong className="uppercase ml-1 text-primary">{selectedImage}</strong>
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateImage}
                  isLoading={isGeneratingImage}
                  leadingIcon={<Sparkles className="w-3.5 h-3.5 text-purple-500" />}
                >
                  {article.generatedImageUrl ? "Regenerar com IA" : "Gerar com IA"}
                </Button>
              </CardHeader>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Option 1: Original Image */}
                {article.originalImageUrl ? (
                  <div
                    onClick={() => setSelectedImage("ORIGINAL")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                      selectedImage === "ORIGINAL"
                        ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20"
                        : "bg-surface border-border hover:border-muted-foreground/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                        <input
                          type="radio"
                          name="selectedImage"
                          checked={selectedImage === "ORIGINAL"}
                          onChange={() => setSelectedImage("ORIGINAL")}
                          className="accent-primary"
                        />
                        Original (RSS)
                      </span>
                      {selectedImage === "ORIGINAL" && (
                        <Badge variant="outline" size="sm">
                          ATIVA
                        </Badge>
                      )}
                    </div>
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface-muted border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={article.originalImageUrl}
                        alt="Imagem Original"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-surface-muted/30 border border-border flex items-center justify-center text-center">
                    <p className="text-[11px] text-muted-foreground italic">Sem imagem original no RSS.</p>
                  </div>
                )}

                {/* Option 2: Modified Image (Sharp) */}
                {article.modifiedImageUrl ? (
                  <div
                    onClick={() => setSelectedImage("MODIFIED")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                      selectedImage === "MODIFIED"
                        ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20"
                        : "bg-surface border-border hover:border-muted-foreground/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                        <input
                          type="radio"
                          name="selectedImage"
                          checked={selectedImage === "MODIFIED"}
                          onChange={() => setSelectedImage("MODIFIED")}
                          className="accent-primary"
                        />
                        Invertida (Sharp)
                      </span>
                      {selectedImage === "MODIFIED" && (
                        <Badge variant="outline" size="sm">
                          ATIVA
                        </Badge>
                      )}
                    </div>
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface-muted border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={article.modifiedImageUrl}
                        alt="Imagem Modificada"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-surface-muted/30 border border-border flex items-center justify-center text-center">
                    <p className="text-[11px] text-muted-foreground italic">
                      Inversão Sharp não gerada ainda.
                    </p>
                  </div>
                )}

                {/* Option 3: AI Generated Image */}
                {article.generatedImageUrl ? (
                  <div
                    onClick={() => setSelectedImage("AI_GENERATED")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                      selectedImage === "AI_GENERATED"
                        ? "bg-purple-500/10 border-purple-500 shadow-xs ring-1 ring-purple-500/30"
                        : "bg-surface border-border hover:border-muted-foreground/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                        <input
                          type="radio"
                          name="selectedImage"
                          checked={selectedImage === "AI_GENERATED"}
                          onChange={() => setSelectedImage("AI_GENERATED")}
                          className="accent-purple-500"
                        />
                        Gerada por IA
                      </span>
                      {selectedImage === "AI_GENERATED" ? (
                        <Badge variant="purple" size="sm">
                          ATIVA
                        </Badge>
                      ) : (
                        <Badge variant="outline" size="sm">
                          IA
                        </Badge>
                      )}
                    </div>
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface-muted border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={article.generatedImageUrl}
                        alt="Imagem Gerada com IA"
                        className="object-cover w-full h-full"
                      />
                    </div>
                    {article.imagePrompt && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPromptModal(!showPromptModal);
                          }}
                          className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          {showPromptModal ? "Ocultar Prompt" : "Ver Prompt"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-purple-500/5 border border-dashed border-purple-500/30 flex flex-col items-center justify-center text-center space-y-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <p className="text-[11px] text-muted-foreground">
                      Nenhuma imagem IA gerada ainda.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateImage}
                      isLoading={isGeneratingImage}
                      className="text-xs"
                    >
                      Gerar com IA
                    </Button>
                  </div>
                )}
              </div>

              {/* Prompt Expandível */}
              {showPromptModal && article.imagePrompt && (
                <div className="p-3 rounded-xl bg-surface-muted/60 border border-border space-y-1">
                  <p className="text-[11px] font-semibold text-foreground">Prompt de IA Utilizado:</p>
                  <p className="text-[10px] text-muted-foreground font-mono leading-relaxed bg-surface p-2 rounded-md border border-border">
                    {article.imagePrompt}
                  </p>
                </div>
              )}
            </Card>

            {/* Original RSS Reference Panel */}
            <Card className="p-6 space-y-3 shadow-xs">
              <CardHeader className="p-0 border-b border-border pb-3">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-primary" />
                  Matéria Original (RSS)
                </CardTitle>
              </CardHeader>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">{article.originalTitle}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                  <span>Fonte: {article.source?.name || "Fonte RSS"}</span>
                  <span>•</span>
                  <span>
                    Publicação:{" "}
                    {article.originalPublishedAt
                      ? new Date(article.originalPublishedAt).toLocaleDateString("pt-BR", {
                          timeZone: "America/Sao_Paulo",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Data não informada pela fonte"}
                  </span>
                </p>
              </div>

              {article.originalDescription && (
                <p className="text-xs text-muted-foreground line-clamp-4 bg-surface-muted/60 p-3 rounded-lg border border-border leading-relaxed">
                  {article.originalDescription}
                </p>
              )}

              <a
                href={article.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline pt-1 font-medium"
              >
                Ver notícia original na íntegra <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
