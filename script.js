// ======================================================
// LYNEX MAIN SCRIPT (Fix: Storage Limit, Tab Switching)
// ======================================================

const KEY_PRODUCTS = 'lynex_products';
const KEY_CART = 'lynex_cart';
const KEY_ORDERS = 'lynex_orders';
const KEY_MESSAGES = 'lynex_messages';
const KEY_ADMIN_LOGGED = 'lynex_admin_logged';
const KEY_ORDER_COUNT = 'lynex_order_counter';

document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Nav Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    }
    
    // 2. Init Cart Badge
    updateCartCount();

    // 3. Routing
    const path = window.location.pathname;
    const page = path.split("/").pop(); 

    // --- PUBLIC PAGES ---
    if (page === 'index.html' || page === '') loadProductsDisplay(true);
    else if (page === 'products.html') loadProductsDisplay(false);
    else if (page === 'cart.html') loadCartDisplay();
    else if (page === 'checkout.html') { handleCheckoutForm(); loadCartSummaryForCheckout(); }
    else if (page === 'contact.html') handleContactForm();
    
    // --- ADMIN PAGES ---
    else if (page.includes('admin_') && !page.includes('login')) {
        checkAdminAuth();
        updateAdminSidebarBadges();
        
        if (page.includes('dashboard')) initAdminDashboard();
        if (page.includes('products')) initAdminProducts();
        if (page.includes('orders')) initAdminOrders();
        if (page.includes('messages')) initAdminMessages();
    }
    
    // --- LOGIN ---
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.onsubmit = (e) => {
            e.preventDefault();
            const u = e.target.username.value;
            const p = e.target.password.value;
            if (u === 'admin' && p === '1234') {
                sessionStorage.setItem(KEY_ADMIN_LOGGED, 'true');
                window.location.href = 'admin_dashboard.html';
            } else {
                alert('Login Failed!');
            }
        };
    }
});

// --- HELPER FUNCTIONS ---
function getStorage(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } 
    catch (e) { return []; }
}

function setStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        // স্টোরেজ ফুল হলে ইউজারকে জানাবে
        if (e.name === 'QuotaExceededError') {
            alert('Storage Full! বড় সাইজের ছবি আপলোড করা যাবে না। দয়া করে ছোট ছবি ব্যবহার করুন বা পুরনো ডাটা ক্লিয়ার করুন।');
        } else {
            alert('Error saving data: ' + e.message);
        }
        return false;
    }
}

function updateCartCount() {
    const cart = getStorage(KEY_CART);
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll('.cart-count').forEach(el => el.innerText = `(${totalQty})`);
}

function updateAdminSidebarBadges() {
    const orders = getStorage(KEY_ORDERS);
    const msgs = getStorage(KEY_MESSAGES);
    const hasPending = orders.some(o => o.status === 'Pending');
    const hasUnread = msgs.some(m => !m.isRead);
    
    const oLink = document.getElementById('nav-orders');
    const mLink = document.getElementById('nav-messages');

    if(hasPending && oLink && !window.location.pathname.includes('admin_orders')) 
        if(!oLink.querySelector('.nav-badge')) oLink.innerHTML += ' <span class="nav-badge"></span>';
    
    if(hasUnread && mLink && !window.location.pathname.includes('admin_messages')) 
        if(!mLink.querySelector('.nav-badge')) mLink.innerHTML += ' <span class="nav-badge"></span>';
}

// ==========================================
//  WEBSITE LOGIC
// ==========================================

function loadProductsDisplay(isHome) {
    let grid = document.querySelector('.product-grid');
    if (!grid) return;
    
    let products = getStorage(KEY_PRODUCTS);
    if (isHome) products = products.filter(p => p.isNewArrival);

    grid.innerHTML = products.length ? products.map(p => {
        let priceHTML = `<span class="current-price">৳ ${p.price}</span>`;
        let badgeHTML = '';
        if (p.originalPrice && p.originalPrice > p.price) {
            priceHTML = `<span class="old-price">৳ ${p.originalPrice}</span> <span class="current-price">৳ ${p.price}</span>`;
            const disc = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
            badgeHTML = `<span class="discount-badge">-${disc}%</span>`;
        }
        // ছবি না থাকলে ডিফল্ট আইকন
        let imgHTML = p.image 
            ? `<img src="${p.image}" alt="${p.name}">` 
            : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#555;"><i class="fas fa-tshirt" style="font-size:3em;"></i></div>`;

        return `<div class="product-card">${badgeHTML}<div class="product-image">${imgHTML}</div><div class="product-info"><h3>${p.name}</h3><div class="price-container">${priceHTML}</div><div class="product-actions"><button onclick="addToCart('${p.id}')" class="btn secondary-btn">Add to Cart</button><button onclick="buyNow('${p.id}')" class="btn primary-btn">Buy Now</button></div></div></div>`;
    }).join('') : '<p style="text-align:center;width:100%;color:#777;">No products available.</p>';
}

window.addToCart = function(id) {
    const products = getStorage(KEY_PRODUCTS);
    const product = products.find(p => p.id == id);
    if (product) {
        let cart = getStorage(KEY_CART);
        const ex = cart.find(item => item.id == id);
        if (ex) ex.qty++; else cart.push({ ...product, qty: 1 });
        if(setStorage(KEY_CART, cart)) {
            updateCartCount();
            alert('Added to Cart!');
        }
    }
};
window.buyNow = (id) => { window.addToCart(id); window.location.href = 'checkout.html'; };

function loadCartDisplay() {
    const c = document.querySelector('.cart-items'); const t = document.getElementById('cart-total');
    if(!c) return; const cart = getStorage(KEY_CART);
    if(cart.length===0) { c.innerHTML='<p style="text-align:center;color:#aaa;">Cart is empty.</p>'; if(t) t.innerText='0'; document.querySelector('.checkout-btn').style.display='none'; return; }
    
    c.innerHTML = cart.map((item, i) => `
        <div class="cart-item"><div style="display:flex;align-items:center;gap:15px;"><img src="${item.image||''}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;background:#333;"><div><h4>${item.name}</h4><p>৳ ${item.price} x ${item.qty}</p><div class="qty-controls"><button class="qty-btn" onclick="upQty(${i},-1)">-</button><span style="color:#fff;">${item.qty}</span><button class="qty-btn" onclick="upQty(${i},1)">+</button></div></div></div><div style="text-align:right;"><p style="font-weight:bold;color:#ff9f43;">৳ ${item.price*item.qty}</p><button onclick="rmCart(${i})" style="color:#e74c3c;background:none;border:none;cursor:pointer;margin-top:5px;">Remove</button></div></div>`).join('');
    if(t) t.innerText = cart.reduce((s, i) => s + (i.price * i.qty), 0);
}
window.upQty = (i, v) => { let c=getStorage(KEY_CART); c[i].qty+=v; if(c[i].qty<1) { if(confirm("Remove?")) c.splice(i,1); else c[i].qty=1; } setStorage(KEY_CART, c); loadCartDisplay(); updateCartCount(); };
window.rmCart = (i) => { let c=getStorage(KEY_CART); c.splice(i,1); setStorage(KEY_CART, c); loadCartDisplay(); updateCartCount(); };

function handleCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const cart = getStorage(KEY_CART);
            if(cart.length === 0) return alert("Cart is empty!");
            
            let count = parseInt(localStorage.getItem(KEY_ORDER_COUNT)) || 0; count++; localStorage.setItem(KEY_ORDER_COUNT, count);
            const orderId = 'ORD-' + String(count).padStart(3, '0');
            const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
            
            const order = {
                id: orderId, date: new Date().toLocaleDateString(),
                customer: { name: e.target.name.value, phone: e.target.phone.value, address: e.target.address.value },
                items: cart, total: total, status: 'Pending'
            };
            
            const orders = getStorage(KEY_ORDERS); orders.unshift(order);
            if(setStorage(KEY_ORDERS, orders)) {
                setStorage(KEY_CART, []); updateCartCount();
                alert(`Order Confirmed!\nID: ${orderId}`); window.location.href = 'index.html';
            }
        };
    }
}
function loadCartSummaryForCheckout() { const el=document.getElementById('checkout-total'); if(el) { const c=getStorage(KEY_CART); el.innerText=c.reduce((s,i)=>s+(i.price*i.qty),0); }}

function handleContactForm() {
    const form = document.getElementById('contact-form');
    if(form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const msg = { id: Date.now(), date: new Date().toLocaleDateString(), name: e.target.name.value, email: e.target.email.value, subject: e.target.subject.value, text: e.target.message.value, isRead: false };
            const msgs = getStorage(KEY_MESSAGES); msgs.unshift(msg);
            if(setStorage(KEY_MESSAGES, msgs)) { e.target.reset(); alert('Message Sent!'); }
        };
    }
}

// ==========================================
//  ADMIN LOGIC (Fixed)
// ==========================================
function checkAdminAuth() { if (!sessionStorage.getItem(KEY_ADMIN_LOGGED)) window.location.href = 'admin_login.html'; }

// 1. PRODUCTS
function initAdminProducts() {
    const form = document.getElementById('add-product-form');
    const tbody = document.querySelector('#product-table tbody');
    const render = () => {
        const p = getStorage(KEY_PRODUCTS);
        tbody.innerHTML = p.length ? p.map((x, i) => `<tr><td><img src="${x.image||''}" style="width:40px;height:40px;object-fit:cover;background:#333;border-radius:4px;"></td><td>${x.name} ${x.isNewArrival?'<span style="color:#2ecc71;">(New)</span>':''}</td><td>৳ ${x.price}</td><td><button onclick="delProd(${i})" style="color:red;cursor:pointer;background:none;border:none;">Del</button></td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;">Empty</td></tr>';
        document.getElementById('current-product-count').innerText = p.length;
    };
    render();
    if(form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            // File Size Check (Limit 500KB)
            const file = e.target.image.files[0];
            if(file && file.size > 500000) {
                alert("File too large! Please upload image less than 500KB.");
                return;
            }
            const reader = new FileReader();
            const save = (img) => {
                const p = getStorage(KEY_PRODUCTS);
                p.push({ id: Date.now(), name: e.target.name.value, price: parseFloat(e.target.price.value), originalPrice: e.target.oldPrice.value ? parseFloat(e.target.oldPrice.value) : null, isNewArrival: e.target.isNew.checked, image: img });
                if(setStorage(KEY_PRODUCTS, p)) { e.target.reset(); render(); alert('Added!'); }
            };
            if(file) { reader.onload = (ev) => save(ev.target.result); reader.readAsDataURL(file); } else save(null);
        };
    }
    window.delProd = (i) => { if(confirm('Del?')) { const p=getStorage(KEY_PRODUCTS); p.splice(i,1); setStorage(KEY_PRODUCTS, p); render(); }};
}

// 2. ORDERS (Filters & View Fixed)
function initAdminOrders() {
    const tbody = document.querySelector('#orders-table tbody');
    let currentFilter = 'All'; // Global variable for this scope

    // We expose filterOrders to window so HTML can call it
    window.filterOrders = (status) => {
        currentFilter = status;
        renderOrders();
    };

    const renderOrders = () => {
        const allOrders = getStorage(KEY_ORDERS);
        const list = currentFilter === 'All' ? allOrders : allOrders.filter(o => o.status === currentFilter);
        
        // Highlight active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if(btn.textContent.trim() === currentFilter || (currentFilter === 'All' && btn.textContent.trim() === 'All')) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        if(list.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No Orders Found</td></tr>'; return; }

        tbody.innerHTML = list.map(o => {
            const idx = allOrders.findIndex(x => x.id === o.id);
            let color = '#ff9f43'; if(o.status==='Shipped')color='#3498db'; if(o.status==='Delivered')color='#2ecc71'; if(o.status==='Cancelled')color='#e74c3c';
            return `<tr><td>${o.id}</td><td>${o.customer.name}</td><td>৳ ${o.total}</td>
            <td><select onchange="upStat(${idx},this.value)" style="color:${color};background:#222;border:1px solid ${color}"><option ${o.status==='Pending'?'selected':''}>Pending</option><option ${o.status==='Shipped'?'selected':''}>Shipped</option><option ${o.status==='Delivered'?'selected':''}>Delivered</option><option ${o.status==='Cancelled'?'selected':''}>Cancelled</option></select></td>
            <td><button onclick="vOrd('${o.id}')" style="color:#fff;background:none;border:none;cursor:pointer;">View</button></td></tr>`;
        }).join('');
    };
    
    // Initial Render
    renderOrders();

    window.upStat = (i, v) => { const o = getStorage(KEY_ORDERS); o[i].status = v; setStorage(KEY_ORDERS, o); renderOrders(); };
    window.vOrd = (id) => { const o = getStorage(KEY_ORDERS).find(x => x.id === id); const its = o.items.map(i=>`- ${i.name} x${i.qty} (৳${i.price})`).join('\n'); alert(`ID: ${o.id}\nInfo: ${o.customer.name}\nPhone: ${o.customer.phone}\nAddress: ${o.customer.address}\n\nItems:\n${its}\n\nTotal: ৳${o.total}`); };
}

// 3. MESSAGES (Read/Unread Fixed)
function initAdminMessages() {
    const tbody = document.querySelector('#messages-table tbody');
    let view = 'New';

    window.filterMsgs = (mode) => {
        view = mode;
        renderMsgs();
    };

    const renderMsgs = () => {
        const allMsgs = getStorage(KEY_MESSAGES);
        const list = view === 'New' ? allMsgs.filter(m => !m.isRead) : allMsgs.filter(m => m.isRead);
        
        // Highlight Tabs
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if(btn.textContent.includes(view)) btn.classList.add('active'); else btn.classList.remove('active');
        });

        if(list.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No Messages</td></tr>'; return; }

        tbody.innerHTML = list.map(m => {
            const idx = allMsgs.findIndex(x => x.id === m.id);
            return `<tr><td>${m.date}</td><td>${m.name}<br>${m.email}</td><td>${m.subject}</td><td>${m.text}</td><td>${!m.isRead?`<button onclick="mkRead(${idx})" style="color:green;background:none;border:none;cursor:pointer;margin-right:5px;">Read</button>`:''}<button onclick="delMsg(${idx})" style="color:red;background:none;border:none;cursor:pointer;">Del</button></td></tr>`;
        }).join('');
    };
    renderMsgs();

    window.mkRead = (i) => { const m=getStorage(KEY_MESSAGES); m[i].isRead=true; setStorage(KEY_MESSAGES,m); renderMsgs(); };
    window.delMsg = (i) => { if(confirm('Del?')){ const m=getStorage(KEY_MESSAGES); m.splice(i,1); setStorage(KEY_MESSAGES,m); renderMsgs(); }};
}

// 4. DASHBOARD
function initAdminDashboard() {
    const o = getStorage(KEY_ORDERS);
    const rev = o.filter(x => x.status === 'Delivered').reduce((s, i) => s + parseFloat(i.total), 0);
    const setT = (id, v) => { if(document.getElementById(id)) document.getElementById(id).innerText = v; };
    setT('stat-revenue', '৳ ' + rev);
    setT('stat-pending', o.filter(x => x.status === 'Pending').length);
    setT('stat-shipped', o.filter(x => x.status === 'Shipped').length);
    setT('stat-delivered', o.filter(x => x.status === 'Delivered').length);
    setT('stat-cancelled', o.filter(x => x.status === 'Cancelled').length);
    setT('stat-products', getStorage(KEY_PRODUCTS).length);
}
