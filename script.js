// script.js - Final Fixed Version for Checkout & Features

// --- KEYS ---
const KEY_PRODUCTS = 'lynex_products';
const KEY_CART = 'lynex_cart';
const KEY_ORDERS = 'lynex_orders';
const KEY_MESSAGES = 'lynex_messages';
const KEY_ADMIN_LOGGED = 'lynex_admin_logged';
const KEY_ORDER_COUNT = 'lynex_order_count';

document.addEventListener('DOMContentLoaded', function() {
    
    // Navigation Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle) menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    
    updateCartCount();

    // Routing Logic
    const path = window.location.pathname;
    const page = path.split("/").pop(); 

    // Website Pages
    if (page === 'index.html' || page === '') loadProductsDisplay(true); // Home: New Arrivals
    else if (page === 'products.html') loadProductsDisplay(false); // All Products
    else if (page === 'cart.html') loadCartDisplay();
    else if (page === 'checkout.html') { 
        handleCheckoutForm(); // চেকআউট ফর্ম হ্যান্ডলিং
        loadCartSummaryForCheckout(); // কার্ট সামারি লোড
    }
    else if (page === 'contact.html') handleContactForm();
    
    // Admin Pages
    else if (page.includes('admin_') && !page.includes('login')) {
        checkAdminAuth();
        if (page.includes('dashboard')) initAdminDashboard();
        if (page.includes('products')) initAdminProducts();
        if (page.includes('orders')) initAdminOrders();
        if (page.includes('messages')) initAdminMessages();
    }
    
    // Login
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (e.target.username.value === 'admin' && e.target.password.value === '1234') {
                sessionStorage.setItem(KEY_ADMIN_LOGGED, 'true');
                window.location.href = 'admin_dashboard.html';
            } else alert('Login Failed!');
        });
    }
});

// --- HELPER FUNCTIONS ---
function getStorage(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function setStorage(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function updateCartCount() {
    const cart = getStorage(KEY_CART);
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll('.cart-count').forEach(el => el.innerText = `(${totalQty})`);
}

// --- WEBSITE LOGIC ---

// Product Display
function loadProductsDisplay(isHome) {
    let grid = document.querySelector('.product-grid');
    if (!grid) return;
    let products = getStorage(KEY_PRODUCTS);
    if (isHome) products = products.filter(p => p.isNewArrival);

    grid.innerHTML = products.length ? products.map(p => {
        let priceHTML = `<span class="current-price">৳ ${p.price}</span>`;
        let badge = '';
        if (p.originalPrice && p.originalPrice > p.price) {
            priceHTML = `<span class="old-price">৳ ${p.originalPrice}</span> <span class="current-price">৳ ${p.price}</span>`;
            badge = `<span class="discount-badge">-${Math.round(((p.originalPrice-p.price)/p.originalPrice)*100)}%</span>`;
        }
        let imgHTML = p.image ? `<img src="${p.image}" alt="${p.name}">` : `<i class="fas fa-tshirt" style="font-size:3em; color:#555;"></i>`;
        
        return `
        <div class="product-card">
            ${badge}
            <div class="product-image">${imgHTML}</div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <div class="price-container">${priceHTML}</div>
                <div class="product-actions">
                    <button onclick="addToCart('${p.id}')" class="btn secondary-btn">Add to Cart</button>
                    <button onclick="buyNow('${p.id}')" class="btn primary-btn">Buy Now</button>
                </div>
            </div>
        </div>`;
    }).join('') : '<p style="text-align:center;width:100%;color:#777;">No products available.</p>';
}

// Cart Actions
window.addToCart = (id) => {
    const products = getStorage(KEY_PRODUCTS);
    const product = products.find(p => p.id == id);
    if (product) {
        let cart = getStorage(KEY_CART);
        const exIdx = cart.findIndex(item => item.id == id);
        if (exIdx > -1) cart[exIdx].qty += 1; else cart.push({ ...product, qty: 1 });
        setStorage(KEY_CART, cart);
        updateCartCount();
        alert('Added to Cart!');
    }
};
window.buyNow = (id) => { window.addToCart(id); window.location.href = 'checkout.html'; };

// Cart Display
function loadCartDisplay() {
    const container = document.querySelector('.cart-items');
    const totalEl = document.getElementById('cart-total');
    if (!container) return;
    const cart = getStorage(KEY_CART);
    
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center;">Cart is empty.</p>';
        if(totalEl) totalEl.innerText = '0';
        const btn = document.querySelector('.checkout-btn'); if(btn) btn.style.display = 'none';
        return;
    }
    container.innerHTML = cart.map((item, i) => `
        <div class="cart-item">
            <div style="display:flex;align-items:center;gap:15px;">
                <img src="${item.image||''}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;">
                <div><h4>${item.name}</h4><p>৳ ${item.price} x ${item.qty}</p>
                <div class="qty-controls"><button class="qty-btn" onclick="upQty(${i},-1)">-</button><span>${item.qty}</span><button class="qty-btn" onclick="upQty(${i},1)">+</button></div>
                </div>
            </div>
            <div style="text-align:right;"><p style="font-weight:bold;color:#ff9f43;">৳ ${item.price*item.qty}</p><button onclick="rmCart(${i})" style="color:red;background:none;border:none;cursor:pointer;">Remove</button></div>
        </div>`).join('');
    if(totalEl) totalEl.innerText = cart.reduce((s, i) => s + (i.price * i.qty), 0);
}
window.upQty = (i, c) => { let cart=getStorage(KEY_CART); cart[i].qty+=c; if(cart[i].qty<=0) cart.splice(i,1); setStorage(KEY_CART,cart); loadCartDisplay(); updateCartCount(); };
window.rmCart = (i) => { let cart=getStorage(KEY_CART); cart.splice(i,1); setStorage(KEY_CART,cart); loadCartDisplay(); updateCartCount(); };

// [FIXED] CHECKOUT LOGIC
function handleCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if (form) {
        // Remove old listeners to prevent duplicates (optional safety)
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const cart = getStorage(KEY_CART);
            
            if(cart.length === 0) { 
                alert("Cart is Empty! Please add products."); 
                return; 
            }
            
            let count = parseInt(localStorage.getItem(KEY_ORDER_COUNT)) || 0; 
            count++; 
            localStorage.setItem(KEY_ORDER_COUNT, count);
            
            const totalAmount = cart.reduce((s, i) => s + (i.price * i.qty), 0);
            
            const order = {
                id: 'ORD-' + String(count).padStart(3, '0'),
                date: new Date().toLocaleDateString(),
                customer: { 
                    name: e.target.name.value, 
                    phone: e.target.phone.value, 
                    address: e.target.address.value 
                },
                items: cart,
                total: totalAmount,
                status: 'Pending'
            };
            
            // Save Order
            const orders = getStorage(KEY_ORDERS); 
            orders.unshift(order); 
            setStorage(KEY_ORDERS, orders);
            
            // Clear Cart
            setStorage(KEY_CART, []);
            updateCartCount();
            
            alert('Order Confirmed! Order ID: ' + order.id); 
            window.location.href = 'index.html'; 
        });
    }
}

function loadCartSummaryForCheckout() { 
    const el=document.getElementById('checkout-total'); 
    if(el) { 
        const c=getStorage(KEY_CART); 
        el.innerText=c.reduce((s,i)=>s+(i.price*i.qty),0); 
    }
}

function handleContactForm() {
    const form = document.getElementById('contact-form');
    if(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const msg = {
                id: Date.now(), date: new Date().toLocaleDateString(),
                name: e.target.name.value, email: e.target.email.value, subject: e.target.subject.value, text: e.target.message.value, isRead: false
            };
            const msgs = getStorage(KEY_MESSAGES); msgs.unshift(msg); setStorage(KEY_MESSAGES, msgs);
            e.target.reset(); alert('Message Sent!');
        });
    }
}

// --- ADMIN LOGIC ---
function checkAdminAuth() { if (!sessionStorage.getItem(KEY_ADMIN_LOGGED)) window.location.href = 'admin_login.html'; }

// Messages
function initAdminMessages() {
    const tbody = document.querySelector('#messages-table tbody');
    let view = 'New';
    const render = () => {
        const msgs = getStorage(KEY_MESSAGES);
        const list = view === 'New' ? msgs.filter(m => !m.isRead) : msgs.filter(m => m.isRead);
        tbody.innerHTML = list.length ? list.map((m) => {
            const idx = msgs.findIndex(x => x.id === m.id);
            return `<tr><td>${m.date}</td><td>${m.name}<br>${m.email}</td><td>${m.subject}</td><td>${m.text}</td>
            <td>${!m.isRead ? `<button onclick="mkRead(${idx})" style="color:green;margin-right:5px;cursor:pointer;background:none;border:1px solid green;">Mark Read</button>`:''}
            <button onclick="delMsg(${idx})" style="color:red;cursor:pointer;background:none;border:none;">Del</button></td></tr>`;
        }).join('') : '<tr><td colspan="5" style="text-align:center;">No Messages</td></tr>';
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.innerText.includes(view)));
    };
    render();
    window.filterMsgs = (v) => { view = v; render(); };
    window.mkRead = (i) => { const m = getStorage(KEY_MESSAGES); m[i].isRead = true; setStorage(KEY_MESSAGES, m); render(); };
    window.delMsg = (i) => { if(confirm('Del?')) { const m=getStorage(KEY_MESSAGES); m.splice(i,1); setStorage(KEY_MESSAGES, m); render(); }};
}

// Orders
function initAdminOrders() {
    const tbody = document.querySelector('#orders-table tbody');
    let filter = 'All';
    const render = () => {
        const all = getStorage(KEY_ORDERS);
        const list = filter === 'All' ? all : all.filter(x => x.status === filter);
        tbody.innerHTML = list.length ? list.map(o => {
            const idx = all.findIndex(x => x.id === o.id);
            let c = o.status==='Pending'?'#ff9f43':o.status==='Delivered'?'#2ecc71':o.status==='Shipped'?'#3498db':'#e74c3c';
            return `<tr><td>${o.id}</td><td>${o.customer.name}</td><td>৳ ${o.total}</td>
                <td><select onchange="upStat(${idx}, this.value)" style="color:${c};background:#222;border:1px solid ${c}"><option ${o.status==='Pending'?'selected':''}>Pending</option><option ${o.status==='Shipped'?'selected':''}>Shipped</option><option ${o.status==='Delivered'?'selected':''}>Delivered</option><option ${o.status==='Cancelled'?'selected':''}>Cancelled</option></select></td>
                <td><button onclick="viewOrd('${o.id}')" style="color:#fff;background:none;border:none;cursor:pointer;">View</button></td></tr>`;
        }).join('') : '<tr><td colspan="5" style="text-align:center;">No orders</td></tr>';
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.innerText.includes(filter)));
    };
    render();
    window.filterOrders = (s) => { filter = s; render(); };
    window.upStat = (i, s) => { const o = getStorage(KEY_ORDERS); o[i].status = s; setStorage(KEY_ORDERS, o); render(); };
    window.viewOrd = (id) => { const o = getStorage(KEY_ORDERS).find(x => x.id === id); const its = o.items.map(i=>`- ${i.name} x${i.qty} (৳${i.price})`).join('\n'); alert(`ID: ${o.id}\nInfo: ${o.customer.name}, ${o.customer.phone}\nAddr: ${o.customer.address}\n\nItems:\n${its}\n\nTotal: ৳${o.total}`); };
}

// Dashboard
function initAdminDashboard() {
    const o = getStorage(KEY_ORDERS);
    const rev = o.filter(x => x.status === 'Delivered').reduce((s, i) => s + parseFloat(i.total), 0);
    if(document.getElementById('stat-revenue')) document.getElementById('stat-revenue').innerText = '৳ ' + rev;
    if(document.getElementById('stat-pending')) document.getElementById('stat-pending').innerText = o.filter(x => x.status === 'Pending').length;
    if(document.getElementById('stat-shipped')) document.getElementById('stat-shipped').innerText = o.filter(x => x.status === 'Shipped').length;
    if(document.getElementById('stat-delivered')) document.getElementById('stat-delivered').innerText = o.filter(x => x.status === 'Delivered').length;
    if(document.getElementById('stat-cancelled')) document.getElementById('stat-cancelled').innerText = o.filter(x => x.status === 'Cancelled').length;
    if(document.getElementById('stat-products')) document.getElementById('stat-products').innerText = getStorage(KEY_PRODUCTS).length;
}

// Products
function initAdminProducts() {
    const form = document.getElementById('add-product-form');
    const tbody = document.querySelector('#product-table tbody');
    const render = () => {
        const p = getStorage(KEY_PRODUCTS);
        tbody.innerHTML = p.length ? p.map((x, i) => `<tr><td><img src="${x.image||''}" style="width:40px;height:40px;object-fit:cover;"></td><td>${x.name} ${x.isNewArrival?'<span style="color:#2ecc71">(New)</span>':''}</td><td>৳ ${x.price}</td><td><button onclick="delProd(${i})" style="color:red;border:none;background:none;cursor:pointer;">Del</button></td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;">Empty</td></tr>';
        document.getElementById('current-product-count').innerText = p.length;
    };
    render();
    if(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const file = e.target.image.files[0];
            const reader = new FileReader();
            const save = (img) => {
                const p = getStorage(KEY_PRODUCTS);
                p.push({ id: Date.now(), name: e.target.name.value, price: parseFloat(e.target.price.value), originalPrice: e.target.oldPrice.value ? parseFloat(e.target.oldPrice.value) : null, isNewArrival: e.target.isNew.checked, image: img });
                setStorage(KEY_PRODUCTS, p); e.target.reset(); render(); alert('Added!');
            };
            if(file) { reader.onload = (ev) => save(ev.target.result); reader.readAsDataURL(file); } else save(null);
        });
    }
    window.delProd = (i) => { if(confirm('Del?')) { const p=getStorage(KEY_PRODUCTS); p.splice(i,1); setStorage(KEY_PRODUCTS, p); render(); }};
}
