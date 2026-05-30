import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCOPES = [
  "design:content:write",
  "design:meta:read",
  "design:content:read",
  "asset:write",
  "asset:read",
  "brandtemplate:meta:read",
  "brandtemplate:content:read",
  "profile:read",
].join(" ");

function base64url(bytes: Uint8Array): string {
  let s = btoa(String.fromCharCode(...bytes));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(input: string): Promise<Uint8Array> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return new Uint8Array(buf);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const CLIENT_ID = Deno.env.get("CANVA_CLIENT_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!CLIENT_ID) throw new Error("CANVA_CLIENT_ID não configurado");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "no auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "invalid user" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { redirect_to } = await req.json().catch(() => ({}));

    // PKCE
    const verifierBytes = new Uint8Array(64);
    crypto.getRandomValues(verifierBytes);
    const codeVerifier = base64url(verifierBytes);
    const codeChallenge = base64url(await sha256(codeVerifier));
    const stateBytes = new Uint8Array(32);
    crypto.getRandomValues(stateBytes);
    const state = base64url(stateBytes);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { error: insErr } = await admin.from("canva_oauth_state").insert({
      state, user_id: user.id, code_verifier: codeVerifier, redirect_to: redirect_to || null,
    });
    if (insErr) throw insErr;

    const redirectUri = `${SUPABASE_URL}/functions/v1/canva-oauth-callback`;
    const url = new URL("https://www.canva.com/api/oauth/authorize");
    url.searchParams.set("client_id", CLIENT_ID);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", SCOPES);
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");

    return new Response(JSON.stringify({ authorize_url: url.toString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("canva-oauth-start error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});