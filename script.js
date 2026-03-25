/* ═══════════════════════════════════════════════
   HARSH PACKAGING — Main Site Script
   script.js
═══════════════════════════════════════════════ */

// ── CONFIG ──────────────────────────────────────
const CONFIG = {
  WA_NUMBER: '918320579839',   // ← Replace with your WhatsApp number (e.g. 919876543210)
  MOQ: 100,
  ADMIN_PASS: 'hasrh2006k',   // ← Change in admin.js too
};

// ── STORAGE HELPERS ─────────────────────────────
const DB = {
  getProducts() {
    const raw = localStorage.getItem('hp_products');
    if (!raw) return this.defaultProducts();
    return JSON.parse(raw);
  },
  saveProducts(p) { localStorage.setItem('hp_products', JSON.stringify(p)); },
  getOrders()   { return JSON.parse(localStorage.getItem('hp_orders') || '[]'); },
  saveOrders(o) { localStorage.setItem('hp_orders', JSON.stringify(o)); },
  addOrder(order) {
    const orders = this.getOrders();
    orders.unshift({ ...order, id: Date.now(), timestamp: new Date().toISOString() });
    this.saveOrders(orders);
  },
  defaultProducts() {
    const defaults = [
      {
        id: 'p1',
        name: 'Fast Food Box',
        description: 'Sturdy, grease-resistant paper boxes perfect for burgers, fries, wraps, and all quick-service restaurant items. Keeps food fresh and presentation sharp.',
        tags: ['Food Grade', 'Grease-Resistant', 'Eco-Friendly'],
        shape: 'flat',
        colorA: '#C8935A',
        colorB: '#E07B39',
        image: '',
      },
      {
        id: 'p2',
        name: 'Sweet & Mithai Box',
        description: 'Elegant, food-safe boxes designed for sweets, mithai, chocolates, and festive confectionery. Premium finish with hygienic inner coating.',
        tags: ['Food Grade', 'Festive-Ready', 'Durable'],
        shape: 'tall',
        colorA: '#3D6B4A',
        colorB: '#5A9B6A',
        image: '',
      },
      {
        id: 'p3',
        name: 'Custom Printed Box',
        description: 'Your brand, your design. Fully customizable paper boxes with logo printing, custom dimensions, and your brand colors on food-grade material.',
        tags: ['Custom Print', 'Any Size', 'Food Grade'],
        shape: 'square',
        colorA: '#8B5E2F',
        colorB: '#C8935A',
        image: '',
      },
    ];
    this.saveProducts(defaults);
    return defaults;
  },
};

// ── THREE.JS BOX RENDERER ────────────────────────
function createBoxScene(canvas, w, h, d, colorA, colorB) {
  if (!window.THREE) return null;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(3.2, 2.4, 3.8);
  camera.lookAt(0, 0, 0);

  // Lights
  scene.add(new THREE.AmbientLight(0xFFF8F0, 0.75));
  const sun = new THREE.DirectionalLight(0xFFE8CC, 1.5);
  sun.position.set(5, 8, 5); sun.castShadow = true; scene.add(sun);
  const fill = new THREE.DirectionalLight(0xD4F0DC, 0.4);
  fill.position.set(-4, 3, -4); scene.add(fill);
  scene.add(new THREE.PointLight(0xFFD4A0, 0.3, 10));

  const matOuter = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorA), roughness: 0.78, metalness: 0.04 });
  const matInner = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorB), roughness: 0.9 });
  const matLid   = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorA), roughness: 0.6, metalness: 0.06 });

  const group = new THREE.Group();

  // Bottom panel
  addBox(group, [w, 0.06, d], [0, 0, 0], matOuter);
  // Walls
  addBox(group, [0.06, h, d],      [-w/2+0.03, h/2, 0], matOuter);
  addBox(group, [0.06, h, d],      [ w/2-0.03, h/2, 0], matOuter);
  addBox(group, [w, h, 0.06],      [0, h/2, -d/2+0.03], matOuter);
  addBox(group, [w-0.06, h, 0.06], [0, h/2,  d/2-0.03], matOuter);
  // Inner floor
  addBox(group, [w-0.12, 0.02, d-0.12], [0, 0.04, 0], matInner);
  // Lid
  addBox(group, [w+0.07, 0.09, d+0.07], [0, h+0.05, 0], matLid);
  // Lid walls (partial)
  addBox(group, [w+0.07, 0.18, 0.09], [0, h-0.04, -d/2-0.04], matLid);
  addBox(group, [w+0.07, 0.18, 0.09], [0, h-0.04,  d/2+0.04], matLid);

  group.position.y = -h / 2;
  scene.add(group);

  // Shadow plane
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.ShadowMaterial({ opacity: 0.1 })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -0.01;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  // Interaction
  let dragging = false, prevX = 0, prevY = 0;
  let rotY = 0.6, rotX = 0.2, tRotY = 0.6, tRotX = 0.2;
  let zoom = 1, tZoom = 1;

  canvas.addEventListener('mousedown',  e => { dragging=true; prevX=e.clientX; prevY=e.clientY; });
  canvas.addEventListener('touchstart', e => { dragging=true; prevX=e.touches[0].clientX; prevY=e.touches[0].clientY; }, {passive:true});
  window.addEventListener('mousemove',  e => { if(!dragging) return; tRotY+=(e.clientX-prevX)*0.009; tRotX+=(e.clientY-prevY)*0.006; prevX=e.clientX; prevY=e.clientY; });
  window.addEventListener('touchmove',  e => { if(!dragging) return; tRotY+=(e.touches[0].clientX-prevX)*0.009; tRotX+=(e.touches[0].clientY-prevY)*0.006; prevX=e.touches[0].clientX; prevY=e.touches[0].clientY; }, {passive:true});
  window.addEventListener('mouseup',   () => dragging=false);
  window.addEventListener('touchend',  () => dragging=false);
  canvas.addEventListener('wheel', e => { tZoom=Math.max(0.5,Math.min(2.8,tZoom+e.deltaY*0.001)); e.preventDefault(); }, {passive:false});

  let raf;
  function tick() {
    raf = requestAnimationFrame(tick);
    rotY += (tRotY - rotY) * 0.09;
    rotX += (tRotX - rotX) * 0.09;
    zoom += (tZoom  - zoom) * 0.09;

    // Auto-spin when idle
    if (!dragging) tRotY += 0.003;

    group.rotation.y = rotY;
    group.rotation.x = rotX;
    camera.position.setLength(6 * zoom);

    const cw = canvas.clientWidth || 400, ch = canvas.clientHeight || 300;
    if (renderer.domElement.width !== cw || renderer.domElement.height !== ch) {
      renderer.setSize(cw, ch, false);
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);
  }
  tick();

  return { dispose: () => { cancelAnimationFrame(raf); renderer.dispose(); } };
}

function addBox(group, [w,h,d], [x,y,z], mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
  m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true;
  group.add(m);
}

// ── PRODUCT SHAPE DIMENSIONS ─────────────────────
function shapeFor(shape) {
  switch(shape) {
    case 'tall':   return [1.4, 1.3, 1.4];
    case 'square': return [1.6, 1.0, 1.6];
    default:       return [2.2, 0.85, 1.5]; // flat
  }
}

// ── RENDER PRODUCTS ──────────────────────────────
const activeScenes = {};

function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  // Dispose old scenes
  Object.values(activeScenes).forEach(s => s && s.dispose && s.dispose());
  Object.keys(activeScenes).forEach(k => delete activeScenes[k]);

  const products = DB.getProducts();

  if (products.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-soft)">
      <div style="font-size:3rem;margin-bottom:16px">📦</div>
      <p style="font-size:1rem">No products yet. Admin can add products from the <a href="admin.html" style="color:var(--kraft)">Admin Panel</a>.</p>
    </div>`;
    return;
  }

  grid.innerHTML = products.map(p => `
    <div class="product-card card reveal" data-id="${p.id}">
      <div class="product-canvas-wrap">
        ${p.image
          ? `<img src="${p.image}" alt="${p.name}" class="product-img">`
          : `<canvas class="product-canvas" id="canvas-${p.id}" data-shape="${p.shape}" data-ca="${p.colorA}" data-cb="${p.colorB}"></canvas>`
        }
      </div>
      <div class="product-body">
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.description}</p>
        <div class="product-tags">
          ${p.tags.map(t => `<span class="badge badge-green">${t}</span>`).join('')}
        </div>
        <div class="order-block">
          <div class="qty-row">
            <label class="form-label" style="margin-bottom:0">Quantity:</label>
            <div class="qty-stepper">
              <button class="qty-btn minus-btn" data-id="${p.id}" aria-label="Decrease">−</button>
              <input type="number" class="qty-input" id="qty-${p.id}" value="100" min="100" step="50" aria-label="Quantity">
              <button class="qty-btn plus-btn" data-id="${p.id}" aria-label="Increase">+</button>
            </div>
          </div>
          <div class="qty-error" id="err-${p.id}">⚠ Minimum order is ${CONFIG.MOQ} boxes</div>
          <div class="moq-notice" style="margin:10px 0">📦 Minimum Order: ${CONFIG.MOQ} Boxes</div>
          <button class="btn btn-wa btn-full order-btn" data-id="${p.id}" data-name="${p.name}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.093.539 4.062 1.481 5.779L0 24l6.389-1.673A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
            Order Now
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Init 3D canvases
  products.forEach(p => {
    if (p.image) return;
    const canvas = document.getElementById(`canvas-${p.id}`);
    if (!canvas) return;
    const [w,h,d] = shapeFor(p.shape);
    activeScenes[p.id] = createBoxScene(canvas, w, h, d, p.colorA, p.colorB);
  });

  // Reveal cards
  requestAnimationFrame(() => {
    document.querySelectorAll('.product-card').forEach((el,i) => {
      setTimeout(() => el.classList.add('visible'), i * 120);
    });
  });

  // Bind quantity buttons
  document.querySelectorAll('.minus-btn').forEach(btn => {
    btn.addEventListener('click', () => adjustQty(btn.dataset.id, -50));
  });
  document.querySelectorAll('.plus-btn').forEach(btn => {
    btn.addEventListener('click', () => adjustQty(btn.dataset.id, +50));
  });

  // Bind qty inputs
  document.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', () => validateQty(input.id.replace('qty-','')));
  });

  // Bind order buttons
  document.querySelectorAll('.order-btn').forEach(btn => {
    btn.addEventListener('click', () => openOrderModal(btn.dataset.id, btn.dataset.name));
  });
}

function adjustQty(id, delta) {
  const input = document.getElementById(`qty-${id}`);
  let val = parseInt(input.value) || CONFIG.MOQ;
  val = Math.max(CONFIG.MOQ, val + delta);
  input.value = val;
  validateQty(id);
}

function validateQty(id) {
  const input = document.getElementById(`qty-${id}`);
  const err   = document.getElementById(`err-${id}`);
  const val   = parseInt(input.value);
  if (!val || val < CONFIG.MOQ) {
    err.classList.add('show');
    input.value = CONFIG.MOQ;
    return false;
  }
  err.classList.remove('show');
  return true;
}

// ── ORDER MODAL ──────────────────────────────────
function openOrderModal(productId, productName) {
  const qtyInput = document.getElementById(`qty-${productId}`);
  const qty      = parseInt(qtyInput?.value) || CONFIG.MOQ;

  if (qty < CONFIG.MOQ) { validateQty(productId); return; }

  const modal = document.getElementById('order-modal');
  modal.dataset.productId   = productId;
  modal.dataset.productName = productName;
  modal.dataset.qty         = qty;

  document.getElementById('modal-product-name').textContent = productName;
  document.getElementById('modal-qty').textContent = `${qty} boxes`;
  document.getElementById('modal-customer-name').value = '';
  document.getElementById('modal-note').value = '';

  modal.classList.add('open');
}

function closeModal() {
  document.getElementById('order-modal').classList.remove('open');
}

function confirmOrder() {
  const modal = document.getElementById('order-modal');
  const productId   = modal.dataset.productId;
  const productName = modal.dataset.productName;
  const qty         = modal.dataset.qty;
  const customerName = document.getElementById('modal-customer-name').value.trim();
  const note        = document.getElementById('modal-note').value.trim();

  if (!customerName) {
    showToast('Please enter your name.', 'error');
    document.getElementById('modal-customer-name').focus();
    return;
  }

  // Save order to localStorage
  const order = { productId, productName, qty: parseInt(qty), customerName, note };
  DB.addOrder(order);

  // Close modal
  closeModal();

  // Show confirmation message then redirect
  showToast('✅ Order saved! Redirecting to WhatsApp…', 'success');

  setTimeout(() => {
    const msg = buildWAMessage(productName, qty, customerName, note);
    window.open(`https://wa.me/${CONFIG.WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  }, 1200);
}

function buildWAMessage(productName, qty, customerName, note) {
  let msg = `Hello Harsh Packaging! 👋\n\n`;
  msg += `I want to place a bulk order:\n`;
  msg += `📦 *Product:* ${productName}\n`;
  msg += `🔢 *Quantity:* ${qty} boxes\n`;
  msg += `👤 *Name:* ${customerName}\n`;
  if (note) msg += `📝 *Note:* ${note}\n`;
  msg += `\nKindly confirm availability and share details. Thank you!`;
  return msg;
}

// ── TOAST SYSTEM ─────────────────────────────────
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.4s ease forwards';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ── HERO 3D CANVAS ───────────────────────────────
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || !window.THREE) return;
  createBoxScene(canvas, 2.2, 0.85, 1.5, '#C8935A', '#E07B39');
}

// ── MAIN 3D VIEWER ───────────────────────────────
let mainViewerScene = null;
const viewerModels = {
  fastfood: { w:2.2, h:0.85, d:1.5, ca:'#C8935A', cb:'#E07B39' },
  sweet:    { w:1.4, h:1.3,  d:1.4, ca:'#3D6B4A', cb:'#5A9B6A' },
  custom:   { w:1.6, h:1.0,  d:1.6, ca:'#8B5E2F', cb:'#C8935A' },
};

function initMainViewer(modelKey = 'fastfood') {
  const canvas = document.getElementById('main-viewer');
  if (!canvas || !window.THREE) return;
  if (mainViewerScene) mainViewerScene.dispose();
  const cfg = viewerModels[modelKey];
  mainViewerScene = createBoxScene(canvas, cfg.w, cfg.h, cfg.d, cfg.ca, cfg.cb);
}

// ── NAV ──────────────────────────────────────────
function initNav() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });

  document.getElementById('hamburger')?.addEventListener('click', () => {
    nav.classList.toggle('open');
  });

  // Close nav on link click (mobile)
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => nav.classList.remove('open'));
  });
}

// ── SCROLL REVEAL ────────────────────────────────
function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 70);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

// ── MARQUEE DUPLICATE ────────────────────────────
function initMarquee() {
  const inner = document.getElementById('marquee');
  if (!inner) return;
  const clone = inner.cloneNode(true);
  inner.parentElement.appendChild(clone);
}

// ── INIT ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initMarquee();
  renderProducts();
  initHeroCanvas();
  initMainViewer('fastfood');
  initReveal();

  // Model switcher buttons
  document.querySelectorAll('.model-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.model-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      initMainViewer(btn.dataset.model);
    });
  });

  // Modal close
  document.getElementById('close-modal')?.addEventListener('click', closeModal);
  document.getElementById('confirm-order')?.addEventListener('click', confirmOrder);
  document.getElementById('order-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
});
