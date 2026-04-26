// Weekly Insight — varm, kort sammanfattning av användarens vecka.
// - Anropar Lovable AI Gateway (google/gemini-3-flash-preview) med tool calling
//   för att garantera ett strukturerat JSON-svar.
// - Cachar resultatet i `weekly_insights` (en rad per vecka).
// - Modellen får aldrig diagnostisera och måste alltid referera till siffrorna
//   i payloaden.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Insight = {
  headline: string;
  trend_summary: string;
  bright_spot: string;
  one_thing_to_try: string;
  flags: string[];
};

const SYSTEM_PROMPT = `Du är en varm, jordnära coach för en svensk app om psykisk hälsa.
Skriv på svenska, i andra person ("du"), kort och konkret.

REGLER (obligatoriska):
- Diagnostisera ALDRIG. Skriv aldrig något som låter alarmerande.
- Använd bara siffror som finns i payloaden. Hitta inte på.
- Om datan är tunn: säg det rakt — föreslå små steg, inte slutsatser.
- Om "safety_status" indikerar fara — håll dig stödjande, undvik prestationsspråk,
  och föreslå att kontakta vården eller en stödlinje istället för en övning.

Använd verktyget weekly_insight för att returnera ditt svar.`;

const buildUserPrompt = (report: unknown) => {
  return `Här är användarens senaste 14 dagars data (JSON). Skriv en kort,
varm veckosammanfattning enligt verktygsschemat.

DATA:
${JSON.stringify(report)}`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "not_authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "missing_api_key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "not_authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    let body: { force?: boolean; week_start?: string } = {};
    try {
      body = await req.json();
    } catch {
      // tom body är ok
    }

    // Beräkna veckans startdag (måndag).
    const computeWeekStart = (iso?: string): string => {
      const base = iso ? new Date(iso) : new Date();
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
      const day = d.getDay(); // 0=sön
      const diff = (day + 6) % 7;
      d.setDate(d.getDate() - diff);
      return d.toISOString().split("T")[0];
    };
    const weekStart = computeWeekStart(body.week_start);

    // Cache-kontroll: returnera befintlig om < 24h gammal och inte force.
    if (!body.force) {
      const { data: cached } = await supabase
        .from("weekly_insights")
        .select("payload, created_at")
        .eq("user_id", userId)
        .eq("week_start", weekStart)
        .maybeSingle();
      if (cached) {
        return new Response(
          JSON.stringify({ insight: cached.payload, cached: true, week_start: weekStart }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Hämta veckorapporten via befintlig RPC.
    const { data: report, error: reportErr } = await supabase.rpc("get_weekly_report");
    if (reportErr) {
      console.error("get_weekly_report failed:", reportErr);
      return new Response(JSON.stringify({ error: "report_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Anropa Lovable AI Gateway med tool calling.
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(report) },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "weekly_insight",
              description: "Strukturerad veckosammanfattning. Alla fält är obligatoriska.",
              parameters: {
                type: "object",
                properties: {
                  headline: { type: "string", description: "Max 60 tecken, varm ton." },
                  trend_summary: { type: "string", description: "2–3 meningar, du-form, måste citera siffror." },
                  bright_spot: { type: "string", description: "1 mening om något som gick bra denna vecka." },
                  one_thing_to_try: { type: "string", description: "Konkret, vänligt förslag — aldrig krav." },
                  flags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Valfri lista, t.ex. 'kort sömn'. Aldrig diagnoser.",
                  },
                },
                required: ["headline", "trend_summary", "bright_spot", "one_thing_to_try", "flags"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "weekly_insight" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "rate_limited", message: "Just nu är vi många här. Försök igen om en stund." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "credits_exhausted", message: "AI-krediter behöver fyllas på." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const text = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, text);
      return new Response(JSON.stringify({ error: "ai_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response", JSON.stringify(aiJson).slice(0, 500));
      return new Response(JSON.stringify({ error: "ai_no_tool_call" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let insight: Insight;
    try {
      insight = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Failed to parse tool args:", e);
      return new Response(JSON.stringify({ error: "ai_parse_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Spara i cache (upsert på user_id+week_start).
    const { error: upsertErr } = await supabase
      .from("weekly_insights")
      .upsert(
        { user_id: userId, week_start: weekStart, payload: insight },
        { onConflict: "user_id,week_start" },
      );
    if (upsertErr) {
      console.error("Cache upsert failed:", upsertErr);
      // Returnera ändå — datan är fortfarande användbar
    }

    return new Response(
      JSON.stringify({ insight, cached: false, week_start: weekStart }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("weekly-insight error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
