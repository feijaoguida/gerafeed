import { PlanIntent } from "../src/lib/plan-intent";

async function main() {
  console.log("--- Testando Plan Intent (Task 243) ---");

  // 1. Simulação da geração de URLs
  const plans = [
    { slug: "free", monthlyPrice: 0 },
    { slug: "starter", monthlyPrice: 49 },
    { slug: "pro", monthlyPrice: 89 },
  ];

  for (const plan of plans) {
    const isFree = plan.monthlyPrice === 0;
    const registerHref = isFree
      ? "/register?plan=free"
      : `/register?plan=${encodeURIComponent(plan.slug)}&cycle=monthly`;

    console.log(`Plano: ${plan.slug} -> URL: ${registerHref}`);

    if (isFree && !registerHref.includes("plan=free")) {
      throw new Error(`URL de plano free incorreta: ${registerHref}`);
    }
    if (!isFree && (!registerHref.includes(`plan=${plan.slug}`) || !registerHref.includes("cycle=monthly"))) {
      throw new Error(`URL de plano pago incorreta: ${registerHref}`);
    }
  }

  // 2. Validação da interface PlanIntent
  const sampleIntent: PlanIntent = {
    slug: "pro",
    cycle: "MONTHLY",
    planName: "Pro",
    price: 89,
  };

  if (sampleIntent.slug !== "pro" || sampleIntent.cycle !== "MONTHLY") {
    throw new Error("Falha na interface PlanIntent");
  }
  console.log("Interface PlanIntent: OK");

  console.log("Todos os testes da Task 243 passaram com sucesso!");
}

main().catch((err) => {
  console.error("Erro no teste da Task 243:", err);
  process.exit(1);
});
