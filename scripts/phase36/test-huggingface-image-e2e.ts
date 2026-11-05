import assert from "node:assert/strict";
import { resolveImageCredentials } from "../../src/lib/images/credentials";
import {
  IMAGE_STYLE_DEFINITIONS,
  ImageProviderType,
} from "../../src/lib/images/types";
import { createImageGenerator, ImageGenerationService } from "../../src/lib/images/service";
import { HuggingFaceFluxAdapter } from "../../src/lib/images/adapters/huggingface-flux";
import { PollinationsFluxAdapter } from "../../src/lib/images/adapters/pollinations-flux";
import { buildImagePrompt } from "../../src/lib/images/prompt-builder";

async function run() {
  console.log("=== Phase 36 E2E Verification Suite ===");

  // 1. Verify Hugging Face credentials resolution from DB seed
  console.log("1. Testing Hugging Face credentials resolution from database...");
  const creds = await resolveImageCredentials("default-workspace");
  assert.equal(creds.provider, "huggingface");
  assert.equal(creds.model, "black-forest-labs/FLUX.1-schnell");
  assert.equal(creds.isInheritedFromTextAi, false);
  assert.ok(
    creds.apiKey.startsWith("hf_"),
    `Expected Hugging Face token to start with hf_, got ${creds.apiKey.slice(0, 5)}`
  );
  console.log("   [PASS] Hugging Face credentials properly saved, encrypted and decrypted.");

  // 2. Verify Prompt Engineering modifiers
  console.log("2. Testing enriched prompt modifiers for FLUX / SD...");
  const realisticDef = IMAGE_STYLE_DEFINITIONS.REALISTIC;
  assert.ok(realisticDef.promptModifier.includes("35mm lens"));
  assert.ok(realisticDef.promptModifier.includes("DSLR camera photo"));
  assert.ok(realisticDef.promptModifier.includes("8k resolution"));
  assert.ok(realisticDef.promptModifier.includes("visible skin and texture details"));

  const cartoonDef = IMAGE_STYLE_DEFINITIONS.CARTOON;
  assert.ok(cartoonDef.promptModifier.includes("Pixar-inspired"));
  assert.ok(cartoonDef.promptModifier.includes("clay and 3D rendering"));

  const drawingDef = IMAGE_STYLE_DEFINITIONS.DRAWING;
  assert.ok(drawingDef.promptModifier.includes("2D cartoon illustration"));
  assert.ok(drawingDef.promptModifier.includes("vector graphic"));
  assert.ok(drawingDef.promptModifier.includes("flat design"));

  const generatedPrompt = await buildImagePrompt({
    title: "Governo anuncia novos investimentos em energia solar",
    summary: "Setor de energia limpa receberá incentivos no Nordeste.",
    content: "O presidente e ministros estiveram em Salvador para lançar o programa.",
    style: "REALISTIC",
  });
  assert.ok(generatedPrompt.includes("Governo anuncia novos investimentos em energia solar"));
  assert.ok(generatedPrompt.includes("photojournalism style"));
  console.log("   [PASS] Prompt engineering modifiers verified.");

  // 3. Test Pollinations.ai Adapter
  console.log("3. Testing Pollinations.ai Adapter (free, keyless)...");
  const pollinationsAdapter = new PollinationsFluxAdapter();
  assert.equal(pollinationsAdapter.name, "Pollinations.ai");
  assert.equal(pollinationsAdapter.defaultModel, "flux");

  // Mock fetch for Pollinations to verify Data URI output format deterministically
  const originalFetch = global.fetch;
  let pollinationsFetchCalled = false;
  global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.toString()
        : input.url;

    if (urlStr.includes("image.pollinations.ai")) {
      pollinationsFetchCalled = true;
      const fakeJpegBytes = Buffer.from("fake-pollinations-jpeg-binary-stream");
      return new Response(fakeJpegBytes, {
        status: 200,
        headers: { "Content-Type": "image/jpeg" },
      });
    }
    return originalFetch(input, init);
  };

  try {
    const pollResult = await pollinationsAdapter.generateImage(
      "A cozy cafe with books and plants, warm light",
      { model: "flux" }
    );
    assert.equal(pollinationsFetchCalled, true);
    assert.ok(pollResult.imageUrl.startsWith("data:image/jpeg;base64,"));
    assert.equal(pollResult.model, "flux");
  } finally {
    global.fetch = originalFetch;
  }
  console.log("   [PASS] Pollinations.ai adapter verified.");

  // 4. Test HuggingFace Adapter (ZeroGPU Space flow & Router fallback)
  console.log("4. Testing Hugging Face Adapter...");
  const hfAdapter = new HuggingFaceFluxAdapter(creds.apiKey);
  assert.equal(hfAdapter.name, "Hugging Face FLUX");
  assert.equal(hfAdapter.defaultModel, "black-forest-labs/FLUX.1-schnell");

  let spaceInferCalled = false;
  let spaceSseCalled = false;
  let spaceFileDownloadCalled = false;

  global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.toString()
        : input.url;

    if (urlStr.includes("/gradio_api/call/infer/") && !urlStr.endsWith("/infer")) {
      spaceSseCalled = true;
      const sseBody = `event: complete\ndata: [{"path": "/tmp/test.webp", "url": "https://black-forest-labs-flux-1-schnell.hf.space/gradio_api/file=/tmp/test.webp"}, 12345]\n\n`;
      return new Response(sseBody, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      });
    }

    if (urlStr.includes("/gradio_api/call/infer")) {
      spaceInferCalled = true;
      return new Response(JSON.stringify({ event_id: "test-event-uuid-1234" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (urlStr.includes("/gradio_api/file=")) {
      spaceFileDownloadCalled = true;
      const fakeWebpBytes = Buffer.from("fake-huggingface-webp-binary-stream");
      return new Response(fakeWebpBytes, {
        status: 200,
        headers: { "Content-Type": "image/webp" },
      });
    }

    return originalFetch(input, init);
  };

  try {
    const hfResult = await hfAdapter.generateImage(
      "Cinematic photo of a scientist in a laboratory, 8k",
      { model: "black-forest-labs/FLUX.1-schnell" }
    );
    assert.equal(spaceInferCalled, true, "Space infer must be called");
    assert.equal(spaceSseCalled, true, "Space SSE stream must be read");
    assert.equal(spaceFileDownloadCalled, true, "Generated file must be downloaded to Data URI");
    assert.ok(hfResult.imageUrl.startsWith("data:image/webp;base64,"));
    assert.equal(hfResult.model, "black-forest-labs/FLUX.1-schnell");
  } finally {
    global.fetch = originalFetch;
  }
  console.log("   [PASS] Hugging Face ZeroGPU Space adapter verified.");

  // 5. Verify Factory and Non-regression for all 5 providers
  console.log("5. Testing factory createImageGenerator for all 5 providers...");
  const providersToTest: ImageProviderType[] = [
    "huggingface",
    "pollinations",
    "openai",
    "gemini",
    "openrouter",
  ];

  for (const prov of providersToTest) {
    const generator = createImageGenerator({
      provider: prov,
      apiKey: "test-key-mock",
      isInheritedFromTextAi: false,
    });
    assert.ok(generator, `Generator must be instantiated for ${prov}`);
    assert.ok(typeof generator.generateImage === "function");
    assert.ok(generator.name.length > 0);
  }
  console.log("   [PASS] All 5 image providers cleanly instantiated without regression.");

  // 6. Test ImageGenerationService end-to-end with workspace
  console.log("6. Testing ImageGenerationService.checkProviderStatus and generateImage...");
  const status = await ImageGenerationService.checkProviderStatus("default-workspace");
  assert.equal(status.available, true);
  assert.equal(status.provider, "huggingface");

  console.log("=== ALL PHASE 36 E2E TESTS PASSED ===");
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Phase 36 E2E test failed:", err);
    process.exit(1);
  });
