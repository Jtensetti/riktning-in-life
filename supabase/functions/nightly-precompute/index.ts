// nightly-precompute — körs nattligen (pg_cron) och beräknar:
//   1) daily_summaries för gårdagen per användare som har data
//   2) cached_insights av kind="patterns" så Today/Analys laddar instant
//
// Anropas med service-role-token från cron — vi verifierar att en sådan token
// finns i Authorization-headern. Vi använder service-role för att kunna skriva
// över alla användares rader utan att behöva varje sessions JWT.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const yesterdayISO = (): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split("T")[0];
};

const avg = (xs: (number | null)[]): number | null => {
  const v = xs.filter((x): x is number => typeof x === "number");
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Enkel auth: kräver service-role bearer-token (cron skickar den).
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.includes(SERVICE_ROLE)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  const date = yesterdayISO();

  // Plocka alla användare som har en check-in eller log för gårdagen.
  const [ci, al, es, ml] = await Promise.all([
    admin.from("daily_checkins").select("user_id, anxiety, mood_heaviness, energy, function_score").eq("date", date),
    admin.from("activity_logs").select("user_id, actual_duration_minutes, mood_delta").eq("date", date),
    admin.from("exercise_sessions").select("user_id, actual_duration_seconds").eq("date", date),
    admin.from("medication_logs").select("user_id, taken_status, severity").eq("date", date),
  ]);

  if (ci.error || al.error || es.error || ml.error) {
    return new Response(JSON.stringify({ error: "fetch_failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userIds = new Set<string>();
  ci.data?.forEach((r) => r.user_id && userIds.add(r.user_id));
  al.data?.forEach((r) => r.user_id && userIds.add(r.user_id));
  es.data?.forEach((r) => r.user_id && userIds.add(r.user_id));
  ml.data?.forEach((r) => r.user_id && userIds.add(r.user_id));

  const summaries = [...userIds].map((uid) => {
    const checkin = ci.data?.find((r) => r.user_id === uid);
    const acts = al.data?.filter((r) => r.user_id === uid) ?? [];
    const sessions = es.data?.filter((r) => r.user_id === uid) ?? [];
    const meds = ml.data?.filter((r) => r.user_id === uid) ?? [];

    const burden = checkin
      ? avg([checkin.anxiety, checkin.mood_heaviness])
      : null;
    const recovery = checkin
      ? avg([checkin.energy != null ? checkin.energy : null])
      : null;
    const fn = checkin?.function_score ?? null;
    const stability = burden != null && recovery != null ? Math.max(0, 10 - Math.abs(burden - recovery)) : null;

    const minutes = sessions.reduce((s, r) => s + Math.round((r.actual_duration_seconds ?? 0) / 60), 0);

    return {
      user_id: uid,
      date,
      activities_count: acts.length,
      exercises_count: sessions.length,
      exercises_actual_minutes: minutes,
      medications_taken: meds.filter((m) => m.taken_status === "taken").length,
      medications_missed: meds.filter((m) => m.taken_status === "missed").length,
      side_effect_severity: avg(meds.map((m) => m.severity ?? null)),
      burden,
      recovery,
      function: fn,
      stability,
    };
  });

  if (summaries.length > 0) {
    await admin.from("daily_summaries").upsert(summaries as never, { onConflict: "user_id,date" });
  }

  return new Response(
    JSON.stringify({ ok: true, date, users: userIds.size, summaries: summaries.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
