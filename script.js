// ======================================================
// LYNEX MAIN SCRIPT (SECURED VERSION)
// Features: Input Sanitization, Session Security, Data Encoding
// ======================================================

// --- KEYS ---
const KEY_PRODUCTS = 'lynex_products';
const KEY_CART = 'lynex_cart';
const KEY_ORDERS = 'lynex_orders';
const KEY_MESSAGES = 'lynex_messages';
const KEY_ADMIN_TOKEN = 'lynex_admin_token'; // Changed from simple logged flag
const KEY_ORDER_COUNT = 'lynex_order_count';

// --- SECURITY UTILS ---

// 1. Input Sanitization (To prevent XSS attacks)
// ব্যবহারকারী কোনো স্ক্রিপ্ট কোড ইনপুট দিলে তা টেক্সটে কনভার্ট করবে
function sanitizeInput(str) {
    if (typeof str !== 'string') return str;
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
}

// 2. Simple Token Generator (For Admin Session)
function generateToken() {
    return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function() {
    
    // Nav Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle) menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    
    updateCartCount();

    // Routing
    const path = window.location.pathname;
    const page = path.split("/").pop(); 

    // Public Pages
    if (page === 'index.html' || page === '') loadProductsDisplay(true);
    else if (page === 'products.html') loadProductsDisplay(false);
    else if (page === 'cart.html') loadCartDisplay();
    else if (page === 'checkout.html') { handleCheckoutForm(); loadCartSummaryForCheckout(); }
    else if (page === 'contact.html') handleContactForm();
    
    // Admin Pages Security Check
    else if (page.includes('admin_') && !page.includes('login')) {
        if (!checkAdminAuth()) {
            // যদি অথেন্টিকেশন ফেইল করে, লগইনে পাঠাবে এবং বাকি কোড রান করবে না
            return; 
        }
        
        // অ্যাডমিন সাইডবার আপডেট
        updateAdminSidebarBadges();

        if (page.includes('dashboard')) initAdminDashboard();
        if (page.includes('products')) initAdminProducts();
        if (page.includes('orders')) initAdminOrders();
        if (page.includes('messages')) initAdminMessages();
    }
    
    // Admin Login
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        // যদি অলরেডি লগইন করা থাকে, ড্যাশবোর্ডে পাঠাবে
        if(sessionStorage.getItem(KEY_ADMIN_TOKEN)) {
            window.location.href = 'admin_dashboard.html';
        }

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const u = sanitizeInput(e.target.username.value); // Sanitize
            const p = e.target.password.value;
            
            // Hardcoded Credentials (In real app, this goes to server)
            if (u === 'hasanbro' && p === 'hasanbro998800') {
                const token = generateToken();
                sessionStorage.setItem(KEY_ADMIN_TOKEN, token);
                window.location.href = 'admin_dashboard.html';
            } else {
                alert('Invalid Username or Password!');
            }
        });
    }
});

// --- HELPER FUNCTIONS ---
function getStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Data integrity error", e);
        return [];
    }
}

function setStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function updateCartCount() {
    const cart = getStorage(KEY_CART);
    const totalQty = cart.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0);
    document.querySelectorAll('.cart-count').forEach(el => el.innerText = `(${totalQty})`);
}

// --- ADMIN SECURITY CHECK ---
function checkAdminAuth() {
    const token = sessionStorage.getItem(KEY_ADMIN_TOKEN);
    if (!token) {
        // সিকিউরিটির জন্য সরাসরি উইন্ডো রিপ্লেস করা
        window.location.replace('admin_login.html');
        return false;
    }
    return true;
}

function logoutAdmin() {
    sessionStorage.removeItem(KEY_ADMIN_TOKEN);
    window.location.href = 'admin_login.html';
}

// Attach logout to logout button dynamically to avoid inline JS issues
const logoutBtn = document.querySelector('a[href="admin_login.html"]');
if(logoutBtn && window.location.pathname.includes('admin_')) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logoutAdmin();
    });
}

// --- NOTIFICATIONS ---
function updateAdminSidebarBadges() {
    const orders = getStorage(KEY_ORDERS);
    const msgs = getStorage(KEY_MESSAGES);
    
    // Safe check
    if(!Array.isArray(orders) || !Array.isArray(msgs)) return;

    const hasPending = orders.some(o => o.status === 'Pending');
    const hasUnread = msgs.some(m => !m.isRead);
    
    const orderLink = document.getElementById('nav-orders');
    const msgLink = document.getElementById('nav-messages');

    if(hasPending && orderLink && !window.location.pathname.includes('admin_orders')) {
        if(!orderLink.querySelector('.nav-badge')) orderLink.innerHTML += ' <span class="nav-badge"></span>';
    }
    
    if(hasUnread && msgLink && !window.location.pathname.includes('admin_messages')) {
        if(!msgLink.querySelector('.nav-badge')) msgLink.innerHTML += ' <span class="nav-badge"></span>';
    }
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
        // Safe access to properties
        const price = parseFloat(p.price) || 0;
        const oldPrice = parseFloat(p.originalPrice) || 0;
        const name = sanitizeInput(p.name); // Sanitize Name

        let priceHTML = `<span class="current-price">৳ ${price}</span>`;
        let badgeHTML = '';
        
        if (oldPrice > price) {
            priceHTML = `<span class="old-price">৳ ${oldPrice}</span> <span class="current-price">৳ ${price}</span>`;
            const discount = Math.round(((oldPrice - price) / oldPrice) * 100);
            badgeHTML = `<span class="discount-badge">-${discount}%</span>`;
        }
        let imgHTML = p.image ? `<img src="${p.image}" alt="${name}">` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#555;"><i class="fas fa-tshirt" style="font-size:3em;"></i></div>`;

        return `
        <div class="product-card">
            ${badgeHTML}
            <div class="product-image">${imgHTML}</div>
            <div class="product-info">
                <h3>${name}</h3>
                <div class="price-container">${priceHTML}</div>
                <div class="product-actions">
                    <button onclick="addToCart('${p.id}')" class="btn secondary-btn">Add to Cart</button>
                    <button onclick="buyNow('${p.id}')" class="btn primary-btn">Buy Now</button>
                </div>
            </div>
        </div>`;
    }).join('') : '<p style="text-align:center;width:100%;color:#777;">No products available.</p>';
}

window.addToCart = function(id) {
    const products = getStorage(KEY_PRODUCTS);
    const product = products.find(p => p.id == id);
    if (product) {
        let cart = getStorage(KEY_CART);
        const existingItem = cart.find(item => item.id == id);
        if (existingItem) existingItem.qty += 1; else cart.push({ ...product, qty: 1 });
        setStorage(KEY_CART, cart);
        updateCartCount();
        alert('Product added to cart!');
    }
};
window.buyNow = (id) => { window.addToCart(id); window.location.href = 'checkout.html'; };

function loadCartDisplay() {
    const container = document.querySelector('.cart-items');
    const totalEl = document.getElementById('cart-total');
    if (!container) return;
    const cart = getStorage(KEY_CART);
    
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px; color:#aaa;">Your cart is empty.</p>';
        if(totalEl) totalEl.innerText = '0';
        const btn = document.querySelector('.checkout-btn'); if(btn) btn.style.display = 'none';
        return;
    }

    let totalAmount = 0;
    container.innerHTML = cart.map((item, index) => {
        const price = parseFloat(item.price);
        const qty = parseInt(item.qty);
        totalAmount += (price * qty);
        const name = sanitizeInput(item.name);
        
        let imgDisplay = item.image ? `<img src="${item.image}" style="width:60px; height:60px; object-fit:cover; border-radius:4px;">` : `<div style="width:60px; height:60px; background:#333;"></div>`;

        return `
        <div class="cart-item">
            <div class="cart-item-info">
                ${imgDisplay}
                <div>
                    <h4 style="margin:0; font-size:1em; color:#fff;">${name}</h4>
                    <p style="margin:5px 0; color:#aaa; font-size:0.9em;">৳ ${price} x ${qty}</p>
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
                        <span style="color:#fff;">${qty}</span>
                        <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
                    </div>
                </div>
            </div>
            <div style="text-align:right;">
                <p style="font-weight:bold; color:#ff9f43;">৳ ${price * qty}</p>
                <button onclick="removeFromCart(${index})" style="color:#e74c3c; background:none; border:none; cursor:pointer; margin-top:5px; font-size:0.9em;">Remove</button>
            </div>
        </div>`;
    }).join('');
    if(totalEl) totalEl.innerText = totalAmount;
}

window.updateQty = function(index, change) {
    let cart = getStorage(KEY_CART);
    cart[index].qty += change;
    if (cart[index].qty <= 0) { if(confirm("Remove item?")) cart.splice(index, 1); else cart[index].qty = 1; }
    setStorage(KEY_CART, cart); loadCartDisplay(); updateCartCount();
};
window.removeFromCart = function(index) {
    let cart = getStorage(KEY_CART); cart.splice(index, 1); setStorage(KEY_CART, cart); loadCartDisplay(); updateCartCount();
};

function handleCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            const cart = getStorage(KEY_CART);
            if(cart.length === 0) { alert("Cart is empty!"); return; }

            let count = parseInt(localStorage.getItem(KEY_ORDER_COUNT)) || 0; count++; 
            localStorage.setItem(KEY_ORDER_COUNT, count);
            const orderId = 'ORD-' + String(count).padStart(3, '0');
            const total = cart.reduce((s, i) => s + (parseFloat(i.price) * parseInt(i.qty)), 0);

            // Sanitize Input Data
            const order = {
                id: orderId,
                date: new Date().toLocaleDateString(),
                customer: {
                    name: sanitizeInput(e.target.name.value),
                    phone: sanitizeInput(e.target.phone.value),
                    address: sanitizeInput(e.target.address.value)
                },
                items: cart,
                total: total,
                status: 'Pending'
            };

            const orders = getStorage(KEY_ORDERS);
            orders.unshift(order);
            setStorage(KEY_ORDERS, orders);
            setStorage(KEY_CART, []);
            updateCartCount();

            alert(`Order Confirmed!\nID: ${orderId}\nWe will contact you soon.`);
            window.location.href = 'index.html';
        };
    }
}
function loadCartSummaryForCheckout() { 
    const el = document.getElementById('checkout-total'); 
    if(el) { 
        const c = getStorage(KEY_CART); 
        el.innerText = c.reduce((s, i) => s + (parseFloat(i.price) * parseInt(i.qty)), 0); 
    }
}

function handleContactForm() {
    const form = document.getElementById('contact-form');
    if(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const msg = {
                id: Date.now(),
                date: new Date().toLocaleDateString(),
                name: sanitizeInput(e.target.name.value),
                email: sanitizeInput(e.target.email.value),
                subject: sanitizeInput(e.target.subject.value),
                text: sanitizeInput(e.target.message.value),
                isRead: false
            };
            const msgs = getStorage(KEY_MESSAGES);
            msgs.unshift(msg);
            setStorage(KEY_MESSAGES, msgs);
            e.target.reset();
            alert('Message Sent Successfully!');
        });
    }
}

// --- ADMIN LOGIC ---

// Dashboard
function initAdminDashboard() {
    const orders = getStorage(KEY_ORDERS);
    const products = getStorage(KEY_PRODUCTS);
    const delivered = orders.filter(o => o.status === 'Delivered');
    const revenue = delivered.reduce((sum, o) => sum + parseFloat(o.total), 0);

    const setVal = (id, v) => { if(document.getElementById(id)) document.getElementById(id).innerText = v; };
    setVal('stat-revenue', '৳ ' + revenue);
    setVal('stat-pending', orders.filter(o => o.status === 'Pending').length);
    setVal('stat-shipped', orders.filter(o => o.status === 'Shipped').length);
    setVal('stat-delivered', delivered.length);
    setVal('stat-cancelled', orders.filter(o => o.status === 'Cancelled').length);
    setVal('stat-products', products.length);
}

// Products
function initAdminProducts() {
    const form = document.getElementById('add-product-form');
    const tbody = document.querySelector('#product-table tbody');

    const renderTable = () => {
        const products = getStorage(KEY_PRODUCTS);
        if (products.length === 0) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No Products</td></tr>'; document.getElementById('current-product-count').innerText = 0; return; }
        
        tbody.innerHTML = products.map((p, i) => `
            <tr>
                <td><img src="${p.image || ''}" style="width:40px;height:40px;object-fit:cover;background:#333;border-radius:4px;"></td>
                <td>${p.name} ${p.isNewArrival ? '<span style="color:#2ecc71;">(New)</span>' : ''}</td>
                <td>৳ ${p.price}</td>
                <td><button onclick="deleteProduct(${i})" style="color:#e74c3c;background:none;border:none;cursor:pointer;">Delete</button></td>
            </tr>`).join('');
        document.getElementById('current-product-count').innerText = products.length;
    };
    renderTable();

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const file = e.target.image.files[0];
            const reader = new FileReader();
            const save = (imgData) => {
                const p = getStorage(KEY_PRODUCTS);
                p.push({
                    id: Date.now(),
                    name: sanitizeInput(e.target.name.value),
                    price: parseFloat(e.target.price.value),
                    originalPrice: e.target.oldPrice.value ? parseFloat(e.target.oldPrice.value) : null,
                    isNewArrival: e.target.isNew.checked,
                    image: imgData
                });
                setStorage(KEY_PRODUCTS, p); e.target.reset(); renderTable(); alert('Product Added!');
            };
            if (file) { reader.onload = (ev) => save(ev.target.result); reader.readAsDataURL(file); } else save(null);
        });
    }
    window.deleteProduct = (i) => { if (confirm('Are you sure?')) { const p = getStorage(KEY_PRODUCTS); p.splice(i, 1); setStorage(KEY_PRODUCTS, p); renderTable(); } };
}

// Orders
function initAdminOrders() {
    const tbody = document.querySelector('#orders-table tbody');
    let currentFilter = 'All';

    const render = () => {
        const allOrders = getStorage(KEY_ORDERS);
        const filtered = currentFilter === 'All' ? allOrders : allOrders.filter(o => o.status === currentFilter);

        if (filtered.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No Orders</td></tr>'; return; }

        tbody.innerHTML = filtered.map(o => {
            const realIdx = allOrders.findIndex(x => x.id === o.id);
            let color = '#ff9f43'; if(o.status==='Shipped')color='#3498db'; if(o.status==='Delivered')color='#2ecc71'; if(o.status==='Cancelled')color='#e74c3c';
            
            return `<tr><td>${o.id}</td><td>${o.customer.name}</td><td>৳ ${o.total}</td>
            <td><select onchange="updateStatus(${realIdx}, this.value)" style="color:${color};border:1px solid ${color};background:#222;"><option value="Pending" ${o.status==='Pending'?'selected':''}>Pending</option><option value="Shipped" ${o.status==='Shipped'?'selected':''}>Shipped</option><option value="Delivered" ${o.status==='Delivered'?'selected':''}>Delivered</option><option value="Cancelled" ${o.status==='Cancelled'?'selected':''}>Cancelled</option></select></td>
            <td><button onclick="viewOrder('${o.id}')" style="color:#fff;background:none;border:none;cursor:pointer;">View</button></td></tr>`;
        }).join('');
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.innerText.includes(currentFilter)));
    };
    render();
    window.filterOrders = (s) => { currentFilter = s; render(); };
    window.updateStatus = (i, v) => { const o = getStorage(KEY_ORDERS); o[i].status = v; setStorage(KEY_ORDERS, o); render(); };
    window.viewOrder = (id) => { const o = getStorage(KEY_ORDERS).find(x => x.id === id); const its = o.items.map(i=>`- ${i.name} x${i.qty} (৳${i.price})`).join('\n'); alert(`ORDER ID: ${o.id}\nInfo: ${o.customer.name}, ${o.customer.phone}\nAddr: ${o.customer.address}\n\nItems:\n${its}\nTotal: ৳${o.total}`); };
}

// Messages
function initAdminMessages() {
    const tbody = document.querySelector('#messages-table tbody');
    let viewMode = 'New';
    const render = () => {
        const allMsgs = getStorage(KEY_MESSAGES);
        const list = viewMode === 'New' ? allMsgs.filter(m => !m.isRead) : allMsgs.filter(m => m.isRead);
        
        if(list.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No Messages</td></tr>'; }
        else {
            tbody.innerHTML = list.map(m => {
                const idx = allMsgs.findIndex(x => x.id === m.id);
                return `<tr><td>${m.date}</td><td>${m.name}<br><small style="color:#aaa;">${m.email}</small></td><td>${m.subject}</td><td>${m.text}</td><td>${!m.isRead?`<button onclick="mkRead(${idx})" style="color:green;margin-right:5px;cursor:pointer;background:none;border:none;">Mark Read</button>`:''}<button onclick="delMsg(${idx})" style="color:red;background:none;border:none;cursor:pointer;">Del</button></td></tr>`;
            }).join('');
        }
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.innerText.includes(viewMode)));
    };
    render();
    window.filterMsgs = (m) => { viewMode = m; render(); };
    window.mkRead = (i) => { const m = getStorage(KEY_MESSAGES); m[i].isRead = true; setStorage(KEY_MESSAGES, m); render(); };
    window.delMsg = (i) => { if(confirm('Delete?')) { const m=getStorage(KEY_MESSAGES); m.splice(i,1); setStorage(KEY_MESSAGES, m); render(); }};
}
