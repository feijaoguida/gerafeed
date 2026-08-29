"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, Package } from "lucide-react";

import { PageHeader } from "@/components/design-system/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/design-system/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";

interface ProductCategory {
  id: string;
  name: string;
}

export function ProductNew() {
  const router = useRouter();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [rating, setRating] = useState<number | "">("");
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [specs] = useState<{ key: string; value: string }[]>([]);

  useEffect(() => {
    fetch("/api/affiliate/categories")
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setCategories([]);
        }
      })
      .catch(() => setCategories([]));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    const specsRecord: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.key.trim()) {
        specsRecord[s.key.trim()] = s.value.trim();
      }
    });

    try {
      const res = await fetch("/api/affiliate/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          brand: brand.trim() || null,
          categoryId: categoryId || null,
          description: description.trim() || null,
          imageUrl: imageUrl.trim() || null,
          rating: rating !== "" ? Number(rating) : null,
          pros: pros.filter((p) => p.trim()),
          cons: cons.filter((c) => c.trim()),
          specs: Object.keys(specsRecord).length > 0 ? specsRecord : null,
          status: "ACTIVE",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao criar produto.");
      }

      const created = await res.json();
      router.push(`/affiliates/products/${created.id}`);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleCreate} className="space-y-6">
      {/* Header com PageHeader */}
      <PageHeader
        title="Cadastrar Novo Produto"
        description="Adicione um novo produto ao catálogo do workspace com especificações e prós/contras."
        icon={<Package className="w-5 h-5" />}
        badge={
          <Link href="/affiliates/products" className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Catálogo
          </Link>
        }
        actions={
          <div className="flex items-center gap-3">
            <Link href="/affiliates/import">
              <Button variant="outline" size="sm">
                Prefiro Importar URL
              </Button>
            </Link>
            <Button
              type="submit"
              variant="gradient"
              size="sm"
              isLoading={loading}
              leadingIcon={<Save className="w-3.5 h-3.5" />}
            >
              Criar Produto
            </Button>
          </div>
        }
      />

      {errorMsg && (
        <Alert variant="destructive" onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 space-y-5 shadow-xs">
          <FormField label="Nome do Produto" required>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Câmera Mirrorless 4K"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Marca">
              <Input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex: Sony"
              />
            </FormField>

            <FormField label="Categoria">
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Sem Categoria</option>
                {Array.isArray(categories) &&
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </Select>
            </FormField>
          </div>

          <FormField label="Descrição Editorial / Sinopse">
            <Textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o produto, recursos principais..."
            />
          </FormField>

          {/* Pros and Cons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#00C2A8]">
                  Pontos Positivos (Prós)
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPros([...pros, ""])}
                  leadingIcon={<Plus className="w-3 h-3" />}
                >
                  Adicionar
                </Button>
              </div>
              {pros.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={p}
                    onChange={(e) => {
                      const copy = [...pros];
                      copy[idx] = e.target.value;
                      setPros(copy);
                    }}
                    placeholder="Ponto positivo"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setPros(pros.filter((_, i) => i !== idx))}
                    className="text-muted-foreground hover:text-rose-500 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-500">
                  Pontos Negativos (Contras)
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCons([...cons, ""])}
                  leadingIcon={<Plus className="w-3 h-3" />}
                >
                  Adicionar
                </Button>
              </div>
              {cons.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={c}
                    onChange={(e) => {
                      const copy = [...cons];
                      copy[idx] = e.target.value;
                      setCons(copy);
                    }}
                    placeholder="Ponto negativo"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setCons(cons.filter((_, i) => i !== idx))}
                    className="text-muted-foreground hover:text-rose-500 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card className="p-5 shadow-xs space-y-3">
            <h3 className="font-heading text-xs font-semibold text-foreground uppercase tracking-wider">
              Imagem do Produto
            </h3>
            <div className="h-44 bg-surface-muted/50 rounded-xl border border-border flex items-center justify-center p-3">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={name} className="max-h-full max-w-full object-contain rounded" />
              ) : (
                <Package className="w-10 h-10 text-muted-foreground/40" />
              )}
            </div>
            <FormField label="URL da Imagem">
              <Input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </FormField>
          </Card>

          <Card className="p-5 shadow-xs space-y-4">
            <FormField label="Avaliação (0 a 5)">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={rating}
                onChange={(e) => setRating(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Ex: 4.8"
              />
            </FormField>
          </Card>
        </div>
      </div>
    </form>
  );
}
