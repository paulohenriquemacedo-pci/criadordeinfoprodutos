import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CANVA_API = "https://api.canva.com/rest/v1";

async function refreshIfNeeded(admin: any, conn: any) {
  const expires = new Date(conn.expires_at).getTime();
  if (expires - Date.now() > 60_000) return conn.access_token;

  const CLIENT_ID = Deno.env.get("CANVA_CLIENT_ID")!;
  const CLIENT_SECRET = Deno.env.get("CANVA_CLIENT_SECRET")!;
  const r = await fetch(`${CANVA_API}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: conn.refresh_token }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Refresh falhou: ${JSON.stringify(j)}`);
  const expiresAt = new Date(Date.now() + (j.expires_in ?? 3600) * 1000).toISOString();
  await admin.from("canva_connections").update({
    access_token: j.access_token,
    refresh_token: j.refresh_token ?? conn.refresh_token,
    expires_at: expiresAt,
  }).eq("user_id", conn.user_id);
  return j.access_token;
}

async function uploadImage(token: string, imageUrl: string, name: string): Promise<string> {
  const imgResp = await fetch(imageUrl);
  if (!imgResp.ok) throw new Error(`Falha ao baixar imagem: ${imgResp.status}`);
  const bytes = new Uint8Array(await imgResp.arrayBuffer());
  const metadata = btoa(unescape(encodeURIComponent(JSON.stringify({ name_base64: btoa(name) }))));

  const up = await fetch(`${CANVA_API}/asset-uploads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
      "Asset-Upload-Metadata": metadata,
    },
    body: bytes,
  });
  const upJson = await up.json();
  if (!up.ok) throw new Error(`Upload asset falhou: ${JSON.stringify(upJson)}`);
  let jobId = upJson.job?.id;
  let assetId = upJson.job?.asset?.id;
  let status = upJson.job?.status;

  // Poll
  for (let i = 0; i < 30 && status !== "success"; i++) {
    if (status === "failed") throw new Error("Upload asset falhou no Canva");
    await new Promise(r => setTimeout(r, 1000));
    const poll = await fetch(`${CANVA_API}/asset-uploads/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pj = await poll.json();
    if (!poll.ok) throw new Error(`Poll asset falhou: ${JSON.stringify(pj)}`);
    status = pj.job?.status;
    assetId = pj.job?.asset?.id ?? assetId;
  }
  if (!assetId) throw new Error("Asset ID não retornado pelo Canva");
  return assetId;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const FEED_TPL = Deno.env.get("CANVA_FEED_TEMPLATE_ID");
    const STORY_TPL = Deno.env.get("CANVA_STORY_TEMPLATE_ID");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "no auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "invalid user" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { format, title, subtitle, body, cta, imageUrl } = await req.json();
    const tplId = format === "story" ? STORY_TPL : FEED_TPL;
    if (!tplId) throw new Error(`Brand template não configurado para formato '${format}'`);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: conn, error: cErr } = await admin
      .from("canva_connections").select("*").eq("user_id", user.id).maybeSingle();
    if (cErr) throw cErr;
    if (!conn) return new Response(JSON.stringify({ error: "not_connected" }), {
      status: 412, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const token = await refreshIfNeeded(admin, conn);

    // Build autofill data
    const data: Record<string, any> = {};
    if (title) data.titulo = { type: "text", text: String(title) };
    if (subtitle) data.subtitulo = { type: "text", text: String(subtitle) };
    if (body) data.corpo = { type: "text", text: String(body) };
    if (cta) data.cta = { type: "text", text: String(cta) };
    if (imageUrl) {
      const assetId = await uploadImage(token, imageUrl, "post-image");
      data.imagem = { type: "image", asset_id: assetId };
    }

    const af = await fetch(`${CANVA_API}/autofills`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ brand_template_id: tplId, data }),
    });
    const afJson = await af.json();
    if (!af.ok) {
      const msg = JSON.stringify(afJson);
      if (af.status === 403 || /plan|enterprise|teams|brand_template/i.test(msg)) {
        return new Response(JSON.stringify({ error: "plan_required", detail: afJson }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Autofill falhou: ${msg}`);
    }
    let job = afJson.job;
    for (let i = 0; i < 60 && job?.status !== "success"; i++) {
      if (job?.status === "failed") throw new Error(`Autofill falhou: ${JSON.stringify(job)}`);
      await new Promise(r => setTimeout(r, 1500));
      const poll = await fetch(`${CANVA_API}/autofills/${job.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pj = await poll.json();
      if (!poll.ok) throw new Error(`Poll autofill: ${JSON.stringify(pj)}`);
      job = pj.job;
    }
    const editUrl = job?.result?.design?.url ?? job?.result?.design?.urls?.edit_url;
    if (!editUrl) throw new Error(`URL do design não retornada: ${JSON.stringify(job)}`);

    return new Response(JSON.stringify({ edit_url: editUrl, design: job.result.design }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("canva-autofill error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});