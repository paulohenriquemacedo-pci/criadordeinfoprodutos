(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))i(o);new MutationObserver(o=>{for(const a of o)if(a.type==="childList")for(const s of a.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function n(o){const a={};return o.integrity&&(a.integrity=o.integrity),o.referrerPolicy&&(a.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?a.credentials="include":o.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(o){if(o.ep)return;o.ep=!0;const a=n(o);fetch(o.href,a)}})();const Z="https://koxmzaitmocgsyqiznuw.supabase.co",Q="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtveG16YWl0bW9jZ3N5cWl6bnV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MDMxODYsImV4cCI6MjA5ODE3OTE4Nn0.CpsJoI5ixso_nfcR25Fh_4yxVim_c35ErKaijDH2o6A";function ae(){try{const e=localStorage.getItem("sb-koxmzaitmocgsyqiznuw-auth-token");if(e){const n=JSON.parse(e);if(n&&n.access_token)return n.access_token}}catch(t){console.warn("Erro ao ler token do LocalStorage:",t)}return Q}const S={async getProjects(){return await J("/projects?order=created_at.desc")},async createProject(t,e,n,i){return await se("/projects?select=*",{name:t,niche:e||null,promise:n||null,target_audience:i||null})},async updateProject(t,e,n,i,o){return await ge(`/projects?id=eq.${t}`,{name:e,niche:n||null,promise:i||null,target_audience:o||null})},async getAvatars(){return await J("/avatars?order=id")},async getMarketData(){return await J("/market_data?order=id")},async getModules(){return await J("/modules?order=module_number")},async getModuleContent(t,e){const n=await J(`/modules?project_id=eq.${t}&module_number=eq.${e}`);return n&&n.length>0?n[0]:null},async saveModuleContent(t,e,n,i){const o=await this.getModuleContent(t,e);return o?await ge(`/modules?id=eq.${o.id}`,{generated_content:n,last_updated:new Date().toISOString(),is_outdated:!1}):await se("/modules",{project_id:t,module_number:e,title:i||`Módulo ${e}`,generated_content:n,last_updated:new Date().toISOString(),is_outdated:!1,key_concepts:[]})},async markModulesOutdated(t){return await ge(`/modules?project_id=eq.${t}`,{is_outdated:!0})},async getProjectFiles(t){return await J(`/project_files?project_id=eq.${t}&order=created_at.desc`)},async uploadReferenceFile(t,e,n){const i=Date.now(),o=e.name.replace(/[^a-zA-Z0-9.-]/g,"_"),a=`${t}/${i}_${o}`,s=`${Z}/storage/v1/object/reference-files/${a}`;new FormData().append("file",e),console.log(`[*] Subindo arquivo para o bucket do Supabase: ${e.name}`);const m=await fetch(s,{method:"POST",headers:{apikey:Q,Authorization:`Bearer ${ae()}`,"Content-Type":e.type||"application/pdf"},body:e});if(!m.ok){const c=await m.text();throw new Error(`Erro ao enviar arquivo para o Storage: ${c}`)}await m.json();const x=`${Z}/storage/v1/object/public/reference-files/${a}`,u=await se("/project_files?select=*",{project_id:t,filename:e.name,folder:n||"Geral",file_url:x,processing_status:"processing"}),r=u[0].id;return this.triggerPdfTextExtraction(t,a,e.name,r).catch(c=>{console.error("[EXTRACTION ERROR]",c)}),u[0]},async triggerPdfTextExtraction(t,e,n,i){return await le("/extract-pdf-text",{projectId:t,filePath:e,fileName:n,fileId:i})},async deleteReferenceFile(t,e){let n="";if(e.includes("reference-files/")&&(n=e.split("reference-files/")[1]),n)try{const a=`${Z}/storage/v1/object/reference-files/${n}`;console.log(`[*] Deletando arquivo do storage: ${n}`);const s=await fetch(a,{method:"DELETE",headers:{apikey:Q,Authorization:`Bearer ${ae()}`}});s.ok||console.warn("[STORAGE DELETE WARNING] Falha ao deletar do storage:",await s.text())}catch(a){console.error("[STORAGE DELETE ERROR] Erro ao deletar do storage:",a)}const i=`${Z}/rest/v1/project_files?id=eq.${t}`,o=await fetch(i,{method:"DELETE",headers:{apikey:Q,Authorization:`Bearer ${ae()}`}});if(!o.ok){const a=await o.text();throw new Error(`Erro ao deletar registro do banco: ${a}`)}return{success:!0}},async getModuleVersions(t){return await J(`/module_versions?module_id=eq.${t}&order=created_at.desc`)},async saveModuleVersion(t,e){return await se("/module_versions",{module_id:t,content:e})},async coherenceCheck(t,e,n,i,o){return await le("/coherence-check",{briefing:t,moduleNumber:e,moduleTitle:n,moduleContent:i,previousModules:o})},async generateModuleStream(t,e,n,i,o,a,s,p,m){var x,u,r;try{const[c,g,h]=await Promise.all([J(`/projects?id=eq.${t}`),J(`/modules?project_id=eq.${t}&order=module_number`),J(`/project_files?project_id=eq.${t}`)]),f=c&&c.length>0?`BRIEFING DO PROJETO:
Nome: ${c[0].name}
Nicho: ${c[0].niche}
Promessa: ${c[0].promise}
Público: ${c[0].target_audience}`:"",P=g?g.filter(L=>L.generated_content&&L.module_number!==e).map(L=>`Módulo ${L.module_number} (${L.title}):
${L.generated_content}`).join(`

---

`):"",w=h?h.filter(L=>L.extracted_text).map(L=>`Arquivo (${L.folder}/${L.filename}):
${L.extracted_text}`).join(`

---

`):"",A=`${Z}/functions/v1/generate-module`,C=await fetch(A,{method:"POST",headers:{apikey:Q,Authorization:`Bearer ${ae()}`,"Content-Type":"application/json"},body:JSON.stringify({moduleNumber:e,customPrompt:n,provider:i,model:o,funnelStage:a,briefing:f,previousOutputs:P,referenceFilesText:w.slice(0,1e5)})});if(!C.ok){const L=await C.text();throw new Error(L)}const z=C.body.getReader(),X=new TextDecoder("utf-8");let ee="";for(;;){const{done:L,value:te}=await z.read();if(L){p();break}ee+=X.decode(te,{stream:!0});const M=ee.split(`
`);ee=M.pop();for(const R of M){const N=R.trim();if(N.startsWith("data: ")){const H=N.substring(6);if(H==="[DONE]"){p();return}try{const K=((r=(u=(x=JSON.parse(H).choices)==null?void 0:x[0])==null?void 0:u.delta)==null?void 0:r.content)||"";K&&s(K)}catch{}}}}}catch(c){console.error("[STREAM ERROR]",c),m(c)}},async generatePostImage(t,e,n,i){return await le("/generate-post-image",{prompt:t,style:e,width:n,height:i})},async searchStockImages(t,e=12,n="portrait"){return await le("/search-stock-images",{query:t,perPage:e,orientation:n})},async generatePostCaption(t,e,n,i,o,a="profissional e engajante",s="Instagram"){return await le("/generate-post-caption",{headline:t,subheadline:e,body:n,niche:i,targetAudience:o,tone:a,platform:s})},async localGetHealth(){return await _("/health")},async localGetSettings(){return await _("/settings")},async localUpdateSettings(t){return await _("/settings",{method:"POST",body:JSON.stringify(t)})},async localGetKbStats(){return await _("/kb/stats")},async localGetKbFiles(){return await _("/kb/files")},async localGetAvatars(){return await _("/kb/avatars")},async localGetMarketData(){return await _("/kb/market-data")},async localGetModules(){return await _("/kb/modules")},async localForceSync(){return await _("/kb/sync",{method:"POST"})},async localGetGenerations(t=50){return await _(`/generations?limit=${t}`)},async localRateGeneration(t,e){return await _("/generations/rate",{method:"POST",body:JSON.stringify({generation_id:t,rating:e})})},async localGenerateMetaAds(t,e,n,i,o,a){return await _("/generate/meta-ads",{method:"POST",body:JSON.stringify({avatar_id:t||null,market_data_id:e||null,custom_prompt:n||null,provider:i||null,model:o||null,funnel_stage:a||"TOPO"})})},async localGenerateInstagram(t,e,n,i,o,a){return await _("/generate/instagram",{method:"POST",body:JSON.stringify({module_id:t,custom_prompt:e||null,provider:n||null,model:i||null,funnel_stage:o||"TOPO",post_type:a||"carrossel"})})},async localGenerateBlog(t,e,n,i,o,a){return await _("/generate/blog-post",{method:"POST",body:JSON.stringify({keyword:t,custom_prompt:e||null,provider:n||null,model:i||null,funnel_stage:o||"TOPO",output_format:a||"markdown"})})},async localGenerateProduct(t,e,n,i,o){return await _("/generate/product",{method:"POST",body:JSON.stringify({module_id:t,custom_prompt:e||null,provider:n||null,model:i||null,funnel_stage:o||"TOPO"})})},async localGenerateThemes(t,e,n,i,o,a,s,p=null){return await _("/generate/themes",{method:"POST",body:JSON.stringify({funnel_stage:t,priority_icp:e,round_objective:n,qty_per_stage:parseInt(i)||5,target_channel:o,provider:a||null,model:s||null,custom_subject:p})})},async localGenerateCampaign(t,e,n,i,o){return await _("/generate/campaign",{method:"POST",body:JSON.stringify({theme:t,provider:e||null,model:n||null,output_format:i||"markdown",insta_post_type:o||"carrossel"})})},async localAdaptContent(t,e,n,i,o,a,s){return await _("/generate/adapt",{method:"POST",body:JSON.stringify({content:t,source_format:e,target_format:n,provider:i||null,model:o||null,output_format:a||"markdown",custom_rules:s||null})})},async localPerplexitySearch(t,e=null,n=null){return await _("/perplexity/search",{method:"POST",body:JSON.stringify({query:t,system_prompt:e,model:n})})},async restGet(t){return await J(t)},async restPost(t,e){return await se(t,e)},async restPatch(t,e){return await ge(t,e)},async driveStatus(){return await _("/drive/status")},async driveSync(){return await _("/drive/sync",{method:"POST"})},async driveSyncWait(){return await _("/drive/sync-wait",{method:"POST"})},async driveListFiles(){return await _("/drive/files")}};async function J(t){const e=`${Z}/rest/v1${t}`,n=await fetch(e,{headers:{apikey:Q,Authorization:`Bearer ${ae()}`}});if(!n.ok)throw new Error(`Falha Supabase GET ${t}: ${n.statusText}`);return await n.json()}async function se(t,e){const n=`${Z}/rest/v1${t}`,i=await fetch(n,{method:"POST",headers:{apikey:Q,Authorization:`Bearer ${ae()}`,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify(e)});if(!i.ok){const o=await i.text();throw new Error(`Falha Supabase POST ${t}: ${o}`)}return await i.json()}async function ge(t,e){const n=`${Z}/rest/v1${t}`,i=await fetch(n,{method:"PATCH",headers:{apikey:Q,Authorization:`Bearer ${ae()}`,"Content-Type":"application/json"},body:JSON.stringify(e)});if(!i.ok){const o=await i.text();throw new Error(`Falha Supabase PATCH ${t}: ${o}`)}return i.status===204?{success:!0}:await i.json()}async function le(t,e){const n=`${Z}/functions/v1${t}`,i=await fetch(n,{method:"POST",headers:{apikey:Q,Authorization:`Bearer ${ae()}`,"Content-Type":"application/json"},body:JSON.stringify(e)});if(!i.ok){const o=await i.text();throw new Error(`Falha Edge Function ${t}: ${o}`)}return await i.json()}const Ce="https://command-center-backend-veq6.onrender.com/api";async function _(t,e={}){const n=`${Ce}${t}`,i={"Content-Type":"application/json",...e.headers},o={...e,headers:i};try{const a=await fetch(n,o);if(!a.ok){const s=await a.json().catch(()=>({}));throw new Error(s.detail||`Erro na API Local: ${a.statusText}`)}return await a.json()}catch(a){throw console.error(`Erro no endpoint local ${t}:`,a),a}}const l={currentPage:"dashboard",activeProjectId:localStorage.getItem("activeProjectId")||null,activeProject:null,projectsList:[],kbFiles:[],avatars:[],marketData:[],modules:[],activeGenerationText:"",coherenceReport:null,localHealth:!1,localSettings:{groq_api_key:"",openrouter_api_key:"",perplexity_api_key:"",gemini_api_key:"",unsplash_access_key:"",default_provider:"groq",workspace_path:"d:/0 - SISTEMA ACADEMIA"},localKbStats:{total_files:0,total_words:0},localKbFiles:[],localAvatars:[],localMarketData:[],localModules:[],localActiveProvider:"groq",localActiveModel:"llama-3.3-70b-versatile",localActiveGeneration:null,localActiveCampaignPieces:{meta_ads:"",instagram:"",blog:""}};document.addEventListener("DOMContentLoaded",async()=>{$e(),await ve(),oe(l.currentPage),oe(l.currentPage)});function $e(){const t=document.querySelectorAll(".nav-item");t.forEach(e=>{e.addEventListener("click",n=>{n.preventDefault();const i=e.getAttribute("data-page");t.forEach(o=>o.classList.remove("active")),e.classList.add("active"),l.currentPage=i,oe(i)})})}async function ve(){try{if(l.avatars=await S.getAvatars(),l.marketData=await S.getMarketData(),l.modules=await S.getModules(),l.projectsList=await S.getProjects(),l.activeProjectId){const t=l.projectsList.find(e=>e.id===l.activeProjectId);t?(l.activeProject=t,l.kbFiles=await S.getProjectFiles(l.activeProjectId)):(l.activeProjectId=null,l.activeProject=null)}}catch(t){console.error("Erro ao carregar dados Supabase:",t)}try{l.localSettings=await S.localGetSettings(),l.localHealth=!0,l.localActiveProvider=l.localSettings.default_provider||"groq",l.localActiveProvider==="groq"?l.localActiveModel="llama-3.3-70b-versatile":l.localActiveProvider==="gemini"?l.localActiveModel="gemini-2.5-flash":l.localActiveProvider==="openrouter"?l.localActiveModel="anthropic/claude-sonnet-4.5":l.localActiveProvider==="perplexity"&&(l.localActiveModel="sonar-reasoning-pro"),l.localAvatars=await S.localGetAvatars(),l.localMarketData=await S.localGetMarketData(),l.localModules=await S.localGetModules(),l.localKbStats=await S.localGetKbStats(),l.localKbFiles=await S.localGetKbFiles(),console.log("[OK] Dados locais carregados com sucesso.")}catch(t){console.warn("[WARN] Cérebro local offline ou inacessível:",t),l.localHealth=!1}Te(),we()}function Te(){const t=document.getElementById("active-model-display"),e=document.getElementById("header-sync-btn");t&&(t.innerHTML=`
            <i data-lucide="cloud" class="badge-icon"></i>
            <span>Supabase Cloud Conectado</span>
        `),e&&(e.innerHTML=`
            <i data-lucide="folder-git2"></i>
            <span>${l.activeProject?l.activeProject.name:"Selecionar Projeto"}</span>
        `,e.onclick=n=>{n.preventDefault(),Ee()}),lucide.createIcons()}function we(){const t=document.querySelector(".watcher-status-header .status-text"),e=document.querySelector(".watcher-status-header .status-indicator"),n=document.getElementById("footer-indexed-files"),i=document.getElementById("footer-provider");l.localHealth?(t&&(t.textContent="Cérebro Local Online"),e&&(e.className="status-indicator online",e.style.background="var(--accent-emerald)"),n&&(n.textContent=`${l.localKbStats.total_files||0} arquivos`),i&&(i.textContent=`${l.localActiveProvider.toUpperCase()} / ${l.localActiveModel.split("-")[0].toUpperCase()}`)):(t&&(t.textContent="Cérebro Local Offline"),e&&(e.className="status-indicator offline",e.style.background="var(--text-muted)"),n&&(n.textContent="Indisponível"),i&&(i.textContent="Nenhum")),lucide.createIcons()}function b(t,e="success"){const n=document.getElementById("toast-container");if(!n)return;const i=document.createElement("div");i.className=`toast ${e}`;let o="check-circle";e==="error"&&(o="alert-triangle"),e==="info"&&(o="info"),i.innerHTML=`
        <i data-lucide="${o}" class="toast-icon"></i>
        <span>${t}</span>
    `,n.appendChild(i),lucide.createIcons(),setTimeout(()=>{i.style.opacity="0",i.style.transform="translateY(20px)",setTimeout(()=>i.remove(),300)},4e3)}function re(t){if(!t)return"";const e=t.trim();if(e.startsWith("<")&&(e.endsWith(">")||e.includes("style=")||e.includes("class=")||e.includes("</")))return t;let n=t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");return n=n.replace(/^### (.*$)/gim,"<h3>$1</h3>"),n=n.replace(/^## (.*$)/gim,"<h2>$1</h2>"),n=n.replace(/^# (.*$)/gim,"<h2>$1</h2>"),n=n.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>"),n=n.replace(/\`\`\`([\s\S]*?)\`\`\`/g,"<pre>$1</pre>"),n=n.replace(/\`(.*?)\`/g,"<code>$1</code>"),n=n.replace(/^\> (.*$)/gim,"<blockquote>$1</blockquote>"),n=n.replace(/^\- (.*$)/gim,"<li>$1</li>"),n=n.replace(/(<li>.*<\/li>)/gim,"<ul>$1</ul>"),n=n.replace(/<\/ul>\s*<ul>/g,""),n}function oe(t){const e=document.getElementById("page-content");if(!e)return;if(e.innerHTML="",(t.startsWith("m")&&t!=="meta-ads"||t==="kb")&&!l.activeProjectId){b("Selecione ou crie um projeto para acessar esta área da Nuvem!","info"),l.currentPage="dashboard",document.querySelectorAll(".nav-item").forEach(o=>{o.classList.remove("active"),o.getAttribute("data-page")==="dashboard"&&o.classList.add("active")}),he(e);return}switch(t){case"dashboard":he(e);break;case"kb":Oe(e);break;case"m0":Le(e);break;case"m1":case"m2":case"m3":case"m4":case"m5":case"m6":case"m7":case"m8":case"m9":_e(e,parseInt(t.substring(1)));break;case"m10":De(e);break;case"meta-ads":ze(e);break;case"instagram":qe(e);break;case"blog":Re(e);break;case"products":Ge(e);break;case"theme-creator":Fe(e);break;case"campaign":Ne(e);break;case"settings":je(e);break;default:e.innerHTML=`<p>Aba ${t} em desenvolvimento...</p>`}lucide.createIcons()}async function he(t){try{l.projectsList=await S.getProjects()}catch(a){console.error(a)}let e="";l.activeProject?e=`
            <div class="active-project-card" style="background: var(--bg-card); border: 2px solid var(--accent-violet); border-radius: var(--radius-md); padding: 24px; margin-bottom: 30px; backdrop-filter: blur(10px);">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <span style="font-size: 11px; text-transform: uppercase; color: var(--accent-cyan); font-weight: 700; letter-spacing: 1px;">Projeto Ativo de Autoria</span>
                        <h3 style="font-size: 22px; font-weight: 800; color: white; margin-top: 4px;">${l.activeProject.name}</h3>
                        <p style="font-size: 13px; color: var(--text-secondary); margin-top: 6px;"><strong>Nicho:</strong> ${l.activeProject.niche||"Sem nicho"}</p>
                        <p style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;"><strong>Promessa:</strong> ${l.activeProject.promise||"Sem promessa"}</p>
                    </div>
                    <button class="btn btn-secondary" id="btn-change-project-dashboard">Mudar Projeto</button>
                </div>
            </div>
        `:e=`
            <div class="active-project-card" style="background: rgba(239, 68, 68, 0.05); border: 1px dashed var(--accent-red); border-radius: var(--radius-md); padding: 30px; margin-bottom: 30px; text-align: center;">
                <h3 style="color: white; font-weight: 700; margin-bottom: 10px;">Nenhum Projeto Ativo Selecionado</h3>
                <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">Você precisa selecionar ou criar um projeto acadêmico para começar a gerar copies, estruturas de infoprodutos e criativos.</p>
                <button class="btn btn-primary" id="btn-create-project-empty" style="margin: 0 auto;">Criar Meu Primeiro Projeto</button>
            </div>
        `,t.innerHTML=`
        <div class="page-title-section">
            <h2 class="page-title">Painel de Projetos Acadêmicos</h2>
            <p class="page-subtitle">Crie, gerencie e orquestre o desenvolvimento dos seus livros e funis de vendas.</p>
        </div>

        ${e}

        <div class="panel-card">
            <div class="panel-header">
                <h2>Seus Projetos Cadastrados</h2>
                <button class="btn btn-primary btn-sm" id="btn-new-project">Novo Projeto</button>
            </div>

            <div class="projects-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                ${l.projectsList.map(a=>{const s=l.activeProjectId===a.id;return`
                        <div class="project-item-card ${s?"active":""}" data-id="${a.id}" style="background: rgba(255, 255, 255, 0.02); border: 1px solid ${s?"var(--accent-violet)":"rgba(255,255,255,0.08)"}; border-radius: var(--radius-md); padding: 20px; transition: var(--transition-smooth); cursor: pointer;">
                            <h4 style="font-size: 16px; font-weight: 700; color: white; margin-bottom: 8px;">${a.name}</h4>
                            <span class="folder-badge" style="margin-bottom: 12px; display: inline-block;">${a.niche||"Sem Nicho"}</span>
                            <p style="font-size: 12px; color: var(--text-muted); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 34px;">${a.promise||"Sem promessa estratégica cadastrada."}</p>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">
                                <span style="font-size: 10px; color: var(--text-dim);">${new Date(a.created_at).toLocaleDateString("pt-BR")}</span>
                                ${s?'<span style="font-size: 10px; color: var(--accent-cyan); font-weight: 700; text-transform: uppercase;">Ativo</span>':'<span style="font-size: 10px; color: var(--text-muted);">Selecionar</span>'}
                            </div>
                        </div>
                    `}).join("")}
                ${l.projectsList.length===0?'<div style="grid-column: span 3; text-align: center; color: var(--text-muted); padding: 40px;">Você ainda não possui projetos. Crie um acima!</div>':""}
            </div>
        </div>
    `;const n=document.getElementById("btn-new-project"),i=document.getElementById("btn-create-project-empty");n&&(n.onclick=xe),i&&(i.onclick=xe);const o=document.getElementById("btn-change-project-dashboard");o&&(o.onclick=Ee),t.querySelectorAll(".project-item-card").forEach(a=>{a.onclick=async()=>{const s=a.getAttribute("data-id");l.activeProjectId=s,localStorage.setItem("activeProjectId",s),await ve(),b("Projeto ativado com sucesso!","success"),oe("dashboard")}})}function xe(){const t=document.createElement("div");t.className="preview-overlay active",t.style.zIndex="2000",t.innerHTML=`
        <div class="panel-card" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 450px; border-radius: var(--radius-md); box-shadow: var(--shadow-premium);">
            <div class="panel-header">
                <h2>Criar Novo Projeto Acadêmico</h2>
            </div>
            <div class="panel-form" style="display: flex; flex-direction: column; gap: 14px; padding-top: 14px;">
                <div class="form-group">
                    <label class="form-label">Nome do Projeto</label>
                    <input type="text" id="new-proj-name" placeholder="Ex: Livro Pesquisador Produtivo" class="form-input-text">
                </div>
                <div class="form-group">
                    <label class="form-label">Nicho Acadêmico</label>
                    <input type="text" id="new-proj-niche" placeholder="Ex: Pós-graduação stricto sensu" class="form-input-text">
                </div>
                <div class="form-group">
                    <label class="form-label">Promessa Principal do Método</label>
                    <textarea id="new-proj-promise" placeholder="Ex: Superar a procrastinação e o bloqueio de escrita para defender a tese sem burnout." class="form-input-text" style="height: 60px;"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Público-Alvo Prioritário</label>
                    <input type="text" id="new-proj-audience" placeholder="Ex: Mestrandos e doutorandos sobrecarregados" class="form-input-text">
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                    <button class="btn btn-secondary" id="btn-cancel-new-proj">Cancelar</button>
                    <button class="btn btn-primary" id="btn-save-new-proj">Salvar Projeto</button>
                </div>
            </div>
        </div>
    `,document.body.appendChild(t);const e=()=>t.remove();document.getElementById("btn-cancel-new-proj").onclick=e,document.getElementById("btn-save-new-proj").onclick=async()=>{const n=document.getElementById("new-proj-name").value.trim(),i=document.getElementById("new-proj-niche").value.trim(),o=document.getElementById("new-proj-promise").value.trim(),a=document.getElementById("new-proj-audience").value.trim();if(!n){b("Por favor, informe ao menos o nome do projeto!","error");return}try{const s=await S.createProject(n,i,o,a);b("Projeto criado com sucesso!","success"),l.activeProjectId=s[0].id,localStorage.setItem("activeProjectId",s[0].id),e(),await ve(),oe("dashboard")}catch(s){b(`Falha ao criar projeto: ${s.message}`,"error")}}}function Ee(){const t=document.createElement("div");t.className="preview-overlay active",t.style.zIndex="2000",t.innerHTML=`
        <div class="panel-card" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; max-height: 400px; overflow-y: auto; border-radius: var(--radius-md); box-shadow: var(--shadow-premium);">
            <div class="panel-header">
                <h2>Selecionar Projeto Ativo</h2>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px; padding: 14px 0;">
                ${l.projectsList.map(n=>`
                    <button class="btn btn-secondary proj-select-btn" data-id="${n.id}" style="width: 100%; text-align: left; justify-content: flex-start; padding: 14px;">
                        <div>
                            <div style="font-weight: 700; color: white;">${n.name}</div>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">${n.niche||"Sem nicho"}</div>
                        </div>
                    </button>
                `).join("")}
                ${l.projectsList.length===0?'<p style="color: var(--text-muted); text-align: center; padding: 20px;">Nenhum projeto criado.</p>':""}
            </div>
            <div style="display: flex; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px;">
                <button class="btn btn-secondary" id="btn-close-project-selector">Fechar</button>
            </div>
        </div>
    `,document.body.appendChild(t);const e=()=>t.remove();document.getElementById("btn-close-project-selector").onclick=e,t.querySelectorAll(".proj-select-btn").forEach(n=>{n.onclick=async()=>{const i=n.getAttribute("data-id");l.activeProjectId=i,localStorage.setItem("activeProjectId",i),e(),await ve(),b("Projeto alterado!","success"),oe(l.currentPage)}})}function Oe(t){let e=[...l.kbFiles];const n=[...new Set(l.kbFiles.map(u=>u.folder))].sort(),i=u=>{const r=document.getElementById("kb-table-body");if(r){if(u.length===0){r.innerHTML='<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 40px 0;">Nenhum arquivo de apoio indexado na nuvem para este projeto.</td></tr>';return}r.innerHTML=u.map(c=>{let g="file",h="";const f=c.filename.split(".").pop().toLowerCase();f==="docx"?(g="file-word",h="docx"):f==="pdf"?(g="file-text",h="pdf"):f==="md"&&(g="code",h="md");const P=new Intl.NumberFormat("pt-BR").format(c.word_count||0);return`
                <tr>
                    <td>
                        <div class="file-row-name">
                            <i data-lucide="${g}" class="file-icon ${h}"></i>
                            <a href="${c.file_url}" target="_blank" style="color: white; text-decoration: none;" class="file-link-title">${c.filename}</a>
                        </div>
                    </td>
                    <td><span class="folder-badge">${c.folder}</span></td>
                    <td>${c.processing_status==="completed"?`${P} palavras`:'<span style="color: var(--accent-cyan);">Processando...</span>'}</td>
                    <td>${new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                    <td>
                        <div style="display: flex; gap: 14px; align-items: center;">
                            <button class="btn-view-preview" data-id="${c.id}" ${c.processing_status!=="completed"?"disabled":""}>
                                <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
                                <span>Visualizar</span>
                            </button>
                            <button class="btn-delete-file" data-id="${c.id}" data-url="${c.file_url}">
                                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                                <span>Deletar</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `}).join(""),r.querySelectorAll(".btn-view-preview").forEach(c=>{c.addEventListener("click",()=>{const g=c.getAttribute("data-id"),h=l.kbFiles.find(f=>f.id===g);h&&Be(h)})}),r.querySelectorAll(".btn-delete-file").forEach(c=>{c.addEventListener("click",async()=>{const g=c.getAttribute("data-id"),h=c.getAttribute("data-url");if(confirm("Tem certeza de que deseja deletar este arquivo da Base de Conhecimento?")){b("Excluindo arquivo...","info");try{await S.deleteReferenceFile(g,h),b("Arquivo excluído com sucesso!","success"),l.kbFiles=await S.getProjectFiles(l.activeProjectId),i(l.kbFiles)}catch(f){b(`Erro ao excluir arquivo: ${f.message}`,"error")}}})}),lucide.createIcons()}};t.innerHTML=`
        <div class="page-title-section">
            <h2 class="page-title">Base de Conhecimento em Nuvem</h2>
            <p class="page-subtitle">Suba seus PDFs acadêmicos e e-books de apoio. A IA lerá e extrairá seu conteúdo para enriquecer o contexto dos geradores.</p>
        </div>

        <!-- Drag & Drop Uploader Area -->
        <div id="drag-drop-zone" style="border: 2px dashed rgba(124, 58, 237, 0.4); background: rgba(124, 58, 237, 0.02); border-radius: var(--radius-md); padding: 30px; text-align: center; margin-bottom: 30px; transition: var(--transition-smooth); cursor: pointer;">
            <i data-lucide="upload-cloud" style="width: 48px; height: 48px; color: var(--accent-violet); margin-bottom: 12px;"></i>
            <h3 style="color: white; font-weight: 700;">Suba seus PDFs Científicos de Apoio</h3>
            <p style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">Arraste e solte o arquivo PDF aqui ou clique para selecionar. (Máx. 10MB)</p>
            <input type="file" id="kb-file-input" accept=".pdf" style="display: none;">
        </div>
        
        <!-- Search and Filter Bar -->
        <div class="kb-filters-bar">
            <select id="folder-filter" class="filter-select">
                <option value="all">Todos os Diretórios</option>
                ${n.map(u=>`<option value="${u}">${u}</option>`).join("")}
            </select>
            <input type="text" id="kb-table-search" placeholder="Filtrar arquivos por nome..." class="form-input-text" style="flex-grow: 1;">
        </div>
        
        <!-- Table Area -->
        <div class="kb-table-container">
            <table class="kb-table">
                <thead>
                    <tr>
                        <th>Nome do Arquivo</th>
                        <th>Diretório Físico</th>
                        <th>Tamanho (Palavras)</th>
                        <th>Data de Envio</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="kb-table-body">
                    <!-- Loaded dynamically -->
                </tbody>
            </table>
        </div>
        
        <!-- Preview Side Drawer -->
        <div id="preview-overlay" class="preview-overlay"></div>
        <div id="preview-drawer" class="preview-drawer" style="position: fixed; top: 0; right: -550px; width: 500px; height: 100vh; background-color: var(--bg-sidebar); border-left: var(--border-glass); box-shadow: -10px 0 30px rgba(0,0,0,0.7); z-index: 1000; transition: right 0.4s ease; display: flex; flex-direction: column;">
            <div class="preview-header" style="padding: 24px; border-bottom: var(--border-glass); display: flex; justify-content: space-between; align-items: center;">
                <div class="preview-title">
                    <h2 id="drawer-filename" style="font-size: 16px; font-weight: 700; color: white;">documento.pdf</h2>
                    <span id="drawer-folder" style="font-size: 11px; color: var(--accent-cyan); text-transform: uppercase;">01 - FUNDO</span>
                </div>
                <button id="drawer-close" style="background: none; border: none; cursor: pointer; color: var(--text-muted);"><i data-lucide="x"></i></button>
            </div>
            <div class="preview-body" style="padding: 24px; flex-grow: 1; overflow-y: auto;">
                <div class="preview-text-box" id="drawer-content" style="color: var(--text-secondary); font-size: 13px; line-height: 1.6; white-space: pre-wrap; font-family: monospace;">
                    Selecione um arquivo para ver a prévia...
                </div>
            </div>
        </div>
    `,i(e);const o=document.getElementById("drag-drop-zone"),a=document.getElementById("kb-file-input");o.onclick=()=>a.click(),o.ondragover=u=>{u.preventDefault(),o.style.borderColor="var(--accent-cyan)"},o.ondragleave=()=>{o.style.borderColor="rgba(124, 58, 237, 0.4)"},o.ondrop=async u=>{u.preventDefault(),o.style.borderColor="rgba(124, 58, 237, 0.4)";const r=u.dataTransfer.files;r.length>0&&s(r[0])},a.onchange=async()=>{a.files.length>0&&s(a.files[0])};const s=async u=>{if(!u.name.endsWith(".pdf")){b("Apenas arquivos PDF são aceitos no momento!","error");return}b(`Subindo e indexando PDF: ${u.name}...`,"info");try{await S.uploadReferenceFile(l.activeProjectId,u,"02 - MATERIAIS_BÔNUS_DE_APOIO"),b("PDF carregado! A IA está extraindo o texto em segundo plano...","success"),l.kbFiles=await S.getProjectFiles(l.activeProjectId),i(l.kbFiles)}catch(r){b(`Falha ao subir arquivo: ${r.message}`,"error")}},p=document.getElementById("folder-filter"),m=document.getElementById("kb-table-search"),x=()=>{const u=p.value,r=m.value.toLowerCase();let c=[...l.kbFiles];u!=="all"&&(c=c.filter(g=>g.folder===u)),r&&(c=c.filter(g=>g.filename.toLowerCase().includes(r))),i(c)};p.addEventListener("change",x),m.addEventListener("input",x)}function Be(t){const e=document.getElementById("preview-drawer"),n=document.getElementById("drawer-filename"),i=document.getElementById("drawer-folder"),o=document.getElementById("drawer-content"),a=document.getElementById("drawer-close");n.textContent=t.filename,i.textContent=t.folder,o.textContent=t.extracted_text||"[O texto extraído deste arquivo está em branco]",e.style.right="0",a.onclick=()=>e.style.right="-550px"}async function Le(t){t.innerHTML=`
        <div class="page-title-section">
            <h2 class="page-title">M0 — Orquestrador de Coerência</h2>
            <p class="page-subtitle">A auditoria integrada inteligente. O orquestrador analisa todos os seus módulos ativos e verifica se há contradições teóricas no método.</p>
        </div>

        <div style="background: var(--bg-card); border: var(--border-glass); border-radius: var(--radius-md); padding: 30px; backdrop-filter: blur(10px); box-shadow: var(--shadow-premium); text-align: center; margin-bottom: 30px;">
            <h3 style="color: white; font-weight: 800; font-size: 20px; margin-bottom: 12px;">Auditar Coerência Global</h3>
            <p style="color: var(--text-muted); font-size: 13px; max-width: 500px; margin: 0 auto 20px auto;">A IA fará a leitura do Briefing e de todo o texto gerado de M1 a M9. Ela buscará furos de narrativa, terminologias misturadas ou mudanças bruscas de precificação.</p>
            <button class="btn btn-primary" id="btn-validate-coherence" style="margin: 0 auto;">
                <i data-lucide="shield-check"></i>
                <span>Executar Auditoria Geral</span>
            </button>
        </div>

        <div id="coherence-loading" style="display: none; text-align: center; padding: 40px;">
            <div class="spinner" style="margin: 0 auto 16px auto;"></div>
            <p style="color: var(--text-secondary); font-size: 14px;">Auditando consistência científica no Supabase...</p>
        </div>

        <div id="coherence-report-box" style="display: none;">
            <!-- Report details will be loaded here -->
        </div>
    `;const e=document.getElementById("btn-validate-coherence"),n=document.getElementById("coherence-loading"),i=document.getElementById("coherence-report-box");e.onclick=async()=>{e.style.display="none",n.style.display="block",i.style.display="none";try{const[o,a]=await Promise.all([S.restGet(`/projects?id=eq.${l.activeProjectId}`),S.restGet(`/modules?project_id=eq.${l.activeProjectId}&order=module_number`)]),s=o&&o.length>0?`BRIEFING DO PROJETO:
Nome: ${o[0].name}
Nicho: ${o[0].niche}
Promessa: ${o[0].promise}
Público: ${o[0].target_audience}`:"",p=a?a.filter(u=>u.generated_content&&u.module_number!==0).map(u=>({number:u.module_number,title:u.title,content:u.generated_content})):[];if(p.length===0)throw new Error("Gere conteúdo em ao menos um módulo (M1 a M9) antes de rodar o Orquestrador de Coerência!");const m=p[p.length-1],x=await S.coherenceCheck(s,m.number,m.title,m.content,p.slice(0,-1));l.coherenceReport=x,Me(i,x),i.style.display="block",b("Auditoria concluída com sucesso!","success")}catch(o){b(`Falha na validação: ${o.message}`,"error"),e.style.display="block"}finally{n.style.display="none"}}}function Me(t,e){var i,o,a,s,p,m,x,u;const n=e.score>=80?"var(--accent-green)":e.score>=50?"orange":"var(--accent-red)";t.innerHTML=`
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-info">
                    <h3>Score de Coerência</h3>
                    <div class="metric-value" style="color: ${n};">${e.score}/100</div>
                    <div class="metric-change positive">Consistência Teórica</div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3>Status</h3>
                    <div class="metric-value" style="text-transform: uppercase; font-size: 20px; color: ${n}; margin-top: 10px;">${e.status}</div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3>Contradições</h3>
                    <div class="metric-value">${((i=e.contradictions)==null?void 0:i.length)||0}</div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3>Termos Inconsistentes</h3>
                    <div class="metric-value">${((a=(o=e.glossaryCheck)==null?void 0:o.inconsistent)==null?void 0:a.length)||0}</div>
                </div>
            </div>
        </div>

        <div class="dashboard-layout-grid" style="margin-top: 30px;">
            <!-- Contradições e Detalhes -->
            <div class="panel-card">
                <div class="panel-header">
                    <h2>Contradições e Inconsistências Críticas</h2>
                </div>
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    ${(s=e.contradictions)==null?void 0:s.map(r=>`
                        <div style="background: rgba(239, 68, 68, 0.05); border-left: 4px solid var(--accent-red); padding: 16px; border-radius: var(--radius-sm);">
                            <h4 style="font-weight: 700; color: white;">⚠️ ${r.issue}</h4>
                            <p style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;"><strong>Local:</strong> ${r.location}</p>
                            <p style="font-size: 12px; color: var(--accent-cyan); margin-top: 4px;"><strong>Como Corrigir:</strong> ${r.suggestion}</p>
                        </div>
                    `).join("")}
                    ${!e.contradictions||e.contradictions.length===0?'<p style="color: var(--text-muted); text-align: center; padding: 20px;">Nenhuma contradição ou inconsistência teórica foi detectada no seu infoproduto. Parabéns!</p>':""}
                </div>
            </div>

            <!-- Tom de voz & Recomendações -->
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div class="panel-card">
                    <div class="panel-header">
                        <h2>Análise de Tom de Voz</h2>
                    </div>
                    <p style="font-size: 12px; color: var(--text-secondary);"><strong>Tom Detectado:</strong> ${(p=e.toneCheck)==null?void 0:p.detected}</p>
                    <p style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;"><strong>Alinhado com Eco/Newport?</strong> ${(m=e.toneCheck)!=null&&m.aligned?'<span style="color: var(--accent-green); font-weight:700;">Sim</span>':'<span style="color: var(--accent-red); font-weight:700;">Não</span>'}</p>
                    <p style="font-size: 11px; color: var(--text-muted); margin-top: 6px; line-height: 1.4;">${((x=e.toneCheck)==null?void 0:x.notes)||""}</p>
                </div>

                <div class="panel-card">
                    <div class="panel-header">
                        <h2>Recomendações Práticas</h2>
                    </div>
                    <ul style="padding-left: 16px; color: var(--text-secondary); font-size: 13px; line-height: 1.6;">
                        ${(u=e.recommendations)==null?void 0:u.map(r=>`<li>${r}</li>`).join("")}
                    </ul>
                </div>
            </div>
        </div>
    `,lucide.createIcons()}async function _e(t,e){var h;const n=l.modules.find(f=>f.module_number===e);if(!n)return;let i="",o=!1;try{const f=await S.getModuleContent(l.activeProjectId,e);f&&(i=f.generated_content||"",o=f.is_outdated||!1)}catch(f){console.error(f)}t.innerHTML=`
        <div class="page-title-section">
            <h2 class="page-title">M${e} — ${n.title}</h2>
            <p class="page-subtitle">${n.description}</p>
        </div>

        <div class="three-panel-workspace" style="display: grid; grid-template-columns: 280px 1fr 280px; gap: 24px; min-height: 500px; height: calc(100vh - 180px); overflow: hidden;">
            
            <!-- Painel Esquerdo (Controles) -->
            <div class="panel-card flex-col" style="height: 100%; overflow-y: auto; padding: 20px;">
                <h3 style="font-size: 14px; font-weight: 700; color: white; margin-bottom: 16px;">Parâmetros da IA</h3>
                
                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">Motor de IA</label>
                    <select id="engine-provider" class="filter-select" style="width: 100%; min-width: auto;">
                        <option value="gemini" ${l.activeProvider==="gemini"?"selected":""}>Gemini 2.5 Flash</option>
                        <option value="groq" ${l.activeProvider==="groq"?"selected":""}>Groq Llama 3.3</option>
                        <option value="openrouter" ${l.activeProvider==="openrouter"?"selected":""}>Claude 3.5 Sonnet</option>
                        <option value="perplexity" ${l.activeProvider==="perplexity"?"selected":""}>Perplexity Search</option>
                    </select>
                </div>

                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">Estágio de Funil</label>
                    <select id="funnel-stage" class="filter-select" style="width: 100%; min-width: auto;">
                        <option value="TOPO">Topo de Funil (Atração)</option>
                        <option value="MEIO">Meio de Funil (Método)</option>
                        <option value="FUNDO">Fundo de Funil (Oferta)</option>
                    </select>
                </div>

                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label">Instruções Customizadas</label>
                    <textarea id="custom-prompt" placeholder="Ex: Adicione referências explícitas à obra de Cal Newport..." class="form-input-text" style="height: 140px; font-size: 12px;"></textarea>
                </div>

                <button class="btn btn-primary" id="btn-generate-ai" style="width: 100%;">
                    <i data-lucide="sparkles"></i>
                    <span>${i?"Regenerar com IA":"Gerar com IA"}</span>
                </button>
            </div>

            <!-- Painel Central (Editor) -->
            <div class="panel-card flex-col" style="height: 100%; overflow: hidden; padding: 24px; display: flex; flex-direction: column;">
                
                <!-- Perplexity Search Bar Inline -->
                <div style="background: rgba(255,255,255,0.01); border: var(--border-glass); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 16px; display: flex; gap: 10px; align-items: center;">
                    <input type="text" id="perplexity-search-query" placeholder="Pesquisar mercado brasileiro via Perplexity..." class="form-input-text" style="font-size: 12px; padding: 8px 12px;">
                    <button class="btn btn-secondary" id="btn-search-market" style="padding: 8px 16px;"><i data-lucide="search"></i></button>
                </div>

                <div id="market-research-result" style="display: none; background: rgba(0, 212, 255, 0.05); border-left: 3px solid var(--accent-cyan); padding: 12px; margin-bottom: 16px; font-size: 11px; max-height: 120px; overflow-y: auto; color: var(--text-secondary);">
                    <!-- Research data loaded here -->
                </div>

                <!-- Editor Textarea / HTML Render -->
                <div style="flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; position: relative;">
                    ${o?'<div style="background: rgba(251, 191, 36, 0.1); border: 1px solid #fbbf24; border-radius: var(--radius-sm); padding: 8px 12px; font-size: 11px; color: #fbbf24; margin-bottom: 10px;">⚠️ <strong>Atenção:</strong> O briefing principal do projeto foi atualizado. É recomendável regenerar este módulo para manter o alinhamento!</div>':""}
                    <textarea id="module-textarea" class="form-input-text" style="width: 100%; height: 100%; font-family: monospace; font-size: 13px; line-height: 1.6; resize: none; border-radius: var(--radius-sm); flex-grow: 1; overflow-y: auto;" placeholder="Seu conteúdo final gerado e estruturado aparecerá aqui. Você pode editar livremente e clicar em Salvar.">${i}</textarea>
                    
                    <div id="streaming-overlay" style="display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(7, 8, 15, 0.85); border-radius: var(--radius-sm); align-items: center; justify-content: center; flex-direction: column; z-index: 10;">
                        <div class="spinner" style="margin-bottom: 12px;"></div>
                        <p style="font-size: 13px; color: white;">A IA está redigindo seu módulo em tempo real...</p>
                    </div>
                </div>

                <!-- Bottom Button Panel -->
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 14px;">
                    <button class="btn btn-secondary" id="btn-save-module"><i data-lucide="save"></i><span>Salvar Rascunho</span></button>
                    <button class="btn btn-accent" id="btn-save-version"><i data-lucide="archive"></i><span>Criar Versão</span></button>
                </div>
            </div>

            <!-- Painel Direito (Contexto Ativo) -->
            <div class="panel-card flex-col" style="height: 100%; overflow-y: auto; padding: 20px; font-size: 12px;">
                <h3 style="font-size: 14px; font-weight: 700; color: white; margin-bottom: 12px;">Contexto do Método</h3>
                
                <div style="background: rgba(255,255,255,0.02); border: var(--border-glass); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 20px;">
                    <strong style="color: var(--accent-cyan);">Promessa Ativa:</strong>
                    <p style="color: var(--text-secondary); margin-top: 4px; line-height: 1.4;">${((h=l.activeProject)==null?void 0:h.promise)||"Sem promessa estratégica."}</p>
                </div>

                <h4 style="font-weight: 700; color: white; margin-bottom: 8px;">Conceitos Chave do Módulo</h4>
                <ul style="padding-left: 16px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 20px;">
                    ${n.key_concepts.map(f=>`<li>${f}</li>`).join("")}
                </ul>

                <h4 style="font-weight: 700; color: white; margin-bottom: 8px;">Referências Acadêmicas</h4>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    ${l.kbFiles.slice(0,4).map(f=>`
                        <div style="background: rgba(255,255,255,0.01); border: var(--border-glass); padding: 8px; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="file-text" style="width: 14px; height: 14px; color: var(--accent-violet);"></i>
                            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;">${f.filename}</span>
                        </div>
                    `).join("")}
                    ${l.kbFiles.length===0?'<p style="color: var(--text-dim);">Nenhuma nota local indexada ainda.</p>':""}
                </div>
            </div>

        </div>
    `;const a=document.getElementById("module-textarea"),s=document.getElementById("engine-provider"),p=document.getElementById("funnel-stage"),m=document.getElementById("custom-prompt");s.onchange=()=>{l.activeProvider=s.value,l.activeProvider==="groq"?l.activeModel="llama-3.3-70b-versatile":l.activeProvider==="gemini"?l.activeModel="gemini-2.5-flash":l.activeProvider==="openrouter"?l.activeModel="anthropic/claude-3.5-sonnet":l.activeProvider==="perplexity"&&(l.activeModel="sonar-reasoning")},document.getElementById("btn-save-module").onclick=async()=>{try{await S.saveModuleContent(l.activeProjectId,e,a.value,n.title),b("Rascunho do módulo salvo com sucesso!","success")}catch(f){b(`Falha ao salvar: ${f.message}`,"error")}},document.getElementById("btn-save-version").onclick=async()=>{try{const f=await S.getModuleContent(l.activeProjectId,e);if(!f)throw new Error("Salve o rascunho primeiro antes de criar uma versão!");await S.saveModuleVersion(f.id,a.value),b("Nova versão criada no histórico!","success")}catch(f){b(`Falha ao criar versão: ${f.message}`,"error")}};const x=document.getElementById("btn-search-market"),u=document.getElementById("perplexity-search-query"),r=document.getElementById("market-research-result");x.onclick=async()=>{const f=u.value.trim();if(!f){b("Escreva sua query de busca!","error");return}x.disabled=!0,r.style.display="block",r.innerHTML='<span style="color: var(--accent-cyan);">Pesquisando na internet brasileira com Perplexity API...</span>';try{const P=await S.localPerplexitySearch(f);r.textContent=P.result||"Nenhum resultado retornado."}catch(P){r.textContent=`Erro ao realizar pesquisa via Perplexity API: ${P.message}`}finally{x.disabled=!1}};const c=document.getElementById("btn-generate-ai"),g=document.getElementById("streaming-overlay");c.onclick=async()=>{c.disabled=!0,g.style.display="flex",a.value="",l.activeGenerationText="",await S.generateModuleStream(l.activeProjectId,e,m.value,l.activeProvider,l.activeModel,p.value,f=>{l.activeGenerationText+=f,a.value=l.activeGenerationText},async()=>{g.style.display="none",c.disabled=!1,b("Geração concluída!","success"),await S.saveModuleContent(l.activeProjectId,e,a.value,n.title)},f=>{g.style.display="none",c.disabled=!1,b(`Falha na geração: ${f.message}`,"error")})},lucide.createIcons()}function De(t){let e="",n="#07080f",i=30,o="",a=null;const s={brand:{id:"brand",text:"SISTEMA A.C.A.D.E.M.I.A.",x:80,y:80,fontSize:24,fontFamily:"Outfit",fill:"#22d3ee",align:"center",width:920,fontWeight:"800",fontStyle:"normal"},title:{id:"title",text:"A PÓS-GRADUAÇÃO NÃO PRECISA SER UM MARTÍRIO",x:80,y:400,fontSize:56,fontFamily:"Outfit",fill:"#ffffff",align:"center",width:920,fontWeight:"800",fontStyle:"normal"},subtitle:{id:"subtitle",text:"Descubra seu perfil de improdutividade em 3 minutos.",x:80,y:650,fontSize:32,fontFamily:"Inter",fill:"#94a3b8",align:"center",width:920,fontWeight:"500",fontStyle:"normal"},cta:{id:"cta",text:"Fazer Teste Gratuito",x:340,y:1100,fontSize:26,fontFamily:"Outfit",fill:"#0f172a",bgColor:"#ff6b00",align:"center",width:400,fontWeight:"700",fontStyle:"normal"}};t.innerHTML=`
        <div class="page-title-section">
            <h2 class="page-title">M10 — Hub Criativo (Canvas Visual)</h2>
            <p class="page-subtitle">Crie suas peças visuais, customize localmente e faça o download em alta resolução.</p>
        </div>

        <div class="three-panel-workspace" style="display: grid; grid-template-columns: 320px 1fr 320px; gap: 20px; height: calc(100vh - 180px); overflow: hidden;">
            
            <!-- Painel 1: Conteúdo & IA (Esquerdo) -->
            <div class="panel-card flex-col" style="height: 100%; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px;">
                <h3 style="font-size: 13px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="sparkles" style="width: 14px; height: 14px;"></i>
                    <span>Assistente de Criação</span>
                </h3>
                
                <div class="form-group">
                    <label class="form-label">Formato do Canvas</label>
                    <select id="canvas-format" class="filter-select" style="width: 100%;">
                        <option value="feed">Feed Quadrado (1080x1350)</option>
                        <option value="story">Stories Integrado (1080x1920)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Cor de Fundo Sólida</label>
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <input type="color" id="canvas-bg-color" value="#07080f" style="width: 36px; height: 32px; border: none; border-radius: 4px; cursor: pointer; background: transparent;">
                        <input type="text" id="canvas-bg-color-hex" value="#07080f" class="form-input-text" style="font-size: 11px; flex-grow: 1;">
                    </div>
                </div>

                <!-- Imagen por IA (Gemini Imagen 3) -->
                <div class="form-group" style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px;">
                    <label class="form-label">Plano de Fundo com IA</label>
                    <div style="display: flex; gap: 6px;">
                        <input type="text" id="canvas-image-prompt" placeholder="Descreva a imagem..." class="form-input-text" style="font-size: 11px; flex-grow: 1;">
                        <button class="btn btn-secondary" id="btn-generate-image-ia" style="padding: 0 10px; height: 32px;" title="Gerar com Imagen 3">
                            <i data-lucide="sparkles" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                </div>

                <!-- Imagen por Unsplash -->
                <div class="form-group">
                    <label class="form-label">Buscar no Unsplash</label>
                    <div style="display: flex; gap: 6px;">
                        <input type="text" id="canvas-stock-query" placeholder="Ex: office, dark abstract..." class="form-input-text" style="font-size: 11px; flex-grow: 1;">
                        <button class="btn btn-secondary" id="btn-search-stock" style="padding: 0 10px; height: 32px;" title="Buscar Banco de Imagens">
                            <i data-lucide="search" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                </div>

                <!-- Upload de Imagem -->
                <div class="form-group">
                    <label class="form-label">Upload de Imagem</label>
                    <div style="position: relative; overflow: hidden; display: inline-block; width: 100%;">
                        <input type="file" id="canvas-file-upload" accept="image/*" style="position: absolute; left: 0; top: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%;">
                        <button class="btn btn-secondary" style="width: 100%; font-size: 11px; height: 32px;">
                            <i data-lucide="upload" style="width: 12px; height: 12px; margin-right: 6px;"></i>
                            Fazer Upload
                        </button>
                    </div>
                </div>

                <!-- Opacidade do Fundo -->
                <div class="form-group">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <label class="form-label" style="margin-bottom: 0;">Opacidade da Imagem</label>
                        <span id="opacity-value" style="font-size: 11px; color: var(--text-secondary); font-weight: bold;">30%</span>
                    </div>
                    <input type="range" id="canvas-image-opacity" min="0" max="100" value="30" style="width: 100%; accent-color: var(--accent-purple);">
                </div>

                <!-- Legenda do Post -->
                <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px; display: flex; flex-direction: column; gap: 8px;">
                    <label class="form-label">Redigir Legenda com IA</label>
                    <button class="btn btn-secondary" id="btn-generate-caption" style="width: 100%; height: 32px; font-size: 11px;">
                        <i data-lucide="sparkles" style="width: 12px; height: 12px; margin-right: 6px;"></i>
                        Gerar Legenda
                    </button>
                    <div id="caption-container" style="display: none; flex-direction: column; gap: 6px;">
                        <textarea id="canvas-caption-text" class="form-textarea" style="font-size: 11px; height: 80px; resize: none;"></textarea>
                        <button class="btn btn-secondary" id="btn-copy-caption" style="width: 100%; font-size: 10px; height: 28px;">
                            <i data-lucide="copy" style="width: 12px; height: 12px; margin-right: 6px;"></i>
                            Copiar Legenda
                        </button>
                    </div>
                </div>
            </div>

            <!-- Painel 2: Preview Interativo (Central - Drag & Drop) -->
            <div class="panel-card" style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(7, 8, 15, 0.45); padding: 20px; position: relative;">
                <p style="position: absolute; top: 12px; font-size: 10px; color: var(--text-muted); pointer-events: none; display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="mouse-pointer" style="width: 12px; height: 12px;"></i>
                    <span>Selecione e arraste os elementos para ajustar o design</span>
                </p>

                <!-- Card Mockup Frame -->
                <div id="visual-canvas-mock" style="width: 320px; height: 400px; background-color: #07080f; background-size: cover; background-position: center; border: 2px solid rgba(255,255,255,0.06); border-radius: var(--radius-sm); box-shadow: 0 12px 40px rgba(0,0,0,0.8); position: relative; overflow: hidden; transition: width 0.3s ease, height 0.3s ease;">
                    
                    <!-- Dark blending overlay -->
                    <div id="mock-image-overlay" style="position: absolute; inset: 0; background-color: rgba(7, 8, 15, 0.7); z-index: 1; pointer-events: none;"></div>
                    
                    <!-- Element: Brand -->
                    <div id="el-brand" class="draggable-canvas-element" style="position: absolute; z-index: 2; cursor: move; user-select: none; border: 1px dashed transparent;">
                        <span id="preview-brand-span">SISTEMA A.C.A.D.E.M.I.A.</span>
                    </div>

                    <!-- Element: Title -->
                    <div id="el-title" class="draggable-canvas-element" style="position: absolute; z-index: 2; cursor: move; user-select: none; border: 1px dashed transparent;">
                        <span id="preview-title-span">A PÓS-GRADUAÇÃO NÃO PRECISA SER UM MARTÍRIO</span>
                    </div>

                    <!-- Element: Subtitle -->
                    <div id="el-subtitle" class="draggable-canvas-element" style="position: absolute; z-index: 2; cursor: move; user-select: none; border: 1px dashed transparent;">
                        <span id="preview-subtitle-span">Descubra seu perfil de improdutividade em 3 minutos.</span>
                    </div>

                    <!-- Element: CTA Button -->
                    <div id="el-cta" class="draggable-canvas-element" style="position: absolute; z-index: 2; cursor: move; user-select: none; border: 1px dashed transparent; display: flex; align-items: center; justify-content: center; border-radius: 4px;">
                        <span id="preview-cta-span">FAZER TESTE GRATUITO</span>
                    </div>
                </div>
            </div>

            <!-- Painel 3: Customizador de Estilos (Direito) -->
            <div class="panel-card flex-col" style="height: 100%; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px;">
                <h3 style="font-size: 13px; font-weight: 700; color: var(--accent-purple); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="palette" style="width: 14px; height: 14px;"></i>
                    <span>Painel de Estilos</span>
                </h3>

                <!-- Seção Dinâmica de Estilo de Elemento -->
                <div id="style-panel-selection" style="flex-grow: 1; display: flex; flex-direction: column; gap: 16px;">
                    <!-- Será injetado dinamicamente com base no elemento selecionado -->
                    <div style="text-align: center; color: var(--text-muted); padding: 40px 0; font-size: 12px; line-height: 1.5;">
                        <i data-lucide="info" style="width: 20px; height: 20px; margin: 0 auto 8px auto; color: var(--accent-cyan);"></i>
                        Clique em qualquer texto do criativo no preview central para customizar fontes, cores e tamanhos.
                    </div>
                </div>

                <!-- Exportações -->
                <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; display: flex; flex-direction: column; gap: 10px;">
                    <button class="btn btn-primary" id="btn-download-png" style="width: 100%; height: 38px; border: 1px solid var(--accent-cyan); color: white;">
                        <i data-lucide="download" style="width: 14px; height: 14px; margin-right: 6px;"></i>
                        <span>Baixar PNG em Alta Resolução</span>
                    </button>
                </div>
            </div>

        </div>

        <!-- MODAL UNSPASH STOCK IMAGES -->
        <div id="unsplash-modal" class="modal-overlay" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 9999; align-items: center; justify-content: center; padding: 20px;">
            <div class="panel-card" style="width: 100%; max-width: 650px; max-height: 80vh; display: flex; flex-direction: column; padding: 24px; gap: 16px; border: 1px solid var(--accent-purple);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="font-size: 16px; font-weight: 700; color: white; display: flex; align-items: center; gap: 8px;">
                        <i data-lucide="search" style="width: 18px; height: 18px; color: var(--accent-cyan);"></i>
                        <span>Banco de Imagens (Unsplash)</span>
                    </h3>
                    <button id="btn-close-unsplash-modal" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer;" title="Fechar">
                        <i data-lucide="x" style="width: 20px; height: 20px;"></i>
                    </button>
                </div>
                
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="unsplash-modal-query" placeholder="Buscar fotos..." class="form-input-text" style="flex-grow: 1;">
                    <button class="btn btn-primary" id="btn-unsplash-modal-search" style="padding: 0 16px; height: 36px;">Buscar</button>
                </div>

                <div id="unsplash-modal-results" style="flex-grow: 1; overflow-y: auto; min-height: 250px; max-height: 50vh;">
                    <div style="text-align: center; color: var(--text-muted); padding: 40px 0;">
                        Digite um termo e clique em buscar para carregar fotos.
                    </div>
                </div>
            </div>
        </div>
    `;const p=document.getElementById("canvas-format"),m=document.getElementById("visual-canvas-mock"),x=document.getElementById("mock-image-overlay"),u=document.getElementById("canvas-bg-color"),r=document.getElementById("canvas-bg-color-hex"),c=document.getElementById("canvas-image-prompt"),g=document.getElementById("btn-generate-image-ia"),h=document.getElementById("canvas-stock-query"),f=document.getElementById("btn-search-stock"),P=document.getElementById("canvas-file-upload"),w=document.getElementById("canvas-image-opacity"),A=document.getElementById("opacity-value"),C=document.getElementById("btn-generate-caption"),z=document.getElementById("caption-container"),X=document.getElementById("canvas-caption-text"),ee=document.getElementById("btn-copy-caption"),L=document.getElementById("unsplash-modal"),te=document.getElementById("btn-close-unsplash-modal"),M=document.getElementById("unsplash-modal-query"),R=document.getElementById("btn-unsplash-modal-search"),N=document.getElementById("unsplash-modal-results"),H=document.getElementById("btn-download-png");function D(){const E=p.value==="story",I=(E?240:320)/1080;E?(m.style.width="240px",m.style.height="426px"):(m.style.width="320px",m.style.height="400px"),m.style.backgroundColor=n,r.value=n.toUpperCase(),u.value=n,e?(m.style.backgroundImage=`url("${e}")`,x.style.backgroundColor=`rgba(7, 8, 15, ${1-parseFloat(i)/100})`):(m.style.backgroundImage="none",x.style.backgroundColor="rgba(7, 8, 15, 0)"),Object.keys(s).forEach(T=>{const y=s[T],$=document.getElementById(`el-${T}`),q=document.getElementById(`preview-${T}-span`);$.style.left=y.x*I+"px",$.style.top=y.y*I+"px",$.style.width=y.width*I+"px",q.textContent=y.text,$.style.color=y.fill,$.style.fontSize=y.fontSize*I+"px",$.style.fontFamily=`${y.fontFamily}, sans-serif`,$.style.fontWeight=y.fontWeight,$.style.fontStyle=y.fontStyle,$.style.textAlign=y.align,T==="brand"&&(q.style.letterSpacing=2*I+"px"),T==="cta"?($.style.backgroundColor=y.bgColor||"#ff6b00",$.style.padding=`${6*I}px ${14*I}px`,$.style.color=y.fill||"#0f172a"):($.style.backgroundColor="transparent",$.style.padding="0"),a===T?($.style.border="1px dashed var(--accent-cyan)",$.style.boxShadow="0 0 8px rgba(34, 211, 238, 0.4)"):($.style.border="1px dashed transparent",$.style.boxShadow="none")})}p.onchange=D,u.oninput=()=>{n=u.value,D()},r.oninput=()=>{const v=r.value.trim();/^#[0-9A-F]{6}$/i.test(v)&&(n=v,D())},w.oninput=()=>{i=w.value,A.textContent=`${i}%`,D()},P.onchange=()=>{const v=P.files[0];if(v){const E=new FileReader;E.onload=d=>{e=d.target.result,D(),b("Imagem local carregada com sucesso!","success")},E.readAsDataURL(v)}};function K(v){a=v,D();const E=document.getElementById("style-panel-selection");if(!v){E.innerHTML=`
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Propriedades Gerais</div>
                    
                    <div style="background: rgba(124, 58, 237, 0.06); border: 1px solid rgba(124, 58, 237, 0.15); border-radius: var(--radius-sm); padding: 12px; font-size: 11px; color: var(--text-secondary); line-height: 1.5; display: flex; gap: 8px;">
                        <i data-lucide="mouse-pointer" style="width: 16px; height: 16px; color: var(--accent-cyan); shrink-0;"></i>
                        <span>Clique em qualquer texto do criativo no preview central para customizar suas fontes, cores e tamanhos.</span>
                    </div>

                    <div class="form-group">
                        <label class="form-label" style="font-size: 10px;">Ajustes de Posição Manual</label>
                        <p style="font-size: 11px; color: var(--text-muted);">Selecione um elemento para poder movê-lo usando sliders ou arrastando diretamente no mockup.</p>
                    </div>
                </div>
            `,lucide.createIcons();return}const d=s[v];E.innerHTML=`
            <div style="display: flex; flex-direction: column; gap: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 8px;">
                    <span style="font-size: 11px; color: var(--accent-cyan); font-weight: 700; text-transform: uppercase;">Elemento: ${v.toUpperCase()}</span>
                    <button id="btn-close-style" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-size:10px;">Limpar Foco</button>
                </div>

                <!-- Input de Texto -->
                <div class="form-group">
                    <label class="form-label" style="font-size: 10px;">Texto do Elemento</label>
                    ${v==="title"?`<textarea id="style-text" class="form-textarea" style="font-size: 11px; height: 50px; resize:none;">${d.text}</textarea>`:`<input type="text" id="style-text" class="form-input-text" value="${d.text}" style="font-size: 11px;">`}
                </div>

                <!-- Família de Fonte -->
                <div class="form-group">
                    <label class="form-label" style="font-size: 10px;">Fonte</label>
                    <select id="style-font-family" class="filter-select" style="width: 100%;">
                        <option value="Outfit" ${d.fontFamily==="Outfit"?"selected":""}>Outfit (Premium Sans)</option>
                        <option value="Inter" ${d.fontFamily==="Inter"?"selected":""}>Inter (Clean Sans)</option>
                        <option value="Montserrat" ${d.fontFamily==="Montserrat"?"selected":""}>Montserrat (Elegant)</option>
                        <option value="Playfair Display" ${d.fontFamily==="Playfair Display"?"selected":""}>Playfair (Serif)</option>
                        <option value="Impact" ${d.fontFamily==="Impact"?"selected":""}>Impact (Bold Headline)</option>
                        <option value="Georgia" ${d.fontFamily==="Georgia"?"selected":""}>Georgia (Classic Serif)</option>
                    </select>
                </div>

                <!-- Tamanho de Fonte -->
                <div class="form-group">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <label class="form-label" style="font-size: 10px; margin-bottom: 0;">Tamanho da Fonte</label>
                        <span id="style-font-size-val" style="font-size: 11px; color: var(--text-secondary); font-weight: bold;">${d.fontSize}px</span>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="range" id="style-font-size" min="10" max="120" value="${d.fontSize}" style="flex-grow:1; accent-color: var(--accent-purple);">
                        <input type="number" id="style-font-size-num" min="10" max="120" value="${d.fontSize}" style="width: 48px; text-align: center;" class="form-input-text">
                    </div>
                </div>

                <!-- Alinhamento e Peso -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div class="form-group">
                        <label class="form-label" style="font-size: 10px;">Alinhamento</label>
                        <select id="style-align" class="filter-select" style="width: 100%;">
                            <option value="left" ${d.align==="left"?"selected":""}>Esquerda</option>
                            <option value="center" ${d.align==="center"?"selected":""}>Centro</option>
                            <option value="right" ${d.align==="right"?"selected":""}>Direita</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="font-size: 10px;">Estilo Texto</label>
                        <div style="display: flex; gap: 4px;">
                            <button class="btn btn-secondary ${d.fontWeight==="800"||d.fontWeight==="700"?"active":""}" id="btn-style-bold" style="flex-grow:1; font-weight:bold; height:32px; padding:0;">B</button>
                            <button class="btn btn-secondary ${d.fontStyle==="italic"?"active":""}" id="btn-style-italic" style="flex-grow:1; font-style:italic; height:32px; padding:0;">I</button>
                        </div>
                    </div>
                </div>

                <!-- Cores -->
                <div class="form-group">
                    <label class="form-label" style="font-size: 10px;">Cor do Texto</label>
                    <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 6px;">
                        <input type="color" id="style-fill" value="${d.fill.startsWith("#")?d.fill:"#ffffff"}" style="width: 36px; height: 32px; border: none; border-radius: 4px; cursor: pointer; background: transparent;">
                        <input type="text" id="style-fill-hex" value="${d.fill}" class="form-input-text" style="font-size: 11px; flex-grow: 1;">
                    </div>
                    <!-- Paleta rápida -->
                    <div style="display: flex; gap: 4px;">
                        ${["#ffffff","#22d3ee","#c084fc","#ff6b00","#94a3b8"].map(W=>`<button style="width:20px; height:20px; border-radius:50%; background-color:${W}; border:1px solid rgba(255,255,255,0.15); cursor:pointer;" class="preset-color-btn" data-color="${W}"></button>`).join("")}
                    </div>
                </div>

                <!-- Cor do Botão CTA (Exclusivo CTA) -->
                ${v==="cta"?`
                    <div class="form-group" style="border-top:1px solid rgba(255,255,255,0.06); padding-top:12px;">
                        <label class="form-label" style="font-size: 10px;">Cor do Botão (Fundo)</label>
                        <div style="display: flex; gap: 6px; align-items: center;">
                            <input type="color" id="style-cta-bg" value="${d.bgColor||"#ff6b00"}" style="width: 36px; height: 32px; border: none; border-radius: 4px; cursor: pointer; background: transparent;">
                            <input type="text" id="style-cta-bg-hex" value="${d.bgColor||"#ff6b00"}" class="form-input-text" style="font-size: 11px; flex-grow: 1;">
                        </div>
                    </div>
                `:""}

                <!-- Posicionamento Fino -->
                <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div class="form-group">
                        <label class="form-label" style="font-size: 9px;">Posição X (Export)</label>
                        <input type="number" id="style-pos-x" value="${Math.round(d.x)}" class="form-input-text" style="font-size: 11px;">
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="font-size: 9px;">Posição Y (Export)</label>
                        <input type="number" id="style-pos-y" value="${Math.round(d.y)}" class="form-input-text" style="font-size: 11px;">
                    </div>
                </div>
            </div>
        `;const I=document.getElementById("style-text"),T=document.getElementById("style-font-family"),y=document.getElementById("style-font-size"),$=document.getElementById("style-font-size-num"),q=document.getElementById("style-align"),O=document.getElementById("btn-style-bold"),k=document.getElementById("btn-style-italic"),G=document.getElementById("style-fill"),j=document.getElementById("style-fill-hex"),Y=document.getElementById("style-pos-x"),U=document.getElementById("style-pos-y"),F=()=>{d.text=I.value,d.fontFamily=T.value,d.fontSize=parseInt(y.value),d.align=q.value,d.x=parseInt(Y.value)||0,d.y=parseInt(U.value)||0,D()};if(I.oninput=F,T.onchange=F,y.oninput=()=>{$.value=y.value,document.getElementById("style-font-size-val").textContent=`${y.value}px`,F()},$.oninput=()=>{y.value=$.value,document.getElementById("style-font-size-val").textContent=`${$.value}px`,F()},q.onchange=F,O.onclick=()=>{d.fontWeight==="800"||d.fontWeight==="700"?(d.fontWeight="normal",O.classList.remove("active")):(d.fontWeight=v==="brand"||v==="title"?"800":"700",O.classList.add("active")),D()},k.onclick=()=>{d.fontStyle==="italic"?(d.fontStyle="normal",k.classList.remove("active")):(d.fontStyle="italic",k.classList.add("active")),D()},G.oninput=()=>{d.fill=G.value,j.value=d.fill.toUpperCase(),D()},j.oninput=()=>{/^#[0-9A-F]{6}$/i.test(j.value)&&(d.fill=j.value,G.value=d.fill,D())},E.querySelectorAll(".preset-color-btn").forEach(W=>{W.onclick=()=>{const V=W.getAttribute("data-color");d.fill=V,G.value=V,j.value=V.toUpperCase(),D()}}),v==="cta"){const W=document.getElementById("style-cta-bg"),V=document.getElementById("style-cta-bg-hex");W.oninput=()=>{d.bgColor=W.value,V.value=d.bgColor.toUpperCase(),D()},V.oninput=()=>{/^#[0-9A-F]{6}$/i.test(V.value)&&(d.bgColor=V.value,W.value=d.bgColor,D())}}Y.oninput=F,U.oninput=F,document.getElementById("btn-close-style").onclick=()=>K(null),lucide.createIcons()}Object.keys(s).forEach(v=>{document.getElementById(`el-${v}`).addEventListener("click",d=>{d.stopPropagation(),K(v)})}),m.addEventListener("click",()=>{K(null)});let ne=!1,B=null,de=0,pe=0,ue=0,me=0;Object.keys(s).forEach(v=>{const E=document.getElementById(`el-${v}`);E.addEventListener("mousedown",d=>{d.button===0&&(ne=!0,B=v,de=d.clientX,pe=d.clientY,ue=s[v].x,me=s[v].y,K(v),E.style.cursor="grabbing",d.preventDefault())}),E.addEventListener("touchstart",d=>{const I=d.touches[0];ne=!0,B=v,de=I.clientX,pe=I.clientY,ue=s[v].x,me=s[v].y,K(v),E.style.cursor="grabbing"})}),document.addEventListener("mousemove",v=>{if(!ne||!B)return;const d=p.value==="story",T=(d?240:320)/1080,y=v.clientX-de,$=v.clientY-pe,q=y/T,O=$/T;s[B].x=ue+q,s[B].y=me+O,s[B].x<-150&&(s[B].x=-150),s[B].y<-150&&(s[B].y=-150);const k=d?1920:1350;if(s[B].x>1080&&(s[B].x=1080),s[B].y>k&&(s[B].y=k),D(),a===B){const G=document.getElementById("style-pos-x"),j=document.getElementById("style-pos-y");G&&j&&(G.value=Math.round(s[B].x),j.value=Math.round(s[B].y))}}),document.addEventListener("touchmove",v=>{if(!ne||!B)return;const E=v.touches[0],y=(p.value==="story"?240:320)/1080,$=E.clientX-de,q=E.clientY-pe,O=$/y,k=q/y;if(s[B].x=ue+O,s[B].y=me+k,D(),a===B){const G=document.getElementById("style-pos-x"),j=document.getElementById("style-pos-y");G&&j&&(G.value=Math.round(s[B].x),j.value=Math.round(s[B].y))}});const be=()=>{if(ne&&B){const v=document.getElementById(`el-${B}`);v&&(v.style.cursor="move")}ne=!1,B=null};document.addEventListener("mouseup",be),document.addEventListener("touchend",be),g.onclick=async()=>{const v=c.value.trim()||s.title.text;if(!v){b("Digite um prompt ou preencha o título para gerar o fundo!","warning");return}g.disabled=!0,g.innerHTML='<span class="loading-spinner" style="width:14px; height:14px; display:inline-block; border:2px solid rgba(255,255,255,0.3); border-radius:50%; border-top-color:white; animation:spin 1s ease-in-out infinite;"></span>',b("Gerando imagem com Imagen 3 de última geração...","info");try{const E=p.value==="story",d=1080,I=E?1920:1350,T=await S.generatePostImage(v,"dark premium, highly detailed, moody cinematic lighting, bokeh",d,I);if(T.imageUrl)e=T.imageUrl,D(),b("Plano de fundo gerado com sucesso!","success");else throw new Error(T.error||"Erro na geração de imagens.")}catch(E){b(`Falha ao gerar imagem: ${E.message}`,"error")}finally{g.disabled=!1,g.innerHTML='<i data-lucide="sparkles" style="width: 14px; height: 14px;"></i>',lucide.createIcons()}};async function ye(){const v=M.value.trim();if(!v){N.innerHTML='<div style="text-align:center; padding:40px; color:var(--text-muted);">Digite termos para busca.</div>';return}N.innerHTML='<div style="text-align:center; padding:40px; color:var(--text-secondary);"><span class="loading-spinner" style="width:24px; height:24px; display:inline-block; border:3px solid rgba(255,255,255,0.2); border-radius:50%; border-top-color:var(--accent-purple); animation:spin 1s ease-in-out infinite; margin-bottom:10px;"></span><br>Buscando imagens...</div>';try{const E=await S.searchStockImages(v,12,"portrait");E.images&&E.images.length>0?(N.innerHTML=`
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 8px 0;">
                        ${E.images.map(d=>`
                            <div class="unsplash-thumb" data-url="${d.url}" style="position: relative; cursor: pointer; border-radius: var(--radius-sm); overflow: hidden; aspect-ratio: 3/4; border: 1px solid rgba(255,255,255,0.08); transition: transform 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                                <img src="${d.thumbUrl}" alt="${d.alt}" style="width:100%; height:100%; object-fit: cover;">
                                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(7, 8, 15, 0.85); padding: 6px; font-size: 9px; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-top: 1px solid rgba(255,255,255,0.05);">
                                    📷 ${d.author}
                                </div>
                            </div>
                        `).join("")}
                    </div>
                `,N.querySelectorAll(".unsplash-thumb").forEach(d=>{d.onclick=()=>{e=d.getAttribute("data-url"),L.style.display="none",D(),b("Imagem do Unsplash aplicada!","success")},d.onmouseenter=()=>d.style.transform="scale(1.03)",d.onmouseleave=()=>d.style.transform="scale(1.0)"})):N.innerHTML='<div style="text-align:center; padding:40px; color:var(--text-muted);">Nenhuma imagem encontrada para este termo.</div>'}catch(E){N.innerHTML=`<div style="text-align:center; padding:40px; color:var(--accent-red);">Erro na busca: ${E.message}</div>`}}f.onclick=()=>{L.style.display="flex",M.value=h.value.trim()||s.title.text.substring(0,20).trim(),ye()},R.onclick=ye,M.onkeydown=v=>{v.key==="Enter"&&ye()},te.onclick=()=>{L.style.display="none"},C.onclick=async()=>{C.disabled=!0,C.innerHTML='<span class="loading-spinner" style="width:12px; height:12px; display:inline-block; border:2px solid rgba(255,255,255,0.3); border-radius:50%; border-top-color:white; animation:spin 1s ease-in-out infinite; margin-right:6px;"></span> Gerando...';try{let v="",E="";l.activeProject&&(v=l.activeProject.niche||"",E=l.activeProject.target_audience||"");const d=await S.generatePostCaption(s.title.text,s.subtitle.text,"",v,E,"profissional e engajante","Instagram");if(d.caption)o=d.caption,X.value=o,z.style.display="flex",b("Legenda gerada com sucesso!","success");else throw new Error(d.error||"Nenhum texto de legenda foi retornado.")}catch(v){b(`Falha ao gerar legenda: ${v.message}`,"error")}finally{C.disabled=!1,C.innerHTML='<i data-lucide="sparkles" style="width: 12px; height: 12px; margin-right: 6px;"></i> Gerar Legenda',lucide.createIcons()}},ee.onclick=()=>{navigator.clipboard.writeText(X.value),b("Legenda copiada para a área de transferência!","success")},H.onclick=async()=>{b("Renderizando imagem de alta resolução...","info"),H.disabled=!0,H.innerHTML='<span class="loading-spinner" style="width:14px; height:14px; display:inline-block; border:2px solid rgba(255,255,255,0.3); border-radius:50%; border-top-color:white; animation:spin 1s ease-in-out infinite; margin-right:6px;"></span> Baixando...';try{const v=p.value,E=v==="story",d=1080,I=E?1920:1350,T=document.createElement("canvas");T.width=d,T.height=I;const y=T.getContext("2d");if(y.fillStyle=n||"#07080f",y.fillRect(0,0,d,I),e)try{const O=new Image;if(O.crossOrigin="anonymous",await new Promise(k=>{O.onload=k,O.onerror=()=>{console.warn("Could not load image cross-origin. Falling back to background color."),k()},O.src=e}),O.complete&&O.naturalWidth>0){const k=d/I,G=O.width/O.height;let j=d,Y=I,U=0,F=0;G>k?(j=I*G,U=(d-j)/2):(Y=d/G,F=(I-Y)/2),y.save(),y.globalAlpha=parseFloat(i)/100,y.drawImage(O,U,F,j,Y),y.restore()}}catch(O){console.error("Image draw error:",O)}const $=y.createLinearGradient(0,0,0,I);$.addColorStop(0,"rgba(7, 8, 15, 0.45)"),$.addColorStop(.5,"rgba(7, 8, 15, 0.65)"),$.addColorStop(1,"rgba(7, 8, 15, 0.85)"),y.fillStyle=$,y.fillRect(0,0,d,I),Object.keys(s).forEach(O=>{const k=s[O];y.save(),y.textAlign=k.align,y.textBaseline="top",y.fillStyle=k.fill;const G=`${k.fontStyle==="italic"?"italic":""} ${k.fontWeight==="800"||k.fontWeight==="700"?k.fontWeight:"500"}`;y.font=`${G} ${k.fontSize}px ${k.fontFamily}, sans-serif`;let j=k.x;if(k.align==="center"?j=k.x+k.width/2:k.align==="right"&&(j=k.x+k.width),O==="cta"){const U=y.measureText(k.text.toUpperCase()).width+80,F=64,W=j-U/2,V=k.y;y.fillStyle=k.bgColor||"#ff6b00",Pe(y,W,V,U,F,8,!0,!1),y.fillStyle=k.fill||"#0f172a",y.textAlign="center",y.textBaseline="middle",y.fillText(k.text.toUpperCase(),j,V+F/2)}else{const Y=Ae(y,O==="brand"||O==="title"?k.text.toUpperCase():k.text,k.width);let U=k.y;O==="brand"&&(y.letterSpacing="3px"),Y.forEach(F=>{y.fillText(F,j,U),U+=k.fontSize*1.25})}y.restore()});const q=document.createElement("a");q.download=`criativo_${v}_${Date.now()}.png`,q.href=T.toDataURL("image/png"),q.click(),b("Download concluído com sucesso!","success")}catch(v){b(`Erro na exportação local: ${v.message}`,"error")}finally{H.disabled=!1,H.innerHTML='<i data-lucide="download" style="width: 14px; height: 14px; margin-right: 6px;"></i> <span>Baixar PNG em Alta Resolução</span>',lucide.createIcons()}};function Ae(v,E,d){const I=E.split(" "),T=[];let y=I[0];for(let $=1;$<I.length;$++){const q=I[$];v.measureText(y+" "+q).width<d?y+=" "+q:(T.push(y),y=q)}return T.push(y),T}function Pe(v,E,d,I,T,y,$,q){if(typeof y=="number")y={tl:y,tr:y,br:y,bl:y};else{const O={tl:0,tr:0,br:0,bl:0};for(const k in O)y[k]=y[k]||O[k]}v.beginPath(),v.moveTo(E+y.tl,d),v.lineTo(E+I-y.tr,d),v.quadraticCurveTo(E+I,d,E+I,d+y.tr),v.lineTo(E+I,d+T-y.br),v.quadraticCurveTo(E+I,d+T,E+I-y.br,d+T),v.lineTo(E+y.bl,d+T),v.quadraticCurveTo(E,d+T,E,d+T-y.bl),v.lineTo(E,d+y.tl),v.quadraticCurveTo(E,d,E+y.tl,d),v.closePath(),v.fill()}(async()=>{try{if(l.activeProjectId){const v=await S.getModuleContent(l.activeProjectId,10);if(v&&v.generated_content){const E=v.generated_content.split(`
`);for(const d of E){const I=d.trim();/^Título\s*:/i.test(I)&&(s.title.text=I.replace(/^Título\s*:\s*/i,"").replace(/\*/g,"")),/^Subtítulo\s*:/i.test(I)&&(s.subtitle.text=I.replace(/^Subtítulo\s*:\s*/i,"").replace(/\*/g,"")),/^CTA\s*:/i.test(I)&&(s.cta.text=I.replace(/^CTA\s*:\s*/i,"").replace(/\*/g,"")),/^Prompt de Imagem\s*:/i.test(I)&&(c.value=I.replace(/^Prompt de Imagem\s*:\s*/i,"").replace(/\*/g,"")),/^Palavras-chave de Busca\s*:/i.test(I)&&(h.value=I.replace(/^Palavras-chave de Busca\s*:\s*/i,"").replace(/\*/g,""))}}}}catch(v){console.warn("Could not pre-populate from M10 content draft",v)}K(null),D()})(),lucide.createIcons()}function je(t){const e="https://kquyqumyjkjpeoyfeqit.supabase.co",n="sb_publishable_-bcadizrmBkwSoZL1_L1ug_ruzJ-Qk7";t.innerHTML=`
        <div class="page-title-section">
            <h2 class="page-title">Configurações do Cockpit</h2>
            <p class="page-subtitle">Configure suas chaves de API, credenciais e diretórios para nuvem e ambiente local, além de visualizar o histórico.</p>
        </div>

        <div class="settings-grid">
            <!-- Left: Settings Forms and Tabs -->
            <div>
                <div class="campaign-tabs-nav" style="margin-bottom: 20px; border-bottom: var(--border-glass); padding-bottom: 8px;">
                    <button class="campaign-tab-btn active" id="tab-settings-cloud" style="border: none;">
                        <i data-lucide="cloud" class="tab-icon"></i>
                        <span>Nuvem (Supabase)</span>
                    </button>
                    <button class="campaign-tab-btn" id="tab-settings-local" style="border: none;">
                        <i data-lucide="cpu" class="tab-icon"></i>
                        <span>Local (FastAPI)</span>
                    </button>
                    <button class="campaign-tab-btn" id="tab-settings-drive" style="border: none;">
                        <i data-lucide="hard-drive-upload" class="tab-icon"></i>
                        <span>Google Drive</span>
                    </button>
                </div>

                <div id="settings-tab-content">
                    <!-- Content will be rendered dynamically -->
                </div>
            </div>

            <!-- Right: History List -->
            <div class="panel-card" style="display: flex; flex-direction: column;">
                <div class="panel-header">
                    <h2>📜 Histórico de Conteúdos Gerados</h2>
                    <i data-lucide="clock" class="text-accent"></i>
                </div>
                <div class="history-list" id="history-items-list" style="max-height: 580px; overflow-y: auto;">
                    <div class="loading-spinner-container" style="min-height: 100px;">
                        <div class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>
                    </div>
                </div>
            </div>
        </div>
    `;const i=document.getElementById("tab-settings-cloud"),o=document.getElementById("tab-settings-local"),a=document.getElementById("tab-settings-drive"),s=document.getElementById("settings-tab-content"),p=r=>{[i,o,a].forEach(c=>c&&c.classList.remove("active")),r&&r.classList.add("active")},m=()=>{p(i),s.innerHTML=`
            <div class="panel-card" style="max-width: 600px;">
                <div class="panel-form" style="display: flex; flex-direction: column; gap: 16px;">
                    <div class="form-group">
                        <label class="form-label">Supabase URL</label>
                        <input type="text" value="${e}" disabled class="form-input-text" style="opacity: 0.6; cursor: not-allowed;">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Supabase Anon Key</label>
                        <input type="text" value="${n.substring(0,15)}*****************" disabled class="form-input-text" style="opacity: 0.6; cursor: not-allowed;">
                    </div>



                    <button class="btn btn-primary" id="btn-save-cloud-settings" style="width: fit-content; margin-top: 10px;">Salvar Ajustes</button>
                </div>
            </div>
        `,document.getElementById("btn-save-cloud-settings").onclick=()=>{b("Configurações de nuvem salvas com sucesso!","success")},lucide.createIcons()},x=()=>{if(p(o),!l.localHealth){s.innerHTML=`
                <div class="panel-card" style="max-width: 600px; text-align: center; padding: 40px 20px;">
                    <i data-lucide="wifi-off" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 16px;"></i>
                    <h3 style="margin-bottom: 8px; font-weight: 600;">Cérebro Local Offline</h3>
                    <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 20px; line-height: 1.5;">
                        Não conseguimos conectar ao seu servidor local FastAPI (porta 8000).<br>
                        Certifique-se de rodar <code>python main.py</code> na pasta <code>_command_center/backend</code> para acessar as configurações e chaves locais.
                    </p>
                </div>
            `,lucide.createIcons();return}s.innerHTML=`
            <div class="panel-card" style="max-width: 600px;">
                <form id="local-settings-form" class="panel-form" style="display: flex; flex-direction: column; gap: 16px;">
                    <div class="settings-input-group">
                        <div class="settings-group-title" style="font-weight: 700; margin-bottom: 12px; font-size: 13px; display: flex; gap: 6px; align-items: center; color: var(--accent-cyan);">
                            <i data-lucide="key" style="width: 16px; height: 16px;"></i>
                            <span>Chaves de API das IAs (Locais)</span>
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label class="form-label" for="key-groq">Groq API Key (Llama 3.3 - Grátis)</label>
                            <input type="password" id="key-groq" class="form-input-text" placeholder="gsk_..." value="${l.localSettings.groq_api_key||""}">
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label class="form-label" for="key-gemini">Gemini API Key (Gemini - Grátis)</label>
                            <input type="password" id="key-gemini" class="form-input-text" placeholder="AIzaSy..." value="${l.localSettings.gemini_api_key||""}">
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label class="form-label" for="key-openrouter">OpenRouter API Key (Claude - Pago)</label>
                            <input type="password" id="key-openrouter" class="form-input-text" placeholder="sk-or-v1-..." value="${l.localSettings.openrouter_api_key||""}">
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label class="form-label" for="key-perplexity">Perplexity API Key (Search - Pago)</label>
                            <input type="password" id="key-perplexity" class="form-input-text" placeholder="sk-or-v1-..." value="${l.localSettings.perplexity_api_key||""}">
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="key-unsplash">Unsplash Access Key (Imagens)</label>
                            <input type="password" id="key-unsplash" class="form-input-text" placeholder="UsX3q..." value="${l.localSettings.unsplash_access_key||""}">
                        </div>
                    </div>

                    <div class="settings-input-group" style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px;">
                        <div class="settings-group-title" style="font-weight: 700; margin-bottom: 12px; font-size: 13px; display: flex; gap: 6px; align-items: center; color: var(--accent-purple);">
                            <i data-lucide="folder" style="width: 16px; height: 16px;"></i>
                            <span>Workspace e Preferências</span>
                        </div>

                        <div class="form-group" style="margin-bottom: 12px;">
                            <label class="form-label" for="local-workspace">Caminho da Pasta Workspace</label>
                            <input type="text" id="local-workspace" class="form-input-text" placeholder="Ex: D:/0 - SISTEMA ACADEMIA" value="${l.localSettings.workspace_path||""}">
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="local-default-provider">Provedor Local Padrão</label>
                            <select id="local-default-provider" class="filter-select" style="width: 100%">
                                <option value="groq" ${l.localSettings.default_provider==="groq"?"selected":""}>Groq (Llama 3.3)</option>
                                <option value="gemini" ${l.localSettings.default_provider==="gemini"?"selected":""}>Gemini (Google)</option>
                                <option value="openrouter" ${l.localSettings.default_provider==="openrouter"?"selected":""}>OpenRouter (Claude)</option>
                                <option value="perplexity" ${l.localSettings.default_provider==="perplexity"?"selected":""}>Perplexity (Search)</option>
                            </select>
                        </div>
                    </div>



                    <button type="submit" class="btn btn-primary" style="width: fit-content; margin-top: 10px;">Salvar Chaves Locais</button>
                </form>
            </div>
        `,document.getElementById("local-settings-form").onsubmit=async r=>{r.preventDefault();const c=document.getElementById("key-groq").value,g=document.getElementById("key-gemini").value,h=document.getElementById("key-openrouter").value,f=document.getElementById("key-perplexity").value,P=document.getElementById("key-unsplash").value,w=document.getElementById("local-workspace").value,A=document.getElementById("local-default-provider").value,C={groq_api_key:c,gemini_api_key:g,openrouter_api_key:h,perplexity_api_key:f,unsplash_access_key:P,workspace_path:w,default_provider:A};b("Salvando chaves locais no SQLite...","info");try{const z=await S.localUpdateSettings(C);l.localSettings=z,l.localActiveProvider=z.default_provider||"groq",b("Chaves e configurações locais salvas com sucesso!","success"),we()}catch(z){b(`Erro ao salvar chaves locais: ${z.message}`,"error")}},lucide.createIcons()},u=async()=>{p(a),s.innerHTML=`
            <div class="panel-card" style="max-width: 680px;">
                <div class="panel-header">
                    <h2>☁️ Base de Conhecimento — Google Drive</h2>
                </div>
                <div class="panel-form" style="display: flex; flex-direction: column; gap: 20px;">

                    <div id="drive-status-section" style="display:flex; gap:10px; flex-wrap:wrap;">
                        <div class="loading-spinner-container" style="min-height:40px;">
                            <div class="spinner" style="width:16px;height:16px;border-width:2px;"></div>
                        </div>
                    </div>

                    <div style="border-top: var(--border-glass); padding-top: 20px;">
                        <p style="color: var(--text-muted); font-size: 13px; line-height: 1.6; margin-bottom: 16px;">
                            Sincronize os arquivos da pasta <code style="background:rgba(255,255,255,0.08); padding:2px 6px; border-radius:4px;">_BASE_CONHECIMENTO</code> no Google Drive com o sistema.
                            Novos arquivos adicionados ao Drive ficam disponíveis para as IAs após a sincronização.
                        </p>
                        <div style="display:flex; gap:10px; flex-wrap:wrap;">
                            <button id="btn-drive-sync" class="btn btn-primary" style="display:inline-flex;align-items:center;gap:8px;">
                                <i data-lucide="refresh-cw"></i>
                                <span>Sincronizar do Google Drive</span>
                            </button>
                            <button id="btn-drive-list" class="btn btn-secondary" style="display:inline-flex;align-items:center;gap:8px;">
                                <i data-lucide="list"></i>
                                <span>Listar Arquivos no Drive</span>
                            </button>
                        </div>
                    </div>

                    <div id="drive-report" style="display:none; border-top: var(--border-glass); padding-top: 16px;"></div>

                    <div style="background: rgba(139,92,246,0.06); border: 1px solid rgba(139,92,246,0.2); border-radius: var(--radius-sm); padding: 16px; font-size: 13px; line-height: 1.7;">
                        <strong style="color: var(--accent-violet);">⚙️ Como configurar:</strong><br>
                        1. Crie uma <strong>Service Account</strong> no <a href="https://console.cloud.google.com" target="_blank" style="color:var(--accent-cyan);">Google Cloud Console</a><br>
                        2. Baixe o arquivo <code style="background:rgba(255,255,255,0.08); padding:1px 5px; border-radius:3px;">credentials.json</code><br>
                        3. Defina <code style="background:rgba(255,255,255,0.08); padding:1px 5px; border-radius:3px;">GOOGLE_DRIVE_CREDENTIALS_JSON</code> no <code style="background:rgba(255,255,255,0.08); padding:1px 5px; border-radius:3px;">.env</code> do backend<br>
                        4. Compartilhe a pasta <strong>_BASE_CONHECIMENTO</strong> no Drive com o e-mail da Service Account<br>
                        5. Defina <code style="background:rgba(255,255,255,0.08); padding:1px 5px; border-radius:3px;">GOOGLE_DRIVE_FOLDER_ID</code> com o ID da pasta no Drive
                    </div>
                </div>
            </div>
        `,lucide.createIcons();try{const r=await S.driveStatus(),c=document.getElementById("drive-status-section"),g=[{ok:r.google_api_available,label:"API Google instalada"},{ok:r.credentials_configured,label:"Credenciais configuradas"},{ok:r.folder_configured,label:"Pasta configurada"},{ok:r.pdf_extraction_available,label:"Extração de PDF"}];c.innerHTML=g.map(h=>`
                <span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;
                    background:${h.ok?"rgba(52,211,153,0.12)":"rgba(239,68,68,0.1)"};
                    border:1px solid ${h.ok?"rgba(52,211,153,0.3)":"rgba(239,68,68,0.3)"};
                    font-size:12px; color:${h.ok?"var(--accent-emerald)":"var(--accent-red)"}">
                    <i data-lucide="${h.ok?"check-circle":"x-circle"}" style="width:13px;height:13px;"></i>
                    ${h.label}
                </span>
            `).join(""),r.last_sync&&(c.innerHTML+=`<div style="font-size:12px;color:var(--text-muted);width:100%;margin-top:4px;">Última sincronização: ${new Date(r.last_sync).toLocaleString("pt-BR")}</div>`),lucide.createIcons()}catch{document.getElementById("drive-status-section").innerHTML='<span style="color:var(--text-muted);font-size:12px;">⚠️ Backend local offline — status indisponível</span>'}document.getElementById("btn-drive-sync").onclick=async()=>{const r=document.getElementById("btn-drive-sync"),c=document.getElementById("drive-report");r.disabled=!0,r.innerHTML='<i data-lucide="loader-2" style="animation:spin 1s linear infinite;"></i><span>Sincronizando...</span>',lucide.createIcons();try{const g=await S.driveSyncWait(),h=g.synced||[],f=g.skipped||[],P=g.errors||[];c.style.display="block",c.innerHTML=`
                    <h4 style="margin-bottom:10px;font-size:14px;">📊 Relatório de Sincronização</h4>
                    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px;">
                        <span style="font-size:13px;"><strong style="color:var(--accent-emerald);">${h.length}</strong> sincronizados</span>
                        <span style="font-size:13px;"><strong style="color:var(--text-muted);">${f.length}</strong> sem alterações</span>
                        <span style="font-size:13px;"><strong style="color:var(--accent-red);">${P.length}</strong> erros</span>
                        <span style="font-size:13px;">Total: <strong>${g.total_files||0}</strong> arquivos no Drive</span>
                    </div>
                    ${h.length>0?`<div style="font-size:12px;color:var(--text-muted);">${h.map(w=>`✅ ${w.name} (${w.words} palavras)`).join("<br>")}</div>`:""}
                    ${P.length>0?`<div style="font-size:12px;color:var(--accent-red);margin-top:8px;">${P.map(w=>`❌ ${w.file}: ${w.error}`).join("<br>")}</div>`:""}
                `,b(`Sincronização concluída! ${h.length} arquivo(s) atualizados.`,"success")}catch(g){b("Erro na sincronização: "+g.message,"error")}finally{r.disabled=!1,r.innerHTML='<i data-lucide="refresh-cw"></i><span>Sincronizar do Google Drive</span>',lucide.createIcons()}},document.getElementById("btn-drive-list").onclick=async()=>{const r=document.getElementById("drive-report");r.innerHTML='<div class="loading-spinner-container" style="min-height:60px;"><div class="spinner" style="width:16px;height:16px;border-width:2px;"></div></div>',r.style.display="block";try{const g=(await S.driveListFiles()).files||[],h={};g.forEach(f=>{const P=f.category||"geral";h[P]||(h[P]=[]),h[P].push(f)}),r.innerHTML=`
                    <h4 style="margin-bottom:10px;font-size:14px;">📁 ${g.length} arquivo(s) encontrado(s) no Drive</h4>
                    ${Object.entries(h).map(([f,P])=>`
                        <div style="margin-bottom:10px;">
                            <strong style="font-size:12px;color:var(--accent-violet);text-transform:uppercase;">${f}</strong>
                            <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">${P.map(w=>`📄 ${w.name}`).join(" &nbsp;·&nbsp; ")}</div>
                        </div>
                    `).join("")}
                `}catch(c){r.innerHTML=`<span style="color:var(--accent-red);font-size:13px;">Erro: ${c.message}</span>`}}};i.onclick=m,o.onclick=x,a.onclick=u,l.localHealth?x():m(),Ve()}function ie(t){return l.localHealth?!0:(t.innerHTML=`
            <div class="page-title-section">
                <h2 class="page-title">Agente Offline</h2>
            </div>
            <div class="panel-card" style="max-width: 650px; margin: 40px auto; text-align: center; padding: 40px 20px; border: 1px solid rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.02);">
                <i data-lucide="wifi-off" style="width: 48px; height: 48px; color: var(--accent-red); margin-bottom: 16px;"></i>
                <h3 style="margin-bottom: 12px; font-weight: 600; font-size: 16px;">Conectividade com o Cérebro Local Ausente</h3>
                <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 24px; line-height: 1.6; max-width: 480px; margin-left: auto; margin-right: auto;">
                    Este agente depende do processamento local rodando na sua máquina.<br>
                    Para ativá-lo, inicie o seu servidor local abrindo um terminal PowerShell e rodando:
                </p>
                <div style="background: rgba(0,0,0,0.4); border-radius: var(--radius-sm); padding: 12px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--accent-cyan); margin-bottom: 24px; text-align: left; max-width: 400px; margin-left: auto; margin-right: auto; border: var(--border-glass);">
                    PS D:\\0 - SISTEMA ACADEMIA\\_command_center\\backend&gt; python main.py
                </div>
                <button class="btn btn-secondary" onclick="window.location.reload()" style="display: inline-flex; align-items: center; gap: 6px;">
                    <i data-lucide="refresh-cw"></i>
                    <span>Tentar Reconectar</span>
                </button>
            </div>
        `,lucide.createIcons(),!1)}function ze(t){if(!ie(t))return;const e=`
        <div class="form-group">
            <label class="form-label" for="meta-avatar">Persona Foco (Avatar)</label>
            <select id="meta-avatar" class="filter-select" style="width: 100%">
                <option value="">-- Opcional (Nenhum) --</option>
                ${l.localAvatars.map(n=>`<option value="${n.id}">${n.name}</option>`).join("")}
            </select>
        </div>
        
        <div class="form-group">
            <label class="form-label" for="meta-market">Dados de Mercado de Apoio</label>
            <select id="meta-market" class="filter-select" style="width: 100%">
                <option value="">-- Opcional (Nenhum) --</option>
                ${l.localMarketData.map(n=>`<option value="${n.id}">${n.statistic.substring(0,70)}...</option>`).join("")}
            </select>
        </div>
        
        <div class="form-group">
            <label class="form-label" for="meta-custom">Diretrizes de Copy Extras</label>
            <textarea id="meta-custom" class="form-textarea" placeholder="Ex: Escreva focado em retargeting de pessoas que viram a aula experimental..."></textarea>
        </div>

        <div class="form-group">
            <label class="form-label">Estágio de Funil Comercial</label>
            <div class="funnel-selector-grid">
                <label class="funnel-option active">
                    <input type="radio" name="funnel-stage" value="TOPO" checked style="display:none;">
                    <span class="funnel-badge-dot topo"></span>
                    <span>Topo (Atração - 65%)</span>
                </label>
                <label class="funnel-option">
                    <input type="radio" name="funnel-stage" value="MEIO" style="display:none;">
                    <span class="funnel-badge-dot meio"></span>
                    <span>Meio (Método - 20%)</span>
                </label>
                <label class="funnel-option">
                    <input type="radio" name="funnel-stage" value="FUNDO" style="display:none;">
                    <span class="funnel-badge-dot fundo"></span>
                    <span>Fundo (Oferta - 15%)</span>
                </label>
            </div>
        </div>
    `;ce(t,"Agente: Meta Ads Generator","Gere copys completas para campanhas Meta Ads com ganchos baseados em estatísticas reais e foco no Quiz.",e,async n=>{const i=parseInt(document.getElementById("meta-avatar").value)||null,o=parseInt(document.getElementById("meta-market").value)||null,a=document.getElementById("meta-custom").value,s=t.querySelector('input[name="funnel-stage"]:checked'),p=s?s.value:"TOPO";return await S.localGenerateMetaAds(i,o,a,n,null,p)},"meta_ads")}function qe(t){if(!ie(t))return;const e=`
        <div class="form-group">
            <label class="form-label" for="insta-module">Módulo Origem do Livro</label>
            <select id="insta-module" class="filter-select" style="width: 100%">
                ${l.localModules.map(n=>`<option value="${n.id}">${n.letter} - ${n.name}</option>`).join("")}
            </select>
        </div>
        
        <div class="form-group">
            <label class="form-label" for="insta-post-type">Formato do Post</label>
            <select id="insta-post-type" class="filter-select" style="width: 100%">
                <option value="post_unico">Post Único (Imagem + Legenda)</option>
                <option value="carrossel_4">Carrossel (4 slides)</option>
                <option value="carrossel_7">Carrossel (7 slides)</option>
                <option value="carrossel">Carrossel (8 slides - Padrão)</option>
                <option value="carrossel_9">Carrossel (9 slides)</option>
            </select>
        </div>
        
        <div class="form-group">
            <label class="form-label" for="insta-custom">Instruções de Post Extra</label>
            <textarea id="insta-custom" class="form-textarea" placeholder="Ex: Foco em 7 slides e tom mais incisivo sobre perda de tempo."></textarea>
        </div>

        <div class="form-group">
            <label class="form-label">Estágio de Funil Comercial</label>
            <div class="funnel-selector-grid">
                <label class="funnel-option active">
                    <input type="radio" name="funnel-stage" value="TOPO" checked style="display:none;">
                    <span class="funnel-badge-dot topo"></span>
                    <span>Topo (Atração - 65%)</span>
                </label>
                <label class="funnel-option">
                    <input type="radio" name="funnel-stage" value="MEIO" style="display:none;">
                    <span class="funnel-badge-dot meio"></span>
                    <span>Meio (Método - 20%)</span>
                </label>
                <label class="funnel-option">
                    <input type="radio" name="funnel-stage" value="FUNDO" style="display:none;">
                    <span class="funnel-badge-dot fundo"></span>
                    <span>Fundo (Oferta - 15%)</span>
                </label>
            </div>
        </div>
    `;ce(t,"Agente: Instagram Copywriter","Converta temas complexos do livro A.C.A.D.E.M.I.A. em roteiros magnéticos de carrosséis e posts únicos para engajamento.",e,async n=>{const i=parseInt(document.getElementById("insta-module").value),o=document.getElementById("insta-post-type").value,a=document.getElementById("insta-custom").value,s=t.querySelector('input[name="funnel-stage"]:checked'),p=s?s.value:"TOPO";return await S.localGenerateInstagram(i,a,n,null,p,o)},"instagram")}function Re(t){if(!ie(t))return;ce(t,"Agente: Blog SEO Copywriter","Gere artigos de blog de profunda validação científica, recheados de referências do livro e SEO otimizados.",`
        <div class="form-group">
            <label class="form-label" for="blog-key">Palavra-chave Foco (SEO)</label>
            <input type="text" id="blog-key" class="form-input-text" placeholder="Ex: como vencer a ansiedade na pos graduacao" required>
        </div>
        
        <div class="form-group">
            <label class="form-label" for="blog-custom">Subtemas ou Diretrizes Finais</label>
            <textarea id="blog-custom" class="form-textarea" placeholder="Ex: Mencione a importância da rotina matinal e o Módulo D do livro."></textarea>
        </div>

        <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label">Formato de Saída do Artigo</label>
            <div class="format-selector-grid">
                <label class="format-option active" data-format="markdown">
                    <input type="radio" name="blog-format" value="markdown" checked style="display:none;">
                    <i data-lucide="file-text" style="width:14px; height:14px; margin-right:4px;"></i>
                    <span>Markdown</span>
                </label>
                <label class="format-option" data-format="html">
                    <input type="radio" name="blog-format" value="html" style="display:none;">
                    <i data-lucide="code" style="width:14px; height:14px; margin-right:4px;"></i>
                    <span>HTML do Blog</span>
                </label>
            </div>
        </div>

        <div class="form-group">
            <label class="form-label">Estágio de Funil Comercial</label>
            <div class="funnel-selector-grid">
                <label class="funnel-option active">
                    <input type="radio" name="funnel-stage" value="TOPO" checked style="display:none;">
                    <span class="funnel-badge-dot topo"></span>
                    <span>Topo (Atração - 65%)</span>
                </label>
                <label class="funnel-option">
                    <input type="radio" name="funnel-stage" value="MEIO" style="display:none;">
                    <span class="funnel-badge-dot meio"></span>
                    <span>Meio (Método - 20%)</span>
                </label>
                <label class="funnel-option">
                    <input type="radio" name="funnel-stage" value="FUNDO" style="display:none;">
                    <span class="funnel-badge-dot fundo"></span>
                    <span>Fundo (Oferta - 15%)</span>
                </label>
            </div>
        </div>
        `,async n=>{const i=document.getElementById("blog-key").value,o=document.getElementById("blog-custom").value,a=t.querySelector('input[name="funnel-stage"]:checked'),s=a?a.value:"TOPO",p=t.querySelector('input[name="blog-format"]:checked'),m=p?p.value:"markdown";return await S.localGenerateBlog(i,o,n,null,s,m)},"blog_seo");const e=t.querySelectorAll(".format-option");e.forEach(n=>{n.addEventListener("click",()=>{e.forEach(o=>o.classList.remove("active")),n.classList.add("active");const i=n.querySelector('input[type="radio"]');i&&(i.checked=!0)})})}function Ge(t){if(!ie(t))return;const e=`
        <div class="form-group">
            <label class="form-label" for="prod-module">Módulo Âncora do Livro</label>
            <select id="prod-module" class="filter-select" style="width: 100%">
                ${l.localModules.map(n=>`<option value="${n.id}">${n.letter} - ${n.name}</option>`).join("")}
            </select>
        </div>
        
        <div class="form-group">
            <label class="form-label" for="prod-custom">Formatos de Criativos / Restrições</label>
            <textarea id="prod-custom" class="form-textarea" placeholder="Ex: Crie no formato de um desafio guiado de 14 dias para combater síndrome do impostor."></textarea>
        </div>

        <div class="form-group">
            <label class="form-label">Estágio de Funil Comercial</label>
            <div class="funnel-selector-grid">
                <label class="funnel-option active">
                    <input type="radio" name="funnel-stage" value="TOPO" checked style="display:none;">
                    <span class="funnel-badge-dot topo"></span>
                    <span>Topo (Atração - 65%)</span>
                </label>
                <label class="funnel-option">
                    <input type="radio" name="funnel-stage" value="MEIO" style="display:none;">
                    <span class="funnel-badge-dot meio"></span>
                    <span>Meio (Método - 20%)</span>
                </label>
                <label class="funnel-option">
                    <input type="radio" name="funnel-stage" value="FUNDO" style="display:none;">
                    <span class="funnel-badge-dot fundo"></span>
                    <span>Fundo (Oferta - 15%)</span>
                </label>
            </div>
        </div>
    `;ce(t,"Agente: Novos Produtos & Bumps","Gere blueprints completos de novos microprodutos, templates de Notion e scripts de checkout rápidos.",e,async n=>{const i=parseInt(document.getElementById("prod-module").value),o=document.getElementById("prod-custom").value,a=t.querySelector('input[name="funnel-stage"]:checked'),s=a?a.value:"TOPO";return await S.localGenerateProduct(i,o,n,null,s)},"product")}function Fe(t){if(!ie(t))return;ce(t,"Agente: Criador de Temas","Gere pacotes estratégicos de temas, ideias de ganchos e hashtags alinhadas ao funil e aos perfis de improdutividade.",`
        <div class="form-group">
            <label class="form-label" for="theme-funnel">Estágio do Funil Comercial</label>
            <select id="theme-funnel" class="filter-select" style="width: 100%">
                <option value="ToFu">Topo (ToFu - Atrair)</option>
                <option value="MoFu">Meio (MoFu - Educar)</option>
                <option value="BoFu">Fundo (BoFu - Converter)</option>
                <option value="TODOS">Todos os Estágios (Completo)</option>
            </select>
        </div>
        
        <div class="form-group">
            <label class="form-label" for="theme-icp">Perfil de ICP Prioritário</label>
            <select id="theme-icp" class="filter-select" style="width: 100%">
                <option value="TODOS">Todos os Perfis (Universal)</option>
                <option value="1">Perfil 1 — O Analista Perpétuo (Sofia)</option>
                <option value="2">Perfil 2 — O Perfeccionista Paralisado (Ana)</option>
                <option value="3">Perfil 3 — O Multitarefa Caótico (Pedro)</option>
                <option value="4">Perfil 4 — O Procrastinador Criativo (Rafael)</option>
                <option value="5">Perfil 5 — O Dependente de Motivação (Lucas)</option>
                <option value="6">Perfil 6 — O Sobrecarregado Sistêmico (Gabriela)</option>
            </select>
        </div>
        
        <div class="form-group">
            <label class="form-label" for="theme-objective">Objetivo da Rodada</label>
            <select id="theme-objective" class="filter-select" style="width: 100%">
                <option value="reconhecimento">Reconhecimento</option>
                <option value="aquecimento">Aquecimento</option>
                <option value="educação">Educação / Doutrinação</option>
                <option value="conversão">Conversão de Vendas</option>
                <option value="remarketing">Remarketing</option>
            </select>
        </div>
        
        <div class="form-group">
            <label class="form-label" for="theme-qty">Quantidade de Temas por Estágio</label>
            <input type="number" id="theme-qty" class="form-input-text" value="5" min="1" max="20" style="height: 38px; width: 100%;" />
        </div>
        
        <div class="form-group">
            <label class="form-label" for="theme-channel">Canal de Destino Primário</label>
            <select id="theme-channel" class="filter-select" style="width: 100%">
                <option value="Todos">Todos os Canais</option>
                <option value="Instagram">Instagram (Geral)</option>
                <option value="Reels">Reels (Vídeo Curto)</option>
                <option value="Carrossel">Carrossel (Conteúdo Denso)</option>
                <option value="Stories">Stories (Engajamento)</option>
                <option value="E-mail">E-mail (Nutrição)</option>
                <option value="Anúncios Meta">Anúncios Meta (Tráfego Pago)</option>
            </select>
        </div>

        <div class="form-group">
            <label class="form-label" for="theme-source-type">Origem dos Temas</label>
            <select id="theme-source-type" class="filter-select" style="width: 100%">
                <option value="suggested">Temas sugeridos pela plataforma</option>
                <option value="custom">Digitar assunto específico</option>
            </select>
        </div>
        
        <div class="form-group" id="theme-custom-subject-group" style="display: none;">
            <label class="form-label" for="theme-custom-subject">Assunto Específico</label>
            <textarea id="theme-custom-subject" class="form-textarea" placeholder="Digite o assunto específico para gerar temas a partir dele..." style="min-height: 80px; width: 100%;"></textarea>
        </div>
        `,async i=>{const o=document.getElementById("theme-funnel").value,a=document.getElementById("theme-icp").value,s=document.getElementById("theme-objective").value,p=document.getElementById("theme-qty").value,m=document.getElementById("theme-channel").value,x=document.getElementById("theme-source-type").value;let u=null;return x==="custom"&&(u=document.getElementById("theme-custom-subject").value),await S.localGenerateThemes(o,a,s,p,m,i,null,u)},"theme_creator");const e=document.getElementById("theme-source-type"),n=document.getElementById("theme-custom-subject-group");e&&n&&e.addEventListener("change",()=>{e.value==="custom"?n.style.display="block":n.style.display="none"})}function Ne(t){if(!ie(t))return;let e=l.localActiveCampaignPieces||{meta_ads:"",instagram:"",blog:""},n="meta_ads";t.innerHTML=`
        <div class="page-title-section">
            <h2 class="page-title">Super Agente: Campanha Omnichannel 360°</h2>
            <p class="page-subtitle">Gere campanhas coordenadas e integradas (Anúncio, Post e Artigo) a partir de um único tema central.</p>
        </div>
        
        <div class="agent-workspace-grid">
            <!-- Left Side: Controls -->
            <div class="panel-card">
                <form id="campaign-form" class="panel-form">
                    <div class="form-group">
                        <label class="form-label" for="campaign-theme">Tema Central da Campanha</label>
                        <textarea id="campaign-theme" class="form-textarea" placeholder="Ex: Procrastinação e medo do julgamento ao escrever o referencial teórico da dissertação..." required style="min-height: 100px;"></textarea>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label class="form-label" for="campaign-insta-type">Formato da Peça Instagram</label>
                        <select id="campaign-insta-type" class="filter-select" style="width: 100%">
                            <option value="post_unico">Post Único (Imagem + Legenda)</option>
                            <option value="carrossel_4">Carrossel (4 slides)</option>
                            <option value="carrossel_7">Carrossel (7 slides)</option>
                            <option value="carrossel">Carrossel (8 slides - Padrão)</option>
                            <option value="carrossel_9">Carrossel (9 slides)</option>
                        </select>
                    </div>
                    
                    <!-- Choose active API keys / provider -->
                    <div class="form-group">
                        <label class="form-label">Motor de IA (Chave Escolhida)</label>
                        <div class="engine-toggle-grid">
                            <div class="engine-toggle-card active" data-provider="groq">
                                <span class="engine-provider-name">Groq</span>
                                <span class="engine-type-label">Llama 3.3 (Grátis)</span>
                            </div>
                            <div class="engine-toggle-card" data-provider="gemini">
                                <span class="engine-provider-name">Gemini</span>
                                <span class="engine-type-label">2.5 Flash (Grátis)</span>
                            </div>
                            <div class="engine-toggle-card" data-provider="openrouter">
                                <span class="engine-provider-name">Claude</span>
                                <span class="engine-type-label">3.5 Sonnet (Paga)</span>
                            </div>
                            <div class="engine-toggle-card" data-provider="perplexity">
                                <span class="engine-provider-name">Search</span>
                                <span class="engine-type-label">Perplexity (Paga)</span>
                            </div>
                        </div>
                    </div>

                    <div class="form-group" style="margin-top: 12px; margin-bottom: 12px;">
                        <label class="form-label">Formato do Artigo do Blog</label>
                        <div class="format-selector-grid">
                            <label class="format-option active" data-format="markdown">
                                <input type="radio" name="campaign-format" value="markdown" checked style="display:none;">
                                <i data-lucide="file-text" style="width:14px; height:14px; margin-right:4px;"></i>
                                <span>Markdown</span>
                            </label>
                            <label class="format-option" data-format="html">
                                <input type="radio" name="campaign-format" value="html" style="display:none;">
                                <i data-lucide="code" style="width:14px; height:14px; margin-right:4px;"></i>
                                <span>HTML do Blog</span>
                            </label>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary" id="btn-submit-campaign" style="margin-top: 10px; background: linear-gradient(135deg, var(--accent-purple), var(--accent-cyan)); border: none; font-weight: 700;">
                        <i data-lucide="layers"></i>
                        <span>Disparar Orquestração 360°</span>
                    </button>
                </form>
            </div>
            
            <!-- Right Side: Outputs -->
            <div class="panel-card output-panel">
                <div class="panel-header" style="border-bottom: none; padding-bottom: 0; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div class="campaign-tabs-nav">
                        <button class="campaign-tab-btn active" data-tab="meta_ads" style="border: none;">
                            <i data-lucide="megaphone" class="tab-icon"></i>
                            <span>Anúncio Meta Ads</span>
                        </button>
                        <button class="campaign-tab-btn" data-tab="instagram" style="border: none;">
                            <i data-lucide="instagram" class="tab-icon"></i>
                            <span>Instagram</span>
                        </button>
                        <button class="campaign-tab-btn" data-tab="blog" style="border: none;">
                            <i data-lucide="file-text" class="tab-icon"></i>
                            <span>Artigo Blog SEO</span>
                        </button>
                    </div>
                    <div class="output-header-actions" style="display: flex; gap: 8px; align-items: center;">
                        <button class="btn btn-secondary btn-sm" id="btn-csv-campaign" style="padding: 6px 12px; font-size: 11px; display: none; gap: 4px; align-items: center; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; font-weight: 600;">
                            <i data-lucide="file-spreadsheet"></i>
                            <span>Planilha Lote CSV</span>
                        </button>
                        <button class="btn btn-secondary btn-sm" id="btn-copy-campaign" style="padding: 6px 12px; font-size: 11px;">
                            <i data-lucide="copy"></i>
                            <span>Copiar</span>
                        </button>
                    </div>
                </div>
                
                <div class="output-textarea-container" style="height: 500px;">
                    <div class="output-text-area empty" id="campaign-output-box">
                        Digite um tema central no painel esquerdo e execute o Super Agente para estruturar sua campanha omnichannel...
                    </div>
                </div>
                
                <div class="output-rating-bar" id="campaign-rating-container" style="display: none;">
                    <span class="stat-label">Avalie a qualidade dessa geração omnichannel:</span>
                    <div class="rating-stars-container" id="campaign-rating-stars">
                        <i data-lucide="star" class="star-icon" data-value="1"></i>
                        <i data-lucide="star" class="star-icon" data-value="2"></i>
                        <i data-lucide="star" class="star-icon" data-value="3"></i>
                        <i data-lucide="star" class="star-icon" data-value="4"></i>
                        <i data-lucide="star" class="star-icon" data-value="5"></i>
                    </div>
                </div>
            </div>
        </div>
    `;let i=l.localActiveProvider||"groq";const o=t.querySelectorAll(".engine-toggle-card");o.forEach(u=>{const r=u.getAttribute("data-provider");r===i&&(o.forEach(c=>c.classList.remove("active")),u.classList.add("active")),u.addEventListener("click",()=>{o.forEach(c=>c.classList.remove("active")),u.classList.add("active"),i=r,l.localActiveProvider=r,r==="groq"?l.localActiveModel="llama-3.3-70b-versatile":r==="gemini"?l.localActiveModel="gemini-2.5-flash":r==="openrouter"?l.localActiveModel="anthropic/claude-sonnet-4.5":r==="perplexity"&&(l.localActiveModel="sonar-reasoning-pro")})});const a=t.querySelectorAll(".campaign-tab-btn"),s=t.querySelector("#campaign-output-box"),p=()=>{const u=t.querySelector("#btn-csv-campaign");if(u&&(n==="instagram"&&!s.classList.contains("empty")&&e.instagram?u.style.display="inline-flex":u.style.display="none"),s.classList.contains("empty"))return;const r=e[n];if(!r)s.innerHTML='<div style="text-align: center; color: var(--text-muted); padding: 40px 0;">Nenhum conteúdo gerado para esta peça.</div>';else{const c=t.querySelector('input[name="campaign-format"]:checked'),g=c?c.value:"markdown";if(n==="blog"&&g==="html"){let h=r;const f=h.match(/(?:📝 CONTEÚDO COMPLETO DO ARTIGO:|📝 CONTEÚDO DO ARTIGO:)\s*([\s\S]*)/i);f&&(h=f[1].trim()),h=h.replace(/```html\s*([\s\S]*?)\s*```/g,"$1"),h=h.replace(/```\s*([\s\S]*?)\s*```/g,"$1"),s.innerHTML=h}else s.innerHTML=re(r)}lucide.createIcons()};a.forEach(u=>{u.addEventListener("click",()=>{a.forEach(r=>r.classList.remove("active")),u.classList.add("active"),n=u.getAttribute("data-tab"),p()})});const m=t.querySelectorAll(".format-option");m.forEach(u=>{u.addEventListener("click",()=>{m.forEach(c=>c.classList.remove("active")),u.classList.add("active");const r=u.querySelector('input[type="radio"]');r&&(r.checked=!0),p()})}),t.querySelector("#btn-copy-campaign").addEventListener("click",()=>{let u=e[n];if(u&&!s.classList.contains("empty")){const r=t.querySelector('input[name="campaign-format"]:checked'),c=r?r.value:"markdown";if(n==="blog"&&c==="html"){const g=u.match(/(?:📝 CONTEÚDO COMPLETO DO ARTIGO:|📝 CONTEÚDO DO ARTIGO:)\s*([\s\S]*)/i);g&&(u=g[1].trim()),u=u.replace(/```html\s*([\s\S]*?)\s*```/g,"$1"),u=u.replace(/```\s*([\s\S]*?)\s*```/g,"$1")}navigator.clipboard.writeText(u),b("Peça copiada para a área de transferência!","success")}else b("Nenhum conteúdo disponível para copiar nesta aba.","info")});const x=t.querySelector("#btn-csv-campaign");x&&x.addEventListener("click",()=>{const u=e.instagram;if(u&&!s.classList.contains("empty"))try{const r=Se(u);ke(r,`canva_lote_campanha_${l.localActiveGeneration.generation_id||Date.now()}.csv`),b("Planilha CSV da Campanha gerada para importação no Canva!","success")}catch(r){b(`Erro ao exportar CSV: ${r.message}`,"error")}else b("Nenhum conteúdo do Instagram gerado para exportar.","info")}),t.querySelector("#campaign-form").addEventListener("submit",async u=>{u.preventDefault();const r=t.querySelector("#btn-submit-campaign"),c=t.querySelector("#campaign-rating-container"),g=t.querySelector("#campaign-theme").value,h=t.querySelector("#campaign-insta-type").value,f=t.querySelector('input[name="campaign-format"]:checked'),P=f?f.value:"markdown";r.disabled=!0,r.innerHTML='<div class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></div> <span>Orquestrando 360...</span>',s.className="output-text-area",s.innerHTML='<div class="loading-spinner-container"><div class="spinner"></div><p>Buscando na base de dados indexada (RAG)... e orquestrando as 3 peças promocionais. Aguarde cerca de 10 a 20 segundos.</p></div>',c.style.display="none",e={meta_ads:"",instagram:"",blog:""};try{const w=await S.localGenerateCampaign(g,i,null,P,h);l.localActiveGeneration=w;const A=w.output,C=M=>{const R=A.match(M);return R?{index:R.index,tag:R[0]}:{index:-1,tag:""}},z=C(/\[\[\[META_ADS\]\]\]/i),X=C(/\[\[\[INSTAGRAM\]\]\]/i),ee=C(/\[\[\[BLOG\]\]\]/i),L=(M,R)=>{if(M.index===-1)return"";const N=M.index+M.tag.length,H=R&&R.index!==-1?R.index:-1;return H===-1||H<M.index?A.substring(N).trim():A.substring(N,H).trim()},te=[{type:"meta_ads",match:z},{type:"instagram",match:X},{type:"blog",match:ee}].filter(M=>M.match.index!==-1).sort((M,R)=>M.match.index-R.match.index);e={meta_ads:"",instagram:"",blog:""};for(let M=0;M<te.length;M++){const R=te[M],N=M+1<te.length?te[M+1].match:null;e[R.type]=L(R.match,N)}l.localActiveCampaignPieces=e,s.className="output-text-area",p(),c.style.display="flex",Ie(w.generation_id,t),b("Campanha omnichannel gerada com sucesso!","success")}catch(w){s.className="output-text-area empty",s.innerHTML=`Falha na geração: ${w.message}`,b(`Erro na geração: ${w.message}`,"error")}finally{r.disabled=!1,r.innerHTML='<i data-lucide="layers"></i> <span>Disparar Orquestração 360°</span>',lucide.createIcons()}}),lucide.createIcons()}function Ie(t,e){const n=e.querySelectorAll("#campaign-rating-stars .star-icon");n.forEach(i=>{i.classList.remove("active"),i.addEventListener("click",async()=>{const o=parseInt(i.getAttribute("data-value"));n.forEach((a,s)=>{s<o?a.classList.add("active"):a.classList.remove("active")});try{await S.localRateGeneration(t,o),b("Obrigado pela sua avaliação!","success")}catch(a){b(`Falha ao salvar nota: ${a.message}`,"error")}})})}function ce(t,e,n,i,o,a){t.innerHTML=`
        <div class="page-title-section">
            <h2 class="page-title">${e}</h2>
            <p class="page-subtitle">${n}</p>
        </div>
        
        <div class="agent-workspace-grid">
            <!-- Left Side: Controls -->
            <div class="panel-card">
                <form id="agent-form" class="panel-form">
                    ${i}
                    
                    <!-- Choose active API keys / provider -->
                    <div class="form-group">
                        <label class="form-label">Motor de IA (Chave Escolhida)</label>
                        <div class="engine-toggle-grid">
                            <div class="engine-toggle-card active" data-provider="groq">
                                <span class="engine-provider-name">Groq</span>
                                <span class="engine-type-label">Llama 3.3 (Grátis)</span>
                            </div>
                            <div class="engine-toggle-card" data-provider="gemini">
                                <span class="engine-provider-name">Gemini</span>
                                <span class="engine-type-label">2.5 Flash (Grátis)</span>
                            </div>
                            <div class="engine-toggle-card" data-provider="openrouter">
                                <span class="engine-provider-name">Claude</span>
                                <span class="engine-type-label">3.5 Sonnet (Paga)</span>
                            </div>
                            <div class="engine-toggle-card" data-provider="perplexity">
                                <span class="engine-provider-name">Search</span>
                                <span class="engine-type-label">Perplexity (Paga)</span>
                            </div>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary" id="btn-submit-generate" style="margin-top: 10px;">
                        <i data-lucide="sparkles"></i>
                        <span>Gerar Conteúdo Inteligente</span>
                    </button>
                </form>
            </div>
            
            <!-- Right Side: Outputs -->
            <div class="panel-card output-panel">
                <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h2>✨ Output Gerado da IA</h2>
                    <div class="output-header-actions" style="display: flex; gap: 8px; align-items: center;">
                        <button class="btn btn-accent btn-sm" id="btn-csv-output" style="padding: 6px 12px; font-size: 11px; display: none; gap: 4px; align-items: center; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; font-weight: 600;">
                            <i data-lucide="file-spreadsheet"></i>
                            <span>Planilha Lote CSV</span>
                        </button>
                        <button class="btn btn-accent btn-sm" id="btn-adapt-output" style="padding: 6px 12px; font-size: 11px; display: none; gap: 4px; align-items: center;">
                            <i data-lucide="shuffle"></i>
                            <span>Adaptar Formato</span>
                        </button>
                        <button class="btn btn-secondary btn-sm" id="btn-copy-output" style="padding: 6px 12px; font-size: 11px;">
                            <i data-lucide="copy"></i>
                            <span>Copiar</span>
                        </button>
                    </div>
                </div>
                
                <div class="output-textarea-container">
                    <div class="output-text-area empty" id="output-rendered-content">
                        Preencha o painel de diretrizes no lado esquerdo e dispare o motor de IA...
                    </div>
                </div>
                
                <div class="output-rating-bar" id="rating-container" style="display: none;">
                    <span class="stat-label">Avalie a qualidade dessa geração:</span>
                    <div class="rating-stars-container" id="rating-stars">
                        <i data-lucide="star" class="star-icon" data-value="1"></i>
                        <i data-lucide="star" class="star-icon" data-value="2"></i>
                        <i data-lucide="star" class="star-icon" data-value="3"></i>
                        <i data-lucide="star" class="star-icon" data-value="4"></i>
                        <i data-lucide="star" class="star-icon" data-value="5"></i>
                    </div>
                </div>
            </div>
        </div>
    `;let s=l.localActiveProvider||"groq";const p=t.querySelectorAll(".engine-toggle-card");p.forEach(r=>{const c=r.getAttribute("data-provider");c===s&&(p.forEach(g=>g.classList.remove("active")),r.classList.add("active")),r.addEventListener("click",()=>{p.forEach(g=>g.classList.remove("active")),r.classList.add("active"),s=c,l.localActiveProvider=c,c==="groq"?l.localActiveModel="llama-3.3-70b-versatile":c==="gemini"?l.localActiveModel="gemini-2.5-flash":c==="openrouter"?l.localActiveModel="anthropic/claude-sonnet-4.5":c==="perplexity"&&(l.localActiveModel="sonar-reasoning-pro")})});const m=t.querySelectorAll(".funnel-option");m.forEach(r=>{r.addEventListener("click",()=>{m.forEach(g=>g.classList.remove("active")),r.classList.add("active");const c=r.querySelector('input[type="radio"]');c&&(c.checked=!0)})}),document.getElementById("btn-copy-output").addEventListener("click",()=>{const r=document.getElementById("output-rendered-content");if(l.localActiveGeneration&&r&&!r.classList.contains("empty")){let c=l.localActiveGeneration.output;const g=t.querySelector('input[name="blog-format"]:checked'),h=g?g.value==="html":!1;if(l.localActiveGeneration.type==="blog_seo"&&h){const f=c.match(/(?:📝 CONTEÚDO COMPLETO DO ARTIGO:|📝 CONTEÚDO DO ARTIGO:)\s*([\s\S]*)/i);f&&(c=f[1].trim()),c=c.replace(/```html\s*([\s\S]*?)\s*```/g,"$1"),c=c.replace(/```\s*([\s\S]*?)\s*```/g,"$1")}navigator.clipboard.writeText(c),b("Conteúdo copiado para a área de transferência!","success")}else b("Nenhum conteúdo gerado para copiar.","info")});const x=document.getElementById("btn-adapt-output");x&&x.addEventListener("click",()=>{if(l.localActiveGeneration&&l.localActiveGeneration.output){const r=l.localActiveGeneration.type||a;He(l.localActiveGeneration.output,r)}else b("Nenhum conteúdo carregado para adaptar.","info")});const u=document.getElementById("btn-csv-output");u&&u.addEventListener("click",()=>{if(l.localActiveGeneration&&l.localActiveGeneration.output)try{const r=Se(l.localActiveGeneration.output);ke(r,`canva_lote_post_${l.localActiveGeneration.generation_id||Date.now()}.csv`),b("Planilha CSV gerada para importação no Canva!","success")}catch(r){b(`Erro ao exportar CSV: ${r.message}`,"error")}else b("Nenhum post gerado para exportar.","info")}),document.getElementById("agent-form").addEventListener("submit",async r=>{r.preventDefault();const c=document.getElementById("btn-submit-generate"),g=document.getElementById("output-rendered-content"),h=document.getElementById("rating-container");c.disabled=!0,c.innerHTML='<div class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></div> <span>Processando Copiloto...</span>',g.className="output-text-area",g.innerHTML='<div class="loading-spinner-container"><div class="spinner"></div><p>Gerando conteúdo, orquestrando base teórica... Aguarde.</p></div>',h.style.display="none",x&&(x.style.display="none"),u&&(u.style.display="none");try{const f=await o(s);l.localActiveGeneration={...f,type:a};const P=t.querySelector('input[name="blog-format"]:checked');if((P?P.value:"markdown")==="html"){let A=f.output;const C=A.match(/(?:📝 CONTEÚDO COMPLETO DO ARTIGO:|📝 CONTEÚDO DO ARTIGO:)\s*([\s\S]*)/i);C&&(A=C[1].trim()),A=A.replace(/```html\s*([\s\S]*?)\s*```/g,"$1"),A=A.replace(/```\s*([\s\S]*?)\s*```/g,"$1"),g.innerHTML=A}else g.innerHTML=re(f.output);h.style.display="flex",x&&(x.style.display="inline-flex"),u&&(a==="instagram"||a==="campaign")&&(u.style.display="inline-flex"),fe(f.generation_id),b("Geração completada com sucesso!","success")}catch(f){g.className="output-text-area empty",g.innerHTML=`Falha na geração: ${f.message}`,b(`Erro na geração: ${f.message}`,"error")}finally{c.disabled=!1,c.innerHTML='<i data-lucide="sparkles"></i> <span>Gerar Conteúdo Inteligente</span>',lucide.createIcons()}}),lucide.createIcons()}function fe(t){const e=document.querySelectorAll("#rating-stars .star-icon");e.forEach(n=>{n.classList.remove("active"),n.addEventListener("click",async()=>{const i=parseInt(n.getAttribute("data-value"));e.forEach((o,a)=>{a<i?o.classList.add("active"):o.classList.remove("active")});try{await S.localRateGeneration(t,i),b("Obrigado pela sua avaliação!","success")}catch(o){b(`Falha ao salvar nota: ${o.message}`,"error")}})})}function He(t,e){const n=document.createElement("div");n.className="custom-modal-overlay active",n.id="adaptation-modal";let i="SEO Blog";e==="meta_ads"||e==="meta-ads"?i="Meta Ads":e==="instagram"?i="Instagram":e==="product"||e==="products"?i="Bumps / Produto":e==="theme_creator"||e==="theme-creator"?i="Criador de Temas":e==="campaign"&&(i="Campanha 360°"),n.innerHTML=`
        <div class="custom-modal-card" style="max-width: 500px; width: 95%;">
            <div class="custom-modal-header">
                <h2><i data-lucide="shuffle" style="color: var(--accent-cyan); width: 22px; height: 22px;"></i> Adaptar Conteúdo</h2>
                <button class="custom-modal-close-btn" id="modal-close-adapt">&times;</button>
            </div>
            <div class="custom-modal-body">
                <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
                    Remixe o conteúdo ativo gerado pelo <strong>Agente ${i}</strong> para um novo formato de destino com inteligência contextual.
                </p>
                
                <div class="form-group">
                    <label class="form-label">Selecione o Agente de Destino</label>
                    <div class="adaptation-formats-list" style="display: flex; flex-direction: column; gap: 8px;">
                        ${e!=="meta_ads"&&e!=="meta-ads"?`
                        <label class="adaptation-format-item selected" style="display: flex; align-items: center; gap: 10px; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; cursor: pointer; transition: all 0.2s; padding: 8px;">
                            <input type="checkbox" name="target-agent-format" value="meta_ads" checked style="margin-left: 8px; margin-right: 8px;" class="target-agent-format-checkbox">
                            <div style="display: flex; flex-direction: column; padding: 4px 0;">
                                <span style="font-size: 13px; font-weight: 600; color: #fff;">Megafone: Meta Ads</span>
                                <span style="font-size: 11px; color: var(--text-muted);">Gera anúncio com headline, gancho emocional e CTA de quiz.</span>
                            </div>
                        </label>
                        `:""}
                        
                        ${e!=="instagram"?`
                        <label class="adaptation-format-item ${e==="meta_ads"||e==="meta-ads"?"selected":""}" style="display: flex; align-items: center; gap: 10px; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; cursor: pointer; transition: all 0.2s; padding: 8px;">
                            <input type="checkbox" name="target-agent-format" value="instagram" ${e==="meta_ads"||e==="meta-ads"?"checked":""} style="margin-left: 8px; margin-right: 8px;" class="target-agent-format-checkbox">
                            <div style="display: flex; flex-direction: column; padding: 4px 0;">
                                <span style="font-size: 13px; font-weight: 600; color: #fff;">Post Carrossel Instagram</span>
                                <span style="font-size: 11px; color: var(--text-muted);">Gera roteiro de carrossel passo-a-passo (8 slides) e legenda.</span>
                            </div>
                        </label>
                        `:""}
                        
                        ${e!=="blog_seo"?`
                        <label class="adaptation-format-item ${e==="product"||e==="products"?"selected":""}" style="display: flex; align-items: center; gap: 10px; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; cursor: pointer; transition: all 0.2s; padding: 8px;">
                            <input type="checkbox" name="target-agent-format" value="blog_seo" ${e==="product"||e==="products"?"checked":""} style="margin-left: 8px; margin-right: 8px;" class="target-agent-format-checkbox">
                            <div style="display: flex; flex-direction: column; padding: 4px 0;">
                                <span style="font-size: 13px; font-weight: 600; color: #fff;">Artigo SEO Blog</span>
                                <span style="font-size: 11px; color: var(--text-muted);">Gera artigo completo e profundo com cabeçalhos H2/H3 e dados.</span>
                            </div>
                        </label>
                        `:""}
                        
                        ${e!=="product"&&e!=="products"?`
                        <label class="adaptation-format-item" style="display: flex; align-items: center; gap: 10px; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; cursor: pointer; transition: all 0.2s; padding: 8px;">
                            <input type="checkbox" name="target-agent-format" value="product" style="margin-left: 8px; margin-right: 8px;" class="target-agent-format-checkbox">
                            <div style="display: flex; flex-direction: column; padding: 4px 0;">
                                <span style="font-size: 13px; font-weight: 600; color: #fff;">Novos Produtos & Bumps</span>
                                <span style="font-size: 11px; color: var(--text-muted);">Gera propostas de Notion templates ou infoprodutos focados na dor.</span>
                            </div>
                        </label>
                        `:""}
                    </div>
                </div>
                
                <div class="form-group" style="margin-top: 16px;">
                    <label class="form-label" for="adapt-custom-rules">Regras de Adaptação Específicas (Opcional)</label>
                    <textarea id="adapt-custom-rules" class="form-textarea" placeholder="Ex: Escreva focando em estudantes de Engenharia..."></textarea>
                </div>
            </div>
            
            <div class="custom-modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button class="btn btn-secondary" id="btn-cancel-adapt">Cancelar</button>
                <button class="btn btn-primary" id="btn-confirm-adapt">Adaptar Agora</button>
            </div>
        </div>
    `,document.body.appendChild(n),lucide.createIcons(),n.querySelectorAll(".adaptation-format-item").forEach(a=>{const s=a.querySelector('input[type="checkbox"]'),p=()=>{s.checked?a.classList.add("selected"):a.classList.remove("selected")};a.addEventListener("click",m=>{m.target!==s&&(s.checked=!s.checked),p()}),s.addEventListener("change",p)});const o=()=>n.remove();document.getElementById("modal-close-adapt").onclick=o,document.getElementById("btn-cancel-adapt").onclick=o,document.getElementById("btn-confirm-adapt").onclick=async()=>{const a=n.querySelectorAll('input[name="target-agent-format"]:checked');if(a.length===0){b("Selecione pelo menos um formato de destino.","warning");return}const s=document.getElementById("adapt-custom-rules").value;o();const p=Array.from(a).map(m=>m.value);if(p.length===1){const m=p[0];b("Adaptando formato do conteúdo...","info");const x={meta_ads:"meta-ads",instagram:"instagram",blog_seo:"blog",product:"products"};l.currentPage=x[m],document.querySelectorAll(".nav-item").forEach(r=>{r.classList.remove("active"),r.getAttribute("data-page")===l.currentPage&&r.classList.add("active")}),oe(l.currentPage),setTimeout(async()=>{const r=document.getElementById("output-rendered-content"),c=document.getElementById("rating-container"),g=document.getElementById("btn-submit-generate");r&&(r.className="output-text-area",r.innerHTML='<div class="loading-spinner-container"><div class="spinner"></div><p>Remixando conteúdo original e aplicando novas regras formais... Aguarde.</p></div>'),c&&(c.style.display="none"),g&&(g.disabled=!0);try{const h=document.querySelector('input[name="blog-format"]:checked')||document.querySelector('input[name="campaign-format"]:checked'),f=m==="blog_seo"&&h?h.value:"markdown",P=await S.localAdaptContent(t,e,m,l.localActiveProvider,null,f,s);if(l.localActiveGeneration={...P,type:m},r)if(m==="blog_seo"&&f==="html"){let C=P.output;const z=C.match(/(?:📝 CONTEÚDO COMPLETO DO ARTIGO:|📝 CONTEÚDO DO ARTIGO:)\s*([\s\S]*)/i);z&&(C=z[1].trim()),C=C.replace(/```html\s*([\s\S]*?)\s*```/g,"$1"),C=C.replace(/```\s*([\s\S]*?)\s*```/g,"$1"),r.innerHTML=C}else r.innerHTML=re(P.output);c&&(c.style.display="flex");const w=document.getElementById("btn-adapt-output"),A=document.getElementById("btn-csv-output");w&&(w.style.display="inline-flex"),A&&(m==="instagram"||m==="campaign")&&(A.style.display="inline-flex"),fe(P.generation_id),b("Conteúdo adaptado com sucesso!","success")}catch(h){r&&(r.className="output-text-area empty",r.innerHTML=`Falha na adaptação: ${h.message}`),b(`Erro na adaptação: ${h.message}`,"error")}finally{g&&(g.disabled=!1,lucide.createIcons())}},100)}else{b("Adaptando conteúdo para múltiplos formatos...","info");const m=document.getElementById("output-rendered-content"),x=document.getElementById("rating-container"),u=document.getElementById("btn-submit-generate");m&&(m.className="output-text-area",m.innerHTML='<div class="loading-spinner-container"><div class="spinner"></div><p>Remixando conteúdo para múltiplos formatos... Aguarde.</p></div>'),x&&(x.style.display="none"),u&&(u.disabled=!0);try{const r=p.map(w=>{const A=document.querySelector('input[name="blog-format"]:checked')||document.querySelector('input[name="campaign-format"]:checked'),C=w==="blog_seo"&&A?A.value:"markdown";return S.localAdaptContent(t,e,w,l.localActiveProvider,null,C,s)}),c=await Promise.all(r);let g="";const h={meta_ads:"📢 Megafone: Meta Ads",instagram:"📸 Post Carrossel Instagram",blog_seo:"✍️ Artigo SEO Blog",product:"🎁 Novos Produtos & Bumps"};c.forEach((w,A)=>{const C=p[A],z=h[C]||C.toUpperCase(),X=document.querySelector('input[name="blog-format"]:checked')||document.querySelector('input[name="campaign-format"]:checked'),L=C==="blog_seo"&&X&&X.value==="html"?w.output:re(w.output);g+=`<h2>${z}</h2>

${L}

`,A<c.length-1&&(g+=`<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;">

`)}),l.localActiveGeneration={output:g,generation_id:c[0].generation_id,type:"multi_adaptation"},m&&(m.innerHTML=g),x&&(x.style.display="flex");const f=document.getElementById("btn-adapt-output"),P=document.getElementById("btn-csv-output");f&&(f.style.display="inline-flex"),P&&(P.style.display="none"),c[0]&&c[0].generation_id&&fe(c[0].generation_id),b("Múltiplos formatos adaptados com sucesso!","success")}catch(r){m&&(m.className="output-text-area empty",m.innerHTML=`Falha na adaptação: ${r.message}`),b(`Erro na adaptação: ${r.message}`,"error")}finally{u&&(u.disabled=!1,lucide.createIcons())}}}}function Se(t){const e=[["Nº","Headline","CTA","Elemento extra"]],n=/\[Slide\s+(\d+)\][\s\S]*?(?=\[Slide\s+\d+\]|📝\s*CAPTION|📝\s*LEGENDA|$)/gi;let i,o=!1;for(;(i=n.exec(t))!==null;){o=!0;const a=i[0],s=i[1];let p="";const m=a.match(/T[íi]tulo:\s*([^\n]+)/i);m&&(p=m[1].trim());let x="";const u=a.match(/Conte[úu]do:\s*([^\n]+(?:\n\s*-\s*[^\n]+)*)/i);u&&(x=u[1].trim().replace(/\n/g," ").replace(/\s+/g," "));let r="";const c=p.match(/[A-ZÁÉÍÓÚÂÊÔÃÕÇ\d-]{3,}/g);if(c&&c.length>0)r=c[0];else{const g=p.split(/\s+/);g.length>0&&(r=g[0].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toUpperCase())}e.push([s,p,r,x])}if(!o){let a="";const s=t.match(/📊\s*TEMA\s*DO\s*POST:\s*([^\n]+)/i)||t.match(/T[íi]tulo:\s*([^\n]+)/i);s?a=s[1].trim():a="POST DO INSTAGRAM";let p="";const m=t.match(/(?:📝\s*CAPTION|📝\s*LEGENDA\s*DO\s*POST|📝\s*LEGENDA):\s*([\s\S]+)/i);m?p=m[1].trim().split(`
`)[0].trim():p="Sistema A.C.A.D.E.M.I.A. local";let x="";const u=a.match(/[A-ZÁÉÍÓÚÂÊÔÃÕÇ\d-]{3,}/g);u&&u.length>0?x=u[0]:x="SISTEMA ACADEMIA",e.push(["1",a,x,p])}return e.map(a=>a.map(s=>{let p=s==null?"":String(s);return p=p.replace(/"/g,'""'),p.includes(",")||p.includes('"')||p.includes(`
`)?`"${p}"`:p}).join(",")).join(`
`)}function ke(t,e){const n=new Blob(["\uFEFF"+t],{type:"text/csv;charset=utf-8;"}),i=document.createElement("a");if(i.download!==void 0){const o=URL.createObjectURL(n);i.setAttribute("href",o),i.setAttribute("download",e),i.style.visibility="hidden",document.body.appendChild(i),i.click(),document.body.removeChild(i)}}function Ue(t){const e=t.output_generated||t.output||"",n=t.prompt_used||t.prompt||"";let i;function o(a){if(!a)return"";let s=a.trim();return s=s.replace(/^["'“`\*#\-\s\+:]+|["'”`\*#\-\s]+$/g,""),s=s.replace(/<[^>]*>/g,""),s=s.replace(/^[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}🏆📌💡📊?📌\s\*\-#\+:]+/u,""),s=s.trim().replace(/^["'“`\*#\-\s\+:]+|["'”`\*#\-\s]+$/g,""),s}if(t.type==="blog_seo"){if(i=e.match(/(?:TÍTULO|TITULO)\s*SEO\s*(?:DO\s*ARTIGO)?:\s*(.*)/i)){const a=o(i[1]);if(a)return a}if(i=e.match(/<h1[^>]*>(.*?)<\/h1>/i)){const a=o(i[1]);if(a)return a}if(i=e.match(/<h2[^>]*>(.*?)<\/h2>/i)){const a=o(i[1]);if(a)return a}if(i=e.match(/^\s*#\s*(.*)/m)){const a=o(i[1]);if(a)return a}if(i=e.match(/^\s*##\s*(.*)/m)){const a=o(i[1]);if(a)return a}if(i=n.match(/(?:PALAVRA-CHAVE|PALAVRA\s*CHAVE)\s*(?:ALVO|FOCO)?:\s*(.*)/i)){const a=o(i[1]);if(a)return a}}else if(t.type==="campaign"){if(i=e.match(/<h2[^>]*>(.*?)<\/h2>/i)){const a=o(i[1]);if(a)return a}if(i=e.match(/<h1[^>]*>(.*?)<\/h1>/i)){const a=o(i[1]);if(a)return a}if(i=n.match(/TEMA\s*DA\s*CAMPANHA\s*360:\s*(.*)/i)){const a=o(i[1]);if(a)return a}if(i=e.match(/HEADLINE\s*DO\s*ANÚNCIO:\s*(.*)/i)){const a=o(i[1]);if(a)return a}}else if(t.type==="meta_ads"){if(i=e.match(/(?:TÍTULO|TITULO|HEADLINE)\s*(?:DO\s*ANÚNCIO)?:\s*(.*)/i)){const a=o(i[1]);if(a)return a}if(i=n.match(/AVATAR\s*(?:SELECIONADO)?:\s*(.*)/i)){const a=o(i[1]);if(a)return a}}else if(t.type==="instagram"){if(i=e.match(/(?:TEMA|TÍTULO|TITULO)\s*(?:DO\s*CARROSSEL)?:\s*(.*)/i)){const a=o(i[1]);if(a)return a}if(i=n.match(/MÓDULO\s*(?:SELECIONADO)?:\s*(.*)/i)){const a=o(i[1]);if(a)return a}}else if(t.type==="product"){if(i=e.match(/NOME\s*DO\s*PRODUTO:\s*(.*)/i)){const a=o(i[1]);if(a)return a}}else if(t.type==="theme_creator"){if(i=e.match(/(?:🎯)*\s*TEMA:\s*(.*)/i)){const a=o(i[1]);if(a)return a}if(i=n.match(/Objetivo\s*da\s*rodada:\s*(.*)/i)){const a=o(i[1]);if(a)return"Temas: "+a}}if(i=e.match(/<h1[^>]*>(.*?)<\/h1>/i)){const a=o(i[1]);if(a)return a}if(i=e.match(/<h2[^>]*>(.*?)<\/h2>/i)){const a=o(i[1]);if(a)return a}if(i=e.match(/^\s*#\s*(.*)/m)){const a=o(i[1]);if(a)return a}if(i=e.match(/^\s*##\s*(.*)/m)){const a=o(i[1]);if(a)return a}return null}function We(t){if(t){t.funnel_stage&&document.querySelectorAll('input[name="funnel-stage"]').forEach(i=>{if(i.value===t.funnel_stage.toUpperCase()){i.checked=!0;const o=i.closest(".funnel-option");o&&o.classList.add("active")}else{const o=i.closest(".funnel-option");o&&o.classList.remove("active")}});const e=t.prompt_used||t.prompt||"",n=t.output_generated||t.output||"";if(t.type==="meta_ads"){const i=document.getElementById("meta-avatar");i&&t.avatar_id&&(i.value=t.avatar_id);const o=document.getElementById("meta-market");if(o&&l.localMarketData){const s=l.localMarketData.find(p=>e.includes(p.statistic));s?o.value=s.id:o.value=""}const a=document.getElementById("meta-custom");if(a&&e){const s=e.match(/OUTRAS DIRETRIZES DO USUÁRIO:\s*(.*)/i);s&&s[1].trim()!=="Nenhuma"?a.value=s[1].trim():a.value=""}}else if(t.type==="instagram"){const i=document.getElementById("insta-module");i&&t.module_id&&(i.value=t.module_id);const o=document.getElementById("insta-post-type");o&&e&&(e.includes("POST ÚNICO")?o.value="post_unico":e.includes("CARROSSEL DE EXATAMENTE 4 SLIDES")?o.value="carrossel_4":e.includes("CARROSSEL DE EXATAMENTE 7 SLIDES")?o.value="carrossel_7":e.includes("CARROSSEL DE EXATAMENTE 9 SLIDES")?o.value="carrossel_9":o.value="carrossel");const a=document.getElementById("insta-custom");if(a&&e){const s=e.match(/OUTRAS DIRETRIZES DO USUÁRIO:\s*(.*)/i);s&&s[1].trim()!=="Nenhuma"?a.value=s[1].trim():a.value=""}}else if(t.type==="blog_seo"){const i=document.getElementById("blog-key");if(i&&e){const p=e.match(/PALAVRA-CHAVE ALVO:\s*(.*)/i);p&&(i.value=p[1].trim())}const o=n&&(n.includes('<header class="site-header">')||n.includes('class="cta-block"')),a=document.querySelector(`input[name="blog-format"][value="${o?"html":"markdown"}"]`);a&&(a.checked=!0,document.querySelectorAll(".format-option").forEach(p=>{p.getAttribute("data-format")===(o?"html":"markdown")?p.classList.add("active"):p.classList.remove("active")}));const s=document.getElementById("blog-custom");if(s&&e){const p=e.match(/OUTRAS DIRETRIZES DO USUÁRIO:\s*(.*)/i);p&&p[1].trim()!=="Nenhuma"?s.value=p[1].trim():s.value=""}}else if(t.type==="product"){const i=document.getElementById("prod-module");i&&t.module_id&&(i.value=t.module_id);const o=document.getElementById("prod-custom");if(o&&e){const a=e.match(/OUTRAS DIRETRIZES DO USUÁRIO:\s*(.*)/i);a&&a[1].trim()!=="Nenhuma"?o.value=a[1].trim():o.value=""}}else if(t.type==="theme_creator"){const i=document.getElementById("theme-funnel");if(i&&e){const m=e.match(/- Estágio do funil desejado:\s*(.*)/i);m&&(i.value=m[1].trim())}const o=document.getElementById("theme-icp");if(o&&e){const m=e.match(/- Perfil de ICP prioritário:\s*(.*)/i);m&&(o.value=m[1].trim())}const a=document.getElementById("theme-objective");if(a&&e){const m=e.match(/- Objetivo da rodada:\s*(.*)/i);m&&(a.value=m[1].trim())}const s=document.getElementById("theme-qty");if(s&&e){const m=e.match(/- Quantidade de temas por estágio:\s*(.*)/i);m&&(s.value=parseInt(m[1].trim())||5)}const p=document.getElementById("theme-channel");if(p&&e){const m=e.match(/- Canal de destino:\s*(.*)/i);m&&(p.value=m[1].trim())}}else if(t.type==="campaign"){const i=document.getElementById("campaign-theme");if(i&&e){const p=e.match(/TEMA DA CAMPANHA 360:\s*(.*)/i);p&&(i.value=p[1].trim())}const o=document.getElementById("campaign-insta-type");o&&e&&(e.includes("POST ÚNICO")?o.value="post_unico":e.includes("CARROSSEL DE EXATAMENTE 4 SLIDES")?o.value="carrossel_4":e.includes("CARROSSEL DE EXATAMENTE 7 SLIDES")?o.value="carrossel_7":e.includes("CARROSSEL DE EXATAMENTE 9 SLIDES")?o.value="carrossel_9":o.value="carrossel");const a=n&&n.includes(`[[[BLOG]]]
<`),s=document.querySelector(`input[name="campaign-format"][value="${a?"html":"markdown"}"]`);s&&(s.checked=!0,document.querySelectorAll(".format-option").forEach(p=>{p.getAttribute("data-format")===(a?"html":"markdown")?p.classList.add("active"):p.classList.remove("active")}))}}}async function Ve(){const t=document.getElementById("history-items-list");if(t)try{const e=await S.localGetGenerations(30);if(e.length===0){t.innerHTML='<div style="text-align: center; color: var(--text-muted); padding: 40px 0; font-size: 13px;">Nenhuma geração registrada no histórico local ainda.</div>';return}t.innerHTML=e.map(n=>{const i=new Date(n.created_at).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});let o=n.type;n.type==="meta_ads"?o="Meta Ads":n.type==="instagram"?o="Instagram":n.type==="blog_seo"?o="SEO Blog":n.type==="product"?o="Bumps / Produto":n.type==="campaign"?o="Campanha 360°":n.type==="theme_creator"&&(o="Criador de Temas");let a=Ue(n);return a||(a=o),`
                <div class="history-item" data-id="${n.id}" style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: background 0.2s;">
                    <div class="history-item-left" style="display: flex; flex-direction: column;">
                        <span class="history-item-type" style="font-size: 13px; font-weight: 600; color: white;">${a}</span>
                        <span class="history-item-meta" style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                            ${i} • ${o} • Model: ${(n.model||"").split("/").pop()||"Nenhum"}
                        </span>
                    </div>
                    <div class="history-item-right" style="font-size: 11px; color: var(--accent-cyan); text-align: right; margin-top: 4px;">
                        ${n.rating?"★ ".repeat(n.rating):"Sem Nota"}
                    </div>
                </div>
            `}).join(""),t.querySelectorAll(".history-item").forEach(n=>{n.addEventListener("click",async()=>{const i=parseInt(n.getAttribute("data-id")),o=e.find(a=>a.id===i);if(o){let a="meta-ads";o.type==="instagram"?a="instagram":o.type==="blog_seo"?a="blog":o.type==="product"?a="products":o.type==="theme_creator"?a="theme-creator":o.type==="campaign"&&(a="campaign"),document.querySelectorAll(".nav-item").forEach(s=>{s.classList.remove("active"),s.getAttribute("data-page")===a&&s.classList.add("active")}),l.currentPage=a,oe(a),setTimeout(()=>{if(We(o),o.type==="campaign"){const s=document.getElementById("campaign-output-box"),p=document.getElementById("campaign-rating-container");if(s){s.className="output-text-area";const m=o.output_generated||o.output||"",x=w=>{const A=m.match(w);return A?{index:A.index,tag:A[0]}:{index:-1,tag:""}},u=x(/\[\[\[META_ADS\]\]\]/i),r=x(/\[\[\[INSTAGRAM\]\]\]/i),c=x(/\[\[\[BLOG\]\]\]/i),g=(w,A)=>{if(w.index===-1)return"";const C=w.index+w.tag.length,z=A&&A.index!==-1?A.index:-1;return z===-1||z<w.index?m.substring(C).trim():m.substring(C,z).trim()},h=[{type:"meta_ads",match:u},{type:"instagram",match:r},{type:"blog",match:c}].filter(w=>w.match.index!==-1).sort((w,A)=>w.match.index-A.match.index),f={meta_ads:"",instagram:"",blog:""};for(let w=0;w<h.length;w++){const A=h[w],C=w+1<h.length?h[w+1].match:null;f[A.type]=g(A.match,C)}!f.meta_ads&&!f.instagram&&!f.blog&&(f.meta_ads=m),l.localActiveCampaignPieces=f,l.localActiveGeneration={output:m,generation_id:o.id,type:o.type};const P=document.querySelector(".campaign-tab-btn.active");if(P)P.click();else{const w=document.querySelector(".campaign-tab-btn");w&&w.click()}p&&(p.style.display="flex",Ie(o.id,document.getElementById("page-content")),o.rating&&p.querySelectorAll(".star-icon").forEach((w,A)=>{A<o.rating?w.classList.add("active"):w.classList.remove("active")})),lucide.createIcons()}}else{const s=document.getElementById("output-rendered-content"),p=document.getElementById("rating-container");if(s){s.className="output-text-area";const m=o.output_generated||o.output||"";if(o.type==="blog_seo"&&(m.includes('<header class="site-header">')||m.includes('class="cta-block"')||m.includes("```html")||m.includes("<div")||m.includes("<p"))){let c=m;const g=c.match(/(?:📝 CONTEÚDO COMPLETO DO ARTIGO:|📝 CONTEÚDO DO ARTIGO:)\s*([\s\S]*)/i);g&&(c=g[1].trim()),c=c.replace(/```html\s*([\s\S]*?)\s*```/g,"$1"),c=c.replace(/```\s*([\s\S]*?)\s*```/g,"$1"),s.innerHTML=c}else s.innerHTML=re(m);l.localActiveGeneration={output:m,generation_id:o.id,type:o.type};const u=document.getElementById("btn-adapt-output");u&&(u.style.display="inline-flex");const r=document.getElementById("btn-csv-output");r&&(o.type==="instagram"?r.style.display="inline-flex":r.style.display="none"),p&&(p.style.display="flex",fe(o.id),o.rating&&p.querySelectorAll(".star-icon").forEach((c,g)=>{g<o.rating?c.classList.add("active"):c.classList.remove("active")})),lucide.createIcons()}}},50),b("Geração restaurada com sucesso!","info")}})})}catch{t.innerHTML='<div style="color: var(--accent-red); font-size: 12px; text-align: center; padding: 20px 0;">Erro ao carregar histórico.</div>'}}
