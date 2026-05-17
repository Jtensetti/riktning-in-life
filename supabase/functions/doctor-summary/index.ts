// Doctor Summary — kort klartext-narrativ för läkaren utifrån
// vårdrapportens råa siffror. Modellen får ALDRIG diagnostisera.
// Inga AI-anrop utan inloggad användare; data hämtas via SECURITY
// DEFINER-RPC:n get_clinical_report som låser till auth.uid().

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Summary = {
  headline: string;
  whats_changed: string;
  whats_working: string;
  whats_worrying: string;
  recommended_focus: string;
  flags: string[];
};

const SYSTEM_PROMPT = `Du skriver en saklig vårdrapportsammanfattning på svenska
för en behandlare (läkare/psykolog). Ton: neutral, klinisk, omsorgsfull —
aldrig alarmerande, aldrig diagnostisk.

REGLER (obligatoriska):
- Diagnostisera ALDRIG. Använd aldrig DSM/ICD-termer som slutsats.
- Använd BARA siffror, datum och fält som finns i payloaden. Hitta inget.
- Om datan är tunn (få incheckningar, ingen skattning): säg det rakt och
  håll meningarna korta. Föreslå inget medicinskt.
- Skriv om patienten i tredje person ("patienten", "hen") — detta läses av
  vården, inte patienten.
- Inga emojis, inga utropstecken.

Använd verktyget doctor_summary för att returnera ditt svar.`;

const buildUserPrompt = (report: unknown, period: { start: string; end: string }) => {
  return `Period: ${period.start} → ${period.end}.

Här är patientens aggregerade data för perioden (JSON). Skriv en kort,
saklig sammanfattning enligt verktygsschemat.

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

    let body: { start?: string; end?: string } = {};
    try {
      body = await req.json();
    } catch {
      // tom body ok
    }

    const isISO = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
    if (!isISO(body.start) || !isISO(body.end)) {
      return new Response(JSON.stringify({ error: "invalid_range" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: report, error: rpcErr } = await supabase.rpc(
      "get_clinical_report" as never,
      { p_start: body.start, p_end: body.end } as never,
    );
    if (rpcErr) {
      console.error("get_clinical_report failed:", rpcErr);
      return new Response(JSON.stringify({ error: "report_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(report, { start: body.start!, end: body.end! }) },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "doctor_summary",
              description: "Strukturerad sammanfattning för vården. Alla fält obligatoriska.",
              parameters: {
                type: "object",
                properties: {
                  headline: { type: "string", description: "Max 90 tecken, neutral rubrik." },
                  whats_changed: { type: "string", description: "2 meningar om vad som rört sig under perioden, med siffror." },
                  whats_working: { type: "string", description: "1–2 meningar om vad som verkar fungera." },
                  whats_worrying: { type: "string", description: "1–2 meningar om vad behandlaren bör titta på." },
                  recommended_focus: { type: "string", description: "1 mening — neutralt formulerat fokusområde inför nästa besök." },
                  flags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Korta nyckelord, t.ex. 'kort sömn', 'biverkningar'. Aldrig diagnoser.",
                  },
                },
                required: ["headline", "whats_changed", "whats_working", "whats_worrying", "recommended_focus", "flags"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "doctor_summary" } },
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

    let summary: Summary;
    try {
      summary = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Failed to parse tool args:", e);
      return new Response(JSON.stringify({ error: "ai_parse_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ summary, period: { start: body.start, end: body.end } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("doctor-summary error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
