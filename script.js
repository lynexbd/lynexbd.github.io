// ======================================================
// LYNEX MAIN SCRIPT (Fix: Order Tabs & Dashboard Title)
// ======================================================

const KEY_PRODUCTS = 'lynex_products';
const KEY_CART = 'lynex_cart';
const KEY_ORDERS = 'lynex_orders';
const KEY_MESSAGES = 'lynex_messages';
const KEY_ADMIN_TOKEN = 'lynex_secure_token_v99';
const KEY_ORDER_COUNT = 'lynex_order_counter';

// --- PAGE NAMES ---
const PAGE_LOGIN = 'k7_entry_point.html';
const PAGE_DASHBOARD = 'x_master_v9.html';
const PAGE_PRODUCTS = 'p_data_source_5.html';
const PAGE_ORDERS = 'o_log_file_22.html';
const PAGE_MESSAGES = 'm_feed_back_01.html';

// --- LOGIN INFO ---
const _u = "SysMaster_99";
const _p = "L7n@x#Super!2025";

document.addEventListener('DOMContentLoaded', function() {
    
    // Nav Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    }
    
    updateCartCount();

    const path = window.location.pathname;
    const page = path.split("/").pop(); 

    // --- PUBLIC PAGES ---
    if (page === 'index.html' || page === '') loadProductsDisplay(true);
    else if (page === 'products.html') loadProductsDisplay(false);
    else if (page === 'cart.html') loadCartDisplay();
    else if (page === 'checkout.html') { handleCheckoutForm(); loadCartSummaryForCheckout(); }
    else if (page === 'contact.html') handleContactForm();
    
    // --- ADMIN PAGES ---
    else if ([PAGE_DASHBOARD, PAGE_PRODUCTS, PAGE_ORDERS, PAGE_MESSAGES].includes(page)) {
        checkAdminAuth();
        updateAdminSidebarBadges();
        
        if (page === PAGE_DASHBOARD) initAdminDashboard();
        if (page === PAGE_PRODUCTS) initAdminProducts();
        if (page === PAGE_ORDERS) initAdminOrders();
        if (page === PAGE_MESSAGES) initAdminMessages();
    }
    
    // --- LOGIN ---
    const loginForm = document.getElementById('secure-login-form');
    if (loginForm) {
        if(sessionStorage.getItem(KEY_ADMIN_TOKEN)) window.location.href = PAGE_DASHBOARD;
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (e.target.username.value === _u && e.target.password.value === _p) {
                const token = Math.random().toString(36).substr(2);
                sessionStorage.setItem(KEY_ADMIN_TOKEN, token);
                window.location.href = PAGE_DASHBOARD;
            } else {
                alert('Access Denied!'); e.target.reset();
            }
        });
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
        if (e.name === 'QuotaExceededError') {
            alert('Storage Full! Please use smaller images.');
        }
        return false;
    }
}

function updateCartCount() {
    const cart = getStorage(KEY_CART);
    const totalQty = cart.reduce((sum, item) => sum + (parseInt(item.qty)||0), 0);
    document.querySelectorAll('.cart-count').forEach(el => el.innerText = `(${totalQty})`);
}

function updateAdminSidebarBadges() {
    const orders = getStorage(KEY_ORDERS);
    const msgs = getStorage(KEY_MESSAGES);
    const hasPending = orders.some(o => o.status === 'Pending');
    const hasUnread = msgs.some(m => !m.isRead);
    
    const oLink = document.getElementById('nav-orders');
    const mLink = document.getElementById('nav-messages');

    if(hasPending && oLink && !window.location.pathname.includes(PAGE_ORDERS)) 
        if(!oLink.querySelector('.nav-badge')) oLink.innerHTML += ' <span class="nav-badge"></span>';
    
    if(hasUnread && mLink && !window.location.pathname.includes(PAGE_MESSAGES)) 
        if(!mLink.querySelector('.nav-badge')) mLink.innerHTML += ' <span class="nav-badge"></span>';
}

function checkAdminAuth() {
    if (!sessionStorage.getItem(KEY_ADMIN_TOKEN)) window.location.replace(PAGE_LOGIN);
}
function adminLogout() {
    sessionStorage.removeItem(KEY_ADMIN_TOKEN);
    window.location.href = PAGE_LOGIN;
}

// --- WEBSITE LOGIC ---
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
            const d = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
            badge = `<span class="discount-badge">-${d}%</span>`;
        }
        let img = p.image ? `<img src="${p.image}" alt="${p.name}">` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#555;"><i class="fas fa-tshirt" style="font-size:3em;"></i></div>`;
        return `<div class="product-card">${badge}<div class="product-image">${img}</div><div class="product-info"><h3>${p.name}</h3><div class="price-container">${priceHTML}</div><div class="product-actions"><button onclick="addToCart('${p.id}')" class="btn secondary-btn">Add</button><button onclick="buyNow('${p.id}')" class="btn primary-btn">Buy</button></div></div></div>`;
    }).join('') : '<p style="text-align:center;width:100%;color:#777;">No products.</p>';
}

window.addToCart = (id) => {
    const p = getStorage(KEY_PRODUCTS).find(x => x.id == id);
    if (p) { 
        let c = getStorage(KEY_CART); 
        let ex = c.find(x => x.id == id);
        if(ex) ex.qty++; else c.push({...p, qty:1});
        if(setStorage(KEY_CART, c)) { updateCartCount(); alert('Added to Cart!'); }
    }
};
window.buyNow = (id) => { window.addToCart(id); window.location.href = 'checkout.html'; };

function loadCartDisplay() {
    const c = document.querySelector('.cart-items'); const t = document.getElementById('cart-total');
    if(!c) return; const cart = getStorage(KEY_CART);
    if(cart.length===0) { c.innerHTML='<p style="text-align:center;color:#aaa;">Empty Cart</p>'; if(t) t.innerText='0'; document.querySelector('.checkout-btn').style.display='none'; return; }
    c.innerHTML = cart.map((x,i)=>`<div class="cart-item"><div style="display:flex;gap:10px;align-items:center"><img src="${x.image||''}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;background:#333;"><div><h4>${x.name}</h4><p>৳${x.price} x ${x.qty}</p><div class="qty-controls"><button class="qty-btn" onclick="upQty(${i},-1)">-</button><span>${x.qty}</span><button class="qty-btn" onclick="upQty(${i},1)">+</button></div></div></div><div style="text-align:right;"><p style="font-weight:bold;color:#ff9f43;">৳${x.price*x.qty}</p><button onclick="rmC(${i})" style="color:red;background:none;border:none;cursor:pointer;margin-top:5px;">Remove</button></div></div>`).join('');
    if(t) t.innerText = cart.reduce((s, i) => s + (i.price * i.qty), 0);
}
window.upQty = (i, v) => { let c=getStorage(KEY_CART); c[i].qty+=v; if(c[i].qty<1) { if(confirm("Remove?")) c.splice(i,1); else c[i].qty=1; } setStorage(KEY_CART, c); loadCartDisplay(); updateCartCount(); };
window.rmC = (i) => { let c=getStorage(KEY_CART); c.splice(i,1); setStorage(KEY_CART, c); loadCartDisplay(); updateCartCount(); };

function handleCheckoutForm() {
    const f = document.getElementById('checkout-form');
    if(f) {
        f.onsubmit = (e) => {
            e.preventDefault();
            const c = getStorage(KEY_CART);
            if(c.length===0) return alert('Cart Empty');
            let cnt = parseInt(localStorage.getItem(KEY_ORDER_COUNT))||0; cnt++; localStorage.setItem(KEY_ORDER_COUNT, cnt);
            const ord = { id: 'ORD-'+String(cnt).padStart(3,'0'), date: new Date().toLocaleDateString(), customer: {name: e.target.name.value, phone: e.target.phone.value, address: e.target.address.value}, items: c, total: c.reduce((s,i)=>s+(i.price*i.qty),0), status: 'Pending' };
            const orders = getStorage(KEY_ORDERS); orders.unshift(ord); 
            if(setStorage(KEY_ORDERS, orders)) {
                setStorage(KEY_CART, []); updateCartCount();
                alert('Confirmed! ID: '+ord.id); window.location.href='index.html';
            }
        };
    }
}
function loadCartSummaryForCheckout() { const el=document.getElementById('checkout-total'); if(el) { const c=getStorage(KEY_CART); el.innerText=c.reduce((s,i)=>s+(i.price*i.qty),0); }}
function handleContactForm() { const f=document.getElementById('contact-form'); if(f) f.onsubmit=(e)=>{ e.preventDefault(); const m={id:Date.now(), date:new Date().toLocaleDateString(), name:e.target.name.value, email:e.target.email.value, subject:e.target.subject.value, text:e.target.message.value, isRead:false}; const ms=getStorage(KEY_MESSAGES); ms.unshift(m); if(setStorage(KEY_MESSAGES, ms)){ e.target.reset(); alert('Sent!'); } }; }

// --- ADMIN LOGIC ---
function initAdminDashboard() {
    const o = getStorage(KEY_ORDERS);
    const p = getStorage(KEY_PRODUCTS);
    const rev = o.filter(x => x.status === 'Delivered').reduce((s, i) => s + parseFloat(i.total), 0);
    const setT = (id, v) => { if(document.getElementById(id)) document.getElementById(id).innerText = v; };
    setT('stat-revenue', '৳ ' + rev);
    setT('stat-pending', o.filter(x => x.status === 'Pending').length);
    setT('stat-shipped', o.filter(x => x.status === 'Shipped').length);
    setT('stat-delivered', o.filter(x => x.status === 'Delivered').length);
    setT('stat-cancelled', o.filter(x => x.status === 'Cancelled').length);
    setT('stat-products', p.length);
}

function initAdminProducts() {
    const form = document.getElementById('add-product-form');
    const tbody = document.querySelector('#product-table tbody');
    const render = () => {
        const p = getStorage(KEY_PRODUCTS);
        tbody.innerHTML = p.length ? p.map((x, i) => `<tr><td><img src="${x.image||''}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;"></td><td>${x.name} ${x.isNewArrival?'<span style="color:#2ecc71;">(New)</span>':''}</td><td>৳ ${x.price}</td><td><button onclick="delProd(${i})" style="color:red;border:none;background:none;cursor:pointer;">Del</button></td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;">Empty</td></tr>';
        document.getElementById('current-product-count').innerText = p.length;
    };
    render();
    if(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const file = e.target.image.files[0];
            const reader = new FileReader();
            const save = (imgData) => {
                const p = getStorage(KEY_PRODUCTS);
                p.push({ id: Date.now(), name: e.target.name.value, price: parseFloat(e.target.price.value), originalPrice: e.target.oldPrice.value ? parseFloat(e.target.oldPrice.value) : null, isNewArrival: e.target.isNew.checked, image: imgData });
                if(setStorage(KEY_PRODUCTS, p)) { e.target.reset(); render(); alert('Added!'); }
            };
            if(file) { reader.onload = (ev) => save(ev.target.result); reader.readAsDataURL(file); } else save(null);
        });
    }
    window.delProd = (i) => { if(confirm('Del?')) { const p = getStorage(KEY_PRODUCTS); p.splice(i, 1); setStorage(KEY_PRODUCTS, p); render(); } };
}

// [FIXED] Order Tabs Logic
function initAdminOrders() {
    const tbody = document.querySelector('#orders-table tbody');
    let currentFilter = 'All';

    const render = () => {
        const allOrders = getStorage(KEY_ORDERS);
        const list = currentFilter === 'All' ? allOrders : allOrders.filter(o => o.status === currentFilter);

        // Highlight Buttons Logic Fixed
        document.querySelectorAll('.filter-btn').forEach(btn => {
            const btnText = btn.innerText.trim();
            // Check button text against currentFilter mapping
            // Button 'Completed' maps to 'Delivered' status
            let isActive = false;
            if (currentFilter === 'All' && btnText === 'All') isActive = true;
            else if (currentFilter === 'Pending' && btnText === 'Pending') isActive = true;
            else if (currentFilter === 'Shipped' && btnText === 'Shipped') isActive = true;
            else if (currentFilter === 'Delivered' && btnText === 'Completed') isActive = true;
            else if (currentFilter === 'Cancelled' && btnText === 'Cancelled') isActive = true;

            if (isActive) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        if (list.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No Orders Found</td></tr>'; return; }

        tbody.innerHTML = list.map(o => {
            const idx = allOrders.findIndex(x => x.id === o.id);
            let color = '#ff9f43'; if(o.status==='Shipped')color='#3498db'; if(o.status==='Delivered')color='#2ecc71'; if(o.status==='Cancelled')color='#e74c3c';
            return `<tr><td>${o.id}</td><td>${o.customer.name}</td><td>৳ ${o.total}</td><td><select onchange="upStat(${idx},this.value)" style="color:${color};background:#222;border:1px solid ${color}"><option ${o.status==='Pending'?'selected':''}>Pending</option><option ${o.status==='Shipped'?'selected':''}>Shipped</option><option ${o.status==='Delivered'?'selected':''}>Delivered</option><option ${o.status==='Cancelled'?'selected':''}>Cancelled</option></select></td><td><button onclick="viewOrd('${o.id}')" style="color:#fff;background:none;border:none;cursor:pointer;">View</button></td></tr>`;
        }).join('');
    };
    render();

    window.filterOrders = (s) => { currentFilter = s; render(); };
    window.upStat = (i, v) => { const o = getStorage(KEY_ORDERS); o[i].status = v; setStorage(KEY_ORDERS, o); render(); };
    window.viewOrd = (id) => { const o = getStorage(KEY_ORDERS).find(x => x.id === id); if(!o) return; const its = o.items.map(i=>`- ${i.name} x${i.qty} (৳${i.price})`).join('\n'); alert(`ORDER: ${o.id}\n${o.customer.name}\n${o.customer.phone}\n${o.customer.address}\n\n${its}\nTotal: ৳${o.total}`); };
}

function initAdminMessages() {
    const tbody = document.querySelector('#messages-table tbody');
    let viewMode = 'New'; 
    const render = () => {
        const allMsgs = getStorage(KEY_MESSAGES);
        const list = viewMode === 'New' ? allMsgs.filter(m => !m.isRead) : allMsgs.filter(m => m.isRead);
        
        document.querySelectorAll('.filter-btn').forEach(b => {
            if(b.innerText.includes(viewMode)) b.classList.add('active'); else b.classList.remove('active');
        });

        if (list.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No Messages</td></tr>'; }
        else {
            tbody.innerHTML = list.map(m => {
                const idx = allMsgs.findIndex(x => x.id === m.id);
                return `<tr><td>${m.date}</td><td>${m.name}<br><small style="color:#aaa;">${m.email}</small></td><td>${m.subject}</td><td>${m.text}</td><td>${!m.isRead?`<button onclick="mkRead(${idx})" style="color:green;background:none;border:none;cursor:pointer;">Read</button>`:''}<button onclick="delMsg(${idx})" style="color:red;background:none;border:none;cursor:pointer;">Del</button></td></tr>`;
            }).join('');
        }
    };
    render();
    window.filterMsgs = (m) => { viewMode = m; render(); };
    window.mkRead = (i) => { const m = getStorage(KEY_MESSAGES); m[i].isRead = true; setStorage(KEY_MESSAGES, m); render(); };
    window.delMsg = (i) => { if(confirm('Delete?')) { const m=getStorage(KEY_MESSAGES); m.splice(i,1); setStorage(KEY_MESSAGES, m); render(); }};
}
