// Reads a recipe from a screenshot or a short PDF with Claude and returns it as fields for the
// recipe form.
// The Anthropic key lives only here, as the ANTHROPIC_API_KEY secret; the app never sees it.
// Each account may read a few screenshots a day, premium accounts many more, and admins any number.
import Anthropic from "npm:@anthropic-ai/sdk@1";
import { createClient } from "npm:@supabase/supabase-js@2";

const FREE_PER_DAY = 3;
const PREMIUM_PER_DAY = 30;
const MEALS = ["breakfast", "lunch", "dinner", "snack", "dessert"];
// The app's units, as the database stores them.
const UNITS = ["pcs", "g", "kg", "ml", "cup", "tbsp", "tsp", "can", "bag", "head", "loaf"];
const LANGUAGE = { he: "Hebrew", en: "English", ru: "Russian" } as const;
// Screenshots of one long recipe are read together, as one fill.
const SHOTS_MAX = 4;
// A PDF is read page by page and each page costs about as much as a screenshot.
const PDF_MAX_BYTES = 5 * 1024 * 1024;
const PDF_MAX_PAGES = 5;

/** Roughly how many pages a PDF has: its page objects. 0 when they're packed where this can't see. */
function pageCount(base64: string): number {
  const text = atob(base64);
  return (text.match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
}

const SCHEMA = {
  type: "object",
  properties: {
    is_recipe: { type: "boolean", description: "false when the image shows no recipe" },
    name: { type: "string" },
    description: { type: "string", description: "one short sentence, or empty" },
    serves: { type: "integer", description: "how many people the amounts are for; 4 if the image doesn't say" },
    minutes: { type: "integer", description: "total preparation time in minutes; estimate if the image doesn't say" },
    meal: { type: "string", enum: MEALS },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "the ingredient alone, without amount or preparation" },
          qty: { type: "number", description: "amount in the unit, for the people in serves" },
          unit: { type: "string", enum: UNITS },
        },
        required: ["name", "qty", "unit"],
        additionalProperties: false,
      },
    },
    steps: { type: "array", items: { type: "string" }, description: "one step per item, in order" },
  },
  required: ["is_recipe", "name", "description", "serves", "minutes", "meal", "ingredients", "steps"],
  additionalProperties: false,
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  // Who is asking: the signed-in user's own token, so the database's rules apply as them.
  // The project's publishable key (the legacy anon key only if there is none).
  const publishable = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}") as Record<string, string>;
  const publicKey = publishable.default ?? Object.values(publishable)[0] ?? Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, publicKey, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return reply(401, { error: "signed_out" });

  const body = await req.json().catch(() => ({}));
  const { pdf, lang } = body;
  // One screenshot (as older versions of the app send it) or several, in order.
  const images: unknown[] = Array.isArray(body.images) ? body.images : body.image ? [body.image] : [];
  if (typeof pdf === "string" && pdf) {
    // Only the size and the page count go to the log, never the file.
    const bytes = Math.floor(pdf.length * 3 / 4), pages = pageCount(pdf);
    console.info(`pdf: ${(bytes / 1024 / 1024).toFixed(2)} MB, ${pages || "unknown"} pages`);
    if (bytes > PDF_MAX_BYTES) return reply(413, { error: "pdf_too_big" });
    if (pages > PDF_MAX_PAGES) return reply(413, { error: "pdf_too_long", pages: PDF_MAX_PAGES });
  } else if (!images.length || images.length > SHOTS_MAX || images.some((i) => typeof i !== "string" || !i || i.length > 7_000_000)) {
    return reply(400, { error: "bad_image" });
  }
  const language = LANGUAGE[lang as keyof typeof LANGUAGE] ?? "Hebrew";
  const sources = typeof pdf === "string" && pdf
    ? [{ type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: pdf } }]
    : (images as string[]).map((data) => ({ type: "image" as const, source: { type: "base64" as const, media_type: "image/jpeg" as const, data } }));

  // is_premium is set only by the payment webhook, and admins are added by hand in the
  // database; users can't change either themselves.
  const [profile, admin] = await Promise.all([
    supabase.from("profiles").select("is_premium").eq("id", user.id).single(),
    supabase.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
  ]);
  const limit = admin.data ? Infinity : profile.data?.is_premium ? PREMIUM_PER_DAY : FREE_PER_DAY;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const used = await supabase.from("recipe_imports").select("id", { count: "exact", head: true }).gte("created_at", since);
  if (used.error) return reply(500, { error: "server" });
  if ((used.count ?? 0) >= limit) return reply(429, { error: "limit", limit, premium: !!profile.data?.is_premium });

  const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
  let response;
  try {
    response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      // A declined request is re-run on Anthropic's recommended fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      messages: [{
        role: "user",
        content: [
          ...sources,
          {
            type: "text",
            text: `${sources.length > 1 ? `These ${sources.length} screenshots are parts of one recipe, in order, from` : "This is a screenshot or a document from"} a family meal-planning app's user. Read the recipe (the first one, if there are several) and fill in the fields, writing every text in ${language} (translate if the recipe is in another language). ` +
              `Give each ingredient's amount in the unit that fits it best from the list; amounts like "a pinch" or "to taste" become a small amount in tsp. ` +
              `Split the method into short steps. Pick the meal the dish suits best. If it shows no recipe, set is_recipe to false and leave the rest empty.`,
          },
        ],
      }],
    });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return reply(503, { error: "busy" });
    if (e instanceof Anthropic.APIError) return reply(502, { error: "claude", status: e.status });
    return reply(502, { error: "claude" });
  }

  if (response.stop_reason === "refusal") return reply(422, { error: "refused" });
  const text = response.content.find((b) => b.type === "text");
  let recipe;
  try {
    recipe = JSON.parse(text && text.type === "text" ? text.text : "");
  } catch {
    return reply(502, { error: "unreadable" });
  }
  if (!recipe.is_recipe) return reply(422, { error: "not_a_recipe" });

  // Only a recipe that was read counts toward the day's limit, however many screenshots it took.
  await supabase.from("recipe_imports").insert({ user_id: user.id });
  return reply(200, { recipe, left: limit === Infinity ? null : limit - (used.count ?? 0) - 1 });
});
