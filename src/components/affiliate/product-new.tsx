"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, AlertCircle, Package } from "lucide-react";

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
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);

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
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/affiliates/products"
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Cadastrar Novo Produto</h1>
            <p className="text-xs text-slate-500">Adicione um novo produto ao catálogo do workspace.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/affiliates/import"
            className="px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 rounded-lg"
          >
            Prefiro Importar URL
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {loading ? "Criando..." : "Criar Produto"}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          {errorMsg}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome do Produto *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Câmera Mirrorless 4K"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Marca
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex: Sony"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoria
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
              >
                <option value="">Sem Categoria</option>
                {Array.isArray(categories) &&
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição Editorial / Sinopse
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o produto, recursos principais..."
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          {/* Pros and Cons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Pontos Positivos (Prós)
                </label>
                <button
                  type="button"
                  onClick={() => setPros([...pros, ""])}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Adicionar
                </button>
              </div>
              {pros.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={p}
                    onChange={(e) => {
                      const copy = [...pros];
                      copy[idx] = e.target.value;
                      setPros(copy);
                    }}
                    placeholder="Ponto positivo"
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setPros(pros.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                  Pontos Negativos (Contras)
                </label>
                <button
                  type="button"
                  onClick={() => setCons([...cons, ""])}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Adicionar
                </button>
              </div>
              {cons.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={c}
                    onChange={(e) => {
                      const copy = [...cons];
                      copy[idx] = e.target.value;
                      setCons(copy);
                    }}
                    placeholder="Ponto negativo"
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setCons(cons.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Imagem do Produto
            </h3>
            <div className="h-44 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center p-3">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={name} className="max-h-full max-w-full object-contain rounded" />
              ) : (
                <Package className="w-10 h-10 text-slate-300" />
              )}
            </div>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
            />
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Avaliação / Nota (0 a 5)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={rating}
                onChange={(e) => setRating(e.target.value === "" ? "" : parseFloat(e.target.value))}
                placeholder="Ex: 4.8"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
              />
            </div>

            {/* Quick Specs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Especificações
                </label>
                <button
                  type="button"
                  onClick={() => setSpecs([...specs, { key: "", value: "" }])}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Adicionar
                </button>
              </div>
              {specs.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={s.key}
                    onChange={(e) => {
                      const copy = [...specs];
                      copy[idx].key = e.target.value;
                      setSpecs(copy);
                    }}
                    placeholder="Chave"
                    className="w-1/2 px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded dark:text-white"
                  />
                  <input
                    type="text"
                    value={s.value}
                    onChange={(e) => {
                      const copy = [...specs];
                      copy[idx].value = e.target.value;
                      setSpecs(copy);
                    }}
                    placeholder="Valor"
                    className="w-1/2 px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setSpecs(specs.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
