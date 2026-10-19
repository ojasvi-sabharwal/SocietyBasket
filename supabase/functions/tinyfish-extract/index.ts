// TinyFish extract edge function.
// Receives a retailer URL from the frontend, validates it, starts an async
// TinyFish Agent run, polls for completion, and returns normalized grocery
// product data. The API key is read server-side only and never exposed.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Endpoints per https://docs.tinyfish.ai/key-concepts/endpoints
// Sync /run blocks too long for heavy retailer pages (Amazon, etc.), so we
// use /run-async to start the run, then poll /v1/runs/{id} until completion.
const TINYFISH_RUN_ASYNC_URL = "https://agent.tinyfish.ai/v1/automation/run-async";
const TINYFISH_RUNS_BASE = "https://agent.tinyfish.ai/v1/runs";

const TOTAL_DEADLINE_MS = 110_000;
const POLL_INTERVAL_MS = 3_000;
const INITIAL_POLL_DELAY_MS = 2_000;

interface NormalizedProduct {
  name: string;
  brand: string;
  variant: string;
  packSize: string;
  displayPrice: string;
  currency: string;
  discount: string;
  availability: string;
  imageUrl: string;
  sourceUrl: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// If TinyFish returns the agent output as a JSON string (common when the goal
// asks for JSON), parse it into an object first so normalizeProducts can read
// product fields. Otherwise return the value unchanged.
function unwrapOutput(val: unknown): unknown {
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return JSON.parse(trimmed);
      } catch {
        // not JSON — leave as-is and let normalizeProducts handle it
      }
    }
    // Some agent outputs wrap JSON in markdown fences ```json ... ```
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) {
      try {
        return JSON.parse(fence[1].trim());
      } catch {
        // ignore
      }
    }
  }
  return val;
}

// Parse a Response body as JSON, detecting HTML pages (which indicate the
// endpoint moved or auth failed) so callers get a useful error instead of a
// raw JSON parse exception.
async function safeJson(res: Response): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  const ct = res.headers.get("content-type") || "";
  const raw = await res.text();
  if (ct.includes("text/html") || /^\s*<!doctype\s+html/i.test(raw) || /^\s*<html/i.test(raw)) {
    return { ok: false, error: "TinyFish returned an HTML page instead of JSON (the API key may be invalid or the endpoint moved)." };
  }
  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch {
    return { ok: false, error: "TinyFish response was not valid JSON." };
  }
}

// Extract a human-readable error message from a TinyFish error body, handling
// both flat { error: "..." } and nested { error: { code, message } } shapes.
function extractErrorDetail(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const obj = body as Record<string, unknown>;
  const errField = obj.error;
  if (typeof errField === "string") return errField.trim();
  if (errField && typeof errField === "object") {
    const nested = errField as Record<string, unknown>;
    const msg = str(nested.message) || str(nested.code);
    if (msg) return msg;
  }
  return str(obj.message) || str(obj.code);
}

function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "::1") return true;
  if (h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (h === "metadata.google.internal") return true;
  const parts = h.split(".");
  if (parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p))) {
    const [a, b] = parts.map((p) => parseInt(p, 10));
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 0) return true;
  }
  return false;
}

function validateUrl(raw: string): { ok: true; url: URL } | { ok: false; error: string } {
  if (typeof raw !== "string" || raw.trim() === "") {
    return { ok: false, error: "Missing 'url' field." };
  }
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return { ok: false, error: "Invalid URL format." };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http and https URLs are allowed." };
  }
  if (isPrivateHost(parsed.hostname)) {
    return { ok: false, error: "URLs pointing to private or internal hosts are not allowed." };
  }
  return { ok: true, url: parsed };
}

function str(val: unknown): string {
  return typeof val === "string" ? val.trim() : "";
}

function normalizeProducts(input: unknown, fallbackSourceUrl: string): NormalizedProduct[] {
  const unwrapped = unwrapOutput(input);
  if (!unwrapped || typeof unwrapped !== "object") return [];

  let list: unknown[] | null = null;
  const obj = unwrapped as Record<string, unknown>;
  if (Array.isArray(obj.products)) list = obj.products as unknown[];
  else if (Array.isArray(obj.items)) list = obj.items as unknown[];
  else if (Array.isArray(unwrapped)) list = unwrapped as unknown[];
  if (!list) return [];

  const out: NormalizedProduct[] = [];
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const name = str(e.name) || str(e.productName) || str(e.product_name) || str(e.title);
    if (!name) continue;
    out.push({
      name,
      brand: str(e.brand) || str(e.manufacturer) || "",
      variant: str(e.variant) || str(e.flavor) || str(e.flavour) || "",
      packSize:
        str(e.packSize) || str(e.pack_size) || str(e.size) || str(e.quantity) || str(e.weight) || "",
      displayPrice:
        str(e.displayPrice) ||
        str(e.price) ||
        str(e.displayedPrice) ||
        str(e.listedPrice) ||
        str(e.mrp) ||
        "",
      currency: str(e.currency) || "INR",
      discount: str(e.discount) || str(e.discountPct) || str(e.discount_text) || "",
      availability:
        str(e.availability) ||
        str(e.inStock) ||
        str(e.in_stock) ||
        str(e.stock) ||
        "",
      imageUrl: str(e.imageUrl) || str(e.image_url) || str(e.image) || str(e.thumbnail) || "",
      sourceUrl: str(e.sourceUrl) || str(e.url) || str(e.link) || str(e.productUrl) || fallbackSourceUrl,
    });
  }
  return out;
}

function authHeaders(apiKey: string): Record<string, string> {
  return { "X-API-Key": apiKey, "Content-Type": "application/json" };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed. Use POST." }, 405);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "Request body must be valid JSON." }, 400);
  }
  const data = body as Record<string, unknown> | null;
  if (!data || typeof data !== "object") {
    return jsonResponse({ ok: false, error: "Request body must be a JSON object." }, 400);
  }

  const validation = validateUrl(typeof data.url === "string" ? data.url : "");
  if (!validation.ok) {
    return jsonResponse({ ok: false, error: validation.error }, 400);
  }
  const targetUrl = validation.url.toString();

  const apiKey = Deno.env.get("TINYFISH_API_KEY");
  if (!apiKey || apiKey.trim() === "") {
    return jsonResponse(
      {
        ok: false,
        source: "live",
        error: "TinyFish API key is not configured. Set TINYFISH_API_KEY as an edge function secret.",
      },
      503
    );
  }

  const goal =
    "Visit this grocery retailer search page and extract every product listed. For each product return: " +
    "name (product name as shown), brand (the brand/manufacturer if shown, else empty string), " +
    "variant (flavour/variant/type if shown, else empty string), " +
    "packSize (the pack size or quantity shown, e.g. '1 kg', '500 g', '2 L', else empty string), " +
    "displayPrice (the exact price text shown on the page, including currency symbol, else empty string), " +
    "currency (the currency code if determinable, e.g. 'INR', else 'INR'), " +
    "discount (any discount text shown, e.g. '10% off' or empty string), " +
    "availability (e.g. 'in stock', 'out of stock', or empty string if unknown), " +
    "imageUrl (URL of the product's image if shown, else empty string), and " +
    "sourceUrl (the URL of the individual product page if available, otherwise the current page URL). " +
    "Return ONLY valid JSON with the shape { \"products\": [ { name, brand, variant, packSize, displayPrice, currency, discount, availability, imageUrl, sourceUrl } ] }. " +
    "Only include products you can actually see on the page. Do not invent prices, brands, pack sizes or discounts. " +
    "If a field is not visible, return an empty string for that field rather than guessing.";

  const deadline = Date.now() + TOTAL_DEADLINE_MS;

  // Step 1: start an async run.
  let runId = "";
  try {
    const startRes = await fetch(TINYFISH_RUN_ASYNC_URL, {
      method: "POST",
      headers: authHeaders(apiKey),
      body: JSON.stringify({ url: targetUrl, goal }),
    });

    if (!startRes.ok) {
      const status = startRes.status;
      const parsed = await safeJson(startRes);
      const detail = parsed.ok ? extractErrorDetail(parsed.data) : parsed.error;
      const msg = detail
        ? `TinyFish request failed (${status}): ${detail}`
        : `TinyFish request failed (${status}).`;
      return jsonResponse({ ok: false, source: "live", error: msg }, 502);
    }

    const parsedStart = await safeJson(startRes);
    if (!parsedStart.ok) {
      return jsonResponse({ ok: false, source: "live", error: parsedStart.error }, 502);
    }
    const startData = parsedStart.data as Record<string, unknown>;
    runId = str(startData.id) || str(startData.run_id) || str(startData.runId);
    if (!runId) {
      return jsonResponse(
        { ok: false, source: "live", error: "TinyFish did not return a run ID." },
        502
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to start TinyFish run.";
    return jsonResponse({ ok: false, source: "live", error: msg }, 502);
  }

  // Step 2: poll the run status until it completes or the deadline expires.
  await sleep(INITIAL_POLL_DELAY_MS);

  let lastStatus = "";
  try {
    while (Date.now() < deadline) {
      const pollRes = await fetch(`${TINYFISH_RUNS_BASE}/${runId}`, {
        method: "GET",
        headers: authHeaders(apiKey),
      });

      if (!pollRes.ok) {
        const status = pollRes.status;
        const parsed = await safeJson(pollRes);
        const detail = parsed.ok ? extractErrorDetail(parsed.data) : parsed.error;
        const msg = detail
          ? `TinyFish poll failed (${status}): ${detail}`
          : `TinyFish poll failed (${status}).`;
        return jsonResponse({ ok: false, source: "live", error: msg }, 502);
      }

      const parsedPoll = await safeJson(pollRes);
      if (!parsedPoll.ok) {
        return jsonResponse({ ok: false, source: "live", error: parsedPoll.error }, 502);
      }

      const runData = parsedPoll.data as Record<string, unknown>;
      lastStatus = str(runData.status).toUpperCase();

      if (lastStatus === "COMPLETED") {
        const output =
          runData.output ??
          runData.result ??
          runData.data ??
          runData;
        const products = normalizeProducts(output, targetUrl);
        const productCount = products.length;
        return jsonResponse({
          ok: true,
          source: "live",
          sourceUrl: targetUrl,
          fetchedAt: new Date().toISOString(),
          productCount,
          products,
        });
      }

      if (lastStatus === "FAILED" || lastStatus === "CANCELLED") {
        const detail = extractErrorDetail(runData);
        const msg = detail
          ? `TinyFish run ${lastStatus.toLowerCase()}: ${detail}`
          : `TinyFish run ${lastStatus.toLowerCase()}.`;
        return jsonResponse({ ok: false, source: "live", error: msg }, 502);
      }

      // PENDING or RUNNING — keep polling.
      await sleep(POLL_INTERVAL_MS);
    }

    // Deadline expired while still running.
    return jsonResponse(
      {
        ok: false,
        source: "live",
        error: `TinyFish run did not finish in time (last status: ${lastStatus || "RUNNING"}). Try again.`,
      },
      504
    );
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return jsonResponse(
        { ok: false, source: "live", error: "TinyFish request timed out. Try again." },
        504
      );
    }
    const msg = err instanceof Error ? err.message : "Unexpected error polling TinyFish.";
    return jsonResponse({ ok: false, source: "live", error: msg }, 502);
  }
});
