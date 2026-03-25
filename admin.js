/* ═══════════════════════════════════════════════
   HARSH PACKAGING — Admin Panel Script
   admin.js
═══════════════════════════════════════════════ */

// ── ADMIN CONFIG ─────────────────────────────────
const ADMIN = {
  USERNAME: 'admin',
  PASSWORD: 'harsh@admin',   // ← Change this password
};

// ── STORAGE ──────────────────────────────────────
const AdminDB = {
  getProducts() { return JSON.parse(localStorage.getItem('hp_products') || '[]'); },
  saveProducts(p) { localStorage.setItem('hp_products', JSON.stringify(p)); },
  getOrders()  { return JSON.parse(localStorage.getItem('hp_orders') || '[]'); },
  isLoggedIn() { return sessionStorage.getItem('hp_admin_auth') === 'true'; },
  login()      { sessionStorage.setItem('hp_admin_auth', 'true'); },
  logout()     { sessionStorage.removeItem('hp_admin_auth'); },
};

// ── AUTH ─────────────────────────────────────────
function checkAuth() {
  const loginPage   = document.getElementById('login-page');
  const adminPanel  = document.getElementById('admin-panel');

  if (AdminDB.isLoggedIn()) {
    loginPage.style.display  = 'none';
    adminPanel.style.display = 'block';
    loadDashboard();
  } else {
    loginPage.style.display  = 'flex';
    adminPanel.style.display = 'none';
  }
}

function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const err  = document.getElementById('login-error');

  if (user === ADMIN.USERNAME && pass === ADMIN.PASSWORD) {
    AdminDB.login();
    err.style.display = 'none';
    checkAuth();
  } else {
    err.style.display = 'block';
    err.textContent   = '❌ Invalid username or password.';
  }
}

function handleLogout() {
  AdminDB.logout();
  checkAuth();
}

// ── DASHBOARD LOAD ───────────────────────────────
function loadDashboard() {
  updateStats();
  renderAdminProducts();
  renderOrdersTable();
}

function updateStats() {
  const products = AdminDB.getProducts();
  const orders   = AdminDB.getOrders();
  const totalQty = orders.reduce((sum, o) => sum + (o.qty || 0), 0);

  setText('stat-products', products.length);
  setText('stat-orders',   orders.length);
  setText('stat-qty',      totalQty.toLocaleString());
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── TABS ─────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
  document.getElementById(`tab-${tab}`)?.classList.add('active');
}

// ── PRODUCTS ADMIN ───────────────────────────────
function renderAdminProducts() {
  const list     = document.getElementById('admin-products-list');
  const products = AdminDB.getProducts();

  if (products.length === 0) {
    list.innerHTML = `<div class="empty-state">No products yet. Click "Add Product" to get started.</div>`;
    return;
  }

  list.innerHTML = products.map(p => `
    <div class="admin-product-row" id="arow-${p.id}">
      <div class="ap-thumb">
        ${p.image
          ? `<img src="${p.image}" alt="${p.name}">`
          : `<div class="ap-color-swatch" style="background:linear-gradient(135deg,${p.colorA},${p.colorB})"></div>`
        }
      </div>
      <div class="ap-info">
        <div class="ap-name">${p.name}</div>
        <div class="ap-desc">${p.description.substring(0, 80)}…</div>
        <div class="ap-tags">${p.tags.map(t=>`<span class="admin-tag">${t}</span>`).join('')}</div>
      </div>
      <div class="ap-actions">
        <button class="adm-btn adm-btn-edit" onclick="openProductForm('${p.id}')">✏️ Edit</button>
        <button class="adm-btn adm-btn-del"  onclick="deleteProduct('${p.id}')">🗑 Delete</button>
      </div>
    </div>
  `).join('');
}

// ── PRODUCT FORM ─────────────────────────────────
function openProductForm(editId = null) {
  const form     = document.getElementById('product-form-overlay');
  const title    = document.getElementById('pf-title');
  const products = AdminDB.getProducts();

  clearProductForm();

  if (editId) {
    const p = products.find(x => x.id === editId);
    if (!p) return;
    document.getElementById('pf-id').value          = p.id;
    document.getElementById('pf-name').value        = p.name;
    document.getElementById('pf-desc').value        = p.description;
    document.getElementById('pf-tags').value        = p.tags.join(', ');
    document.getElementById('pf-shape').value       = p.shape;
    document.getElementById('pf-colora').value      = p.colorA;
    document.getElementById('pf-colorb').value      = p.colorB;
    document.getElementById('pf-img-preview').src   = p.image || '';
    document.getElementById('pf-img-preview').style.display = p.image ? 'block' : 'none';
    document.getElementById('pf-current-img').value = p.image || '';
    title.textContent = 'Edit Product';
  } else {
    document.getElementById('pf-id').value = 'p' + Date.now();
    title.textContent = 'Add New Product';
  }

  form.classList.add('open');
}

function closeProductForm() {
  document.getElementById('product-form-overlay').classList.remove('open');
}

function clearProductForm() {
  ['pf-name','pf-desc','pf-tags'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('pf-shape').value       = 'flat';
  document.getElementById('pf-colora').value      = '#C8935A';
  document.getElementById('pf-colorb').value      = '#E07B39';
  document.getElementById('pf-img-preview').style.display = 'none';
  document.getElementById('pf-current-img').value = '';
  document.getElementById('pf-image').value       = '';
}

function handleImageUpload(input) {
  const file    = input.files[0];
  const preview = document.getElementById('pf-img-preview');
  const stored  = document.getElementById('pf-current-img');

  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    showAdminToast('Image too large. Max 2MB.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;
    stored.value           = dataUrl;
    preview.src            = dataUrl;
    preview.style.display  = 'block';
  };
  reader.readAsDataURL(file);
}

function saveProduct(e) {
  e.preventDefault();

  const id    = document.getElementById('pf-id').value;
  const name  = document.getElementById('pf-name').value.trim();
  const desc  = document.getElementById('pf-desc').value.trim();
  const tags  = document.getElementById('pf-tags').value.split(',').map(t=>t.trim()).filter(Boolean);
  const shape = document.getElementById('pf-shape').value;
  const colorA = document.getElementById('pf-colora').value;
  const colorB = document.getElementById('pf-colorb').value;
  const image  = document.getElementById('pf-current-img').value;

  if (!name || !desc) {
    showAdminToast('Name and description are required.', 'error');
    return;
  }

  const products = AdminDB.getProducts();
  const existing = products.findIndex(p => p.id === id);
  const product  = { id, name, description: desc, tags: tags.length ? tags : ['Food Grade'], shape, colorA, colorB, image };

  if (existing >= 0) products[existing] = product;
  else products.push(product);

  AdminDB.saveProducts(products);
  closeProductForm();
  loadDashboard();
  showAdminToast(`Product "${name}" saved successfully!`, 'success');
}

function deleteProduct(id) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  const products = AdminDB.getProducts().filter(p => p.id !== id);
  AdminDB.saveProducts(products);
  loadDashboard();
  showAdminToast('Product deleted.', 'info');
}

// ── ORDERS TABLE ─────────────────────────────────
function renderOrdersTable() {
  const tbody  = document.getElementById('orders-tbody');
  const orders = AdminDB.getOrders();

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">No orders yet. Orders will appear here after customers submit via WhatsApp.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map((o, i) => `
    <tr>
      <td class="order-num">#${orders.length - i}</td>
      <td>${escapeHtml(o.customerName || '—')}</td>
      <td>${escapeHtml(o.productName  || '—')}</td>
      <td><strong>${o.qty || 0}</strong> boxes</td>
      <td>${escapeHtml(o.note || '—')}</td>
      <td class="order-time">${formatDate(o.timestamp)}</td>
    </tr>
  `).join('');
}

function clearOrders() {
  if (!confirm('Clear ALL order history? This cannot be undone.')) return;
  localStorage.setItem('hp_orders', '[]');
  loadDashboard();
  showAdminToast('All orders cleared.', 'info');
}

function exportOrders() {
  const orders = AdminDB.getOrders();
  if (!orders.length) { showAdminToast('No orders to export.', 'info'); return; }

  const header = ['#','Customer','Product','Qty','Note','Date'];
  const rows   = orders.map((o,i) => [
    orders.length - i,
    o.customerName || '',
    o.productName  || '',
    o.qty || 0,
    o.note || '',
    formatDate(o.timestamp),
  ]);

  const csv = [header, ...rows].map(r => r.map(c=>`"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `harsh-packaging-orders-${Date.now()}.csv`;
  a.click(); URL.revokeObjectURL(url);
  showAdminToast('Orders exported as CSV!', 'success');
}

// ── SEARCH / FILTER ORDERS ───────────────────────
function filterOrders(query) {
  const q = query.toLowerCase();
  const orders = AdminDB.getOrders();
  const filtered = orders.filter(o =>
    (o.customerName||'').toLowerCase().includes(q) ||
    (o.productName||'').toLowerCase().includes(q)
  );

  const tbody = document.getElementById('orders-tbody');
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">No matching orders found.</td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map((o, i) => `
    <tr>
      <td class="order-num">#${i+1}</td>
      <td>${escapeHtml(o.customerName||'—')}</td>
      <td>${escapeHtml(o.productName||'—')}</td>
      <td><strong>${o.qty||0}</strong> boxes</td>
      <td>${escapeHtml(o.note||'—')}</td>
      <td class="order-time">${formatDate(o.timestamp)}</td>
    </tr>
  `).join('');
}

// ── SETTINGS ─────────────────────────────────────
function saveSettings(e) {
  e.preventDefault();
  const waNum = document.getElementById('set-wa').value.trim();
  const moq   = parseInt(document.getElementById('set-moq').value);

  if (!waNum) { showAdminToast('WhatsApp number is required.', 'error'); return; }
  if (!moq || moq < 1) { showAdminToast('MOQ must be at least 1.', 'error'); return; }

  localStorage.setItem('hp_wa_number', waNum);
  localStorage.setItem('hp_moq', moq);
  showAdminToast('Settings saved! Update script.js manually for permanent changes.', 'success');
}

function loadSettings() {
  const waEl  = document.getElementById('set-wa');
  const moqEl = document.getElementById('set-moq');
  if (waEl)  waEl.value  = localStorage.getItem('hp_wa_number') || '91XXXXXXXXXX';
  if (moqEl) moqEl.value = localStorage.getItem('hp_moq') || '100';
}

// ── ADMIN TOAST ──────────────────────────────────
function showAdminToast(msg, type = 'info') {
  const container = document.getElementById('admin-toast');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastOut 0.4s ease forwards';
    setTimeout(() => el.remove(), 400);
  }, 3500);
}

// ── HELPERS ──────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'}) +
         ' ' + d.toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'});
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── INIT ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();

  document.getElementById('login-form')?.addEventListener('submit', handleLogin);
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('add-product-btn')?.addEventListener('click', () => openProductForm());
  document.getElementById('close-pf')?.addEventListener('click', closeProductForm);
  document.getElementById('pf-form')?.addEventListener('submit', saveProduct);
  document.getElementById('pf-image')?.addEventListener('change', e => handleImageUpload(e.target));
  document.getElementById('product-form-overlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeProductForm();
  });

  document.getElementById('clear-orders')?.addEventListener('click', clearOrders);
  document.getElementById('export-orders')?.addEventListener('click', exportOrders);
  document.getElementById('order-search')?.addEventListener('input', e => filterOrders(e.target.value));

  document.getElementById('settings-form')?.addEventListener('submit', saveSettings);

  loadSettings();
});
