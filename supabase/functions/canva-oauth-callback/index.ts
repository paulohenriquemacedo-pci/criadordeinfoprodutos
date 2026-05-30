import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

function htmlRedirect(target: string, message: string): Response {
  const safe = target.replace(/"/g, "&quot;");
  const body = `<!doctype html><meta charset="utf-8"><title>${message}</title>
<script>window.location.replace("${safe}");</script>
<p>${message} — <a href="${safe}">continuar</a></p>`;
  return new Response(body, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errParam = url.searchParams.get("error");

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const CLIENT_ID = Deno.env.get("CANVA_CLIENT_ID")!;
  const CLIENT_SECRET = Deno.env.get("CANVA_CLIENT_SECRET")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  let redirectBack = "/";
  try {
    if (errParam) throw new Error(`Canva retornou erro: ${errParam}`);
    if (!code || !state) throw new Error("code/state ausente");

    const { data: stateRow, error: stateErr } = await admin
      .from("canva_oauth_state").select("*").eq("state", state).maybeSingle();
    if (stateErr || !stateRow) throw new Error("state inválido ou expirado");
    redirectBack = stateRow.redirect_to || "/";

    const redirectUri = `${SUPABASE_URL}/functions/v1/canva-oauth-callback`;
    const tokenResp = await fetch("https://api.canva.com/rest/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        code_verifier: stateRow.code_verifier,
        redirect_uri: redirectUri,
      }),
    });
    const tokenJson = await tokenResp.json();
    if (!tokenResp.ok) throw new Error(`Token exchange falhou: ${JSON.stringify(tokenJson)}`);

    const expiresAt = new Date(Date.now() + (tokenJson.expires_in ?? 3600) * 1000).toISOString();

    const { error: upErr } = await admin.from("canva_connections").upsert({
      user_id: stateRow.user_id,
      access_token: tokenJson.access_token,
      refresh_token: tokenJson.refresh_token,
      expires_at: expiresAt,
      scope: tokenJson.scope ?? null,
    }, { onConflict: "user_id" });
    if (upErr) throw upErr;

    await admin.from("canva_oauth_state").delete().eq("state", state);

    const finalUrl = redirectBack + (redirectBack.includes("?") ? "&" : "?") + "canva=connected";
    return htmlRedirect(finalUrl, "Conta Canva conectada");
  } catch (e) {
    console.error("canva-oauth-callback error:", e);
    const finalUrl = redirectBack + (redirectBack.includes("?") ? "&" : "?") +
      "canva=error&msg=" + encodeURIComponent(e instanceof Error ? e.message : String(e));
    return htmlRedirect(finalUrl, "Falha ao conectar Canva");
  }
});