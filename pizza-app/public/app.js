let cart = [];
let selectedSize = 'small';
let menu = [];

async function loadMenu() {
  try {
    const res = await fetch('/api/menu');
    menu = await res.json();
    renderMenu();
  } catch (e) {
    console.error('Failed to load menu:', e);
  }
}

function renderMenu() {
  const grid = document.getElementById('menu-grid');
  grid.innerHTML = menu.map(item => `
    <div class="menu-card" onclick="addToCart(${item.id})">
      <div class="pizza-emoji">${item.image}</div>
      <div class="card-info">
        <h4>${item.name}</h4>
        <p>${item.description}</p>
        <div class="card-footer">
          <span class="price">$${item.price.toFixed(2)}</span>
          <button class="add-btn" onclick="event.stopPropagation(); addToCart(${item.id})">+</button>
        </div>
      </div>
    </div>
  `).join('');
}

function selectSize(btn) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedSize = btn.dataset.size;
}

function addToCart(id) {
  const item = menu.find(m => m.id === id);
  if (!item) return;
  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  updateCartCount();
  showToast(`${item.name} added!`);
}

function updateCartCount() {
  const total = cart.reduce((sum, i) => sum + i.qty, 0);
  document.getElementById('cart-count').textContent = total;
}

function toggleCart() {
  const cartScreen = document.getElementById('screen-cart');
  if (cartScreen.classList.contains('active')) {
    showScreen('screen-menu');
  } else {
    renderCart();
    showScreen('screen-cart');
  }
}

function renderCart() {
  const container = document.getElementById('cart-items');
  const empty = document.getElementById('cart-empty');
  const summary = document.getElementById('cart-summary');

  if (cart.length === 0) {
    container.innerHTML = '';
    empty.style.display = 'block';
    summary.classList.add('hidden');
    return;
  }

  empty.style.display = 'none';
  summary.classList.remove('hidden');

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <span class="cart-item-emoji">${item.image}</span>
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p>$${(item.price * item.qty).toFixed(2)}</p>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">-</button>
        <span class="qty-display">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
      </div>
    </div>
  `).join('');

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('grand-total').textContent = `$${(subtotal + 2.99).toFixed(2)}`;
}

function changeQty(id, delta) {
  const idx = cart.findIndex(c => c.id === id);
  if (idx === -1) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  updateCartCount();
  renderCart();
}

function showCheckout() {
  showScreen('screen-checkout');
}

async function placeOrder(e) {
  e.preventDefault();
  const address = document.getElementById('address').value;
  const phone = document.getElementById('phone').value;
  const btn = e.target.querySelector('button[type=submit]');
  btn.textContent = 'Placing Order...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map(i => ({ id: i.id, qty: i.qty })),
        address,
        phone,
        size: selectedSize
      })
    });
    const order = await res.json();
    showConfirmation(order);
  } catch (err) {
    alert('Failed to place order. Please try again.');
    btn.textContent = 'Place Order 🍕';
    btn.disabled = false;
  }
}

function showConfirmation(order) {
  document.getElementById('confirm-order-id').textContent = `Order #${order.id} • $${order.total}`;
  document.getElementById('eta-time').textContent = order.estimatedTime;
  const summaryEl = document.getElementById('order-summary-final');
  const itemNames = order.items.map(i => {
    const m = menu.find(x => x.id === i.id);
    return m ? `${m.name} x${i.qty}` : '';
  }).join(', ');
  summaryEl.innerHTML = `
    <h4>Order Summary</h4>
    <p>🍕 ${itemNames}</p>
    <p>📍 ${order.address}</p>
    <p>📏 Size: ${order.size.charAt(0).toUpperCase() + order.size.slice(1)}</p>
  `;
  showScreen('screen-confirmation');
}

function newOrder() {
  cart = [];
  updateCartCount();
  document.getElementById('checkout-form').reset();
  showScreen('screen-menu');
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:20px;font-size:14px;z-index:999;animation:fadeIn 0.3s';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

document.querySelectorAll('input[name=payment]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.getElementById('card-fields').style.display = radio.value === 'card' ? 'block' : 'none';
  });
});

loadMenu();
