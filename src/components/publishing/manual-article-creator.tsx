"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileEdit,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Trash2,
  Check,
  Layers,
  ArrowRight,
  AlignLeft,
  Feather,
  PenTool,
  Wand2,
  Camera,
  Film,
  Smile,
  Sliders,
  Plus,
  FileText,
} from "lucide-react";

import { PageHeader } from "@/components/design-system/page-header";
import { FormField } from "@/components/design-system/form-field";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  CompletionLevel,
  COMPLETION_LEVEL_DEFINITIONS,
  VALID_COMPLETION_LEVELS,
} from "@/lib/ai/manual-prompts";
import {
  ImageStyle,
  IMAGE_STYLE_DEFINITIONS,
} from "@/lib/images/types";
import { trackEvent } from "@/lib/analytics";

interface WordPressSiteOption {
  id: string;
  name: string;
  isDefault?: boolean;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  wordpressSiteId?: string;
}

interface UploadedBodyPhoto {
  id: string;
  imageUrl: string;
  caption: string;
  filename: string;
}

export function ManualArticleCreator() {
  const router = useRouter();

  // Editorial text & level state
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [completionLevel, setCompletionLevel] =
    useState<CompletionLevel>("MEDIUM");

  // Destination state
  const [sites, setSites] = useState<WordPressSiteOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [wordpressSiteId, setWordpressSiteId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Uploaded Cover Photo state
  const [coverImage, setCoverImage] = useState<{
    imageUrl: string;
    modifiedImageUrl: string | null;
    filename: string;
  } | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Uploaded Body Photos state
  const [bodyPhotos, setBodyPhotos] = useState<UploadedBodyPhoto[]>([]);
  const [isUploadingBodyPhoto, setIsUploadingBodyPhoto] = useState(false);
  const bodyPhotoInputRef = useRef<HTMLInputElement>(null);

  // AI Image Generation state ("Criar Fotos através da Matéria")
  const [generateAiImage, setGenerateAiImage] = useState(false);
  const [imageStyle, setImageStyle] = useState<ImageStyle>("REALISTIC");
  const [customImageStyle, setCustomImageStyle] = useState("");
  const [customImagePrompt, setCustomImagePrompt] = useState("");
  const [insertAiImageInBody, setInsertAiImageInBody] = useState(false);

  // Submission & Feedback state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraftOnly, setIsSavingDraftOnly] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadOptions() {
      try {
        const [sitesRes, catsRes] = await Promise.all([
          fetch("/api/wordpress/sites"),
          fetch("/api/wordpress/categories"),
        ]);

        if (!active) return;

        if (sitesRes.ok) {
          const sitesData = await sitesRes.json();
          const loadedSites: WordPressSiteOption[] = Array.isArray(
            sitesData?.sites
          )
            ? sitesData.sites
            : Array.isArray(sitesData)
            ? sitesData
            : [];
          setSites(loadedSites);
          const defaultSite =
            loadedSites.find((s) => s.isDefault) || loadedSites[0];
          if (defaultSite) {
            setWordpressSiteId(defaultSite.id);
          }
        }

        if (catsRes.ok) {
          const catsData = await catsRes.json();
          setCategories(Array.isArray(catsData) ? catsData : []);
        }
      } catch {
        // Non-blocking filter load
      }
    }
    loadOptions();
    return () => {
      active = false;
    };
  }, []);

  const getLevelIcon = (level: CompletionLevel) => {
    switch (level) {
      case "FORMAT_ONLY":
        return <AlignLeft className="w-4 h-4 text-sky-500" />;
      case "LIGHT":
        return <Feather className="w-4 h-4 text-emerald-500" />;
      case "MEDIUM":
        return <PenTool className="w-4 h-4 text-primary" />;
      case "LARGE":
        return <Wand2 className="w-4 h-4 text-purple-500" />;
    }
  };

  const getStyleIcon = (style: ImageStyle) => {
    switch (style) {
      case "REALISTIC":
        return <Camera className="w-4 h-4 text-emerald-500" />;
      case "CARTOON":
        return <Film className="w-4 h-4 text-purple-500" />;
      case "DRAWING":
        return <PenTool className="w-4 h-4 text-blue-500" />;
      case "SATIRICAL_CARTOON":
        return <Smile className="w-4 h-4 text-amber-500" />;
      case "CUSTOM":
        return <Sliders className="w-4 h-4 text-pink-500" />;
    }
  };

  const handleUploadCoverChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("generateModified", "true");

      const res = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao enviar foto de capa.");
      }

      setCoverImage({
        imageUrl: data.imageUrl,
        modifiedImageUrl: data.modifiedImageUrl || null,
        filename: file.name,
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Erro ao enviar foto de capa."
      );
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) {
        coverInputRef.current.value = "";
      }
    }
  };

  const handleUploadBodyPhotosChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingBodyPhoto(true);
    setErrorMessage(null);

    try {
      const uploadedItems: UploadedBodyPhoto[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("generateModified", "false");

        const res = await fetch("/api/images/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.error || `Falha ao enviar a imagem ${file.name}.`
          );
        }

        uploadedItems.push({
          id: `${Date.now()}-${i}`,
          imageUrl: data.imageUrl,
          caption: "",
          filename: file.name,
        });
      }

      setBodyPhotos((prev) => [...prev, ...uploadedItems]);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Erro ao enviar foto para a matéria."
      );
    } finally {
      setIsUploadingBodyPhoto(false);
      if (bodyPhotoInputRef.current) {
        bodyPhotoInputRef.current.value = "";
      }
    }
  };

  const handleUpdateBodyPhotoCaption = (id: string, caption: string) => {
    setBodyPhotos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, caption } : item))
    );
  };

  const handleRemoveBodyPhoto = (id: string) => {
    setBodyPhotos((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (processWithAi: boolean) => {
    if (!rawText.trim()) {
      setErrorMessage(
        "Por favor, digite ou cole o texto base, ideias de pauta ou entrevista."
      );
      return;
    }

    if (processWithAi) {
      setIsSubmitting(true);
    } else {
      setIsSavingDraftOnly(true);
    }
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/articles/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined,
          rawText: rawText.trim(),
          completionLevel,
          processWithAi,
          wordpressSiteId: wordpressSiteId || undefined,
          categoryId: categoryId || undefined,
          coverImage: coverImage
            ? {
                imageUrl: coverImage.imageUrl,
                modifiedImageUrl: coverImage.modifiedImageUrl,
              }
            : undefined,
          bodyImages: bodyPhotos.map((p) => ({
            imageUrl: p.imageUrl,
            caption: p.caption.trim() || null,
            alt: p.caption.trim() || title.trim() || "Imagem da matéria",
          })),
          generateAiImage,
          imageStyle,
          customImageStyle:
            imageStyle === "CUSTOM" ? customImageStyle.trim() : undefined,
          customImagePrompt: customImagePrompt.trim() || undefined,
          insertAiImageInBody,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar a matéria.");
      }

      trackEvent("article_generated", {
        content_type: `manual_${completionLevel.toLowerCase()}`,
      });

      setSuccessMessage(
        "Matéria criada com sucesso! Redirecionando para a revisão editorial..."
      );

      if (data.article?.id) {
        router.push(`/articles/${data.article.id}`);
      } else {
        router.push("/articles");
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Erro ao criar a matéria."
      );
      setIsSubmitting(false);
      setIsSavingDraftOnly(false);
    }
  };

  const activeLevelDef = COMPLETION_LEVEL_DEFINITIONS[completionLevel];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Criar Matéria por Texto / Pauta"
        description="Escreva ideias de pauta, notas de entrevista ou pedaços de texto, escolha o nível de complemento da IA e adicione ou gere fotos para a matéria."
        icon={<FileEdit className="w-5 h-5 text-primary" />}
        badge={
          <Link
            href="/publishing"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
          >
            <Layers className="w-3.5 h-3.5" /> Central de Publicação
          </Link>
        }
        actions={
          <Link href="/articles">
            <Button
              variant="outline"
              size="sm"
              leadingIcon={<FileText className="w-3.5 h-3.5 text-primary" />}
            >
              Ver Fila de Matérias
            </Button>
          </Link>
        }
      />

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

      {/* SEÇÃO 1: Nível de Complemento da Matéria (4 estilos) */}
      <Card className="p-6 space-y-5 shadow-xs border border-border">
        <CardHeader className="p-0 border-b border-border pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                1. Escolha o Nível de &ldquo;Completar&rdquo; o Texto
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Cada nível utiliza um prompt especializado para controlar o quanto a IA preserva ou expande seu texto.
              </CardDescription>
            </div>
            <Badge variant="purple" size="sm">
              Selecionado: {activeLevelDef.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VALID_COMPLETION_LEVELS.map((levelKey) => {
              const def = COMPLETION_LEVEL_DEFINITIONS[levelKey];
              const isSelected = completionLevel === levelKey;

              return (
                <button
                  key={levelKey}
                  type="button"
                  onClick={() => setCompletionLevel(levelKey)}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                    isSelected
                      ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/25"
                      : "bg-surface border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <div className="space-y-2 w-full">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getLevelIcon(levelKey)}
                        <span className="font-heading text-sm font-bold text-foreground">
                          {def.label}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    <Badge
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                    >
                      {def.badge}
                    </Badge>

                    <p className="font-sans text-xs text-foreground/90 leading-relaxed font-medium pt-1">
                      {def.description}
                    </p>
                  </div>

                  <p className="font-sans text-[11px] text-muted-foreground leading-relaxed border-t border-border/60 pt-2">
                    {def.aiBehaviorSummary}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 2: Texto Base, Pauta ou Entrevista */}
      <Card className="p-6 space-y-5 shadow-xs border border-border">
        <CardHeader className="p-0 border-b border-border pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <FileEdit className="w-4 h-4 text-primary" />
            2. Texto Base, Pedaços de Texto, Ideias de Pauta ou Entrevista
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">
            Cole seus rascunhos, perguntas e respostas de uma entrevista, tópicos de pauta ou o texto completo que deseja formatar/completar.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <FormField label="Título ou Ideia de Título (Opcional)">
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Deixe vazio para a IA criar..."
                />
              </FormField>
            </div>

            <div>
              <FormField label="Site WordPress Destino">
                <Select
                  value={wordpressSiteId}
                  onChange={(e) => {
                    setWordpressSiteId(e.target.value);
                    setCategoryId("");
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
            </div>

            <div>
              <FormField label="Categoria no WordPress (Opcional)">
                <Select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">-- Sugerir automaticamente pela IA --</option>
                  {categories
                    .filter(
                      (cat) =>
                        !wordpressSiteId ||
                        cat.wordpressSiteId === wordpressSiteId
                    )
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </Select>
              </FormField>
            </div>
          </div>

          <FormField
            label="Texto / Pedaços de Texto / Pauta / Entrevista"
            required
          >
            <Textarea
              rows={12}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Exemplo de uso:\n- Ideias de pauta ou resumo de acontecimentos;\n- Perguntas e respostas de uma entrevista realizada;\n- Pedaços de texto e declarações que precisam virar matéria;\n- Ou um texto já pronto se você escolheu a opção "Formatar".`}
              className="leading-relaxed"
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span>
                Modo ativo: <strong className="text-foreground">{activeLevelDef.label}</strong> — {activeLevelDef.description}
              </span>
              <span>{rawText.length} caracteres</span>
            </div>
          </FormField>
        </CardContent>
      </Card>

      {/* SEÇÃO 3: Fotos e Imagens da Matéria (Upload + Criação por IA) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel 3A: Enviar Fotos e Imagens (Upload) */}
        <Card className="p-6 space-y-5 shadow-xs border border-border flex flex-col justify-between">
          <div className="space-y-4">
            <CardHeader className="p-0 border-b border-border pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Upload className="w-4 h-4 text-primary" />
                3. Enviar Fotos e Imagens para a Matéria
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Envie fotos do seu computador (JPG, PNG ou WEBP) para usar como Capa ou para inserir ao longo do corpo da matéria.
              </CardDescription>
            </CardHeader>

            {/* Upload de Foto de Capa */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Foto de Capa (Mídia Destacada)
                </span>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleUploadCoverChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => coverInputRef.current?.click()}
                  isLoading={isUploadingCover}
                  leadingIcon={<Upload className="w-3.5 h-3.5 text-primary" />}
                >
                  {coverImage ? "Trocar Foto de Capa" : "Enviar Foto de Capa"}
                </Button>
              </div>

              {coverImage ? (
                <div className="p-3 rounded-xl bg-surface-muted/50 border border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-20 h-14 rounded-lg overflow-hidden border border-border bg-surface shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverImage.imageUrl}
                        alt="Capa enviada"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {coverImage.filename}
                      </p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                        ✓ Pronta para capa (versão Sharp também gerada)
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCoverImage(null)}
                    className="text-rose-500 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-border text-center text-[11px] text-muted-foreground">
                  Nenhuma foto de capa enviada manualmente.
                </div>
              )}
            </div>

            {/* Upload de Fotos para o Corpo da Matéria */}
            <div className="space-y-2.5 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Fotos no Corpo da Matéria ({bodyPhotos.length})
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Serão distribuídas entre os parágrafos da matéria e enviadas ao WordPress.
                  </span>
                </div>
                <input
                  ref={bodyPhotoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleUploadBodyPhotosChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => bodyPhotoInputRef.current?.click()}
                  isLoading={isUploadingBodyPhoto}
                  leadingIcon={<Plus className="w-3.5 h-3.5 text-primary" />}
                >
                  Adicionar Fotos no Texto
                </Button>
              </div>

              {bodyPhotos.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {bodyPhotos.map((photo, idx) => (
                    <div
                      key={photo.id}
                      className="p-2.5 rounded-xl bg-surface-muted/40 border border-border flex items-center gap-3"
                    >
                      <div className="w-16 h-12 rounded-lg overflow-hidden border border-border bg-surface shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.imageUrl}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <Input
                          type="text"
                          value={photo.caption}
                          onChange={(e) =>
                            handleUpdateBodyPhotoCaption(
                              photo.id,
                              e.target.value
                            )
                          }
                          placeholder={`Legenda opcional da foto ${idx + 1}...`}
                          className="h-8 text-xs"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBodyPhoto(photo.id)}
                        className="text-rose-500 hover:bg-rose-500/10 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-border text-center text-[11px] text-muted-foreground">
                  Nenhuma foto adicionada para o corpo do texto.
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Painel 3B: Criar Fotos através da Matéria (IA) */}
        <Card className="p-6 space-y-5 shadow-xs border border-border flex flex-col justify-between">
          <div className="space-y-4">
            <CardHeader className="p-0 border-b border-border pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <ImageIcon className="w-4 h-4 text-purple-500" />
                    4. Criar Fotos através da Matéria (IA)
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Gere automaticamente uma ilustração ou foto exclusiva lendo os personagens, o cenário e o contexto da matéria criada.
                  </CardDescription>
                </div>
                <Badge variant={generateAiImage ? "purple" : "outline"} size="sm">
                  {generateAiImage ? "Ativado" : "Opcional"}
                </Badge>
              </div>
            </CardHeader>

            {/* Toggle para ativar criação de foto pela matéria */}
            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                generateAiImage
                  ? "bg-purple-500/10 border-purple-500 ring-1 ring-purple-500/25"
                  : "bg-surface border-border hover:border-muted-foreground/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={generateAiImage}
                  onChange={(e) => setGenerateAiImage(e.target.checked)}
                  className="mt-1 rounded-sm accent-purple-600"
                />
                <div className="space-y-1">
                  <span className="font-heading text-xs font-bold text-foreground block">
                    Criar Foto com IA baseada no conteúdo desta matéria
                  </span>
                  <span className="font-sans text-[11px] text-muted-foreground block leading-relaxed">
                    A IA analisará o título e o texto final da matéria para criar uma imagem inédita. Você também poderá gerar ou regenerar fotos depois na tela de revisão.
                  </span>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
            </label>

            {generateAiImage && (
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground block">
                    Estilo Visual da Foto Criada
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(
                      [
                        "REALISTIC",
                        "DRAWING",
                        "CARTOON",
                        "SATIRICAL_CARTOON",
                        "CUSTOM",
                      ] as ImageStyle[]
                    ).map((styleKey) => {
                      const def = IMAGE_STYLE_DEFINITIONS[styleKey];
                      const isSelected = imageStyle === styleKey;

                      return (
                        <button
                          key={styleKey}
                          type="button"
                          onClick={() => setImageStyle(styleKey)}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? "bg-purple-500/10 border-purple-500 text-foreground"
                              : "bg-surface border-border hover:border-muted-foreground/40"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {getStyleIcon(styleKey)}
                            <span className="text-xs font-semibold truncate">
                              {def.label}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {imageStyle === "CUSTOM" && (
                  <FormField label="Descreva o Estilo Visual Personalizado">
                    <Input
                      type="text"
                      value={customImageStyle}
                      onChange={(e) => setCustomImageStyle(e.target.value)}
                      placeholder="Ex: fotografia documental em preto e branco, iluminação dramática..."
                    />
                  </FormField>
                )}

                <FormField label="Instrução Específica para a Foto (Opcional)">
                  <Input
                    type="text"
                    value={customImagePrompt}
                    onChange={(e) => setCustomImagePrompt(e.target.value)}
                    placeholder="Deixe vazio para a IA extrair automaticamente da matéria..."
                  />
                </FormField>

                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={insertAiImageInBody}
                    onChange={(e) => setInsertAiImageInBody(e.target.checked)}
                    className="rounded-sm accent-purple-600"
                  />
                  <span>
                    Inserir também esta foto criada por IA dentro do corpo da matéria
                  </span>
                </label>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Barra de Ação Final */}
      <Card className="p-5 border border-border bg-surface-muted/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5 text-center sm:text-left">
          <p className="text-xs font-semibold text-foreground">
            Pronto para gerar a matéria no nível{" "}
            <span className="text-primary">{activeLevelDef.label}</span>?
          </p>
          <p className="text-[11px] text-muted-foreground">
            Após a criação, você será levado para a tela de Revisão Editorial para ajustar qualquer detalhe antes de publicar no WordPress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => handleSubmit(false)}
            isLoading={isSavingDraftOnly}
            disabled={isSubmitting}
          >
            Salvar Apenas Rascunho Formatado
          </Button>

          <Button
            type="button"
            variant="gradient"
            size="lg"
            onClick={() => handleSubmit(true)}
            isLoading={isSubmitting}
            disabled={isSavingDraftOnly}
            leadingIcon={<Sparkles className="w-4 h-4" />}
            trailingIcon={<ArrowRight className="w-4 h-4" />}
          >
            Criar Matéria ({activeLevelDef.label})
          </Button>
        </div>
      </Card>
    </div>
  );
}
