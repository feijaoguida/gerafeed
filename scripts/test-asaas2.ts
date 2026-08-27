import dotenv from "dotenv";
dotenv.config({ path: ".env" });

async function main() {
  const apiKey = process.env.ASAAS_API_KEY;
  const baseUrl = "https://sandbox.asaas.com/api/v3";
  
  const res = await fetch(`${baseUrl}/paymentLinks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "access_token": apiKey as string,
    },
    body: JSON.stringify({
      name: `News Curator - Plano Pro`,
      billingType: "UNDEFINED",
      chargeType: "RECURRENT",
      value: 100,
      subscriptionCycle: "MONTHLY",
      dueDateLimitDays: 10,
      externalReference: "ws_test",
      callback: {
        successUrl: "http://localhost:3000/settings/billing",
        autoRedirect: true,
      },
    }),
  });

  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Data:", JSON.stringify(data, null, 2));
}

main();
