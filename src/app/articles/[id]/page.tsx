"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Save,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Search,
  Globe,
  Tag,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  wordpressId: number;
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
  suggestedCategoryId: string | null;
  categoryId: string | null;
  tags: string[];
  seoFocusKeyword: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  aiScore: number | null;
  status: "PENDING" | "PUBLISHED" | "REJECTED";
  wordpressPostId: number | null;
  source?: { id: string; name: string; rssUrl?: string } | null;
  suggestedCategory: Category | null;
  category: Category | null;
}

export default function ReviewArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Editable Form Fields
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [tagsInput, setTagsInput] = useState("");
  const [seoFocusKeyword, setSeoFocusKeyword] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  // Loading & Action states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadArticleAndCategories() {
      try {
        const [articleRes, categoriesRes] = await Promise.all([
          fetch(`/api/articles/${id}`),
          fetch("/api/wordpress/categories"),
        ]);

        if (!active) return;

        if (articleRes.ok) {
          const artData: ArticleDetail = await articleRes.json();
          setArticle(artData);
          setTitle(artData.title || artData.originalTitle || "");
          setSummary(artData.summary || "");
          setContent(artData.content || "");
          setCategoryId(artData.categoryId || artData.suggestedCategoryId || "");
          setTagsInput((artData.tags || []).join(", "));
          setSeoFocusKeyword(artData.seoFocusKeyword || "");
          setSeoTitle(artData.seoTitle || artData.title || artData.originalTitle || "");
          setSeoDescription(artData.seoDescription || artData.summary || "");
        } else {
          setErrorMessage("Notícia não encontrada.");
        }

        if (categoriesRes.ok) {
          const catsData: Category[] = await categoriesRes.json();
          setCategories(catsData);
        }
      } catch (err) {
        if (!active) return;
        console.error("Error loading article details:", err);
        setErrorMessage("Erro ao carregar notícia.");
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

    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          content,
          categoryId: categoryId || null,
          tags: tagsArray,
          seoFocusKeyword,
          seoTitle,
          seoDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar alterações.");

      setArticle(data);
      setSuccessMessage("Alterações salvas com sucesso!");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao salvar rascunho.");
    } finally {
      setIsSaving(false);
    }
  };

  // Action: Process with AI
  const handleProcessAi = async () => {
    setIsProcessingAi(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/articles/${id}/process-ai`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro no processamento de IA.");

      const updated: ArticleDetail = data.article;
      setArticle(updated);
      setTitle(updated.title || "");
      setSummary(updated.summary || "");
      setContent(updated.content || "");
      setCategoryId(updated.categoryId || updated.suggestedCategoryId || "");
      setTagsInput((updated.tags || []).join(", "));
      setSeoFocusKeyword(updated.seoFocusKeyword || "");
      setSeoTitle(updated.seoTitle || "");
      setSeoDescription(updated.seoDescription || "");

      setSuccessMessage("Notícia reescrita e otimizada pela IA com sucesso!");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao reescrever com IA.");
    } finally {
      setIsProcessingAi(false);
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
      router.push("/");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao rejeitar notícia.");
      setIsRejecting(false);
    }
  };

  // Action: Approve & Publish Article
  const handleApprove = async () => {
    // Validate required fields client-side before calling server
    if (!title.trim()) {
      setErrorMessage("O Título é obrigatório para aprovação.");
      return;
    }
    if (!content.trim()) {
      setErrorMessage("O Conteúdo do artigo é obrigatório para aprovação.");
      return;
    }
    if (!categoryId) {
      setErrorMessage("Selecione uma Categoria do WordPress antes de aprovar.");
      return;
    }

    setIsApproving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Save changes first before triggering approve
    await handleSaveDraft();

    try {
      const res = await fetch(`/api/articles/${id}/approve`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao aprovar e publicar no WordPress.");

      setSuccessMessage(`Notícia APROVADA e publicada com sucesso! ID WordPress: ${data.wordpressPostId}`);
      setTimeout(() => router.push("/"), 1500);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro na aprovação/publicação.");
      setIsApproving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
        <p className="text-zinc-400 text-sm animate-pulse">Carregando editor de revisão...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 space-y-4">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
        </Link>
        <p className="text-rose-400">Notícia não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-16">
      {/* Header Sticky */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              title="Voltar ao Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">Revisão Editorial</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    article.status === "PENDING"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : article.status === "PUBLISHED"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  }`}
                >
                  {article.status === "PENDING"
                    ? "Pendente"
                    : article.status === "PUBLISHED"
                    ? "Publicada"
                    : "Rejeitada"}
                </span>
              </div>
              <p className="text-xs text-zinc-400">Fonte: {article.source?.name || "Fonte RSS"}</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleProcessAi}
              disabled={isProcessingAi}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isProcessingAi ? "animate-spin" : ""}`} />
              {isProcessingAi ? "Reescrevendo..." : "Reescrever com IA"}
            </button>

            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? "Salvando..." : "Salvar Rascunho"}
            </button>

            <button
              onClick={handleReject}
              disabled={isRejecting}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              {isRejecting ? "Rejeitando..." : "Rejeitar"}
            </button>

            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isApproving ? "Aprovando & Publicando..." : "Aprovar e Publicar"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Alerts */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-xs text-rose-400 hover:underline">
              Fechar
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-xs text-emerald-400 hover:underline">
              Fechar
            </button>
          </div>
        )}

        {/* 2-Column Editor Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editorial Form (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-5">
              <h2 className="text-sm font-semibold text-zinc-300 border-b border-zinc-800 pb-3">
                Conteúdo Editorial
              </h2>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-400">Título Editorial</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título atraente para publicação..."
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm font-semibold text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category Select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-400">Categoria no WordPress</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Selecione uma Categoria --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} (slug: {cat.slug})
                    </option>
                  ))}
                </select>
                {article.suggestedCategory && (
                  <p className="text-[11px] text-indigo-400">
                    Sugestão da IA: <strong>{article.suggestedCategory.name}</strong>
                  </p>
                )}
              </div>

              {/* Summary Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-400">Resumo / Excerpt</label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Resumo curto da notícia..."
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Content Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-400">Corpo do Artigo (HTML)</label>
                <textarea
                  rows={12}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="<p>Conteúdo do artigo em HTML...</p>"
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Tags Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-400 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" />
                  Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="tecnologia, inovacao, ai"
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* SEO & Reference Column (1/3) */}
          <div className="space-y-6">
            {/* SEO Settings Panel */}
            <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-5">
              <h2 className="text-sm font-semibold text-zinc-300 border-b border-zinc-800 pb-3 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-indigo-400" />
                Configurações de SEO (Yoast)
              </h2>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-400">Palavra-Chave Foco (Focus Keyword)</label>
                <input
                  type="text"
                  value={seoFocusKeyword}
                  onChange={(e) => setSeoFocusKeyword(e.target.value)}
                  placeholder="Palavra-chave principal..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-400">Título SEO (Meta Title)</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Título para ferramentas de busca..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-400">Meta Descrição</label>
                <textarea
                  rows={4}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Descrição exibida no Google (120-155 caracteres)..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Original RSS Reference Panel */}
            <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <h2 className="text-sm font-semibold text-zinc-300 border-b border-zinc-800 pb-3 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-400" />
                Matéria Original (RSS)
              </h2>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-white">{article.originalTitle}</p>
                <p className="text-[11px] text-zinc-500">Fonte: {article.source?.name || "Fonte RSS"}</p>
              </div>

              {article.originalDescription && (
                <p className="text-xs text-zinc-400 line-clamp-4 bg-zinc-950/60 p-3 rounded border border-zinc-800/60 leading-relaxed">
                  {article.originalDescription}
                </p>
              )}

              <a
                href={article.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:underline pt-1"
              >
                Ver notícia original na íntegra <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
