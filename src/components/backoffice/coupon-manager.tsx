"use client";

import { useState } from "react";
import {
  Tag,
  Plus,
  Copy,
  Check,
  Edit2,
  Trash2,
  Users,
  Clock,
  Sparkles,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Calculator,
  RefreshCw,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/design-system/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/design-system/form-field";

interface AvailablePlan {
  id: string;
  name: string;
  slug: string;
  monthlyPrice: number | string;
  periodicity: string;
}

interface CouponItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED_DISCOUNT" | "FIXED_PRICE";
  discountValue: number | string;
  durationMonths: number;
  customerType: "NEW" | "BASE" | "BOTH";
  validFrom: string | null;
  validUntil: string | null;
  maxUses: number | null;
  maxUsesPerWorkspace: number;
  usedCount: number;
  active: boolean;
  createdAt: string;
  plans: Array<{
    planId: string;
    plan: {
      id: string;
      name: string;
      slug: string;
      monthlyPrice: number | string;
    };
  }>;
  _count?: {
    redemptions: number;
  };
}

interface CouponManagerProps {
  initialCoupons: CouponItem[];
  availablePlans: AvailablePlan[];
}

export function CouponManager({ initialCoupons, availablePlans }: CouponManagerProps) {
  const [coupons, setCoupons] = useState<CouponItem[]>(initialCoupons);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados do formulário
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<"PERCENTAGE" | "FIXED_DISCOUNT" | "FIXED_PRICE">("FIXED_PRICE");
  const [formDiscountValue, setFormDiscountValue] = useState<string>("19.90");
  const [formDurationMonths, setFormDurationMonths] = useState<number>(3);
  const [formCustomerType, setFormCustomerType] = useState<"NEW" | "BASE" | "BOTH">("NEW");
  const [formSelectedPlanIds, setFormSelectedPlanIds] = useState<string[]>([]);
  const [formValidUntil, setFormValidUntil] = useState<string>("");
  const [formMaxUses, setFormMaxUses] = useState<string>("");
  const [formMaxUsesPerWorkspace, setFormMaxUsesPerWorkspace] = useState<number>(1);
  const [formActive, setFormActive] = useState<boolean>(true);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let res = "";
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormCode(res);
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormName("");
    setFormCode("");
    setFormDescription("");
    setFormDiscountType("FIXED_PRICE");
    setFormDiscountValue("19.90");
    setFormDurationMonths(3);
    setFormCustomerType("NEW");
    setFormSelectedPlanIds(availablePlans.map((p) => p.id));
    setFormValidUntil("");
    setFormMaxUses("");
    setFormMaxUsesPerWorkspace(1);
    setFormActive(true);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: CouponItem) => {
    setEditingCoupon(coupon);
    setFormName(coupon.name);
    setFormCode(coupon.code);
    setFormDescription(coupon.description || "");
    setFormDiscountType(coupon.discountType);
    setFormDiscountValue(String(coupon.discountValue));
    setFormDurationMonths(coupon.durationMonths);
    setFormCustomerType(coupon.customerType);
    setFormSelectedPlanIds(coupon.plans.map((p) => p.planId));
    setFormValidUntil(coupon.validUntil ? coupon.validUntil.slice(0, 10) : "");
    setFormMaxUses(coupon.maxUses ? String(coupon.maxUses) : "");
    setFormMaxUsesPerWorkspace(coupon.maxUsesPerWorkspace || 1);
    setFormActive(coupon.active);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleTogglePlan = (planId: string) => {
    setFormSelectedPlanIds((prev) =>
      prev.includes(planId) ? prev.filter((id) => id !== planId) : [...prev, planId]
    );
  };

  const handleToggleActive = async (coupon: CouponItem) => {
    try {
      const res = await fetch(`/api/backoffice/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !coupon.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao alterar status do cupom.");

      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, active: !c.active } : c))
      );
      setSuccessMessage(`Cupom ${coupon.code} ${!coupon.active ? "ativado" : "desativado"} com sucesso!`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao atualizar cupom.");
    }
  };

  const handleDelete = async (coupon: CouponItem) => {
    if (!confirm(`Tem certeza que deseja excluir ou inativar o cupom ${coupon.code}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/backoffice/coupons/${coupon.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir cupom.");

      if (data.inactivated) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, active: false } : c))
        );
        alert(data.message);
      } else {
        setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
        setSuccessMessage(`Cupom ${coupon.code} removido com sucesso!`);
      }
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao excluir cupom.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const payload = {
      name: formName.trim(),
      code: formCode.trim().toUpperCase(),
      description: formDescription.trim() || null,
      discountType: formDiscountType,
      discountValue: parseFloat(formDiscountValue) || 0,
      durationMonths: formDurationMonths,
      customerType: formCustomerType,
      planIds: formSelectedPlanIds,
      validUntil: formValidUntil ? new Date(formValidUntil).toISOString() : null,
      maxUses: formMaxUses ? parseInt(formMaxUses, 10) : null,
      maxUsesPerWorkspace: formMaxUsesPerWorkspace,
      active: formActive,
    };

    try {
      const url = editingCoupon ? `/api/backoffice/coupons/${editingCoupon.id}` : "/api/backoffice/coupons";
      const method = editingCoupon ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar cupom de desconto.");
      }

      if (editingCoupon) {
        setCoupons((prev) => prev.map((c) => (c.id === editingCoupon.id ? data.coupon : c)));
        setSuccessMessage(`Cupom ${data.coupon.code} atualizado com sucesso!`);
      } else {
        setCoupons((prev) => [data.coupon, ...prev]);
        setSuccessMessage(`Cupom ${data.coupon.code} cadastrado com sucesso!`);
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Falha ao salvar cupom.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper para simulação de cálculo no modal
  const calculatePlanSimulation = (planMonthlyPrice: number | string) => {
    const orig = Number(planMonthlyPrice);
    const dVal = parseFloat(formDiscountValue) || 0;
    let discounted = orig;

    if (formDiscountType === "PERCENTAGE") {
      discounted = orig * (1 - dVal / 100);
    } else if (formDiscountType === "FIXED_DISCOUNT") {
      discounted = orig - dVal;
    } else if (formDiscountType === "FIXED_PRICE") {
      discounted = dVal;
    }

    discounted = Math.max(0, parseFloat(discounted.toFixed(2)));
    const savings = Math.max(0, orig - discounted);
    return { orig, discounted, savings };
  };

  const formatDurationText = (months: number) => {
    if (months === 0) return "Para Sempre";
    if (months === 1) return "No 1º Mês";
    return `Nos ${months} Primeiros Meses`;
  };

  const formatCustomerTypeText = (type: "NEW" | "BASE" | "BOTH") => {
    if (type === "NEW") return "Novo Cliente";
    if (type === "BASE") return "Cliente Base";
    return "Novo & Base";
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Cupons de Desconto"
        description="Crie e gerencie cupons promocionais para novos clientes no cadastro ou para upgrades e retenção de clientes da base."
        actions={
          <Button variant="gradient" onClick={openCreateModal} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Cupom
          </Button>
        }
      />

      {/* Alertas */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-3">
          <Check className="w-5 h-5 shrink-0 text-emerald-500" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-border bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Total de Cupons</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{coupons.length}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Tag className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-border bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Cupons Ativos</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">
                {coupons.filter((c) => c.active).length}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-border bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Resgates Realizados</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">
                {coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Grid de Cupons */}
      {coupons.length === 0 ? (
        <Card className="p-12 text-center border-border bg-surface">
          <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-foreground">Nenhum cupom cadastrado</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Crie seu primeiro cupom promocional para oferecer descontos na criação de conta ou retenção de assinantes.
          </p>
          <Button variant="gradient" onClick={openCreateModal} className="mt-6 gap-2">
            <Plus className="w-4 h-4" />
            Criar Primeiro Cupom
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coupons.map((coupon) => (
            <Card
              key={coupon.id}
              className={`border transition-all flex flex-col justify-between ${
                coupon.active
                  ? "border-border bg-surface shadow-xs"
                  : "border-border/60 bg-surface/50 opacity-75"
              }`}
            >
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-foreground tracking-wider bg-surface-muted px-2.5 py-1 rounded-lg border border-border">
                        {coupon.code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(coupon.code)}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title="Copiar código"
                      >
                        {copiedCode === coupon.code ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <h4 className="font-heading font-bold text-sm text-foreground mt-2">{coupon.name}</h4>
                  </div>
                  <Badge variant={coupon.active ? "success" : "secondary"} size="sm">
                    {coupon.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                {coupon.description && (
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{coupon.description}</p>
                )}
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-3.5">
                {/* Desconto & Duração */}
                <div className="p-3 rounded-xl bg-surface-muted border border-border space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-muted-foreground">Condição Promocional:</span>
                    <span className="text-foreground">
                      {coupon.discountType === "PERCENTAGE" && `${coupon.discountValue}% OFF`}
                      {coupon.discountType === "FIXED_DISCOUNT" && `- R$ ${Number(coupon.discountValue).toFixed(2)}`}
                      {coupon.discountType === "FIXED_PRICE" && `Pague R$ ${Number(coupon.discountValue).toFixed(2)}/mês`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Duração:
                    </span>
                    <span className="font-medium text-foreground">
                      {formatDurationText(coupon.durationMonths)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      Público:
                    </span>
                    <span className="font-medium text-foreground">
                      {formatCustomerTypeText(coupon.customerType)}
                    </span>
                  </div>
                </div>

                {/* Planos Elegíveis */}
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Planos Elegíveis ({coupon.plans.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {coupon.plans.map((cp) => (
                      <span
                        key={cp.planId}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-medium"
                      >
                        {cp.plan.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Estatísticas de Uso e Validade */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground border-t border-border pt-2.5">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground">Usos:</span>
                    <span className="font-medium text-foreground">
                      {coupon.usedCount} {coupon.maxUses ? `/ ${coupon.maxUses}` : "(Ilimitado)"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground">Validade:</span>
                    <span className="font-medium text-foreground">
                      {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString("pt-BR") : "Sem Expiração"}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-4 border-t border-border bg-surface-muted/30 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleActive(coupon)}
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  {coupon.active ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-500" />
                      Ativo
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                      Inativo
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(coupon)}
                    className="gap-1 text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(coupon)}
                    className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                    title="Excluir ou inativar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6 bg-surface border-border">
            <CardHeader className="p-0 border-b border-border pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  {editingCoupon ? `Editar Cupom: ${editingCoupon.code}` : "Cadastrar Novo Cupom de Desconto"}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Preencha as regras promocionais, planos elegíveis e duração no Asaas.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nome e Código */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Nome do Cupom" required>
                  <Input
                    type="text"
                    placeholder="Ex: Promoção Influencer de Lançamento"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </FormField>

                <FormField label="Código do Cupom" required>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Ex: INFLUENCER19"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                      className="font-mono font-bold tracking-wider uppercase"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateRandomCode}
                      title="Gerar código aleatório"
                    >
                      <Sparkles className="w-4 h-4 text-primary" />
                    </Button>
                  </div>
                </FormField>
              </div>

              {/* Descrição */}
              <FormField label="Descrição Promocional (Opcional)">
                <Input
                  type="text"
                  placeholder="Ex: Pague R$ 19,90 nos 3 primeiros meses de assinatura do Plano Influencer"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </FormField>

              {/* Regra de Desconto e Valor */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Tipo de Desconto" required>
                  <select
                    value={formDiscountType}
                    onChange={(e) =>
                      setFormDiscountType(e.target.value as "PERCENTAGE" | "FIXED_DISCOUNT" | "FIXED_PRICE")
                    }
                    className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-foreground text-xs focus:ring-2 focus:ring-primary outline-hidden"
                  >
                    <option value="FIXED_PRICE">Preço Fixo Mensalidade (ex: R$ 19,90)</option>
                    <option value="PERCENTAGE">Desconto Percentual (% OFF)</option>
                    <option value="FIXED_DISCOUNT">Desconto em Valor Fixo (- R$)</option>
                  </select>
                </FormField>

                <FormField
                  label={
                    formDiscountType === "PERCENTAGE"
                      ? "Percentual (%)"
                      : formDiscountType === "FIXED_PRICE"
                      ? "Valor da Mensalidade (R$)"
                      : "Abatimento Fixo (R$)"
                  }
                  required
                >
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="19.90"
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(e.target.value)}
                    required
                  />
                </FormField>

                <FormField label="Quanto tempo (meses)" required>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="3"
                    value={formDurationMonths}
                    onChange={(e) => setFormDurationMonths(parseInt(e.target.value, 10) || 0)}
                    required
                  />
                </FormField>
              </div>

              {/* Legenda Dinâmica de Duração */}
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-primary flex items-start gap-2.5">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Regra de Duração no Asaas: </span>
                  {formDurationMonths === 0 && (
                    <span><strong>Para Sempre</strong> — O desconto será aplicado continuamente em todas as mensalidades enquanto a assinatura permanecer ativa.</span>
                  )}
                  {formDurationMonths === 1 && (
                    <span><strong>1º Mês</strong> — O cliente paga o valor promocional na 1ª mensalidade. A partir do 2º mês, o Asaas cobra o valor integral normal do plano.</span>
                  )}
                  {formDurationMonths > 1 && (
                    <span><strong>{formDurationMonths} Primeiros Meses</strong> — O cliente pagará o valor promocional nas {formDurationMonths} primeiras faturas mensais. A partir do {formDurationMonths + 1}º mês, o sistema atualiza automaticamente o Asaas para o valor cheio do plano.</span>
                  )}
                </div>
              </div>

              {/* Tipo de Cliente & Validade */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Tipo de Cliente" required>
                  <select
                    value={formCustomerType}
                    onChange={(e) => setFormCustomerType(e.target.value as "NEW" | "BASE" | "BOTH")}
                    className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-foreground text-xs focus:ring-2 focus:ring-primary outline-hidden"
                  >
                    <option value="NEW">Novo Cliente (Criação de Conta)</option>
                    <option value="BASE">Cliente Base (Plano & Cobrança)</option>
                    <option value="BOTH">Ambos (Novo e Base)</option>
                  </select>
                </FormField>

                <FormField label="Válido até (Opcional)">
                  <Input
                    type="date"
                    value={formValidUntil}
                    onChange={(e) => setFormValidUntil(e.target.value)}
                  />
                </FormField>

                <FormField label="Limite de Usos Global (Opcional)">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Ilimitado"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(e.target.value)}
                  />
                </FormField>
              </div>

              {/* Seleção de Múltiplos Planos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-heading text-xs font-semibold text-foreground">
                    Planos Elegíveis (Selecione um ou múltiplos planos):
                  </label>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setFormSelectedPlanIds(availablePlans.map((p) => p.id))}
                      className="text-primary hover:underline text-[11px]"
                    >
                      Marcar Todos
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button
                      type="button"
                      onClick={() => setFormSelectedPlanIds([])}
                      className="text-muted-foreground hover:underline text-[11px]"
                    >
                      Desmarcar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-surface-muted border border-border">
                  {availablePlans.map((plan) => {
                    const isChecked = formSelectedPlanIds.includes(plan.id);
                    return (
                      <label
                        key={plan.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? "bg-primary/10 border-primary/30 text-foreground font-semibold"
                            : "bg-surface border-border text-muted-foreground hover:border-border-hover"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePlan(plan.id)}
                          className="accent-primary h-4 w-4 rounded"
                        />
                        <div className="flex-1 flex items-center justify-between">
                          <span>{plan.name}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            R$ {Number(plan.monthlyPrice).toFixed(2)}/mês
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* SIMULADOR EM TEMPO REAL NO MODAL */}
              {formSelectedPlanIds.length > 0 && (
                <div className="p-4 rounded-xl bg-surface-muted border border-border space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Calculator className="w-4 h-4 text-emerald-500" />
                    Simulação em Tempo Real das Cobranças no Asaas:
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {availablePlans
                      .filter((p) => formSelectedPlanIds.includes(p.id))
                      .map((p) => {
                        const sim = calculatePlanSimulation(p.monthlyPrice);
                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border"
                          >
                            <span className="font-semibold text-foreground">{p.name}:</span>
                            <div className="text-right">
                              {formDurationMonths === 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  R$ {sim.discounted.toFixed(2)}/mês permanente
                                </span>
                              ) : (
                                <span>
                                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                                    {formDurationMonths}x de R$ {sim.discounted.toFixed(2)}
                                  </strong>
                                  <span className="text-muted-foreground"> (depois R$ {sim.orig.toFixed(2)}/mês)</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Opção Ativo */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formActive"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="accent-primary h-4 w-4 rounded"
                />
                <label htmlFor="formActive" className="text-xs font-semibold text-foreground cursor-pointer">
                  Cupom Ativo para resgates imediatos
                </label>
              </div>

              {/* Botões do Rodapé */}
              <CardFooter className="p-0 flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  size="sm"
                  disabled={isLoading || formSelectedPlanIds.length === 0}
                  className="gap-2"
                >
                  {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {editingCoupon ? "Salvar Alterações" : "Criar Cupom"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
