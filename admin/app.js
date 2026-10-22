/* =========================================================
   ADMIN BELLAMY — app.js
   SPA · Hash routing · Mock-first · Pronto para API real
   ========================================================= */

/* ===================== CONFIG ===================== */
const APP = {
  apiBase: window.ADMIN_API_BASE || "", // preenchido quando backend estiver online
  mockMode: true, // ← quando backend existir, trocar para false
  botUsername: "larizinhastorebot",
  channelLink: "https://t.me/larizinhastore",
  adminTelegramId: null,
  currency: "R$",
};

/* ===================== TELEGRAM WEBAPP ===================== */
const tg = window.Telegram?.WebApp || null;
function initTelegram() {
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    tg.setHeaderColor("#0a0a0f");
    tg.setBackgroundColor("#0a0a0f");
    const u = tg.initDataUnsafe?.user;
    if (u) {
      APP.adminTelegramId = u.id;
      const name = [u.first_name, u.last_name].filter(Boolean).join(" ");
      const nameEl = document.getElementById("adminName");
      const avatarEl = document.getElementById("adminAvatar");
      if (nameEl) nameEl.textContent = name || "Admin";
      if (avatarEl) avatarEl.textContent = (name || "A").charAt(0).toUpperCase();
    }
  } catch (e) { console.warn("Telegram init:", e); }
}

/* ===================== UTILS ===================== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtMoney = (v) => `${APP.currency} ${Number(v || 0).toFixed(2).replace(".", ",")}`;
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
};
const uid = () => "id_" + Math.random().toString(36).slice(2, 10);

/* ===================== TOAST ===================== */
function toast(message, type = "info", timeout = 3200) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const icons = { success: "check-circle-2", error: "alert-circle", info: "info" };
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = `<i data-lucide="${icons[type] || "info"}"></i><span>${esc(message)}</span>`;
  container.appendChild(el);
  if (window.lucide) lucide.createIcons();
  setTimeout(() => {
    el.classList.add("fade-out");
    setTimeout(() => el.remove(), 250);
  }, timeout);
}

/* ===================== MODAL ===================== */
const modalRoot = () => document.getElementById("modalRoot");
const modalBox = () => document.getElementById("modalBox");

function openModal({ title, body, footer = "", size = "md", onMount }) {
  const root = modalRoot();
  const box = modalBox();
  if (!root || !box) return;
  box.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">${esc(title || "")}</h3>
      <button class="modal-close" onclick="closeModal()"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="modal-body">${body}</div>
    ${footer ? `<div class="modal-footer">${footer}</div>` : ""}
  `;
  root.classList.remove("hidden");
  if (window.lucide) lucide.createIcons();
  if (typeof onMount === "function") onMount(box);
}
function closeModal() {
  const root = modalRoot();
  if (root) root.classList.add("hidden");
}

/* ===================== CONFIRM ===================== */
let confirmResolver = null;
function confirmDialog(title, message) {
  return new Promise((resolve) => {
    confirmResolver = resolve;
    const el = document.getElementById("confirmDialog");
    if (!el) return resolve(false);
    document.getElementById("confirmTitle").textContent = title || "Confirmar";
    document.getElementById("confirmMessage").textContent = message || "Tem certeza?";
    el.classList.remove("hidden");
  });
}
function closeConfirm(result) {
  const el = document.getElementById("confirmDialog");
  if (el) el.classList.add("hidden");
  if (confirmResolver) { confirmResolver(result); confirmResolver = null; }
}
window.closeConfirm = closeConfirm;
window.closeModal = closeModal;

/* ===================== LOADING ===================== */
function showLoading(show) {
  const el = document.getElementById("loadingOverlay");
  if (!el) return;
  el.classList.toggle("hidden", !show);
  el.classList.toggle("flex", show);
}

/* ===================== API (mock-first) ===================== */
async function api(path, { method = "GET", body } = {}) {
  if (APP.mockMode) {
    await new Promise((r) => setTimeout(r, 120));
    return mockApi(path, method, body);
  }
  const res = await fetch(`${APP.apiBase}${path}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Telegram-Init": tg?.initData || "" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

/* ===================== MOCK STATE ===================== */
const MOCK = {
  stats: {
    users_total: 12483, users_today: 142, users_7d: 891, users_30d: 3421,
    sales_total: 9871, revenue_bruto: 187432.9, recargas_total: 214980.5, bonus_total: 8240.3,
    saldo_carteiras: 41208.77, pix_pendentes: 12, pix_aprovados: 3402, pix_expirados: 87, pix_cancelados: 21,
    produtos_vendidos: 15230, estoque_disponivel: 812, esgotados: 3,
    compras_aprovadas: 9621, falhas_entrega: 4, reembolsos: 2,
    comissoes_pendentes: 612.4, pontos_afiliados: 15820,
  },
  recent: [
    { icon: "shopping-cart", color: "green", text: "Nova venda · Netflix 4K · R$ 18,00", time: "há 2 min" },
    { icon: "wallet", color: "purple", text: "Recarga aprovada · R$ 50,00 · @maria_silva", time: "há 6 min" },
    { icon: "user-plus", color: "blue", text: "Novo usuário cadastrado · @lucasdev", time: "há 11 min" },
    { icon: "package", color: "yellow", text: "Estoque baixo · Disney+ Plano Padrão (3 un.)", time: "há 22 min" },
    { icon: "pix", color: "green", text: "PIX confirmado · R$ 30,00 · @ricardo_m", time: "há 34 min" },
  ],
  messages: [
    { key: "welcome", name: "Boas-vindas", text: "🎬 Bem-vindo à Larizinha Store! ✨\nA sua central de streamings com entrega 100% automática.\n\n🆔 ID: {id}\n💰 Saldo: R$ {saldo}", active: true },
    { key: "channel_lock", name: "Bloqueio de canal", text: "❗️ Para utilizar nosso serviço é obrigatório que você entre no nosso grupo.", active: true },
    { key: "catalog", name: "Catálogo de Serviços", text: "📱 Lari Contas | Catálogo de Serviços\n💰 Saldo: R$ {saldo}\n⬇️ Selecione uma categoria:", active: true },
    { key: "product", name: "Detalhes do Produto", text: "🔥 OPORTUNIDADE EXCLUSIVA 🔥\n🚀 {produto}\n💵 R$ {preco}\n📦 Estoque: {estoque}", active: true },
    { key: "low_balance", name: "Saldo Insuficiente", text: "❌ Saldo insuficiente!\nFaltam R$ {faltam}", active: true },
    { key: "pix", name: "PIX / Pagamento", text: "💰 Comprar Saldo com Pix\n💵 Valor: R$ {valor}\n{codigo_pix}", active: true },
    { key: "sale_approved", name: "Venda Aprovada", text: "🎉 VENDA APROVADA!\n📧 {email}\n🔒 {senha}\n🔗 {link_acesso}", active: true },
    { key: "profile", name: "Meu Perfil", text: "👤 Meu perfil\n🆔 {id}\n💰 R$ {saldo}", active: true },
    { key: "maintenance_msg", name: "Manutenção", text: "Estamos realizando uma manutenção. Tente novamente em alguns minutos.", active: true },
  ],
  buttons: [
    { id: "b1", label: "🛍 Comprar Produtos", type: "callback", action: "menu:catalog", row: 1, pos: 1, visible: true, bg: "primary" },
    { id: "b2", label: "💳 Recarregar Saldo", type: "callback", action: "menu:topup", row: 1, pos: 2, visible: true, bg: "primary" },
    { id: "b3", label: "👤 Meu Perfil", type: "callback", action: "menu:profile", row: 2, pos: 1, visible: true, bg: "secondary" },
    { id: "b4", label: "💰 Afiliados", type: "callback", action: "menu:affiliates", row: 2, pos: 2, visible: true, bg: "secondary" },
    { id: "b5", label: "🏆 Top Compradores", type: "callback", action: "menu:top", row: 3, pos: 1, visible: true, bg: "secondary" },
    { id: "b6", label: "💬 Atendimento", type: "url", action: "https://t.me/m/UyHOGg-RZjgx", row: 3, pos: 2, visible: true, bg: "secondary" },
    { id: "b7", label: "🔎 Pesquisar Serviço", type: "inline", action: "switch_inline_query_current_chat", row: 4, pos: 1, visible: true, bg: "secondary" },
  ],
  products: [
    { id: 1, name: "Netflix 4K Premium", price: 18.0, stock: 42, sold: 1240, active: true, category: "Streaming" },
    { id: 2, name: "Disney+ Plano Padrão", price: 12.9, stock: 3, sold: 980, active: true, category: "Streaming" },
    { id: 3, name: "Spotify Premium", price: 8.5, stock: 87, sold: 620, active: true, category: "Música" },
    { id: 4, name: "HBO Max", price: 14.0, stock: 22, sold: 845, active: true, category: "Streaming" },
    { id: 5, name: "Canva Pro", price: 6.9, stock: 0, sold: 412, active: false, category: "Ferramentas" },
    { id: 6, name: "Play Store Gift R$ 50", price: 45.0, stock: 15, sold: 210, active: true, category: "Gift" },
  ],
  orders: [
    { id: "ORD-9121", user: "Maria Silva", product: "Netflix 4K Premium", value: 18.0, status: "entregue", date: "2026-10-22T14:32:00Z" },
    { id: "ORD-9120", user: "Lucas Dev", product: "Disney+ Plano Padrão", value: 12.9, status: "aprovado", date: "2026-10-22T14:15:00Z" },
    { id: "ORD-9119", user: "Ricardo M.", product: "Spotify Premium", value: 8.5, status: "entregue", date: "2026-10-22T13:58:00Z" },
    { id: "ORD-9118", user: "Ana Beatriz", product: "HBO Max", value: 14.0, status: "erro", date: "2026-10-22T13:40:00Z" },
  ],
  pix: [
    { id: "PIX-451", user: "Maria Silva", value: 50.0, status: "aprovado", created: "2026-10-22T14:10:00Z" },
    { id: "PIX-450", user: "Ricardo M.", value: 30.0, status: "pendente", created: "2026-10-22T14:22:00Z" },
    { id: "PIX-449", user: "Lucas Dev", value: 15.0, status: "expirado", created: "2026-10-22T13:45:00Z" },
  ],
  users: [
    { id: 88122, name: "Maria Silva", username: "maria_silva", saldo: 42.5, compras: 12, whatsapp: "11999998888", created: "2026-01-10" },
    { id: 88120, name: "Lucas Dev", username: "lucasdev", saldo: 8.0, compras: 3, whatsapp: "", created: "2026-03-05" },
    { id: 88119, name: "Ricardo M.", username: "ricardo_m", saldo: 120.0, compras: 28, whatsapp: "21988887777", created: "2025-12-22" },
    { id: 88118, name: "Ana Beatriz", username: "anab", saldo: 0.0, compras: 1, whatsapp: "", created: "2026-08-14" },
  ],
  gifts: [
    { code: "ABC123XYZ456", value: 25.0, product: "—", used: false, created: "2026-10-01" },
    { code: "NETFLIX-2026", value: 0, product: "Netflix 4K", used: true, created: "2026-09-15" },
  ],
  affiliates: [
    { user: "Ricardo M.", indicacoes: 42, comissao_ganha: 312.5, nivel: "Ouro", ativo: true },
    { user: "Maria Silva", indicacoes: 18, comissao_ganha: 89.0, nivel: "Prata", ativo: true },
  ],
  rankings: {
    services: [
      { pos: 1, name: "HBO Max", orders: 150 },
      { pos: 2, name: "Sky + HBO + Paramount", orders: 125 },
      { pos: 3, name: "Disney+ Plano Padrão", orders: 116 },
      { pos: 4, name: "Netflix 4K Premium", orders: 107 },
      { pos: 5, name: "Canva Pro", orders: 82 },
    ],
    recargas: [
      { pos: 1, name: "Viktor", value: 520.0 },
      { pos: 2, name: "Ricardo", value: 410.0 },
      { pos: 3, name: "Maria S.", value: 380.5 },
    ],
    saldo: [
      { pos: 1, name: "Ricardo M.", value: 1240.0 },
      { pos: 2, name: "Maria Silva", value: 890.5 },
      { pos: 3, name: "Lucas Dev", value: 512.3 },
    ],
  },
  promos: [
    { id: "P1", title: "SKY+ Completa", product: "Netflix 4K", price: 11.9, status: "ativa", date: "2026-10-20" },
    { id: "P2", title: "Black Friday Disney", product: "Disney+ Plano Padrão", price: 8.9, status: "agendada", date: "2026-11-25" },
  ],
  automations: [
    { key: "welcome", name: "Boas-vindas", active: true, desc: "Enviada ao usuário após entrar no canal" },
    { key: "cart_abandon", name: "Carrinho abandonado", active: true, desc: "15 min após visualizar produto" },
    { key: "pix_expire", name: "PIX expirado", active: true, desc: "Aviso 15 min após gerar PIX sem pagamento" },
    { key: "payment_confirm", name: "Pagamento confirmado", active: true, desc: "Mensagem ao aprovar pagamento" },
    { key: "stock_low", name: "Estoque baixo", active: true, desc: "Alerta quando estoque < 5" },
    { key: "product_restock", name: "Produto abastecido", active: true, desc: "Aviso no canal quando estoque é reposto" },
    { key: "sale_channel", name: "Venda no canal", active: true, desc: "Publicar venda aprovada no canal" },
    { key: "daily_report", name: "Relatório diário", active: false, desc: "Resumo diário para admins às 23:59" },
  ],
  maintenance: {
    enabled: false,
    scope: "all", // all | purchases | miniapp | none
    message: "Estamos realizando uma manutenção. Tente novamente em alguns minutos.",
    allowAdmins: true,
    scheduledAt: "",
  },
  settings: {
    botName: "Larizinha Store",
    botUsername: "larizinhastorebot",
    channelLink: "https://t.me/larizinhastore",
    supportLink: "https://t.me/m/UyHOGg-RZjgx",
    timezone: "America/Sao_Paulo",
    currency: "R$",
    language: "pt-BR",
    minRecarga: 4.0,
    maxRecarga: 1000.0,
    bonusPercent: 10,
    bonusMin: 15.0,
    pixExpiration: 10,
    affiliateCommission: 15,
  },
  permissions: [
    { role: "Proprietário", name: "Administrador Principal", modules: "Todos", color: "purple" },
    { role: "Financeiro", name: "Gestor Financeiro", modules: "PIX, Recargas, Relatórios", color: "green" },
    { role: "Produtos", name: "Gerente Catálogo", modules: "Produtos, Estoque", color: "blue" },
    { role: "Suporte", name: "Atendimento", modules: "Usuários, Tickets", color: "yellow" },
  ],
  logs: [
    { id: 1, action: "Alterou preço", target: "Netflix 4K", admin: "Admin Principal", date: "2026-10-22T14:10:00Z" },
    { id: 2, action: "Abasteceu estoque", target: "Disney+ (+50)", admin: "Admin Principal", date: "2026-10-22T13:42:00Z" },
    { id: 3, action: "Adicionou saldo", target: "Maria Silva · +R$ 20", admin: "Financeiro", date: "2026-10-22T13:20:00Z" },
    { id: 4, action: "Ativou manutenção", target: "Compras", admin: "Admin Principal", date: "2026-10-22T12:55:00Z" },
    { id: 5, action: "Editou mensagem", target: "Boas-vindas", admin: "Marketing", date: "2026-10-22T12:10:00Z" },
  ],
};

/* MOCK API ROUTER */
function mockApi(path, method, body) {
  // Retorna cópias do estado para simular respostas reais
  if (path === "/stats") return JSON.parse(JSON.stringify(MOCK.stats));
  if (path === "/recent") return JSON.parse(JSON.stringify(MOCK.recent));
  if (path === "/messages") return JSON.parse(JSON.stringify(MOCK.messages));
  if (path.startsWith("/messages/") && method === "PUT") {
    const key = path.split("/")[2];
    const idx = MOCK.messages.findIndex(m => m.key === key);
    if (idx >= 0) MOCK.messages[idx] = { ...MOCK.messages[idx], ...body };
    return { ok: true };
  }
  if (path === "/buttons") return JSON.parse(JSON.stringify(MOCK.buttons));
  if (path === "/products") return JSON.parse(JSON.stringify(MOCK.products));
  if (path === "/orders") return JSON.parse(JSON.stringify(MOCK.orders));
  if (path === "/pix") return JSON.parse(JSON.stringify(MOCK.pix));
  if (path === "/users") return JSON.parse(JSON.stringify(MOCK.users));
  if (path === "/gifts") return JSON.parse(JSON.stringify(MOCK.gifts));
  if (path === "/affiliates") return JSON.parse(JSON.stringify(MOCK.affiliates));
  if (path === "/rankings") return JSON.parse(JSON.stringify(MOCK.rankings));
  if (path === "/promos") return JSON.parse(JSON.stringify(MOCK.promos));
  if (path === "/automations") return JSON.parse(JSON.stringify(MOCK.automations));
  if (path === "/maintenance") return JSON.parse(JSON.stringify(MOCK.maintenance));
  if (path === "/settings") return JSON.parse(JSON.stringify(MOCK.settings));
  if (path === "/permissions") return JSON.parse(JSON.stringify(MOCK.permissions));
  if (path === "/logs") return JSON.parse(JSON.stringify(MOCK.logs));
  return { ok: true };
}

/* ===================== ROUTER ===================== */
const ROUTES = {
  "/dashboard": { title: "Dashboard", subtitle: "Visão geral do bot", render: renderDashboard },
  "/bot/menus": { title: "Menus & Fluxos", subtitle: "Editor visual dos fluxos do bot", render: renderBotMenus },
  "/bot/messages": { title: "Mensagens", subtitle: "Editor de mensagens do bot", render: renderBotMessages },
  "/bot/buttons": { title: "Botões Inline", subtitle: "Gerenciador de botões", render: renderBotButtons },
  "/bot/commands": { title: "Comandos", subtitle: "Comandos do bot (/start, /admin, etc.)", render: renderBotCommands },
  "/products": { title: "Produtos", subtitle: "Catálogo de serviços", render: renderProducts },
  "/stock": { title: "Estoque & Credenciais", subtitle: "Itens de entrega automática", render: renderStock },
  "/orders": { title: "Pedidos & Entregas", subtitle: "Histórico de compras", render: renderOrders },
  "/finance": { title: "Financeiro", subtitle: "Recargas, transações, bônus", render: renderFinance },
  "/pix": { title: "PIX & Pagamentos", subtitle: "Monitoramento de pagamentos", render: renderPix },
  "/gifts": { title: "Gift Cards", subtitle: "Códigos e resgates", render: renderGifts },
  "/affiliates": { title: "Afiliados & Pontos", subtitle: "Programa de indicações", render: renderAffiliates },
  "/users": { title: "Usuários", subtitle: "Gerenciamento de clientes", render: renderUsers },
  "/rankings": { title: "Rankings", subtitle: "Top compradores", render: renderRankings },
  "/promos": { title: "Promoções", subtitle: "Campanhas e disparos", render: renderPromos },
  "/automations": { title: "Automações", subtitle: "Notificações automáticas", render: renderAutomations },
  "/support": { title: "Atendimento", subtitle: "Suporte e tickets", render: renderSupport },
  "/maintenance": { title: "Modo Manutenção", subtitle: "Controle global do bot", render: renderMaintenance },
  "/settings": { title: "Configurações", subtitle: "Identidade, valores, integrações", render: renderSettings },
  "/permissions": { title: "Permissões", subtitle: "Funções de administradores", render: renderPermissions },
  "/logs": { title: "Logs & Auditoria", subtitle: "Histórico de ações", render: renderLogs },
};

function getRoute() {
  const hash = window.location.hash.replace(/^#/, "") || "/dashboard";
  return ROUTES[hash] ? hash : "/dashboard";
}

async function navigate() {
  const route = getRoute();
  const cfg = ROUTES[route];
  document.getElementById("pageTitle").textContent = cfg.title;
  document.getElementById("pageSubtitle").textContent = cfg.subtitle;

  // marca nav ativo
  const navKey = route.substring(1).replace("/", "-");
  $$("#sidebarNav .nav-item").forEach(el => {
    el.classList.toggle("active", el.dataset.nav === navKey || (route === "/dashboard" && el.dataset.nav === "dashboard"));
  });

  // fecha sidebar mobile
  document.getElementById("sidebar")?.classList.remove("open");
  document.getElementById("sidebarOverlay")?.classList.add("hidden");

  const main = document.getElementById("mainContent");
  main.innerHTML = `<div class="flex items-center justify-center py-20"><div class="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div></div>`;

  try {
    const html = await cfg.render();
    main.innerHTML = `<div class="fade-in">${html}</div>`;
    if (window.lucide) lucide.createIcons();
    main.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error(err);
    main.innerHTML = `<div class="card text-center py-10"><p class="text-red-400 font-semibold">Erro ao carregar</p><p class="text-sm text-gray-500 mt-1">${esc(err.message)}</p></div>`;
    toast("Erro ao carregar página", "error");
  }
}

window.addEventListener("hashchange", navigate);

/* ===================== RENDER — DASHBOARD ===================== */
async function renderDashboard() {
  const s = await api("/stats");
  const recent = await api("/recent");

  const statCard = (icon, color, label, value, sub) => `
    <div class="card">
      <div class="card-header">
        <span class="card-title">${esc(label)}</span>
        <span class="card-icon" style="background:rgba(${color},0.15);color:rgb(${color})">
          <i data-lucide="${icon}"></i>
        </span>
      </div>
      <div class="card-value">${value}</div>
      ${sub ? `<div class="card-sub">${esc(sub)}</div>` : ""}
    </div>`;

  const bars = [
    { d: "Seg", v: 62 }, { d: "Ter", v: 78 }, { d: "Qua", v: 45 },
    { d: "Qui", v: 91 }, { d: "Sex", v: 84 }, { d: "Sáb", v: 100 }, { d: "Dom", v: 72 },
  ];
  const maxBar = Math.max(...bars.map(b => b.v));

  return `
    <div class="space-y-4">
      <div class="stats-grid">
        ${statCard("users", "59,130,246", "Usuários totais", s.users_total.toLocaleString("pt-BR"), `+${s.users_today} hoje · +${s.users_7d} nos 7d`)}
        ${statCard("shopping-cart", "16,185,129", "Vendas totais", s.sales_total.toLocaleString("pt-BR"), `Faturamento: ${fmtMoney(s.revenue_bruto)}`)}
        ${statCard("wallet", "147,51,234", "Saldo em carteiras", fmtMoney(s.saldo_carteiras), `Recargas: ${fmtMoney(s.recargas_total)}`)}
        ${statCard("qr-code", "234,179,8", "PIX pendentes", s.pix_pendentes, `${s.pix_aprovados} aprovados · ${s.pix_expirados} expirados`)}
        ${statCard("package", "236,72,153", "Estoque disponível", s.estoque_disponivel.toLocaleString("pt-BR"), `${s.esgotados} produto(s) esgotado(s)`)}
        ${statCard("alert-triangle", "239,68,68", "Falhas na entrega", s.falhas_entrega, `${s.reembolsos} reembolso(s)`)}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="card lg:col-span-2">
          <div class="card-header">
            <span class="card-title">Vendas (últimos 7 dias)</span>
            <span class="badge badge-green"><i data-lucide="trending-up"></i>+18.2%</span>
          </div>
          <div class="flex items-end gap-2 h-40 pt-2">
            ${bars.map(b => `
              <div class="flex-1 flex flex-col items-center gap-2">
                <div class="w-full bg-gradient-to-t from-purple-600 to-fuchsia-500 rounded-t" style="height:${(b.v / maxBar) * 100}%;min-height:8px"></div>
                <span class="text-[10px] text-gray-500">${b.d}</span>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">Atividade recente</span>
            <button class="text-xs text-purple-400 hover:text-purple-300 font-semibold" onclick="toast('Logs completos em /logs','info')">Ver logs</button>
          </div>
          <div class="space-y-3">
            ${recent.map(r => `
              <div class="flex items-start gap-2.5">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style="background:rgba(147,51,234,0.15);color:#c084fc">
                  <i data-lucide="${r.icon}" class="w-3.5 h-3.5"></i>
                </div>
                <div class="min-w-0">
                  <p class="text-xs text-gray-300 leading-snug">${esc(r.text)}</p>
                  <p class="text-[10px] text-gray-500 mt-0.5">${esc(r.time)}</p>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <button class="btn btn-primary" onclick="openProductModal()"><i data-lucide="plus"></i>Novo produto</button>
        <button class="btn btn-secondary" onclick="toast('Selecione um produto em Produtos para abastecer','info')"><i data-lucide="package-plus"></i>Abastecer</button>
        <button class="btn btn-secondary" onclick="location.hash='#/promos'"><i data-lucide="megaphone"></i>Promoção</button>
        <button class="btn btn-secondary" onclick="location.hash='#/maintenance'"><i data-lucide="wrench"></i>Manutenção</button>
      </div>
    </div>
  `;
}

/* ===================== RENDER — BOT MENUS ===================== */
async function renderBotMenus() {
  const menus = [
    { key: "channel_lock", name: "Bloqueio de canal obrigatório", icon: "lock" },
    { key: "welcome", name: "Boas-vindas / Menu principal", icon: "home" },
    { key: "catalog", name: "Catálogo de categorias", icon: "layout-grid" },
    { key: "product", name: "Detalhes do produto", icon: "package" },
    { key: "low_balance", name: "Saldo insuficiente", icon: "alert-circle" },
    { key: "pix", name: "Geração e confirmação de PIX", icon: "qr-code" },
    { key: "sale_approved", name: "Venda aprovada / entrega", icon: "check-circle-2" },
    { key: "multi_buy", name: "Compra de múltiplas unidades", icon: "layers" },
    { key: "profile", name: "Meu perfil", icon: "user" },
    { key: "history", name: "Histórico de compras", icon: "receipt" },
    { key: "gift", name: "Resgate de gift card", icon: "gift" },
    { key: "topup", name: "Recarga de saldo", icon: "wallet" },
    { key: "affiliates", name: "Afiliados e troca de pontos", icon: "users-round" },
    { key: "rankings", name: "Rankings", icon: "trophy" },
    { key: "support", name: "Atendimento", icon: "headphones" },
    { key: "search", name: "Pesquisa inline", icon: "search" },
    { key: "promo", name: "Promoções e notificações", icon: "megaphone" },
    { key: "errors", name: "Erros / sucesso / cancelamento", icon: "alert-triangle" },
  ];

  return `
    <div class="space-y-3">
      <div class="card">
        <p class="text-sm text-gray-400">Cada fluxo abaixo controla uma parte real do bot. Ao clicar você edita as mensagens e os botões que aparecem naquele momento.</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        ${menus.map(m => `
          <button class="card text-left hover:border-purple-500/50 transition group" onclick="location.hash='#/bot/messages'; setTimeout(()=>toast('Selecione a mensagem &quot;${esc(m.name)}&quot;','info'),400)">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-300 group-hover:bg-purple-500/25 transition">
                <i data-lucide="${m.icon}"></i>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-white truncate">${esc(m.name)}</p>
                <p class="text-[11px] text-gray-500">${esc(m.key)}</p>
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 text-gray-600"></i>
            </div>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

/* ===================== RENDER — BOT MESSAGES ===================== */
async function renderBotMessages() {
  const messages = await api("/messages");
  return `
    <div class="space-y-3">
      <div class="card">
        <p class="text-sm text-gray-400 mb-2">Editor de mensagens. Use as variáveis dinâmicas clicando nos chips abaixo — elas serão substituídas por dados reais no bot.</p>
        <div class="flex flex-wrap gap-1.5">
          ${["{id}","{nome}","{username}","{saldo}","{produto}","{preco}","{estoque}","{email}","{senha}","{link_acesso}","{valor}","{faltam}","{codigo_pix}","{data}","{pontos}","{novo_saldo}"].map(v => `<button class="var-chip" onclick="toast('Copie ${esc(v)} para a mensagem que está editando','info')">${esc(v)}</button>`).join("")}
        </div>
      </div>
      <div class="space-y-2">
        ${messages.map(m => `
          <div class="card">
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-white">${esc(m.name)}</p>
                <p class="text-[11px] text-gray-500">${esc(m.key)}</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="badge ${m.active ? 'badge-green' : 'badge-gray'}">${m.active ? 'Ativa' : 'Inativa'}</span>
                <button class="topbar-btn" onclick="editMessageModal('${esc(m.key)}')"><i data-lucide="pencil" class="w-4 h-4"></i></button>
              </div>
            </div>
            <pre class="text-xs text-gray-400 whitespace-pre-wrap break-words bg-[#0f0f16] border border-[#222230] rounded-lg p-2.5 max-h-32 overflow-y-auto font-sans">${esc(m.text)}</pre>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

async function editMessageModal(key) {
  const messages = await api("/messages");
  const m = messages.find(x => x.key === key);
  if (!m) return;
  openModal({
    title: `Editar: ${m.name}`,
    body: `
      <div class="form-group">
        <label class="form-label">Nome interno</label>
        <input class="form-input" id="mName" value="${esc(m.name)}" />
      </div>
      <div class="form-group">
        <label class="form-label">Texto da mensagem</label>
        <textarea class="form-textarea" id="mText" style="min-height:220px;font-family:ui-monospace,monospace">${esc(m.text)}</textarea>
        <p class="form-hint">Formatação: HTML ou MarkdownV2 do Telegram. Variáveis entre { } são substituídas pelos dados reais.</p>
      </div>
      <div class="flex items-center gap-2">
        <input type="checkbox" id="mActive" ${m.active ? "checked" : ""} class="w-4 h-4 accent-purple-600" />
        <label for="mActive" class="text-sm text-gray-300">Mensagem ativa</label>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveMessage('${esc(key)}')"><i data-lucide="save"></i>Salvar</button>
    `,
  });
}

async function saveMessage(key) {
  const name = document.getElementById("mName").value.trim();
  const text = document.getElementById("mText").value;
  const active = document.getElementById("mActive").checked;
  if (!name || !text.trim()) { toast("Preencha nome e texto", "error"); return; }
  await api(`/messages/${key}`, { method: "PUT", body: { name, text, active } });
  toast("Mensagem salva com sucesso", "success");
  closeModal();
  navigate();
}
window.editMessageModal = editMessageModal;
window.saveMessage = saveMessage;

/* ===================== RENDER — BOT BUTTONS (GERENCIADOR) ===================== */
async function renderBotButtons() {
  const buttons = await api("/buttons");
  return `
    <div class="space-y-3">
      <div class="card">
        <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div>
            <p class="text-sm text-white font-semibold">Gerenciador de Botões Inline</p>
            <p class="text-xs text-gray-500 mt-0.5">Configure todos os botões do bot. Edições aplicam em tempo real.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="openButtonModal()"><i data-lucide="plus"></i>Novo botão</button>
        </div>
        <div class="btn-preview-grid" style="grid-template-columns:repeat(2,1fr)">
          ${buttons.map(b => `
            <button class="btn-preview" onclick="editButtonModal('${b.id}')">
              ${esc(b.label)}
            </button>
          `).join("")}
        </div>
      </div>

      <div class="table-wrap">
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>Botão</th><th>Tipo</th><th>Ação</th><th>Linha</th><th>Pos.</th><th>Status</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${buttons.map(b => `
                <tr>
                  <td class="font-semibold text-white">${esc(b.label)}</td>
                  <td><span class="badge badge-purple">${esc(b.type)}</span></td>
                  <td class="text-gray-400 max-w-[200px] text-truncate">${esc(b.action)}</td>
                  <td>${b.row}</td>
                  <td>${b.pos}</td>
                  <td><span class="badge ${b.visible ? 'badge-green' : 'badge-gray'}">${b.visible ? 'Visível' : 'Oculto'}</span></td>
                  <td>
                    <div class="flex gap-1">
                      <button class="btn btn-ghost btn-sm" onclick="editButtonModal('${b.id}')" title="Editar"><i data-lucide="pencil"></i></button>
                      <button class="btn btn-ghost btn-sm" onclick="deleteButton('${b.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
                    </div>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

async function openButtonModal(id) {
  const buttons = await api("/buttons");
  const b = id ? buttons.find(x => x.id === id) : { label: "", type: "callback", action: "", row: 1, pos: 1, visible: true, bg: "primary" };
  const types = [
    { v: "callback", label: "Callback (ação interna)" },
    { v: "url", label: "Link (abre URL)" },
    { v: "inline", label: "Inline (pesquisa)" },
    { v: "copy", label: "Copiar texto" },
    { v: "alert", label: "Alerta (pop-up)" },
    { v: "share", label: "Compartilhar" },
    { v: "rules", label: "Regras (termos)" },
    { v: "custom", label: "Comando personalizado" },
    { v: "delete", label: "Apagar mensagem" },
  ];
  openModal({
    title: id ? "Editar botão" : "Novo botão",
    body: `
      <div class="form-group">
        <label class="form-label">Nome / texto do botão</label>
        <input class="form-input" id="btnLabel" value="${esc(b.label)}" placeholder="🛍 Comprar Produtos" />
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div class="form-group">
          <label class="form-label">Tipo de ação</label>
          <select class="form-select" id="btnType">
            ${types.map(t => `<option value="${t.v}" ${b.type === t.v ? "selected" : ""}>${t.label}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Cor</label>
          <select class="form-select" id="btnBg">
            <option value="primary" ${b.bg === "primary" ? "selected" : ""}>Primária (roxo)</option>
            <option value="secondary" ${b.bg === "secondary" ? "selected" : ""}>Secundária</option>
            <option value="green" ${b.bg === "green" ? "selected" : ""}>Verde</option>
            <option value="red" ${b.bg === "red" ? "selected" : ""}>Vermelho</option>
            <option value="transparent" ${b.bg === "transparent" ? "selected" : ""}>Transparente</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Destino / comando</label>
        <input class="form-input" id="btnAction" value="${esc(b.action)}" placeholder="menu:catalog ou https://..." />
        <p class="form-hint">Para callbacks use <code>menu:&lt;nome&gt;</code>. Para links, cole a URL completa.</p>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div class="form-group">
          <label class="form-label">Linha</label>
          <input type="number" class="form-input" id="btnRow" value="${b.row}" min="1" />
        </div>
        <div class="form-group">
          <label class="form-label">Posição na linha</label>
          <input type="number" class="form-input" id="btnPos" value="${b.pos}" min="1" />
        </div>
      </div>
      <div class="flex items-center gap-2">
        <input type="checkbox" id="btnVisible" ${b.visible ? "checked" : ""} class="w-4 h-4 accent-purple-600" />
        <label for="btnVisible" class="text-sm text-gray-300">Visível para o usuário</label>
      </div>
      <div class="mt-4 p-3 bg-[#0f0f16] border border-[#222230] rounded-lg">
        <p class="text-[11px] text-gray-500 mb-2 uppercase font-semibold tracking-wider">Prévia</p>
        <div class="btn-preview" id="btnPreview">${esc(b.label || "Botão exemplo")}</div>
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveButton('${id || ''}')"><i data-lucide="save"></i>Salvar</button>
    `,
    onMount: () => {
      const lbl = document.getElementById("btnLabel");
      const prev = document.getElementById("btnPreview");
      lbl.addEventListener("input", () => prev.textContent = lbl.value || "Botão exemplo");
    },
  });
}

async function saveButton(id) {
  const data = {
    label: document.getElementById("btnLabel").value.trim(),
    type: document.getElementById("btnType").value,
    action: document.getElementById("btnAction").value.trim(),
    bg: document.getElementById("btnBg").value,
    row: parseInt(document.getElementById("btnRow").value) || 1,
    pos: parseInt(document.getElementById("btnPos").value) || 1,
    visible: document.getElementById("btnVisible").checked,
  };
  if (!data.label) { toast("Informe o nome do botão", "error"); return; }
  if (!data.action) { toast("Informe o destino/comando", "error"); return; }

  if (id) {
    const idx = MOCK.buttons.findIndex(x => x.id === id);
    if (idx >= 0) MOCK.buttons[idx] = { ...MOCK.buttons[idx], ...data };
  } else {
    MOCK.buttons.push({ id: uid(), ...data });
  }
  toast("Botão salvo com sucesso", "success");
  closeModal();
  navigate();
}

async function deleteButton(id) {
  if (!(await confirmDialog("Excluir botão?", "Esta ação não pode ser desfeita."))) return;
  MOCK.buttons = MOCK.buttons.filter(x => x.id !== id);
  toast("Botão excluído", "success");
  navigate();
}
window.openButtonModal = openButtonModal;
window.editButtonModal = openButtonModal;
window.saveButton = saveButton;
window.deleteButton = deleteButton;

/* ===================== RENDER — COMANDOS ===================== */
async function renderBotCommands() {
  const cmds = [
    { cmd: "/start", desc: "Inicia o bot / abre o menu", protected: false },
    { cmd: "/cancelar", desc: "Cancela fluxo atual", protected: false },
    { cmd: "/termos", desc: "Mostra os termos de uso", protected: false },
    { cmd: "/suporte", desc: "Abre atendimento", protected: false },
    { cmd: "/perfil", desc: "Mostra o perfil", protected: false },
    { cmd: "/saldo", desc: "Consulta saldo", protected: false },
    { cmd: "/compras", desc: "Histórico de compras", protected: false },
    { cmd: "/admin", desc: "Acesso administrativo", protected: true },
  ];
  return `
    <div class="table-wrap">
      <div class="table-scroll">
        <table class="data-table">
          <thead><tr><th>Comando</th><th>Descrição</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            ${cmds.map(c => `
              <tr>
                <td class="font-mono text-purple-300">${esc(c.cmd)}</td>
                <td class="text-gray-300">${esc(c.desc)}</td>
                <td>${c.protected ? '<span class="badge badge-yellow">Protegido</span>' : '<span class="badge badge-green">Ativo</span>'}</td>
                <td><button class="btn btn-ghost btn-sm" onclick="toast('Editor de comandos em breve','info')"><i data-lucide="pencil"></i></button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ===================== RENDER — PRODUTOS ===================== */
async function renderProducts() {
  const products = await api("/products");
  return `
    <div class="space-y-3">
      <div class="flex justify-end">
        <button class="btn btn-primary btn-sm" onclick="openProductModal()"><i data-lucide="plus"></i>Novo produto</button>
      </div>
      <div class="table-wrap">
        <div class="table-scroll">
          <table class="data-table">
            <thead><tr><th>Produto</th><th>Preço</th><th>Estoque</th><th>Vendidos</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td>
                    <div class="font-semibold text-white">${esc(p.name)}</div>
                    <div class="text-[11px] text-gray-500">${esc(p.category)}</div>
                  </td>
                  <td class="text-green-400 font-semibold">${fmtMoney(p.price)}</td>
                  <td>${p.stock <= 5 && p.stock > 0 ? `<span class="badge badge-yellow">${p.stock} un.</span>` : p.stock === 0 ? '<span class="badge badge-red">Esgotado</span>' : `${p.stock} un.`}</td>
                  <td>${p.sold}</td>
                  <td><span class="badge ${p.active ? 'badge-green' : 'badge-gray'}">${p.active ? 'Ativo' : 'Pausado'}</span></td>
                  <td><button class="btn btn-ghost btn-sm" onclick="toast('Editar em breve','info')"><i data-lucide="pencil"></i></button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function openProductModal() {
  openModal({
    title: "Novo produto",
    body: `
      <div class="form-group"><label class="form-label">Nome</label><input class="form-input" id="pName" placeholder="Netflix 4K Premium" /></div>
      <div class="grid grid-cols-2 gap-2">
        <div class="form-group"><label class="form-label">Preço (R$)</label><input type="number" step="0.01" class="form-input" id="pPrice" placeholder="18.00" /></div>
        <div class="form-group"><label class="form-label">Categoria</label><input class="form-input" id="pCat" placeholder="Streaming" /></div>
      </div>
      <div class="form-group"><label class="form-label">Descrição</label><textarea class="form-textarea" id="pDesc" placeholder="Tela Netflix | Plano Premium 4K..."></textarea></div>
      <div class="form-group"><label class="form-label">Estoque inicial</label><input type="number" class="form-input" id="pStock" value="0" /></div>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveProduct()"><i data-lucide="save"></i>Salvar</button>
    `,
  });
}

function saveProduct() {
  const name = document.getElementById("pName").value.trim();
  const price = parseFloat(document.getElementById("pPrice").value);
  const cat = document.getElementById("pCat").value.trim() || "Geral";
  const stock = parseInt(document.getElementById("pStock").value) || 0;
  if (!name || !price) { toast("Preencha nome e preço", "error"); return; }
  MOCK.products.push({ id: Date.now(), name, price, stock, sold: 0, active: true, category: cat });
  toast("Produto criado", "success");
  closeModal();
  navigate();
}
window.openProductModal = openProductModal;
window.saveProduct = saveProduct;

/* ===================== RENDER — ESTOQUE ===================== */
async function renderStock() {
  const products = await api("/products");
  return `
    <div class="space-y-3">
      <div class="card">
        <p class="text-sm text-gray-400">Abasteça credenciais em lote. Cada linha vira um item entregue automaticamente após a compra.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        ${products.map(p => `
          <div class="card">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-semibold text-white">${esc(p.name)}</p>
              <span class="badge ${p.stock > 5 ? 'badge-green' : 'badge-yellow'}">${p.stock} un.</span>
            </div>
            <textarea class="form-textarea" style="min-height:80px" placeholder="email1@x.com|senha1&#10;email2@x.com|senha2"></textarea>
            <button class="btn btn-primary btn-sm btn-block mt-2" onclick="toast('Estoque abastecido (mock)','success')"><i data-lucide="upload"></i>Abastecer</button>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

/* ===================== RENDER — PEDIDOS ===================== */
async function renderOrders() {
  const orders = await api("/orders");
  const statusBadge = { entregue: "badge-green", aprovado: "badge-blue", erro: "badge-red", cancelado: "badge-gray" };
  return `
    <div class="table-wrap">
      <div class="table-scroll">
        <table class="data-table">
          <thead><tr><th>ID</th><th>Cliente</th><th>Produto</th><th>Valor</th><th>Data</th><th>Status</th></tr></thead>
          <tbody>
            ${orders.map(o => `
              <tr>
                <td class="font-mono text-purple-300">${esc(o.id)}</td>
                <td>${esc(o.user)}</td>
                <td>${esc(o.product)}</td>
                <td class="text-green-400 font-semibold">${fmtMoney(o.value)}</td>
                <td class="text-gray-400">${fmtDate(o.date)}</td>
                <td><span class="badge ${statusBadge[o.status] || 'badge-gray'}">${esc(o.status)}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ===================== RENDER — FINANCEIRO ===================== */
async function renderFinance() {
  const s = await api("/stats");
  return `
    <div class="space-y-3">
      <div class="stats-grid">
        <div class="card"><div class="card-header"><span class="card-title">Faturamento bruto</span><span class="card-icon" style="background:rgba(16,185,129,0.15);color:#10b981"><i data-lucide="trending-up"></i></span></div><div class="card-value">${fmtMoney(s.revenue_bruto)}</div></div>
        <div class="card"><div class="card-header"><span class="card-title">Recargas totais</span><span class="card-icon" style="background:rgba(59,130,246,0.15);color:#3b82f6"><i data-lucide="wallet"></i></span></div><div class="card-value">${fmtMoney(s.recargas_total)}</div></div>
        <div class="card"><div class="card-header"><span class="card-title">Bônus concedidos</span><span class="card-icon" style="background:rgba(234,179,8,0.15);color:#eab308"><i data-lucide="gift"></i></span></div><div class="card-value">${fmtMoney(s.bonus_total)}</div></div>
        <div class="card"><div class="card-header"><span class="card-title">Saldo em carteiras</span><span class="card-icon" style="background:rgba(147,51,234,0.15);color:#a855f7"><i data-lucide="circle-dollar-sign"></i></span></div><div class="card-value">${fmtMoney(s.saldo_carteiras)}</div></div>
      </div>
      <div class="card">
        <p class="text-sm text-gray-400">Relatórios detalhados, exportações e reconciliação PIX estarão disponíveis após conectar o backend real.</p>
      </div>
    </div>
  `;
}

/* ===================== RENDER — PIX ===================== */
async function renderPix() {
  const pix = await api("/pix");
  const badges = { aprovado: "badge-green", pendente: "badge-yellow", expirado: "badge-gray", cancelado: "badge-red" };
  return `
    <div class="table-wrap">
      <div class="table-scroll">
        <table class="data-table">
          <thead><tr><th>ID</th><th>Usuário</th><th>Valor</th><th>Status</th><th>Criado</th></tr></thead>
          <tbody>
            ${pix.map(p => `
              <tr>
                <td class="font-mono text-purple-300">${esc(p.id)}</td>
                <td>${esc(p.user)}</td>
                <td class="text-green-400 font-semibold">${fmtMoney(p.value)}</td>
                <td><span class="badge ${badges[p.status] || 'badge-gray'}">${esc(p.status)}</span></td>
                <td class="text-gray-400">${fmtDate(p.created)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ===================== RENDER — GIFT CARDS ===================== */
async function renderGifts() {
  const gifts = await api("/gifts");
  return `
    <div class="space-y-3">
      <div class="flex justify-end">
        <button class="btn btn-primary btn-sm" onclick="toast('Gerar em lote em breve','info')"><i data-lucide="plus"></i>Gerar gift card</button>
      </div>
      <div class="table-wrap">
        <div class="table-scroll">
          <table class="data-table">
            <thead><tr><th>Código</th><th>Valor</th><th>Produto</th><th>Status</th><th>Criado</th></tr></thead>
            <tbody>
              ${gifts.map(g => `
                <tr>
                  <td class="font-mono text-purple-300">${esc(g.code)}</td>
                  <td>${g.value > 0 ? fmtMoney(g.value) : "—"}</td>
                  <td>${esc(g.product || "—")}</td>
                  <td><span class="badge ${g.used ? 'badge-gray' : 'badge-green'}">${g.used ? 'Resgatado' : 'Disponível'}</span></td>
                  <td class="text-gray-400">${fmtDate(g.created)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/* ===================== RENDER — AFILIADOS ===================== */
async function renderAffiliates() {
  const aff = await api("/affiliates");
  return `
    <div class="space-y-3">
      <div class="card">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p class="text-sm text-white font-semibold">Programa de Afiliados</p>
            <p class="text-xs text-gray-500 mt-0.5">Comissão atual: 15% de recargas dos indicados</p>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="toast('Editor de comissões em breve','info')"><i data-lucide="settings"></i>Configurar</button>
        </div>
      </div>
      <div class="table-wrap">
        <div class="table-scroll">
          <table class="data-table">
            <thead><tr><th>Usuário</th><th>Indicações</th><th>Comissão ganha</th><th>Nível</th><th>Status</th></tr></thead>
            <tbody>
              ${aff.map(a => `
                <tr>
                  <td class="font-semibold text-white">${esc(a.user)}</td>
                  <td>${a.indicacoes}</td>
                  <td class="text-green-400 font-semibold">${fmtMoney(a.comissao_ganha)}</td>
                  <td><span class="badge badge-yellow">${esc(a.nivel)}</span></td>
                  <td><span class="badge ${a.ativo ? 'badge-green' : 'badge-gray'}">${a.ativo ? 'Ativo' : 'Inativo'}</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/* ===================== RENDER — USUÁRIOS ===================== */
async function renderUsers() {
  const users = await api("/users");
  return `
    <div class="space-y-3">
      <div class="card">
        <div class="flex gap-2">
          <input class="form-input flex-1" placeholder="Buscar por nome, ID ou @username..." oninput="filterTable(this,'usersTable')" />
          <button class="btn btn-secondary btn-sm" onclick="toast('Exportar em breve','info')"><i data-lucide="download"></i>Exportar</button>
        </div>
      </div>
      <div class="table-wrap" id="usersTable">
        <div class="table-scroll">
          <table class="data-table">
            <thead><tr><th>ID</th><th>Nome</th><th>@</th><th>Saldo</th><th>Compras</th><th>WhatsApp</th><th>Ações</th></tr></thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td class="font-mono text-purple-300">${u.id}</td>
                  <td class="text-white font-semibold">${esc(u.name)}</td>
                  <td class="text-gray-400">@${esc(u.username)}</td>
                  <td class="text-green-400 font-semibold">${fmtMoney(u.saldo)}</td>
                  <td>${u.compras}</td>
                  <td class="text-gray-400">${u.whatsapp ? esc(u.whatsapp) : "—"}</td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="editUserModal(${u.id})"><i data-lucide="pencil"></i></button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

async function editUserModal(id) {
  const users = await api("/users");
  const u = users.find(x => x.id === id);
  if (!u) return;
  openModal({
    title: `Editar usuário #${u.id}`,
    body: `
      <div class="space-y-2 text-sm">
        <p><span class="text-gray-500">Nome:</span> <span class="text-white font-semibold">${esc(u.name)}</span></p>
        <p><span class="text-gray-500">Username:</span> @${esc(u.username)}</p>
        <p><span class="text-gray-500">Saldo atual:</span> <span class="text-green-400">${fmtMoney(u.saldo)}</span></p>
        <p><span class="text-gray-500">Compras:</span> ${u.compras}</p>
      </div>
      <div class="divider"></div>
      <div class="form-group">
        <label class="form-label">Ajustar saldo (R$)</label>
        <input type="number" step="0.01" class="form-input" id="uSaldoAdj" placeholder="20.00 (positivo adiciona, negativo remove)" />
        <p class="form-hint">Operação registrada no log de auditoria.</p>
      </div>
      <div class="form-group">
        <label class="form-label">Motivo do ajuste</label>
        <input class="form-input" id="uSaldoReason" placeholder="Ex.: bônus manual" />
      </div>
    `,
    footer: `
      <button class="btn btn-danger" onclick="closeModal();toast('Usuário bloqueado (mock)','success')"><i data-lucide="ban"></i>Bloquear</button>
      <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="closeModal();toast('Ajuste aplicado (mock)','success')"><i data-lucide="save"></i>Aplicar</button>
    `,
  });
}
window.editUserModal = editUserModal;

/* ===================== RENDER — RANKINGS ===================== */
async function renderRankings() {
  const r = await api("/rankings");
  const medals = ["🥇", "🥈", "🥉"];
  return `
    <div class="space-y-3">
      <div class="tabs">
        <button class="tab active">Serviços</button>
        <button class="tab" onclick="toast('Ranking de recargas (mock)','info')">Recargas</button>
        <button class="tab" onclick="toast('Ranking de saldo (mock)','info')">Saldo</button>
        <button class="tab" onclick="toast('Ranking de gift (mock)','info')">Gift Card</button>
      </div>
      <div class="card">
        <p class="text-sm font-semibold text-white mb-3">🏆 Serviços mais vendidos (este mês)</p>
        <div class="space-y-2">
          ${r.services.map(s => `
            <div class="flex items-center gap-3 py-2 border-b border-[#1a1a24] last:border-0">
              <span class="text-2xl">${medals[s.pos - 1] || `${s.pos}°`}</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-white font-semibold truncate">${esc(s.name)}</p>
                <p class="text-[11px] text-gray-500">${s.orders} pedidos</p>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

/* ===================== RENDER — PROMOÇÕES ===================== */
async function renderPromos() {
  const promos = await api("/promos");
  return `
    <div class="space-y-3">
      <div class="flex justify-end">
        <button class="btn btn-primary btn-sm" onclick="toast('Criar promoção em breve','info')"><i data-lucide="plus"></i>Nova promoção</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        ${promos.map(p => `
          <div class="card">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-semibold text-white">${esc(p.title)}</p>
              <span class="badge ${p.status === 'ativa' ? 'badge-green' : 'badge-yellow'}">${esc(p.status)}</span>
            </div>
            <p class="text-xs text-gray-400">${esc(p.product)} · ${fmtMoney(p.price)}</p>
            <p class="text-[11px] text-gray-500 mt-1">${fmtDate(p.date)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

/* ===================== RENDER — AUTOMAÇÕES ===================== */
async function renderAutomations() {
  const autos = await api("/automations");
  return `
    <div class="space-y-2">
      ${autos.map(a => `
        <div class="card flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-white">${esc(a.name)}</p>
            <p class="text-xs text-gray-500 mt-0.5">${esc(a.desc)}</p>
          </div>
          <label class="switch">
            <input type="checkbox" ${a.active ? "checked" : ""} onchange="toast('${esc(a.name)} ' + (this.checked ? 'ativada' : 'desativada'), 'success')" />
            <span class="slider"></span>
          </label>
        </div>
      `).join("")}
    </div>
  `;
}

/* ===================== RENDER — SUPORTE ===================== */
async function renderSupport() {
  return `
    <div class="space-y-3">
      <div class="card">
        <div class="form-group">
          <label class="form-label">Link do atendimento</label>
          <input class="form-input" value="https://t.me/m/UyHOGg-RZjgx" />
        </div>
        <div class="form-group">
          <label class="form-label">Mensagem de suporte</label>
          <textarea class="form-textarea">Precisa de ajuda? Clique no botão abaixo para falar com um atendente.</textarea>
        </div>
        <button class="btn btn-primary" onclick="toast('Configuração de atendimento salva','success')"><i data-lucide="save"></i>Salvar</button>
      </div>
      <div class="card">
        <p class="text-sm text-gray-400">O sistema de tickets aparecerá aqui quando integrado ao backend real.</p>
      </div>
    </div>
  `;
}

/* ===================== RENDER — MANUTENÇÃO ===================== */
async function renderMaintenance() {
  const m = await api("/maintenance");
  return `
    <div class="space-y-3">
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-sm font-semibold text-white">Modo de manutenção</p>
            <p class="text-xs text-gray-500 mt-0.5">Controle global de acesso e operações</p>
          </div>
          <label class="switch">
            <input type="checkbox" id="maintEnabled" ${m.enabled ? "checked" : ""} onchange="toggleMaintenance(this.checked)" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="form-group">
          <label class="form-label">Tipo de manutenção</label>
          <select class="form-select" id="maintScope">
            <option value="all" ${m.scope === "all" ? "selected" : ""}>Bloquear o bot inteiro</option>
            <option value="purchases" ${m.scope === "purchases" ? "selected" : ""}>Bloquear compras e pagamentos</option>
            <option value="miniapp" ${m.scope === "miniapp" ? "selected" : ""}>Bloquear apenas Mini App</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Mensagem exibida aos usuários</label>
          <textarea class="form-textarea" id="maintMsg">${esc(m.message)}</textarea>
        </div>

        <div class="flex items-center gap-2 mb-4">
          <input type="checkbox" id="maintAdmins" ${m.allowAdmins ? "checked" : ""} class="w-4 h-4 accent-purple-600" />
          <label for="maintAdmins" class="text-sm text-gray-300">Permitir que administradores acessem</label>
        </div>

        <div class="p-3 bg-[#0f0f16] border border-[#222230] rounded-lg">
          <p class="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Resumo</p>
          <div class="space-y-1 text-xs text-gray-300">
            <p>Estado: <span class="font-semibold ${m.enabled ? 'text-red-400' : 'text-green-400'}">${m.enabled ? 'Em manutenção' : 'Bot em operação normal'}</span></p>
            <p>Escopo: <span class="text-white">${m.scope === "all" ? "Bot inteiro" : m.scope === "purchases" ? "Compras" : "Mini App"}</span></p>
            <p>Acesso administrativo: <span class="text-white">${m.allowAdmins ? "Permitido" : "Bloqueado"}</span></p>
          </div>
        </div>

        <button class="btn btn-primary btn-block mt-3" onclick="saveMaintenance()"><i data-lucide="save"></i>Salvar configuração</button>
      </div>
    </div>
  `;
}

function toggleMaintenance(v) {
  MOCK.maintenance.enabled = v;
  toast(v ? "Manutenção ativada" : "Manutenção desativada", v ? "info" : "success");
  navigate();
}
function saveMaintenance() {
  MOCK.maintenance.scope = document.getElementById("maintScope").value;
  MOCK.maintenance.message = document.getElementById("maintMsg").value;
  MOCK.maintenance.allowAdmins = document.getElementById("maintAdmins").checked;
  toast("Configuração salva", "success");
}
window.toggleMaintenance = toggleMaintenance;
window.saveMaintenance = saveMaintenance;

/* ===================== RENDER — CONFIGURAÇÕES ===================== */
async function renderSettings() {
  const s = await api("/settings");
  return `
    <div class="space-y-3">
      <div class="card">
        <p class="text-sm font-semibold text-white mb-3">Identidade do bot</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div class="form-group"><label class="form-label">Nome do bot</label><input class="form-input" value="${esc(s.botName)}" /></div>
          <div class="form-group"><label class="form-label">@username</label><input class="form-input" value="${esc(s.botUsername)}" /></div>
          <div class="form-group"><label class="form-label">Link do canal</label><input class="form-input" value="${esc(s.channelLink)}" /></div>
          <div class="form-group"><label class="form-label">Link de suporte</label><input class="form-input" value="${esc(s.supportLink)}" /></div>
        </div>
      </div>
      <div class="card">
        <p class="text-sm font-semibold text-white mb-3">Recargas & PIX</p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div class="form-group"><label class="form-label">Recarga mín.</label><input type="number" class="form-input" value="${s.minRecarga}" /></div>
          <div class="form-group"><label class="form-label">Recarga máx.</label><input type="number" class="form-input" value="${s.maxRecarga}" /></div>
          <div class="form-group"><label class="form-label">Bônus %</label><input type="number" class="form-input" value="${s.bonusPercent}" /></div>
          <div class="form-group"><label class="form-label">Bônus mín. R$</label><input type="number" class="form-input" value="${s.bonusMin}" /></div>
        </div>
      </div>
      <div class="card">
        <p class="text-sm font-semibold text-white mb-3">Região & formato</p>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div class="form-group"><label class="form-label">Fuso horário</label><input class="form-input" value="${esc(s.timezone)}" /></div>
          <div class="form-group"><label class="form-label">Moeda</label><input class="form-input" value="${esc(s.currency)}" /></div>
          <div class="form-group"><label class="form-label">Idioma</label><input class="form-input" value="${esc(s.language)}" /></div>
        </div>
      </div>
      <button class="btn btn-primary btn-block" onclick="toast('Configurações salvas','success')"><i data-lucide="save"></i>Salvar tudo</button>
    </div>
  `;
}

/* ===================== RENDER — PERMISSÕES ===================== */
async function renderPermissions() {
  const perms = await api("/permissions");
  return `
    <div class="space-y-2">
      ${perms.map(p => `
        <div class="card flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-${p.color}-500/15 flex items-center justify-center text-${p.color}-300">
            <i data-lucide="shield"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-white">${esc(p.role)}</p>
            <p class="text-xs text-gray-500">${esc(p.name)} · ${esc(p.modules)}</p>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="toast('Edição de permissões em breve','info')"><i data-lucide="pencil"></i></button>
        </div>
      `).join("")}
    </div>
  `;
}

/* ===================== RENDER — LOGS ===================== */
async function renderLogs() {
  const logs = await api("/logs");
  return `
    <div class="table-wrap">
      <div class="table-scroll">
        <table class="data-table">
          <thead><tr><th>Ação</th><th>Alvo</th><th>Admin</th><th>Data</th></tr></thead>
          <tbody>
            ${logs.map(l => `
              <tr>
                <td class="text-white font-semibold">${esc(l.action)}</td>
                <td class="text-gray-300">${esc(l.target)}</td>
                <td class="text-purple-300">${esc(l.admin)}</td>
                <td class="text-gray-400">${fmtDate(l.date)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ===================== UTILS DE UI ===================== */
function filterTable(input, tableId) {
  const q = input.value.toLowerCase();
  $$(`#${tableId} tbody tr`).forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(q) ? "" : "none";
  });
}
window.filterTable = filterTable;

function refreshView() {
  toast("Atualizando...", "info", 1200);
  navigate();
}
window.refreshView = refreshView;

function logout() {
  if (tg?.close) tg.close();
  else { toast("Sessão encerrada", "success"); setTimeout(() => location.reload(), 800); }
}
window.logout = logout;

/* ===================== SIDEBAR MOBILE ===================== */
function initSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const openBtn = document.getElementById("openSidebarBtn");
  const closeBtn = document.getElementById("closeSidebarBtn");

  const open = () => { sidebar.classList.add("open"); overlay.classList.remove("hidden"); };
  const close = () => { sidebar.classList.remove("open"); overlay.classList.add("hidden"); };

  openBtn?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  overlay?.addEventListener("click", close);
}

/* ===================== FAB ===================== */
function initFab() {
  const fab = document.getElementById("fab");
  fab?.addEventListener("click", () => {
    // menu de ações rápidas
    openModal({
      title: "Ações rápidas",
      body: `
        <div class="grid grid-cols-2 gap-2">
          <button class="btn btn-secondary" style="height:auto;padding:1rem" onclick="closeModal();openProductModal()">
            <div class="flex flex-col items-center gap-1"><i data-lucide="package-plus" class="w-5 h-5"></i><span class="text-xs">Novo produto</span></div>
          </button>
          <button class="btn btn-secondary" style="height:auto;padding:1rem" onclick="closeModal();location.hash='#/promos'">
            <div class="flex flex-col items-center gap-1"><i data-lucide="megaphone" class="w-5 h-5"></i><span class="text-xs">Promoção</span></div>
          </button>
          <button class="btn btn-secondary" style="height:auto;padding:1rem" onclick="closeModal();location.hash='#/maintenance'">
            <div class="flex flex-col items-center gap-1"><i data-lucide="wrench" class="w-5 h-5"></i><span class="text-xs">Manutenção</span></div>
          </button>
          <button class="btn btn-secondary" style="height:auto;padding:1rem" onclick="closeModal();location.hash='#/dashboard'">
            <div class="flex flex-col items-center gap-1"><i data-lucide="home" class="w-5 h-5"></i><span class="text-xs">Dashboard</span></div>
          </button>
        </div>
      `,
    });
  });
}

/* ===================== INICIALIZAÇÃO ===================== */
(function boot() {
  initTelegram();
  initSidebar();
  initFab();
  if (window.lucide) lucide.createIcons();
  if (!window.location.hash) window.location.hash = "#/dashboard";
  navigate();
  console.log("%c ADMIN BELLAMY ", "background:#9333ea;color:#fff;font-weight:bold;padding:4px 8px;border-radius:4px", "pronto · mock:", APP.mockMode);
})();
