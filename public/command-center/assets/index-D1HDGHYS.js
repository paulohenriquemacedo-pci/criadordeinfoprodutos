(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver(o=>{for(const a of o)if(a.type==="childList")for(const s of a.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&n(s)}).observe(document,{childList:!0,subtree:!0});function i(o){const a={};return o.integrity&&(a.integrity=o.integrity),o.referrerPolicy&&(a.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?a.credentials="include":o.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function n(o){if(o.ep)return;o.ep=!0;const a=i(o);fetch(o.href,a)}})();const Y="https://koxmzaitmocgsyqiznuw.supabase.co",Z="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtveG16YWl0bW9jZ3N5cWl6bnV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MDMxODYsImV4cCI6MjA5ODE3OTE4Nn0.CpsJoI5ixso_nfcR25Fh_4yxVim_c35ErKaijDH2o6A";function ee(){try{const e=localStorage.getItem("sb-koxmzaitmocgsyqiznuw-auth-token");if(e){const i=JSON.parse(e);if(i&&i.access_token)return i.access_token}}catch(t){console.warn("Erro ao ler token do LocalStorage:",t)}return Z}const k={async getProjects(){return await J("/projects?order=created_at.desc")},async createProject(t,e,i,n){return await se("/projects?select=*",{name:t,niche:e||null,promise:i||null,target_audience:n||null})},async updateProject(t,e,i,n,o){return await ge(`/projects?id=eq.${t}`,{name:e,niche:i||null,promise:n||null,target_audience:o||null})},async getAvatars(){return await J("/avatars?order=id")},async getMarketData(){return await J("/market_data?order=id")},async getModules(){return await J("/modules?order=module_number")},async getModuleContent(t,e){const i=await J(`/modules?project_id=eq.${t}&module_number=eq.${e}`);return i&&i.length>0?i[0]:null},async saveModuleContent(t,e,i,n){const o=await this.getModuleContent(t,e);return o?await ge(`/modules?id=eq.${o.id}`,{generated_content:i,last_updated:new Date().toISOString(),is_outdated:!1}):await se("/modules",{project_id:t,module_number:e,title:n||`Módulo ${e}`,generated_content:i,last_updated:new Date().toISOString(),is_outdated:!1,key_concepts:[]})},async markModulesOutdated(t){return await ge(`/modules?project_id=eq.${t}`,{is_outdated:!0})},async getProjectFiles(t){return await J(`/project_files?project_id=eq.${t}&order=created_at.desc`)},async uploadReferenceFile(t,e,i){const n=Date.now(),o=e.name.replace(/[^a-zA-Z0-9.-]/g,"_"),a=`${t}/${n}_${o}`,s=`${Y}/storage/v1/object/reference-files/${a}`;new FormData().append("file",e),console.log(`[*] Subindo arquivo para o bucket do Supabase: ${e.name}`);const m=await fetch(s,{method:"POST",headers:{apikey:Z,Authorization:`Bearer ${ee()}`,"Content-Type":e.type||"application/pdf"},body:e});if(!m.ok){const c=await m.text();throw new Error(`Erro ao enviar arquivo para o Storage: ${c}`)}await m.json();const h=`${Y}/storage/v1/object/public/reference-files/${a}`,u=await se("/project_files?select=*",{project_id:t,filename:e.name,folder:i||"Geral",file_url:h,processing_status:"processing"}),r=u[0].id;return this.triggerPdfTextExtraction(t,a,e.name,r).catch(c=>{console.error("[EXTRACTION ERROR]",c)}),u[0]},async triggerPdfTextExtraction(t,e,i,n){return await le("/extract-pdf-text",{projectId:t,filePath:e,fileName:i,fileId:n})},async deleteReferenceFile(t,e){let i="";if(e.includes("reference-files/")&&(i=e.split("reference-files/")[1]),i)try{const a=`${Y}/storage/v1/object/reference-files/${i}`;console.log(`[*] Deletando arquivo do storage: ${i}`);const s=await fetch(a,{method:"DELETE",headers:{apikey:Z,Authorization:`Bearer ${ee()}`}});s.ok||console.warn("[STORAGE DELETE WARNING] Falha ao deletar do storage:",await s.text())}catch(a){console.error("[STORAGE DELETE ERROR] Erro ao deletar do storage:",a)}const n=`${Y}/rest/v1/project_files?id=eq.${t}`,o=await fetch(n,{method:"DELETE",headers:{apikey:Z,Authorization:`Bearer ${ee()}`}});if(!o.ok){const a=await o.text();throw new Error(`Erro ao deletar registro do banco: ${a}`)}return{success:!0}},async getModuleVersions(t){return await J(`/module_versions?module_id=eq.${t}&order=created_at.desc`)},async saveModuleVersion(t,e){return await se("/module_versions",{module_id:t,content:e})},async coherenceCheck(t,e,i,n,o){return await le("/coherence-check",{briefing:t,moduleNumber:e,moduleTitle:i,moduleContent:n,previousModules:o})},async generateModuleStream(t,e,i,n,o,a,s,p,m){var h,u,r;try{const[c,v,x]=await Promise.all([J(`/projects?id=eq.${t}`),J(`/modules?project_id=eq.${t}&order=module_number`),J(`/project_files?project_id=eq.${t}`)]),y=c&&c.length>0?`BRIEFING DO PROJETO:
Nome: ${c[0].name}
Nicho: ${c[0].niche}
Promessa: ${c[0].promise}
Público: ${c[0].target_audience}`:"",P=v?v.filter(O=>O.generated_content&&O.module_number!==e).map(O=>`Módulo ${O.module_number} (${O.title}):
${O.generated_content}`).join(`

---

`):"",E=x?x.filter(O=>O.extracted_text).map(O=>`Arquivo (${O.folder}/${O.filename}):
${O.extracted_text}`).join(`

---

`):"",T=`${Y}/functions/v1/generate-module`,L=await fetch(T,{method:"POST",headers:{apikey:Z,Authorization:`Bearer ${ee()}`,"Content-Type":"application/json"},body:JSON.stringify({moduleNumber:e,customPrompt:i,provider:n,model:o,funnelStage:a,briefing:y,previousOutputs:P,referenceFilesText:E.slice(0,1e5)})});if(!L.ok){const O=await L.text();throw new Error(O)}const q=L.body.getReader(),oe=new TextDecoder("utf-8");let ae="";for(;;){const{done:O,value:Q}=await q.read();if(O){p();break}ae+=oe.decode(Q,{stream:!0});const _=ae.split(`
`);ae=_.pop();for(const F of _){const N=F.trim();if(N.startsWith("data: ")){const H=N.substring(6);if(H==="[DONE]"){p();return}try{const X=((r=(u=(h=JSON.parse(H).choices)==null?void 0:h[0])==null?void 0:u.delta)==null?void 0:r.content)||"";X&&s(X)}catch{}}}}}catch(c){console.error("[STREAM ERROR]",c),m(c)}},async generatePostImage(t,e,i,n){return await le("/generate-post-image",{prompt:t,style:e,width:i,height:n})},async searchStockImages(t,e=12,i="portrait"){return await le("/search-stock-images",{query:t,perPage:e,orientation:i})},async generatePostCaption(t,e,i,n,o,a="profissional e engajante",s="Instagram"){return await le("/generate-post-caption",{headline:t,subheadline:e,body:i,niche:n,targetAudience:o,tone:a,platform:s})},async localGetHealth(){return await M("/health")},async localGetSettings(){return await M("/settings")},async localUpdateSettings(t){return await M("/settings",{method:"POST",body:JSON.stringify(t)})},async localGetKbStats(){return await M("/kb/stats")},async localGetKbFiles(){return await M("/kb/files")},async localGetAvatars(){return await M("/kb/avatars")},async localGetMarketData(){return await M("/kb/market-data")},async localGetModules(){return await M("/kb/modules")},async localForceSync(){return await M("/kb/sync",{method:"POST"})},async localGetGenerations(t=50){return await M(`/generations?limit=${t}`)},async localRateGeneration(t,e){return await M("/generations/rate",{method:"POST",body:JSON.stringify({generation_id:t,rating:e})})},async localGenerateMetaAds(t,e,i,n,o,a){return await M("/generate/meta-ads",{method:"POST",body:JSON.stringify({avatar_id:t||null,market_data_id:e||null,custom_prompt:i||null,provider:n||null,model:o||null,funnel_stage:a||"TOPO"})})},async localGenerateInstagram(t,e,i,n,o,a){return await M("/generate/instagram",{method:"POST",body:JSON.stringify({module_id:t,custom_prompt:e||null,provider:i||null,model:n||null,funnel_stage:o||"TOPO",post_type:a||"carrossel"})})},async localGenerateBlog(t,e,i,n,o,a){return await M("/generate/blog-post",{method:"POST",body:JSON.stringify({keyword:t,custom_prompt:e||null,provider:i||null,model:n||null,funnel_stage:o||"TOPO",output_format:a||"markdown"})})},async localGenerateProduct(t,e,i,n,o){return await M("/generate/product",{method:"POST",body:JSON.stringify({module_id:t,custom_prompt:e||null,provider:i||null,model:n||null,funnel_stage:o||"TOPO"})})},async localGenerateThemes(t,e,i,n,o,a,s,p=null){return await M("/generate/themes",{method:"POST",body:JSON.stringify({funnel_stage:t,priority_icp:e,round_objective:i,qty_per_stage:parseInt(n)||5,target_channel:o,provider:a||null,model:s||null,custom_subject:p})})},async localGenerateCampaign(t,e,i,n,o){return await M("/generate/campaign",{method:"POST",body:JSON.stringify({theme:t,provider:e||null,model:i||null,output_format:n||"markdown",insta_post_type:o||"carrossel"})})},async localAdaptContent(t,e,i,n,o,a,s){return await M("/generate/adapt",{method:"POST",body:JSON.stringify({content:t,source_format:e,target_format:i,provider:n||null,model:o||null,output_format:a||"markdown",custom_rules:s||null})})},async localPerplexitySearch(t,e=null,i=null){return await M("/perplexity/search",{method:"POST",body:JSON.stringify({query:t,system_prompt:e,model:i})})},async restGet(t){return await J(t)},async restPost(t,e){return await se(t,e)},async restPatch(t,e){return await ge(t,e)},async driveStatus(){return await M("/drive/status")},async driveSync(){return await M("/drive/sync",{method:"POST"})},async driveSyncWait(){return await M("/drive/sync-wait",{method:"POST"})},async driveListFiles(){return await M("/drive/files")}};async function J(t){const e=`${Y}/rest/v1${t}`,i=await fetch(e,{headers:{apikey:Z,Authorization:`Bearer ${ee()}`}});if(!i.ok)throw new Error(`Falha Supabase GET ${t}: ${i.statusText}`);return await i.json()}async function se(t,e){const i=`${Y}/rest/v1${t}`,n=await fetch(i,{method:"POST",headers:{apikey:Z,Authorization:`Bearer ${ee()}`,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify(e)});if(!n.ok){const o=await n.text();throw new Error(`Falha Supabase POST ${t}: ${o}`)}return await n.json()}async function ge(t,e){const i=`${Y}/rest/v1${t}`,n=await fetch(i,{method:"PATCH",headers:{apikey:Z,Authorization:`Bearer ${ee()}`,"Content-Type":"application/json"},body:JSON.stringify(e)});if(!n.ok){const o=await n.text();throw new Error(`Falha Supabase PATCH ${t}: ${o}`)}return n.status===204?{success:!0}:await n.json()}async function le(t,e){const i=`${Y}/functions/v1${t}`,n=await fetch(i,{method:"POST",headers:{apikey:Z,Authorization:`Bearer ${ee()}`,"Content-Type":"application/json"},body:JSON.stringify(e)});if(!n.ok){const o=await n.text();throw new Error(`Falha Edge Function ${t}: ${o}`)}return await n.json()}const Ce="https://command-center-backend-veq6.onrender.com/api";async function M(t,e={}){const i=`${Ce}${t}`,n={"Content-Type":"application/json",...e.headers},o={...e,headers:n};try{const a=await fetch(i,o);if(!a.ok){const s=await a.json().catch(()=>({}));throw new Error(s.detail||`Erro na API Local: ${a.statusText}`)}return await a.json()}catch(a){throw console.error(`Erro no endpoint local ${t}:`,a),a}}const l={currentPage:"dashboard",activeProjectId:localStorage.getItem("activeProjectId")||null,activeProject:null,projectsList:[],kbFiles:[],avatars:[],marketData:[],modules:[],activeGenerationText:"",coherenceReport:null,localHealth:!1,localSettings:{groq_api_key:"",openrouter_api_key:"",perplexity_api_key:"",gemini_api_key:"",unsplash_access_key:"",default_provider:"groq",workspace_path:"d:/0 - SISTEMA ACADEMIA"},localKbStats:{total_files:0,total_words:0},localKbFiles:[],localAvatars:[],localMarketData:[],localModules:[],localActiveProvider:"groq",localActiveModel:"llama-3.3-70b-versatile",localActiveGeneration:null,localActiveCampaignPieces:{meta_ads:"",instagram:"",blog:""}};document.addEventListener("DOMContentLoaded",async()=>{$e(),await ve(),te(l.currentPage),te(l.currentPage)});function $e(){const t=document.querySelectorAll(".nav-item");t.forEach(e=>{e.addEventListener("click",i=>{i.preventDefault();const n=e.getAttribute("data-page");t.forEach(o=>o.classList.remove("active")),e.classList.add("active"),l.currentPage=n,te(n)})})}async function ve(){try{if(l.avatars=await k.getAvatars(),l.marketData=await k.getMarketData(),l.modules=await k.getModules(),l.projectsList=await k.getProjects(),l.activeProjectId){const t=l.projectsList.find(e=>e.id===l.activeProjectId);t?(l.activeProject=t,l.kbFiles=await k.getProjectFiles(l.activeProjectId)):(l.activeProjectId=null,l.activeProject=null)}}catch(t){console.error("Erro ao carregar dados Supabase:",t)}try{l.localSettings=await k.localGetSettings(),l.localHealth=!0,l.localActiveProvider=l.localSettings.default_provider||"groq",l.localActiveProvider==="groq"?l.localActiveModel="llama-3.3-70b-versatile":l.localActiveProvider==="gemini"?l.localActiveModel="gemini-2.5-flash":l.localActiveProvider==="openrouter"?l.localActiveModel="anthropic/claude-sonnet-4.5":l.localActiveProvider==="perplexity"&&(l.localActiveModel="sonar-reasoning-pro"),l.localAvatars=await k.localGetAvatars(),l.localMarketData=await k.localGetMarketData(),l.localModules=await k.localGetModules(),l.localKbStats=await k.localGetKbStats(),l.localKbFiles=await k.localGetKbFiles(),console.log("[OK] Dados locais carregados com sucesso.")}catch(t){console.warn("[WARN] Cérebro local offline ou inacessível:",t),l.localHealth=!1}Te(),we()}function Te(){const t=document.getElementById("active-model-display"),e=document.getElementById("header-sync-btn");t&&(t.innerHTML=`
            <i data-lucide="cloud" class="badge-icon"></i>
            <span>Supabase Cloud Conectado</span>
        `),e&&(e.innerHTML=`
            <i data-lucide="folder-git2"></i>
            <span>${l.activeProject?l.activeProject.name:"Selecionar Projeto"}</span>
        `,e.onclick=i=>{i.preventDefault(),Ee()}),lucide.createIcons()}function we(){const t=document.querySelector(".watcher-status-header .status-text"),e=document.querySelector(".watcher-status-header .status-indicator"),i=document.getElementById("footer-indexed-files"),n=document.getElementById("footer-provider");l.localHealth?(t&&(t.textContent="Cérebro Local Online"),e&&(e.className="status-indicator online",e.style.background="var(--accent-emerald)"),i&&(i.textContent=`${l.localKbStats.total_files||0} arquivos`),n&&(n.textContent=`${l.localActiveProvider.toUpperCase()} / ${l.localActiveModel.split("-")[0].toUpperCase()}`)):(t&&(t.textContent="Cérebro Local Offline"),e&&(e.className="status-indicator offline",e.style.background="var(--text-muted)"),i&&(i.textContent="Indisponível"),n&&(n.textContent="Nenhum")),lucide.createIcons()}function b(t,e="success"){const i=document.getElementById("toast-container");if(!i)return;const n=document.createElement("div");n.className=`toast ${e}`;let o="check-circle";e==="error"&&(o="alert-triangle"),e==="info"&&(o="info"),n.innerHTML=`
        <i data-lucide="${o}" class="toast-icon"></i>
        <span>${t}</span>
    `,i.appendChild(n),lucide.createIcons(),setTimeout(()=>{n.style.opacity="0",n.style.transform="translateY(20px)",setTimeout(()=>n.remove(),300)},4e3)}function re(t){if(!t)return"";let e=t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");return e=e.replace(/^### (.*$)/gim,"<h3>$1</h3>"),e=e.replace(/^## (.*$)/gim,"<h2>$1</h2>"),e=e.replace(/^# (.*$)/gim,"<h2>$1</h2>"),e=e.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\`\`\`([\s\S]*?)\`\`\`/g,"<pre>$1</pre>"),e=e.replace(/\`(.*?)\`/g,"<code>$1</code>"),e=e.replace(/^\> (.*$)/gim,"<blockquote>$1</blockquote>"),e=e.replace(/^\- (.*$)/gim,"<li>$1</li>"),e=e.replace(/(<li>.*<\/li>)/gim,"<ul>$1</ul>"),e=e.replace(/<\/ul>\s*<ul>/g,""),e}function te(t){const e=document.getElementById("page-content");if(!e)return;if(e.innerHTML="",(t.startsWith("m")&&t!=="meta-ads"||t==="kb")&&!l.activeProjectId){b("Selecione ou crie um projeto para acessar esta área da Nuvem!","info"),l.currentPage="dashboard",document.querySelectorAll(".nav-item").forEach(o=>{o.classList.remove("active"),o.getAttribute("data-page")==="dashboard"&&o.classList.add("active")}),he(e);return}switch(t){case"dashboard":he(e);break;case"kb":Be(e);break;case"m0":_e(e);break;case"m1":case"m2":case"m3":case"m4":case"m5":case"m6":case"m7":case"m8":case"m9":Oe(e,parseInt(t.substring(1)));break;case"m10":je(e);break;case"meta-ads":De(e);break;case"instagram":qe(e);break;case"blog":Fe(e);break;case"products":Ge(e);break;case"theme-creator":Re(e);break;case"campaign":Ne(e);break;case"settings":ze(e);break;default:e.innerHTML=`<p>Aba ${t} em desenvolvimento...</p>`}lucide.createIcons()}async function he(t){try{l.projectsList=await k.getProjects()}catch(a){console.error(a)}let e="";l.activeProject?e=`
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
    `;const i=document.getElementById("btn-new-project"),n=document.getElementById("btn-create-project-empty");i&&(i.onclick=xe),n&&(n.onclick=xe);const o=document.getElementById("btn-change-project-dashboard");o&&(o.onclick=Ee),t.querySelectorAll(".project-item-card").forEach(a=>{a.onclick=async()=>{const s=a.getAttribute("data-id");l.activeProjectId=s,localStorage.setItem("activeProjectId",s),await ve(),b("Projeto ativado com sucesso!","success"),te("dashboard")}})}function xe(){const t=document.createElement("div");t.className="preview-overlay active",t.style.zIndex="2000",t.innerHTML=`
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
    `,document.body.appendChild(t);const e=()=>t.remove();document.getElementById("btn-cancel-new-proj").onclick=e,document.getElementById("btn-save-new-proj").onclick=async()=>{const i=document.getElementById("new-proj-name").value.trim(),n=document.getElementById("new-proj-niche").value.trim(),o=document.getElementById("new-proj-promise").value.trim(),a=document.getElementById("new-proj-audience").value.trim();if(!i){b("Por favor, informe ao menos o nome do projeto!","error");return}try{const s=await k.createProject(i,n,o,a);b("Projeto criado com sucesso!","success"),l.activeProjectId=s[0].id,localStorage.setItem("activeProjectId",s[0].id),e(),await ve(),te("dashboard")}catch(s){b(`Falha ao criar projeto: ${s.message}`,"error")}}}function Ee(){const t=document.createElement("div");t.className="preview-overlay active",t.style.zIndex="2000",t.innerHTML=`
        <div class="panel-card" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; max-height: 400px; overflow-y: auto; border-radius: var(--radius-md); box-shadow: var(--shadow-premium);">
            <div class="panel-header">
                <h2>Selecionar Projeto Ativo</h2>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px; padding: 14px 0;">
                ${l.projectsList.map(i=>`
                    <button class="btn btn-secondary proj-select-btn" data-id="${i.id}" style="width: 100%; text-align: left; justify-content: flex-start; padding: 14px;">
                        <div>
                            <div style="font-weight: 700; color: white;">${i.name}</div>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">${i.niche||"Sem nicho"}</div>
                        </div>
                    </button>
                `).join("")}
                ${l.projectsList.length===0?'<p style="color: var(--text-muted); text-align: center; padding: 20px;">Nenhum projeto criado.</p>':""}
            </div>
            <div style="display: flex; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px;">
                <button class="btn btn-secondary" id="btn-close-project-selector">Fechar</button>
            </div>
        </div>
    `,document.body.appendChild(t);const e=()=>t.remove();document.getElementById("btn-close-project-selector").onclick=e,t.querySelectorAll(".proj-select-btn").forEach(i=>{i.onclick=async()=>{const n=i.getAttribute("data-id");l.activeProjectId=n,localStorage.setItem("activeProjectId",n),e(),await ve(),b("Projeto alterado!","success"),te(l.currentPage)}})}function Be(t){let e=[...l.kbFiles];const i=[...new Set(l.kbFiles.map(u=>u.folder))].sort(),n=u=>{const r=document.getElementById("kb-table-body");if(r){if(u.length===0){r.innerHTML='<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 40px 0;">Nenhum arquivo de apoio indexado na nuvem para este projeto.</td></tr>';return}r.innerHTML=u.map(c=>{let v="file",x="";const y=c.filename.split(".").pop().toLowerCase();y==="docx"?(v="file-word",x="docx"):y==="pdf"?(v="file-text",x="pdf"):y==="md"&&(v="code",x="md");const P=new Intl.NumberFormat("pt-BR").format(c.word_count||0);return`
                <tr>
                    <td>
                        <div class="file-row-name">
                            <i data-lucide="${v}" class="file-icon ${x}"></i>
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
            `}).join(""),r.querySelectorAll(".btn-view-preview").forEach(c=>{c.addEventListener("click",()=>{const v=c.getAttribute("data-id"),x=l.kbFiles.find(y=>y.id===v);x&&Le(x)})}),r.querySelectorAll(".btn-delete-file").forEach(c=>{c.addEventListener("click",async()=>{const v=c.getAttribute("data-id"),x=c.getAttribute("data-url");if(confirm("Tem certeza de que deseja deletar este arquivo da Base de Conhecimento?")){b("Excluindo arquivo...","info");try{await k.deleteReferenceFile(v,x),b("Arquivo excluído com sucesso!","success"),l.kbFiles=await k.getProjectFiles(l.activeProjectId),n(l.kbFiles)}catch(y){b(`Erro ao excluir arquivo: ${y.message}`,"error")}}})}),lucide.createIcons()}};t.innerHTML=`
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
                ${i.map(u=>`<option value="${u}">${u}</option>`).join("")}
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
    `,n(e);const o=document.getElementById("drag-drop-zone"),a=document.getElementById("kb-file-input");o.onclick=()=>a.click(),o.ondragover=u=>{u.preventDefault(),o.style.borderColor="var(--accent-cyan)"},o.ondragleave=()=>{o.style.borderColor="rgba(124, 58, 237, 0.4)"},o.ondrop=async u=>{u.preventDefault(),o.style.borderColor="rgba(124, 58, 237, 0.4)";const r=u.dataTransfer.files;r.length>0&&s(r[0])},a.onchange=async()=>{a.files.length>0&&s(a.files[0])};const s=async u=>{if(!u.name.endsWith(".pdf")){b("Apenas arquivos PDF são aceitos no momento!","error");return}b(`Subindo e indexando PDF: ${u.name}...`,"info");try{await k.uploadReferenceFile(l.activeProjectId,u,"02 - MATERIAIS_BÔNUS_DE_APOIO"),b("PDF carregado! A IA está extraindo o texto em segundo plano...","success"),l.kbFiles=await k.getProjectFiles(l.activeProjectId),n(l.kbFiles)}catch(r){b(`Falha ao subir arquivo: ${r.message}`,"error")}},p=document.getElementById("folder-filter"),m=document.getElementById("kb-table-search"),h=()=>{const u=p.value,r=m.value.toLowerCase();let c=[...l.kbFiles];u!=="all"&&(c=c.filter(v=>v.folder===u)),r&&(c=c.filter(v=>v.filename.toLowerCase().includes(r))),n(c)};p.addEventListener("change",h),m.addEventListener("input",h)}function Le(t){const e=document.getElementById("preview-drawer"),i=document.getElementById("drawer-filename"),n=document.getElementById("drawer-folder"),o=document.getElementById("drawer-content"),a=document.getElementById("drawer-close");i.textContent=t.filename,n.textContent=t.folder,o.textContent=t.extracted_text||"[O texto extraído deste arquivo está em branco]",e.style.right="0",a.onclick=()=>e.style.right="-550px"}async function _e(t){t.innerHTML=`
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
    `;const e=document.getElementById("btn-validate-coherence"),i=document.getElementById("coherence-loading"),n=document.getElementById("coherence-report-box");e.onclick=async()=>{e.style.display="none",i.style.display="block",n.style.display="none";try{const[o,a]=await Promise.all([k.restGet(`/projects?id=eq.${l.activeProjectId}`),k.restGet(`/modules?project_id=eq.${l.activeProjectId}&order=module_number`)]),s=o&&o.length>0?`BRIEFING DO PROJETO:
Nome: ${o[0].name}
Nicho: ${o[0].niche}
Promessa: ${o[0].promise}
Público: ${o[0].target_audience}`:"",p=a?a.filter(u=>u.generated_content&&u.module_number!==0).map(u=>({number:u.module_number,title:u.title,content:u.generated_content})):[];if(p.length===0)throw new Error("Gere conteúdo em ao menos um módulo (M1 a M9) antes de rodar o Orquestrador de Coerência!");const m=p[p.length-1],h=await k.coherenceCheck(s,m.number,m.title,m.content,p.slice(0,-1));l.coherenceReport=h,Me(n,h),n.style.display="block",b("Auditoria concluída com sucesso!","success")}catch(o){b(`Falha na validação: ${o.message}`,"error"),e.style.display="block"}finally{i.style.display="none"}}}function Me(t,e){var n,o,a,s,p,m,h,u;const i=e.score>=80?"var(--accent-green)":e.score>=50?"orange":"var(--accent-red)";t.innerHTML=`
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-info">
                    <h3>Score de Coerência</h3>
                    <div class="metric-value" style="color: ${i};">${e.score}/100</div>
                    <div class="metric-change positive">Consistência Teórica</div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3>Status</h3>
                    <div class="metric-value" style="text-transform: uppercase; font-size: 20px; color: ${i}; margin-top: 10px;">${e.status}</div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-info">
                    <h3>Contradições</h3>
                    <div class="metric-value">${((n=e.contradictions)==null?void 0:n.length)||0}</div>
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
                    <p style="font-size: 11px; color: var(--text-muted); margin-top: 6px; line-height: 1.4;">${((h=e.toneCheck)==null?void 0:h.notes)||""}</p>
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
    `,lucide.createIcons()}async function Oe(t,e){var x;const i=l.modules.find(y=>y.module_number===e);if(!i)return;let n="",o=!1;try{const y=await k.getModuleContent(l.activeProjectId,e);y&&(n=y.generated_content||"",o=y.is_outdated||!1)}catch(y){console.error(y)}t.innerHTML=`
        <div class="page-title-section">
            <h2 class="page-title">M${e} — ${i.title}</h2>
            <p class="page-subtitle">${i.description}</p>
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
                    <span>${n?"Regenerar com IA":"Gerar com IA"}</span>
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
                    <textarea id="module-textarea" class="form-input-text" style="width: 100%; height: 100%; font-family: monospace; font-size: 13px; line-height: 1.6; resize: none; border-radius: var(--radius-sm); flex-grow: 1; overflow-y: auto;" placeholder="Seu conteúdo final gerado e estruturado aparecerá aqui. Você pode editar livremente e clicar em Salvar.">${n}</textarea>
                    
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
                    <p style="color: var(--text-secondary); margin-top: 4px; line-height: 1.4;">${((x=l.activeProject)==null?void 0:x.promise)||"Sem promessa estratégica."}</p>
                </div>

                <h4 style="font-weight: 700; color: white; margin-bottom: 8px;">Conceitos Chave do Módulo</h4>
                <ul style="padding-left: 16px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 20px;">
                    ${i.key_concepts.map(y=>`<li>${y}</li>`).join("")}
                </ul>

                <h4 style="font-weight: 700; color: white; margin-bottom: 8px;">Referências Acadêmicas</h4>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    ${l.kbFiles.slice(0,4).map(y=>`
                        <div style="background: rgba(255,255,255,0.01); border: var(--border-glass); padding: 8px; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="file-text" style="width: 14px; height: 14px; color: var(--accent-violet);"></i>
                            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;">${y.filename}</span>
                        </div>
                    `).join("")}
                    ${l.kbFiles.length===0?'<p style="color: var(--text-dim);">Nenhuma nota local indexada ainda.</p>':""}
                </div>
            </div>

        </div>
    `;const a=document.getElementById("module-textarea"),s=document.getElementById("engine-provider"),p=document.getElementById("funnel-stage"),m=document.getElementById("custom-prompt");s.onchange=()=>{l.activeProvider=s.value,l.activeProvider==="groq"?l.activeModel="llama-3.3-70b-versatile":l.activeProvider==="gemini"?l.activeModel="gemini-2.5-flash":l.activeProvider==="openrouter"?l.activeModel="anthropic/claude-3.5-sonnet":l.activeProvider==="perplexity"&&(l.activeModel="sonar-reasoning")},document.getElementById("btn-save-module").onclick=async()=>{try{await k.saveModuleContent(l.activeProjectId,e,a.value,i.title),b("Rascunho do módulo salvo com sucesso!","success")}catch(y){b(`Falha ao salvar: ${y.message}`,"error")}},document.getElementById("btn-save-version").onclick=async()=>{try{const y=await k.getModuleContent(l.activeProjectId,e);if(!y)throw new Error("Salve o rascunho primeiro antes de criar uma versão!");await k.saveModuleVersion(y.id,a.value),b("Nova versão criada no histórico!","success")}catch(y){b(`Falha ao criar versão: ${y.message}`,"error")}};const h=document.getElementById("btn-search-market"),u=document.getElementById("perplexity-search-query"),r=document.getElementById("market-research-result");h.onclick=async()=>{const y=u.value.trim();if(!y){b("Escreva sua query de busca!","error");return}h.disabled=!0,r.style.display="block",r.innerHTML='<span style="color: var(--accent-cyan);">Pesquisando na internet brasileira com Perplexity API...</span>';try{const P=await k.localPerplexitySearch(y);r.textContent=P.result||"Nenhum resultado retornado."}catch(P){r.textContent=`Erro ao realizar pesquisa via Perplexity API: ${P.message}`}finally{h.disabled=!1}};const c=document.getElementById("btn-generate-ai"),v=document.getElementById("streaming-overlay");c.onclick=async()=>{c.disabled=!0,v.style.display="flex",a.value="",l.activeGenerationText="",await k.generateModuleStream(l.activeProjectId,e,m.value,l.activeProvider,l.activeModel,p.value,y=>{l.activeGenerationText+=y,a.value=l.activeGenerationText},async()=>{v.style.display="none",c.disabled=!1,b("Geração concluída!","success"),await k.saveModuleContent(l.activeProjectId,e,a.value,i.title)},y=>{v.style.display="none",c.disabled=!1,b(`Falha na geração: ${y.message}`,"error")})},lucide.createIcons()}function je(t){let e="",i="#07080f",n=30,o="",a=null;const s={brand:{id:"brand",text:"SISTEMA A.C.A.D.E.M.I.A.",x:80,y:80,fontSize:24,fontFamily:"Outfit",fill:"#22d3ee",align:"center",width:920,fontWeight:"800",fontStyle:"normal"},title:{id:"title",text:"A PÓS-GRADUAÇÃO NÃO PRECISA SER UM MARTÍRIO",x:80,y:400,fontSize:56,fontFamily:"Outfit",fill:"#ffffff",align:"center",width:920,fontWeight:"800",fontStyle:"normal"},subtitle:{id:"subtitle",text:"Descubra seu perfil de improdutividade em 3 minutos.",x:80,y:650,fontSize:32,fontFamily:"Inter",fill:"#94a3b8",align:"center",width:920,fontWeight:"500",fontStyle:"normal"},cta:{id:"cta",text:"Fazer Teste Gratuito",x:340,y:1100,fontSize:26,fontFamily:"Outfit",fill:"#0f172a",bgColor:"#ff6b00",align:"center",width:400,fontWeight:"700",fontStyle:"normal"}};t.innerHTML=`
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
    `;const p=document.getElementById("canvas-format"),m=document.getElementById("visual-canvas-mock"),h=document.getElementById("mock-image-overlay"),u=document.getElementById("canvas-bg-color"),r=document.getElementById("canvas-bg-color-hex"),c=document.getElementById("canvas-image-prompt"),v=document.getElementById("btn-generate-image-ia"),x=document.getElementById("canvas-stock-query"),y=document.getElementById("btn-search-stock"),P=document.getElementById("canvas-file-upload"),E=document.getElementById("canvas-image-opacity"),T=document.getElementById("opacity-value"),L=document.getElementById("btn-generate-caption"),q=document.getElementById("caption-container"),oe=document.getElementById("canvas-caption-text"),ae=document.getElementById("btn-copy-caption"),O=document.getElementById("unsplash-modal"),Q=document.getElementById("btn-close-unsplash-modal"),_=document.getElementById("unsplash-modal-query"),F=document.getElementById("btn-unsplash-modal-search"),N=document.getElementById("unsplash-modal-results"),H=document.getElementById("btn-download-png");function j(){const w=p.value==="story",I=(w?240:320)/1080;w?(m.style.width="240px",m.style.height="426px"):(m.style.width="320px",m.style.height="400px"),m.style.backgroundColor=i,r.value=i.toUpperCase(),u.value=i,e?(m.style.backgroundImage=`url("${e}")`,h.style.backgroundColor=`rgba(7, 8, 15, ${1-parseFloat(n)/100})`):(m.style.backgroundImage="none",h.style.backgroundColor="rgba(7, 8, 15, 0)"),Object.keys(s).forEach(C=>{const f=s[C],S=document.getElementById(`el-${C}`),D=document.getElementById(`preview-${C}-span`);S.style.left=f.x*I+"px",S.style.top=f.y*I+"px",S.style.width=f.width*I+"px",D.textContent=f.text,S.style.color=f.fill,S.style.fontSize=f.fontSize*I+"px",S.style.fontFamily=`${f.fontFamily}, sans-serif`,S.style.fontWeight=f.fontWeight,S.style.fontStyle=f.fontStyle,S.style.textAlign=f.align,C==="brand"&&(D.style.letterSpacing=2*I+"px"),C==="cta"?(S.style.backgroundColor=f.bgColor||"#ff6b00",S.style.padding=`${6*I}px ${14*I}px`,S.style.color=f.fill||"#0f172a"):(S.style.backgroundColor="transparent",S.style.padding="0"),a===C?(S.style.border="1px dashed var(--accent-cyan)",S.style.boxShadow="0 0 8px rgba(34, 211, 238, 0.4)"):(S.style.border="1px dashed transparent",S.style.boxShadow="none")})}p.onchange=j,u.oninput=()=>{i=u.value,j()},r.oninput=()=>{const g=r.value.trim();/^#[0-9A-F]{6}$/i.test(g)&&(i=g,j())},E.oninput=()=>{n=E.value,T.textContent=`${n}%`,j()},P.onchange=()=>{const g=P.files[0];if(g){const w=new FileReader;w.onload=d=>{e=d.target.result,j(),b("Imagem local carregada com sucesso!","success")},w.readAsDataURL(g)}};function X(g){a=g,j();const w=document.getElementById("style-panel-selection");if(!g){w.innerHTML=`
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
            `,lucide.createIcons();return}const d=s[g];w.innerHTML=`
            <div style="display: flex; flex-direction: column; gap: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 8px;">
                    <span style="font-size: 11px; color: var(--accent-cyan); font-weight: 700; text-transform: uppercase;">Elemento: ${g.toUpperCase()}</span>
                    <button id="btn-close-style" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-size:10px;">Limpar Foco</button>
                </div>

                <!-- Input de Texto -->
                <div class="form-group">
                    <label class="form-label" style="font-size: 10px;">Texto do Elemento</label>
                    ${g==="title"?`<textarea id="style-text" class="form-textarea" style="font-size: 11px; height: 50px; resize:none;">${d.text}</textarea>`:`<input type="text" id="style-text" class="form-input-text" value="${d.text}" style="font-size: 11px;">`}
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
                ${g==="cta"?`
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
        `;const I=document.getElementById("style-text"),C=document.getElementById("style-font-family"),f=document.getElementById("style-font-size"),S=document.getElementById("style-font-size-num"),D=document.getElementById("style-align"),$=document.getElementById("btn-style-bold"),A=document.getElementById("btn-style-italic"),G=document.getElementById("style-fill"),z=document.getElementById("style-fill-hex"),K=document.getElementById("style-pos-x"),U=document.getElementById("style-pos-y"),R=()=>{d.text=I.value,d.fontFamily=C.value,d.fontSize=parseInt(f.value),d.align=D.value,d.x=parseInt(K.value)||0,d.y=parseInt(U.value)||0,j()};if(I.oninput=R,C.onchange=R,f.oninput=()=>{S.value=f.value,document.getElementById("style-font-size-val").textContent=`${f.value}px`,R()},S.oninput=()=>{f.value=S.value,document.getElementById("style-font-size-val").textContent=`${S.value}px`,R()},D.onchange=R,$.onclick=()=>{d.fontWeight==="800"||d.fontWeight==="700"?(d.fontWeight="normal",$.classList.remove("active")):(d.fontWeight=g==="brand"||g==="title"?"800":"700",$.classList.add("active")),j()},A.onclick=()=>{d.fontStyle==="italic"?(d.fontStyle="normal",A.classList.remove("active")):(d.fontStyle="italic",A.classList.add("active")),j()},G.oninput=()=>{d.fill=G.value,z.value=d.fill.toUpperCase(),j()},z.oninput=()=>{/^#[0-9A-F]{6}$/i.test(z.value)&&(d.fill=z.value,G.value=d.fill,j())},w.querySelectorAll(".preset-color-btn").forEach(W=>{W.onclick=()=>{const V=W.getAttribute("data-color");d.fill=V,G.value=V,z.value=V.toUpperCase(),j()}}),g==="cta"){const W=document.getElementById("style-cta-bg"),V=document.getElementById("style-cta-bg-hex");W.oninput=()=>{d.bgColor=W.value,V.value=d.bgColor.toUpperCase(),j()},V.oninput=()=>{/^#[0-9A-F]{6}$/i.test(V.value)&&(d.bgColor=V.value,W.value=d.bgColor,j())}}K.oninput=R,U.oninput=R,document.getElementById("btn-close-style").onclick=()=>X(null),lucide.createIcons()}Object.keys(s).forEach(g=>{document.getElementById(`el-${g}`).addEventListener("click",d=>{d.stopPropagation(),X(g)})}),m.addEventListener("click",()=>{X(null)});let ne=!1,B=null,de=0,pe=0,ue=0,me=0;Object.keys(s).forEach(g=>{const w=document.getElementById(`el-${g}`);w.addEventListener("mousedown",d=>{d.button===0&&(ne=!0,B=g,de=d.clientX,pe=d.clientY,ue=s[g].x,me=s[g].y,X(g),w.style.cursor="grabbing",d.preventDefault())}),w.addEventListener("touchstart",d=>{const I=d.touches[0];ne=!0,B=g,de=I.clientX,pe=I.clientY,ue=s[g].x,me=s[g].y,X(g),w.style.cursor="grabbing"})}),document.addEventListener("mousemove",g=>{if(!ne||!B)return;const d=p.value==="story",C=(d?240:320)/1080,f=g.clientX-de,S=g.clientY-pe,D=f/C,$=S/C;s[B].x=ue+D,s[B].y=me+$,s[B].x<-150&&(s[B].x=-150),s[B].y<-150&&(s[B].y=-150);const A=d?1920:1350;if(s[B].x>1080&&(s[B].x=1080),s[B].y>A&&(s[B].y=A),j(),a===B){const G=document.getElementById("style-pos-x"),z=document.getElementById("style-pos-y");G&&z&&(G.value=Math.round(s[B].x),z.value=Math.round(s[B].y))}}),document.addEventListener("touchmove",g=>{if(!ne||!B)return;const w=g.touches[0],f=(p.value==="story"?240:320)/1080,S=w.clientX-de,D=w.clientY-pe,$=S/f,A=D/f;if(s[B].x=ue+$,s[B].y=me+A,j(),a===B){const G=document.getElementById("style-pos-x"),z=document.getElementById("style-pos-y");G&&z&&(G.value=Math.round(s[B].x),z.value=Math.round(s[B].y))}});const be=()=>{if(ne&&B){const g=document.getElementById(`el-${B}`);g&&(g.style.cursor="move")}ne=!1,B=null};document.addEventListener("mouseup",be),document.addEventListener("touchend",be),v.onclick=async()=>{const g=c.value.trim()||s.title.text;if(!g){b("Digite um prompt ou preencha o título para gerar o fundo!","warning");return}v.disabled=!0,v.innerHTML='<span class="loading-spinner" style="width:14px; height:14px; display:inline-block; border:2px solid rgba(255,255,255,0.3); border-radius:50%; border-top-color:white; animation:spin 1s ease-in-out infinite;"></span>',b("Gerando imagem com Imagen 3 de última geração...","info");try{const w=p.value==="story",d=1080,I=w?1920:1350,C=await k.generatePostImage(g,"dark premium, highly detailed, moody cinematic lighting, bokeh",d,I);if(C.imageUrl)e=C.imageUrl,j(),b("Plano de fundo gerado com sucesso!","success");else throw new Error(C.error||"Erro na geração de imagens.")}catch(w){b(`Falha ao gerar imagem: ${w.message}`,"error")}finally{v.disabled=!1,v.innerHTML='<i data-lucide="sparkles" style="width: 14px; height: 14px;"></i>',lucide.createIcons()}};async function ye(){const g=_.value.trim();if(!g){N.innerHTML='<div style="text-align:center; padding:40px; color:var(--text-muted);">Digite termos para busca.</div>';return}N.innerHTML='<div style="text-align:center; padding:40px; color:var(--text-secondary);"><span class="loading-spinner" style="width:24px; height:24px; display:inline-block; border:3px solid rgba(255,255,255,0.2); border-radius:50%; border-top-color:var(--accent-purple); animation:spin 1s ease-in-out infinite; margin-bottom:10px;"></span><br>Buscando imagens...</div>';try{const w=await k.searchStockImages(g,12,"portrait");w.images&&w.images.length>0?(N.innerHTML=`
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 8px 0;">
                        ${w.images.map(d=>`
                            <div class="unsplash-thumb" data-url="${d.url}" style="position: relative; cursor: pointer; border-radius: var(--radius-sm); overflow: hidden; aspect-ratio: 3/4; border: 1px solid rgba(255,255,255,0.08); transition: transform 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                                <img src="${d.thumbUrl}" alt="${d.alt}" style="width:100%; height:100%; object-fit: cover;">
                                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(7, 8, 15, 0.85); padding: 6px; font-size: 9px; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-top: 1px solid rgba(255,255,255,0.05);">
                                    📷 ${d.author}
                                </div>
                            </div>
                        `).join("")}
                    </div>
                `,N.querySelectorAll(".unsplash-thumb").forEach(d=>{d.onclick=()=>{e=d.getAttribute("data-url"),O.style.display="none",j(),b("Imagem do Unsplash aplicada!","success")},d.onmouseenter=()=>d.style.transform="scale(1.03)",d.onmouseleave=()=>d.style.transform="scale(1.0)"})):N.innerHTML='<div style="text-align:center; padding:40px; color:var(--text-muted);">Nenhuma imagem encontrada para este termo.</div>'}catch(w){N.innerHTML=`<div style="text-align:center; padding:40px; color:var(--accent-red);">Erro na busca: ${w.message}</div>`}}y.onclick=()=>{O.style.display="flex",_.value=x.value.trim()||s.title.text.substring(0,20).trim(),ye()},F.onclick=ye,_.onkeydown=g=>{g.key==="Enter"&&ye()},Q.onclick=()=>{O.style.display="none"},L.onclick=async()=>{L.disabled=!0,L.innerHTML='<span class="loading-spinner" style="width:12px; height:12px; display:inline-block; border:2px solid rgba(255,255,255,0.3); border-radius:50%; border-top-color:white; animation:spin 1s ease-in-out infinite; margin-right:6px;"></span> Gerando...';try{let g="",w="";l.activeProject&&(g=l.activeProject.niche||"",w=l.activeProject.target_audience||"");const d=await k.generatePostCaption(s.title.text,s.subtitle.text,"",g,w,"profissional e engajante","Instagram");if(d.caption)o=d.caption,oe.value=o,q.style.display="flex",b("Legenda gerada com sucesso!","success");else throw new Error(d.error||"Nenhum texto de legenda foi retornado.")}catch(g){b(`Falha ao gerar legenda: ${g.message}`,"error")}finally{L.disabled=!1,L.innerHTML='<i data-lucide="sparkles" style="width: 12px; height: 12px; margin-right: 6px;"></i> Gerar Legenda',lucide.createIcons()}},ae.onclick=()=>{navigator.clipboard.writeText(oe.value),b("Legenda copiada para a área de transferência!","success")},H.onclick=async()=>{b("Renderizando imagem de alta resolução...","info"),H.disabled=!0,H.innerHTML='<span class="loading-spinner" style="width:14px; height:14px; display:inline-block; border:2px solid rgba(255,255,255,0.3); border-radius:50%; border-top-color:white; animation:spin 1s ease-in-out infinite; margin-right:6px;"></span> Baixando...';try{const g=p.value,w=g==="story",d=1080,I=w?1920:1350,C=document.createElement("canvas");C.width=d,C.height=I;const f=C.getContext("2d");if(f.fillStyle=i||"#07080f",f.fillRect(0,0,d,I),e)try{const $=new Image;if($.crossOrigin="anonymous",await new Promise(A=>{$.onload=A,$.onerror=()=>{console.warn("Could not load image cross-origin. Falling back to background color."),A()},$.src=e}),$.complete&&$.naturalWidth>0){const A=d/I,G=$.width/$.height;let z=d,K=I,U=0,R=0;G>A?(z=I*G,U=(d-z)/2):(K=d/G,R=(I-K)/2),f.save(),f.globalAlpha=parseFloat(n)/100,f.drawImage($,U,R,z,K),f.restore()}}catch($){console.error("Image draw error:",$)}const S=f.createLinearGradient(0,0,0,I);S.addColorStop(0,"rgba(7, 8, 15, 0.45)"),S.addColorStop(.5,"rgba(7, 8, 15, 0.65)"),S.addColorStop(1,"rgba(7, 8, 15, 0.85)"),f.fillStyle=S,f.fillRect(0,0,d,I),Object.keys(s).forEach($=>{const A=s[$];f.save(),f.textAlign=A.align,f.textBaseline="top",f.fillStyle=A.fill;const G=`${A.fontStyle==="italic"?"italic":""} ${A.fontWeight==="800"||A.fontWeight==="700"?A.fontWeight:"500"}`;f.font=`${G} ${A.fontSize}px ${A.fontFamily}, sans-serif`;let z=A.x;if(A.align==="center"?z=A.x+A.width/2:A.align==="right"&&(z=A.x+A.width),$==="cta"){const U=f.measureText(A.text.toUpperCase()).width+80,R=64,W=z-U/2,V=A.y;f.fillStyle=A.bgColor||"#ff6b00",Pe(f,W,V,U,R,8,!0,!1),f.fillStyle=A.fill||"#0f172a",f.textAlign="center",f.textBaseline="middle",f.fillText(A.text.toUpperCase(),z,V+R/2)}else{const K=Se(f,$==="brand"||$==="title"?A.text.toUpperCase():A.text,A.width);let U=A.y;$==="brand"&&(f.letterSpacing="3px"),K.forEach(R=>{f.fillText(R,z,U),U+=A.fontSize*1.25})}f.restore()});const D=document.createElement("a");D.download=`criativo_${g}_${Date.now()}.png`,D.href=C.toDataURL("image/png"),D.click(),b("Download concluído com sucesso!","success")}catch(g){b(`Erro na exportação local: ${g.message}`,"error")}finally{H.disabled=!1,H.innerHTML='<i data-lucide="download" style="width: 14px; height: 14px; margin-right: 6px;"></i> <span>Baixar PNG em Alta Resolução</span>',lucide.createIcons()}};function Se(g,w,d){const I=w.split(" "),C=[];let f=I[0];for(let S=1;S<I.length;S++){const D=I[S];g.measureText(f+" "+D).width<d?f+=" "+D:(C.push(f),f=D)}return C.push(f),C}function Pe(g,w,d,I,C,f,S,D){if(typeof f=="number")f={tl:f,tr:f,br:f,bl:f};else{const $={tl:0,tr:0,br:0,bl:0};for(const A in $)f[A]=f[A]||$[A]}g.beginPath(),g.moveTo(w+f.tl,d),g.lineTo(w+I-f.tr,d),g.quadraticCurveTo(w+I,d,w+I,d+f.tr),g.lineTo(w+I,d+C-f.br),g.quadraticCurveTo(w+I,d+C,w+I-f.br,d+C),g.lineTo(w+f.bl,d+C),g.quadraticCurveTo(w,d+C,w,d+C-f.bl),g.lineTo(w,d+f.tl),g.quadraticCurveTo(w,d,w+f.tl,d),g.closePath(),g.fill()}(async()=>{try{if(l.activeProjectId){const g=await k.getModuleContent(l.activeProjectId,10);if(g&&g.generated_content){const w=g.generated_content.split(`
`);for(const d of w){const I=d.trim();/^Título\s*:/i.test(I)&&(s.title.text=I.replace(/^Título\s*:\s*/i,"").replace(/\*/g,"")),/^Subtítulo\s*:/i.test(I)&&(s.subtitle.text=I.replace(/^Subtítulo\s*:\s*/i,"").replace(/\*/g,"")),/^CTA\s*:/i.test(I)&&(s.cta.text=I.replace(/^CTA\s*:\s*/i,"").replace(/\*/g,"")),/^Prompt de Imagem\s*:/i.test(I)&&(c.value=I.replace(/^Prompt de Imagem\s*:\s*/i,"").replace(/\*/g,"")),/^Palavras-chave de Busca\s*:/i.test(I)&&(x.value=I.replace(/^Palavras-chave de Busca\s*:\s*/i,"").replace(/\*/g,""))}}}}catch(g){console.warn("Could not pre-populate from M10 content draft",g)}X(null),j()})(),lucide.createIcons()}function ze(t){const e="https://kquyqumyjkjpeoyfeqit.supabase.co",i="sb_publishable_-bcadizrmBkwSoZL1_L1ug_ruzJ-Qk7";t.innerHTML=`
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
    `;const n=document.getElementById("tab-settings-cloud"),o=document.getElementById("tab-settings-local"),a=document.getElementById("tab-settings-drive"),s=document.getElementById("settings-tab-content"),p=r=>{[n,o,a].forEach(c=>c&&c.classList.remove("active")),r&&r.classList.add("active")},m=()=>{p(n),s.innerHTML=`
            <div class="panel-card" style="max-width: 600px;">
                <div class="panel-form" style="display: flex; flex-direction: column; gap: 16px;">
                    <div class="form-group">
                        <label class="form-label">Supabase URL</label>
                        <input type="text" value="${e}" disabled class="form-input-text" style="opacity: 0.6; cursor: not-allowed;">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Supabase Anon Key</label>
                        <input type="text" value="${i.substring(0,15)}*****************" disabled class="form-input-text" style="opacity: 0.6; cursor: not-allowed;">
                    </div>



                    <button class="btn btn-primary" id="btn-save-cloud-settings" style="width: fit-content; margin-top: 10px;">Salvar Ajustes</button>
                </div>
            </div>
        `,document.getElementById("btn-save-cloud-settings").onclick=()=>{b("Configurações de nuvem salvas com sucesso!","success")},lucide.createIcons()},h=()=>{if(p(o),!l.localHealth){s.innerHTML=`
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
        `,document.getElementById("local-settings-form").onsubmit=async r=>{r.preventDefault();const c=document.getElementById("key-groq").value,v=document.getElementById("key-gemini").value,x=document.getElementById("key-openrouter").value,y=document.getElementById("key-perplexity").value,P=document.getElementById("key-unsplash").value,E=document.getElementById("local-workspace").value,T=document.getElementById("local-default-provider").value,L={groq_api_key:c,gemini_api_key:v,openrouter_api_key:x,perplexity_api_key:y,unsplash_access_key:P,workspace_path:E,default_provider:T};b("Salvando chaves locais no SQLite...","info");try{const q=await k.localUpdateSettings(L);l.localSettings=q,l.localActiveProvider=q.default_provider||"groq",b("Chaves e configurações locais salvas com sucesso!","success"),we()}catch(q){b(`Erro ao salvar chaves locais: ${q.message}`,"error")}},lucide.createIcons()},u=async()=>{p(a),s.innerHTML=`
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
        `,lucide.createIcons();try{const r=await k.driveStatus(),c=document.getElementById("drive-status-section"),v=[{ok:r.google_api_available,label:"API Google instalada"},{ok:r.credentials_configured,label:"Credenciais configuradas"},{ok:r.folder_configured,label:"Pasta configurada"},{ok:r.pdf_extraction_available,label:"Extração de PDF"}];c.innerHTML=v.map(x=>`
                <span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;
                    background:${x.ok?"rgba(52,211,153,0.12)":"rgba(239,68,68,0.1)"};
                    border:1px solid ${x.ok?"rgba(52,211,153,0.3)":"rgba(239,68,68,0.3)"};
                    font-size:12px; color:${x.ok?"var(--accent-emerald)":"var(--accent-red)"}">
                    <i data-lucide="${x.ok?"check-circle":"x-circle"}" style="width:13px;height:13px;"></i>
                    ${x.label}
                </span>
            `).join(""),r.last_sync&&(c.innerHTML+=`<div style="font-size:12px;color:var(--text-muted);width:100%;margin-top:4px;">Última sincronização: ${new Date(r.last_sync).toLocaleString("pt-BR")}</div>`),lucide.createIcons()}catch{document.getElementById("drive-status-section").innerHTML='<span style="color:var(--text-muted);font-size:12px;">⚠️ Backend local offline — status indisponível</span>'}document.getElementById("btn-drive-sync").onclick=async()=>{const r=document.getElementById("btn-drive-sync"),c=document.getElementById("drive-report");r.disabled=!0,r.innerHTML='<i data-lucide="loader-2" style="animation:spin 1s linear infinite;"></i><span>Sincronizando...</span>',lucide.createIcons();try{const v=await k.driveSyncWait(),x=v.synced||[],y=v.skipped||[],P=v.errors||[];c.style.display="block",c.innerHTML=`
                    <h4 style="margin-bottom:10px;font-size:14px;">📊 Relatório de Sincronização</h4>
                    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px;">
                        <span style="font-size:13px;"><strong style="color:var(--accent-emerald);">${x.length}</strong> sincronizados</span>
                        <span style="font-size:13px;"><strong style="color:var(--text-muted);">${y.length}</strong> sem alterações</span>
                        <span style="font-size:13px;"><strong style="color:var(--accent-red);">${P.length}</strong> erros</span>
                        <span style="font-size:13px;">Total: <strong>${v.total_files||0}</strong> arquivos no Drive</span>
                    </div>
                    ${x.length>0?`<div style="font-size:12px;color:var(--text-muted);">${x.map(E=>`✅ ${E.name} (${E.words} palavras)`).join("<br>")}</div>`:""}
                    ${P.length>0?`<div style="font-size:12px;color:var(--accent-red);margin-top:8px;">${P.map(E=>`❌ ${E.file}: ${E.error}`).join("<br>")}</div>`:""}
                `,b(`Sincronização concluída! ${x.length} arquivo(s) atualizados.`,"success")}catch(v){b("Erro na sincronização: "+v.message,"error")}finally{r.disabled=!1,r.innerHTML='<i data-lucide="refresh-cw"></i><span>Sincronizar do Google Drive</span>',lucide.createIcons()}},document.getElementById("btn-drive-list").onclick=async()=>{const r=document.getElementById("drive-report");r.innerHTML='<div class="loading-spinner-container" style="min-height:60px;"><div class="spinner" style="width:16px;height:16px;border-width:2px;"></div></div>',r.style.display="block";try{const v=(await k.driveListFiles()).files||[],x={};v.forEach(y=>{const P=y.category||"geral";x[P]||(x[P]=[]),x[P].push(y)}),r.innerHTML=`
                    <h4 style="margin-bottom:10px;font-size:14px;">📁 ${v.length} arquivo(s) encontrado(s) no Drive</h4>
                    ${Object.entries(x).map(([y,P])=>`
                        <div style="margin-bottom:10px;">
                            <strong style="font-size:12px;color:var(--accent-violet);text-transform:uppercase;">${y}</strong>
                            <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">${P.map(E=>`📄 ${E.name}`).join(" &nbsp;·&nbsp; ")}</div>
                        </div>
                    `).join("")}
                `}catch(c){r.innerHTML=`<span style="color:var(--accent-red);font-size:13px;">Erro: ${c.message}</span>`}}};n.onclick=m,o.onclick=h,a.onclick=u,l.localHealth?h():m(),Ve()}function ie(t){return l.localHealth?!0:(t.innerHTML=`
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
        `,lucide.createIcons(),!1)}function De(t){if(!ie(t))return;const e=`
        <div class="form-group">
            <label class="form-label" for="meta-avatar">Persona Foco (Avatar)</label>
            <select id="meta-avatar" class="filter-select" style="width: 100%">
                <option value="">-- Opcional (Nenhum) --</option>
                ${l.localAvatars.map(i=>`<option value="${i.id}">${i.name}</option>`).join("")}
            </select>
        </div>
        
        <div class="form-group">
            <label class="form-label" for="meta-market">Dados de Mercado de Apoio</label>
            <select id="meta-market" class="filter-select" style="width: 100%">
                <option value="">-- Opcional (Nenhum) --</option>
                ${l.localMarketData.map(i=>`<option value="${i.id}">${i.statistic.substring(0,70)}...</option>`).join("")}
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
    `;ce(t,"Agente: Meta Ads Generator","Gere copys completas para campanhas Meta Ads com ganchos baseados em estatísticas reais e foco no Quiz.",e,async i=>{const n=parseInt(document.getElementById("meta-avatar").value)||null,o=parseInt(document.getElementById("meta-market").value)||null,a=document.getElementById("meta-custom").value,s=t.querySelector('input[name="funnel-stage"]:checked'),p=s?s.value:"TOPO";return await k.localGenerateMetaAds(n,o,a,i,null,p)},"meta_ads")}function qe(t){if(!ie(t))return;const e=`
        <div class="form-group">
            <label class="form-label" for="insta-module">Módulo Origem do Livro</label>
            <select id="insta-module" class="filter-select" style="width: 100%">
                ${l.localModules.map(i=>`<option value="${i.id}">${i.letter} - ${i.name}</option>`).join("")}
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
    `;ce(t,"Agente: Instagram Copywriter","Converta temas complexos do livro A.C.A.D.E.M.I.A. em roteiros magnéticos de carrosséis e posts únicos para engajamento.",e,async i=>{const n=parseInt(document.getElementById("insta-module").value),o=document.getElementById("insta-post-type").value,a=document.getElementById("insta-custom").value,s=t.querySelector('input[name="funnel-stage"]:checked'),p=s?s.value:"TOPO";return await k.localGenerateInstagram(n,a,i,null,p,o)},"instagram")}function Fe(t){if(!ie(t))return;ce(t,"Agente: Blog SEO Copywriter","Gere artigos de blog de profunda validação científica, recheados de referências do livro e SEO otimizados.",`
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
        `,async i=>{const n=document.getElementById("blog-key").value,o=document.getElementById("blog-custom").value,a=t.querySelector('input[name="funnel-stage"]:checked'),s=a?a.value:"TOPO",p=t.querySelector('input[name="blog-format"]:checked'),m=p?p.value:"markdown";return await k.localGenerateBlog(n,o,i,null,s,m)},"blog_seo");const e=t.querySelectorAll(".format-option");e.forEach(i=>{i.addEventListener("click",()=>{e.forEach(o=>o.classList.remove("active")),i.classList.add("active");const n=i.querySelector('input[type="radio"]');n&&(n.checked=!0)})})}function Ge(t){if(!ie(t))return;const e=`
        <div class="form-group">
            <label class="form-label" for="prod-module">Módulo Âncora do Livro</label>
            <select id="prod-module" class="filter-select" style="width: 100%">
                ${l.localModules.map(i=>`<option value="${i.id}">${i.letter} - ${i.name}</option>`).join("")}
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
    `;ce(t,"Agente: Novos Produtos & Bumps","Gere blueprints completos de novos microprodutos, templates de Notion e scripts de checkout rápidos.",e,async i=>{const n=parseInt(document.getElementById("prod-module").value),o=document.getElementById("prod-custom").value,a=t.querySelector('input[name="funnel-stage"]:checked'),s=a?a.value:"TOPO";return await k.localGenerateProduct(n,o,i,null,s)},"product")}function Re(t){if(!ie(t))return;ce(t,"Agente: Criador de Temas","Gere pacotes estratégicos de temas, ideias de ganchos e hashtags alinhadas ao funil e aos perfis de improdutividade.",`
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
        `,async n=>{const o=document.getElementById("theme-funnel").value,a=document.getElementById("theme-icp").value,s=document.getElementById("theme-objective").value,p=document.getElementById("theme-qty").value,m=document.getElementById("theme-channel").value,h=document.getElementById("theme-source-type").value;let u=null;return h==="custom"&&(u=document.getElementById("theme-custom-subject").value),await k.localGenerateThemes(o,a,s,p,m,n,null,u)},"theme_creator");const e=document.getElementById("theme-source-type"),i=document.getElementById("theme-custom-subject-group");e&&i&&e.addEventListener("change",()=>{e.value==="custom"?i.style.display="block":i.style.display="none"})}function Ne(t){if(!ie(t))return;let e=l.localActiveCampaignPieces||{meta_ads:"",instagram:"",blog:""},i="meta_ads";t.innerHTML=`
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
    `;let n=l.localActiveProvider||"groq";const o=t.querySelectorAll(".engine-toggle-card");o.forEach(u=>{const r=u.getAttribute("data-provider");r===n&&(o.forEach(c=>c.classList.remove("active")),u.classList.add("active")),u.addEventListener("click",()=>{o.forEach(c=>c.classList.remove("active")),u.classList.add("active"),n=r,l.localActiveProvider=r,r==="groq"?l.localActiveModel="llama-3.3-70b-versatile":r==="gemini"?l.localActiveModel="gemini-2.5-flash":r==="openrouter"?l.localActiveModel="anthropic/claude-sonnet-4.5":r==="perplexity"&&(l.localActiveModel="sonar-reasoning-pro")})});const a=t.querySelectorAll(".campaign-tab-btn"),s=t.querySelector("#campaign-output-box"),p=()=>{const u=t.querySelector("#btn-csv-campaign");if(u&&(i==="instagram"&&!s.classList.contains("empty")&&e.instagram?u.style.display="inline-flex":u.style.display="none"),s.classList.contains("empty"))return;const r=e[i];if(!r)s.innerHTML='<div style="text-align: center; color: var(--text-muted); padding: 40px 0;">Nenhum conteúdo gerado para esta peça.</div>';else{const c=t.querySelector('input[name="campaign-format"]:checked'),v=c?c.value:"markdown";i==="blog"&&v==="html"?s.innerHTML=r:s.innerHTML=re(r)}lucide.createIcons()};a.forEach(u=>{u.addEventListener("click",()=>{a.forEach(r=>r.classList.remove("active")),u.classList.add("active"),i=u.getAttribute("data-tab"),p()})});const m=t.querySelectorAll(".format-option");m.forEach(u=>{u.addEventListener("click",()=>{m.forEach(c=>c.classList.remove("active")),u.classList.add("active");const r=u.querySelector('input[type="radio"]');r&&(r.checked=!0),p()})}),t.querySelector("#btn-copy-campaign").addEventListener("click",()=>{const u=e[i];u&&!s.classList.contains("empty")?(navigator.clipboard.writeText(u),b("Peça copiada para a área de transferência!","success")):b("Nenhum conteúdo disponível para copiar nesta aba.","info")});const h=t.querySelector("#btn-csv-campaign");h&&h.addEventListener("click",()=>{const u=e.instagram;if(u&&!s.classList.contains("empty"))try{const r=ke(u);Ae(r,`canva_lote_campanha_${l.localActiveGeneration.generation_id||Date.now()}.csv`),b("Planilha CSV da Campanha gerada para importação no Canva!","success")}catch(r){b(`Erro ao exportar CSV: ${r.message}`,"error")}else b("Nenhum conteúdo do Instagram gerado para exportar.","info")}),t.querySelector("#campaign-form").addEventListener("submit",async u=>{u.preventDefault();const r=t.querySelector("#btn-submit-campaign"),c=t.querySelector("#campaign-rating-container"),v=t.querySelector("#campaign-theme").value,x=t.querySelector("#campaign-insta-type").value,y=t.querySelector('input[name="campaign-format"]:checked'),P=y?y.value:"markdown";r.disabled=!0,r.innerHTML='<div class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></div> <span>Orquestrando 360...</span>',s.className="output-text-area",s.innerHTML='<div class="loading-spinner-container"><div class="spinner"></div><p>Buscando na base de dados indexada (RAG)... e orquestrando as 3 peças promocionais. Aguarde cerca de 10 a 20 segundos.</p></div>',c.style.display="none",e={meta_ads:"",instagram:"",blog:""};try{const E=await k.localGenerateCampaign(v,n,null,P,x);l.localActiveGeneration=E;const T=E.output,L=_=>{const F=T.match(_);return F?{index:F.index,tag:F[0]}:{index:-1,tag:""}},q=L(/\[\[\[META_ADS\]\]\]/i),oe=L(/\[\[\[INSTAGRAM\]\]\]/i),ae=L(/\[\[\[BLOG\]\]\]/i),O=(_,F)=>{if(_.index===-1)return"";const N=_.index+_.tag.length,H=F&&F.index!==-1?F.index:-1;return H===-1||H<_.index?T.substring(N).trim():T.substring(N,H).trim()},Q=[{type:"meta_ads",match:q},{type:"instagram",match:oe},{type:"blog",match:ae}].filter(_=>_.match.index!==-1).sort((_,F)=>_.match.index-F.match.index);e={meta_ads:"",instagram:"",blog:""};for(let _=0;_<Q.length;_++){const F=Q[_],N=_+1<Q.length?Q[_+1].match:null;e[F.type]=O(F.match,N)}l.localActiveCampaignPieces=e,s.className="output-text-area",p(),c.style.display="flex",Ie(E.generation_id,t),b("Campanha omnichannel gerada com sucesso!","success")}catch(E){s.className="output-text-area empty",s.innerHTML=`Falha na geração: ${E.message}`,b(`Erro na geração: ${E.message}`,"error")}finally{r.disabled=!1,r.innerHTML='<i data-lucide="layers"></i> <span>Disparar Orquestração 360°</span>',lucide.createIcons()}}),lucide.createIcons()}function Ie(t,e){const i=e.querySelectorAll("#campaign-rating-stars .star-icon");i.forEach(n=>{n.classList.remove("active"),n.addEventListener("click",async()=>{const o=parseInt(n.getAttribute("data-value"));i.forEach((a,s)=>{s<o?a.classList.add("active"):a.classList.remove("active")});try{await k.localRateGeneration(t,o),b("Obrigado pela sua avaliação!","success")}catch(a){b(`Falha ao salvar nota: ${a.message}`,"error")}})})}function ce(t,e,i,n,o,a){t.innerHTML=`
        <div class="page-title-section">
            <h2 class="page-title">${e}</h2>
            <p class="page-subtitle">${i}</p>
        </div>
        
        <div class="agent-workspace-grid">
            <!-- Left Side: Controls -->
            <div class="panel-card">
                <form id="agent-form" class="panel-form">
                    ${n}
                    
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
    `;let s=l.localActiveProvider||"groq";const p=t.querySelectorAll(".engine-toggle-card");p.forEach(r=>{const c=r.getAttribute("data-provider");c===s&&(p.forEach(v=>v.classList.remove("active")),r.classList.add("active")),r.addEventListener("click",()=>{p.forEach(v=>v.classList.remove("active")),r.classList.add("active"),s=c,l.localActiveProvider=c,c==="groq"?l.localActiveModel="llama-3.3-70b-versatile":c==="gemini"?l.localActiveModel="gemini-2.5-flash":c==="openrouter"?l.localActiveModel="anthropic/claude-sonnet-4.5":c==="perplexity"&&(l.localActiveModel="sonar-reasoning-pro")})});const m=t.querySelectorAll(".funnel-option");m.forEach(r=>{r.addEventListener("click",()=>{m.forEach(v=>v.classList.remove("active")),r.classList.add("active");const c=r.querySelector('input[type="radio"]');c&&(c.checked=!0)})}),document.getElementById("btn-copy-output").addEventListener("click",()=>{const r=document.getElementById("output-rendered-content");l.localActiveGeneration&&r&&!r.classList.contains("empty")?(navigator.clipboard.writeText(l.localActiveGeneration.output),b("Conteúdo copiado para a área de transferência!","success")):b("Nenhum conteúdo gerado para copiar.","info")});const h=document.getElementById("btn-adapt-output");h&&h.addEventListener("click",()=>{if(l.localActiveGeneration&&l.localActiveGeneration.output){const r=l.localActiveGeneration.type||a;He(l.localActiveGeneration.output,r)}else b("Nenhum conteúdo carregado para adaptar.","info")});const u=document.getElementById("btn-csv-output");u&&u.addEventListener("click",()=>{if(l.localActiveGeneration&&l.localActiveGeneration.output)try{const r=ke(l.localActiveGeneration.output);Ae(r,`canva_lote_post_${l.localActiveGeneration.generation_id||Date.now()}.csv`),b("Planilha CSV gerada para importação no Canva!","success")}catch(r){b(`Erro ao exportar CSV: ${r.message}`,"error")}else b("Nenhum post gerado para exportar.","info")}),document.getElementById("agent-form").addEventListener("submit",async r=>{r.preventDefault();const c=document.getElementById("btn-submit-generate"),v=document.getElementById("output-rendered-content"),x=document.getElementById("rating-container");c.disabled=!0,c.innerHTML='<div class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></div> <span>Processando Copiloto...</span>',v.className="output-text-area",v.innerHTML='<div class="loading-spinner-container"><div class="spinner"></div><p>Gerando conteúdo, orquestrando base teórica... Aguarde.</p></div>',x.style.display="none",h&&(h.style.display="none"),u&&(u.style.display="none");try{const y=await o(s);l.localActiveGeneration={...y,type:a};const P=t.querySelector('input[name="blog-format"]:checked');(P?P.value:"markdown")==="html"?v.innerHTML=y.output:v.innerHTML=re(y.output),x.style.display="flex",h&&(h.style.display="inline-flex"),u&&(a==="instagram"||a==="campaign")&&(u.style.display="inline-flex"),fe(y.generation_id),b("Geração completada com sucesso!","success")}catch(y){v.className="output-text-area empty",v.innerHTML=`Falha na geração: ${y.message}`,b(`Erro na geração: ${y.message}`,"error")}finally{c.disabled=!1,c.innerHTML='<i data-lucide="sparkles"></i> <span>Gerar Conteúdo Inteligente</span>',lucide.createIcons()}}),lucide.createIcons()}function fe(t){const e=document.querySelectorAll("#rating-stars .star-icon");e.forEach(i=>{i.classList.remove("active"),i.addEventListener("click",async()=>{const n=parseInt(i.getAttribute("data-value"));e.forEach((o,a)=>{a<n?o.classList.add("active"):o.classList.remove("active")});try{await k.localRateGeneration(t,n),b("Obrigado pela sua avaliação!","success")}catch(o){b(`Falha ao salvar nota: ${o.message}`,"error")}})})}function He(t,e){const i=document.createElement("div");i.className="custom-modal-overlay active",i.id="adaptation-modal";let n="SEO Blog";e==="meta_ads"||e==="meta-ads"?n="Meta Ads":e==="instagram"?n="Instagram":e==="product"||e==="products"?n="Bumps / Produto":e==="theme_creator"||e==="theme-creator"?n="Criador de Temas":e==="campaign"&&(n="Campanha 360°"),i.innerHTML=`
        <div class="custom-modal-card" style="max-width: 500px; width: 95%;">
            <div class="custom-modal-header">
                <h2><i data-lucide="shuffle" style="color: var(--accent-cyan); width: 22px; height: 22px;"></i> Adaptar Conteúdo</h2>
                <button class="custom-modal-close-btn" id="modal-close-adapt">&times;</button>
            </div>
            <div class="custom-modal-body">
                <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
                    Remixe o conteúdo ativo gerado pelo <strong>Agente ${n}</strong> para um novo formato de destino com inteligência contextual.
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
    `,document.body.appendChild(i),lucide.createIcons(),i.querySelectorAll(".adaptation-format-item").forEach(a=>{const s=a.querySelector('input[type="checkbox"]'),p=()=>{s.checked?a.classList.add("selected"):a.classList.remove("selected")};a.addEventListener("click",m=>{m.target!==s&&(s.checked=!s.checked),p()}),s.addEventListener("change",p)});const o=()=>i.remove();document.getElementById("modal-close-adapt").onclick=o,document.getElementById("btn-cancel-adapt").onclick=o,document.getElementById("btn-confirm-adapt").onclick=async()=>{const a=i.querySelectorAll('input[name="target-agent-format"]:checked');if(a.length===0){b("Selecione pelo menos um formato de destino.","warning");return}const s=document.getElementById("adapt-custom-rules").value;o();const p=Array.from(a).map(m=>m.value);if(p.length===1){const m=p[0];b("Adaptando formato do conteúdo...","info");const h={meta_ads:"meta-ads",instagram:"instagram",blog_seo:"blog",product:"products"};l.currentPage=h[m],document.querySelectorAll(".nav-item").forEach(r=>{r.classList.remove("active"),r.getAttribute("data-page")===l.currentPage&&r.classList.add("active")}),te(l.currentPage),setTimeout(async()=>{const r=document.getElementById("output-rendered-content"),c=document.getElementById("rating-container"),v=document.getElementById("btn-submit-generate");r&&(r.className="output-text-area",r.innerHTML='<div class="loading-spinner-container"><div class="spinner"></div><p>Remixando conteúdo original e aplicando novas regras formais... Aguarde.</p></div>'),c&&(c.style.display="none"),v&&(v.disabled=!0);try{const x=await k.localAdaptContent(t,e,m,l.localActiveProvider,null,"markdown",s);l.localActiveGeneration={...x,type:m},r&&(r.innerHTML=re(x.output)),c&&(c.style.display="flex");const y=document.getElementById("btn-adapt-output"),P=document.getElementById("btn-csv-output");y&&(y.style.display="inline-flex"),P&&(m==="instagram"||m==="campaign")&&(P.style.display="inline-flex"),fe(x.generation_id),b("Conteúdo adaptado com sucesso!","success")}catch(x){r&&(r.className="output-text-area empty",r.innerHTML=`Falha na adaptação: ${x.message}`),b(`Erro na adaptação: ${x.message}`,"error")}finally{v&&(v.disabled=!1,lucide.createIcons())}},100)}else{b("Adaptando conteúdo para múltiplos formatos...","info");const m=document.getElementById("output-rendered-content"),h=document.getElementById("rating-container"),u=document.getElementById("btn-submit-generate");m&&(m.className="output-text-area",m.innerHTML='<div class="loading-spinner-container"><div class="spinner"></div><p>Remixando conteúdo para múltiplos formatos... Aguarde.</p></div>'),h&&(h.style.display="none"),u&&(u.disabled=!0);try{const r=p.map(E=>k.localAdaptContent(t,e,E,l.localActiveProvider,null,"markdown",s)),c=await Promise.all(r);let v="";const x={meta_ads:"📢 Megafone: Meta Ads",instagram:"📸 Post Carrossel Instagram",blog_seo:"✍️ Artigo SEO Blog",product:"🎁 Novos Produtos & Bumps"};c.forEach((E,T)=>{const L=p[T],q=x[L]||L.toUpperCase();v+=`## ${q}

${E.output}

`,T<c.length-1&&(v+=`---

`)}),l.localActiveGeneration={output:v,generation_id:c[0].generation_id,type:"multi_adaptation"},m&&(m.innerHTML=re(v)),h&&(h.style.display="flex");const y=document.getElementById("btn-adapt-output"),P=document.getElementById("btn-csv-output");y&&(y.style.display="inline-flex"),P&&(P.style.display="none"),c[0]&&c[0].generation_id&&fe(c[0].generation_id),b("Múltiplos formatos adaptados com sucesso!","success")}catch(r){m&&(m.className="output-text-area empty",m.innerHTML=`Falha na adaptação: ${r.message}`),b(`Erro na adaptação: ${r.message}`,"error")}finally{u&&(u.disabled=!1,lucide.createIcons())}}}}function ke(t){const e=[["Nº","Headline","CTA","Elemento extra"]],i=/\[Slide\s+(\d+)\][\s\S]*?(?=\[Slide\s+\d+\]|📝\s*CAPTION|📝\s*LEGENDA|$)/gi;let n,o=!1;for(;(n=i.exec(t))!==null;){o=!0;const a=n[0],s=n[1];let p="";const m=a.match(/T[íi]tulo:\s*([^\n]+)/i);m&&(p=m[1].trim());let h="";const u=a.match(/Conte[úu]do:\s*([^\n]+(?:\n\s*-\s*[^\n]+)*)/i);u&&(h=u[1].trim().replace(/\n/g," ").replace(/\s+/g," "));let r="";const c=p.match(/[A-ZÁÉÍÓÚÂÊÔÃÕÇ\d-]{3,}/g);if(c&&c.length>0)r=c[0];else{const v=p.split(/\s+/);v.length>0&&(r=v[0].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toUpperCase())}e.push([s,p,r,h])}if(!o){let a="";const s=t.match(/📊\s*TEMA\s*DO\s*POST:\s*([^\n]+)/i)||t.match(/T[íi]tulo:\s*([^\n]+)/i);s?a=s[1].trim():a="POST DO INSTAGRAM";let p="";const m=t.match(/(?:📝\s*CAPTION|📝\s*LEGENDA\s*DO\s*POST|📝\s*LEGENDA):\s*([\s\S]+)/i);m?p=m[1].trim().split(`
`)[0].trim():p="Sistema A.C.A.D.E.M.I.A. local";let h="";const u=a.match(/[A-ZÁÉÍÓÚÂÊÔÃÕÇ\d-]{3,}/g);u&&u.length>0?h=u[0]:h="SISTEMA ACADEMIA",e.push(["1",a,h,p])}return e.map(a=>a.map(s=>{let p=s==null?"":String(s);return p=p.replace(/"/g,'""'),p.includes(",")||p.includes('"')||p.includes(`
`)?`"${p}"`:p}).join(",")).join(`
`)}function Ae(t,e){const i=new Blob(["\uFEFF"+t],{type:"text/csv;charset=utf-8;"}),n=document.createElement("a");if(n.download!==void 0){const o=URL.createObjectURL(i);n.setAttribute("href",o),n.setAttribute("download",e),n.style.visibility="hidden",document.body.appendChild(n),n.click(),document.body.removeChild(n)}}function Ue(t){const e=t.output_generated||t.output||"",i=t.prompt_used||t.prompt||"";let n;function o(a){if(!a)return"";let s=a.trim();return s=s.replace(/^["'“`\*#\-\s\+:]+|["'”`\*#\-\s]+$/g,""),s=s.replace(/<[^>]*>/g,""),s=s.replace(/^[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}🏆📌💡📊?📌\s\*\-#\+:]+/u,""),s=s.trim().replace(/^["'“`\*#\-\s\+:]+|["'”`\*#\-\s]+$/g,""),s}if(t.type==="blog_seo"){if(n=e.match(/(?:TÍTULO|TITULO)\s*SEO\s*(?:DO\s*ARTIGO)?:\s*(.*)/i)){const a=o(n[1]);if(a)return a}if(n=e.match(/<h1[^>]*>(.*?)<\/h1>/i)){const a=o(n[1]);if(a)return a}if(n=e.match(/<h2[^>]*>(.*?)<\/h2>/i)){const a=o(n[1]);if(a)return a}if(n=e.match(/^\s*#\s*(.*)/m)){const a=o(n[1]);if(a)return a}if(n=e.match(/^\s*##\s*(.*)/m)){const a=o(n[1]);if(a)return a}if(n=i.match(/(?:PALAVRA-CHAVE|PALAVRA\s*CHAVE)\s*(?:ALVO|FOCO)?:\s*(.*)/i)){const a=o(n[1]);if(a)return a}}else if(t.type==="campaign"){if(n=e.match(/<h2[^>]*>(.*?)<\/h2>/i)){const a=o(n[1]);if(a)return a}if(n=e.match(/<h1[^>]*>(.*?)<\/h1>/i)){const a=o(n[1]);if(a)return a}if(n=i.match(/TEMA\s*DA\s*CAMPANHA\s*360:\s*(.*)/i)){const a=o(n[1]);if(a)return a}if(n=e.match(/HEADLINE\s*DO\s*ANÚNCIO:\s*(.*)/i)){const a=o(n[1]);if(a)return a}}else if(t.type==="meta_ads"){if(n=e.match(/(?:TÍTULO|TITULO|HEADLINE)\s*(?:DO\s*ANÚNCIO)?:\s*(.*)/i)){const a=o(n[1]);if(a)return a}if(n=i.match(/AVATAR\s*(?:SELECIONADO)?:\s*(.*)/i)){const a=o(n[1]);if(a)return a}}else if(t.type==="instagram"){if(n=e.match(/(?:TEMA|TÍTULO|TITULO)\s*(?:DO\s*CARROSSEL)?:\s*(.*)/i)){const a=o(n[1]);if(a)return a}if(n=i.match(/MÓDULO\s*(?:SELECIONADO)?:\s*(.*)/i)){const a=o(n[1]);if(a)return a}}else if(t.type==="product"){if(n=e.match(/NOME\s*DO\s*PRODUTO:\s*(.*)/i)){const a=o(n[1]);if(a)return a}}else if(t.type==="theme_creator"){if(n=e.match(/(?:🎯)*\s*TEMA:\s*(.*)/i)){const a=o(n[1]);if(a)return a}if(n=i.match(/Objetivo\s*da\s*rodada:\s*(.*)/i)){const a=o(n[1]);if(a)return"Temas: "+a}}if(n=e.match(/<h1[^>]*>(.*?)<\/h1>/i)){const a=o(n[1]);if(a)return a}if(n=e.match(/<h2[^>]*>(.*?)<\/h2>/i)){const a=o(n[1]);if(a)return a}if(n=e.match(/^\s*#\s*(.*)/m)){const a=o(n[1]);if(a)return a}if(n=e.match(/^\s*##\s*(.*)/m)){const a=o(n[1]);if(a)return a}return null}function We(t){if(t){t.funnel_stage&&document.querySelectorAll('input[name="funnel-stage"]').forEach(n=>{if(n.value===t.funnel_stage.toUpperCase()){n.checked=!0;const o=n.closest(".funnel-option");o&&o.classList.add("active")}else{const o=n.closest(".funnel-option");o&&o.classList.remove("active")}});const e=t.prompt_used||t.prompt||"",i=t.output_generated||t.output||"";if(t.type==="meta_ads"){const n=document.getElementById("meta-avatar");n&&t.avatar_id&&(n.value=t.avatar_id);const o=document.getElementById("meta-market");if(o&&l.localMarketData){const s=l.localMarketData.find(p=>e.includes(p.statistic));s?o.value=s.id:o.value=""}const a=document.getElementById("meta-custom");if(a&&e){const s=e.match(/OUTRAS DIRETRIZES DO USUÁRIO:\s*(.*)/i);s&&s[1].trim()!=="Nenhuma"?a.value=s[1].trim():a.value=""}}else if(t.type==="instagram"){const n=document.getElementById("insta-module");n&&t.module_id&&(n.value=t.module_id);const o=document.getElementById("insta-post-type");o&&e&&(e.includes("POST ÚNICO")?o.value="post_unico":e.includes("CARROSSEL DE EXATAMENTE 4 SLIDES")?o.value="carrossel_4":e.includes("CARROSSEL DE EXATAMENTE 7 SLIDES")?o.value="carrossel_7":e.includes("CARROSSEL DE EXATAMENTE 9 SLIDES")?o.value="carrossel_9":o.value="carrossel");const a=document.getElementById("insta-custom");if(a&&e){const s=e.match(/OUTRAS DIRETRIZES DO USUÁRIO:\s*(.*)/i);s&&s[1].trim()!=="Nenhuma"?a.value=s[1].trim():a.value=""}}else if(t.type==="blog_seo"){const n=document.getElementById("blog-key");if(n&&e){const p=e.match(/PALAVRA-CHAVE ALVO:\s*(.*)/i);p&&(n.value=p[1].trim())}const o=i&&(i.includes('<header class="site-header">')||i.includes('class="cta-block"')),a=document.querySelector(`input[name="blog-format"][value="${o?"html":"markdown"}"]`);a&&(a.checked=!0,document.querySelectorAll(".format-option").forEach(p=>{p.getAttribute("data-format")===(o?"html":"markdown")?p.classList.add("active"):p.classList.remove("active")}));const s=document.getElementById("blog-custom");if(s&&e){const p=e.match(/OUTRAS DIRETRIZES DO USUÁRIO:\s*(.*)/i);p&&p[1].trim()!=="Nenhuma"?s.value=p[1].trim():s.value=""}}else if(t.type==="product"){const n=document.getElementById("prod-module");n&&t.module_id&&(n.value=t.module_id);const o=document.getElementById("prod-custom");if(o&&e){const a=e.match(/OUTRAS DIRETRIZES DO USUÁRIO:\s*(.*)/i);a&&a[1].trim()!=="Nenhuma"?o.value=a[1].trim():o.value=""}}else if(t.type==="theme_creator"){const n=document.getElementById("theme-funnel");if(n&&e){const m=e.match(/- Estágio do funil desejado:\s*(.*)/i);m&&(n.value=m[1].trim())}const o=document.getElementById("theme-icp");if(o&&e){const m=e.match(/- Perfil de ICP prioritário:\s*(.*)/i);m&&(o.value=m[1].trim())}const a=document.getElementById("theme-objective");if(a&&e){const m=e.match(/- Objetivo da rodada:\s*(.*)/i);m&&(a.value=m[1].trim())}const s=document.getElementById("theme-qty");if(s&&e){const m=e.match(/- Quantidade de temas por estágio:\s*(.*)/i);m&&(s.value=parseInt(m[1].trim())||5)}const p=document.getElementById("theme-channel");if(p&&e){const m=e.match(/- Canal de destino:\s*(.*)/i);m&&(p.value=m[1].trim())}}else if(t.type==="campaign"){const n=document.getElementById("campaign-theme");if(n&&e){const p=e.match(/TEMA DA CAMPANHA 360:\s*(.*)/i);p&&(n.value=p[1].trim())}const o=document.getElementById("campaign-insta-type");o&&e&&(e.includes("POST ÚNICO")?o.value="post_unico":e.includes("CARROSSEL DE EXATAMENTE 4 SLIDES")?o.value="carrossel_4":e.includes("CARROSSEL DE EXATAMENTE 7 SLIDES")?o.value="carrossel_7":e.includes("CARROSSEL DE EXATAMENTE 9 SLIDES")?o.value="carrossel_9":o.value="carrossel");const a=i&&i.includes(`[[[BLOG]]]
<`),s=document.querySelector(`input[name="campaign-format"][value="${a?"html":"markdown"}"]`);s&&(s.checked=!0,document.querySelectorAll(".format-option").forEach(p=>{p.getAttribute("data-format")===(a?"html":"markdown")?p.classList.add("active"):p.classList.remove("active")}))}}}async function Ve(){const t=document.getElementById("history-items-list");if(t)try{const e=await k.localGetGenerations(30);if(e.length===0){t.innerHTML='<div style="text-align: center; color: var(--text-muted); padding: 40px 0; font-size: 13px;">Nenhuma geração registrada no histórico local ainda.</div>';return}t.innerHTML=e.map(i=>{const n=new Date(i.created_at).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});let o=i.type;i.type==="meta_ads"?o="Meta Ads":i.type==="instagram"?o="Instagram":i.type==="blog_seo"?o="SEO Blog":i.type==="product"?o="Bumps / Produto":i.type==="campaign"?o="Campanha 360°":i.type==="theme_creator"&&(o="Criador de Temas");let a=Ue(i);return a||(a=o),`
                <div class="history-item" data-id="${i.id}" style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: background 0.2s;">
                    <div class="history-item-left" style="display: flex; flex-direction: column;">
                        <span class="history-item-type" style="font-size: 13px; font-weight: 600; color: white;">${a}</span>
                        <span class="history-item-meta" style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                            ${n} • ${o} • Model: ${(i.model||"").split("/").pop()||"Nenhum"}
                        </span>
                    </div>
                    <div class="history-item-right" style="font-size: 11px; color: var(--accent-cyan); text-align: right; margin-top: 4px;">
                        ${i.rating?"★ ".repeat(i.rating):"Sem Nota"}
                    </div>
                </div>
            `}).join(""),t.querySelectorAll(".history-item").forEach(i=>{i.addEventListener("click",async()=>{const n=parseInt(i.getAttribute("data-id")),o=e.find(a=>a.id===n);if(o){let a="meta-ads";o.type==="instagram"?a="instagram":o.type==="blog_seo"?a="blog":o.type==="product"?a="products":o.type==="theme_creator"?a="theme-creator":o.type==="campaign"&&(a="campaign"),document.querySelectorAll(".nav-item").forEach(s=>{s.classList.remove("active"),s.getAttribute("data-page")===a&&s.classList.add("active")}),l.currentPage=a,te(a),setTimeout(()=>{if(We(o),o.type==="campaign"){const s=document.getElementById("campaign-output-box"),p=document.getElementById("campaign-rating-container");if(s){s.className="output-text-area";const m=o.output_generated||o.output||"",h=E=>{const T=m.match(E);return T?{index:T.index,tag:T[0]}:{index:-1,tag:""}},u=h(/\[\[\[META_ADS\]\]\]/i),r=h(/\[\[\[INSTAGRAM\]\]\]/i),c=h(/\[\[\[BLOG\]\]\]/i),v=(E,T)=>{if(E.index===-1)return"";const L=E.index+E.tag.length,q=T&&T.index!==-1?T.index:-1;return q===-1||q<E.index?m.substring(L).trim():m.substring(L,q).trim()},x=[{type:"meta_ads",match:u},{type:"instagram",match:r},{type:"blog",match:c}].filter(E=>E.match.index!==-1).sort((E,T)=>E.match.index-T.match.index),y={meta_ads:"",instagram:"",blog:""};for(let E=0;E<x.length;E++){const T=x[E],L=E+1<x.length?x[E+1].match:null;y[T.type]=v(T.match,L)}!y.meta_ads&&!y.instagram&&!y.blog&&(y.meta_ads=m),l.localActiveCampaignPieces=y,l.localActiveGeneration={output:m,generation_id:o.id,type:o.type};const P=document.querySelector(".campaign-tab-btn.active");if(P)P.click();else{const E=document.querySelector(".campaign-tab-btn");E&&E.click()}p&&(p.style.display="flex",Ie(o.id,document.getElementById("page-content")),o.rating&&p.querySelectorAll(".star-icon").forEach((E,T)=>{T<o.rating?E.classList.add("active"):E.classList.remove("active")})),lucide.createIcons()}}else{const s=document.getElementById("output-rendered-content"),p=document.getElementById("rating-container");if(s){s.className="output-text-area";const m=o.output_generated||o.output||"";s.innerHTML=re(m),l.localActiveGeneration={output:m,generation_id:o.id,type:o.type};const h=document.getElementById("btn-adapt-output");h&&(h.style.display="inline-flex");const u=document.getElementById("btn-csv-output");u&&(o.type==="instagram"?u.style.display="inline-flex":u.style.display="none"),p&&(p.style.display="flex",fe(o.id),o.rating&&p.querySelectorAll(".star-icon").forEach((r,c)=>{c<o.rating?r.classList.add("active"):r.classList.remove("active")})),lucide.createIcons()}}},50),b("Geração restaurada com sucesso!","info")}})})}catch{t.innerHTML='<div style="color: var(--accent-red); font-size: 12px; text-align: center; padding: 20px 0;">Erro ao carregar histórico.</div>'}}
