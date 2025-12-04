// script.js - Updated with Contact Form & Message Logic

// --- KEYS ---
const KEY_PRODUCTS = 'lynex_products';
const KEY_CART = 'lynex_cart';
const KEY_ORDERS = 'lynex_orders';
const KEY_MESSAGES = 'lynex_messages'; // নতুন কী
const KEY_ADMIN_LOGGED = 'lynex_admin_logged';
const KEY_ORDER_COUNT = 'lynex_order_count';

document.addEventListener('DOMContentLoaded', function() {
    
    // Navigation & Cart Init
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle) menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    updateCartCount();

    // Routing Logic
    const path = window.location.pathname;
    const page = path.split("/").pop(); 
    
    // Website Pages
    if (page === 'index.html' || page === '' || page === 'products.html') {
        loadProductsDisplay(page === 'index.html' || page === '');
    } else if (page === 'cart.html') {
        loadCartDisplay();
    } else if (page === 'checkout.html') {
        handleCheckoutForm();
        loadCartSummaryForCheckout();
    } else if (page === 'contact.html') {
        handleContactForm(); // নতুন ফাংশন কল
    }
    
    // Admin Pages
    else if (page.includes('admin_') && !page.includes('login')) {
        checkAdminAuth();
        if (page.includes('dashboard')) initAdminDashboard();
        if (page.includes('products')) initAdminProducts();
        if (page.includes('orders')) initAdminOrders();
        if (page.includes('messages')) initAdminMessages(); // নতুন অ্যাডমিন ফাংশন
    }
    
    // Login Handler
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
    document.querySelectorAll('.cart-count').forEach(el => el.innerText = `(${cart.length})`);
}

// --- WEBSITE LOGIC ---

// 1. Contact Form Handler (New)
function handleContactForm() {
    const form = document.getElementById('contact-form');
    if(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const message = {
                id: Date.now(),
                date: new Date().toLocaleDateString(),
                name: e.target.name.value,
                email: e.target.email.value,
                subject: e.target.subject.value,
                text: e.target.message.value
            };
            
            const messages = getStorage(KEY_MESSAGES);
            messages.unshift(message); // Add to top
            setStorage(KEY_MESSAGES, messages);
            
            e.target.reset();
            alert('আপনার বার্তা সফলভাবে পাঠানো হয়েছে!');
        });
    }
}

// 2. Product Display
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
                    <button onclick="addToCart(${p.id})" class="btn secondary-btn" style="flex:1;">Add</button>
                    <button onclick="buyNow(${p.id})" class="btn primary-btn" style="flex:1;">Buy</button>
                </div>
            </div>
        </div>`;
    }).join('') : '<p style="text-align:center; width:100%; color:#777;">No products available.</p>';
}

// Add to Cart & Buy Now
window.addToCart = (id) => {
    const p = getStorage(KEY_PRODUCTS).find(x => x.id == id);
    if(p) { 
        const c = getStorage(KEY_CART); c.push(p); setStorage(KEY_CART, c); 
        updateCartCount(); alert('Added to cart!'); 
    }
};
window.buyNow = (id) => { window.addToCart(id); window.location.href = 'checkout.html'; };

// Cart Display
function loadCartDisplay() {
    const container = document.querySelector('.cart-items');
    const totalEl = document.getElementById('cart-total');
    if(!container) return;
    const cart = getStorage(KEY_CART);
    container.innerHTML = cart.length ? cart.map((item, i) => `
        <div class="cart-item">
            <div style="display:flex; align-items:center; gap:15px;">
                ${item.image ? `<img src="${item.image}" style="width:50px; height:50px; object-fit:cover;">` : `<i class="fas fa-tshirt"></i>`}
                <div><h4>${item.name}</h4><p>৳ ${item.price}</p></div>
            </div>
            <button onclick="removeFromCart(${i})" style="color:#e74c3c; background:none; border:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
        </div>`).join('') : '<p style="text-align:center;">Cart is empty.</p>';
    if(totalEl) totalEl.innerText = cart.reduce((s, i) => s + parseFloat(i.price), 0);
}
window.removeFromCart = (i) => { const c = getStorage(KEY_CART); c.splice(i, 1); setStorage(KEY_CART, c); loadCartDisplay(); updateCartCount(); };

// Checkout
function handleCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const cart = getStorage(KEY_CART);
            if(cart.length === 0) { alert("Cart Empty"); return; }
            
            let count = parseInt(localStorage.getItem(KEY_ORDER_COUNT)) || 0;
            count++; localStorage.setItem(KEY_ORDER_COUNT, count);
            
            const order = {
                id: 'ORD-' + String(count).padStart(3, '0'),
                date: new Date().toLocaleDateString(),
                customer: { name: e.target.name.value, phone: e.target.phone.value, address: e.target.address.value },
                items: cart,
                total: cart.reduce((s, i) => s + parseFloat(i.price), 0),
                status: 'Pending'
            };
            const orders = getStorage(KEY_ORDERS); orders.unshift(order); setStorage(KEY_ORDERS, orders);
            setStorage(KEY_CART, []);
            alert('Order Placed: ' + order.id); window.location.href = 'index.html';
        });
    }
}
function loadCartSummaryForCheckout() {
    const el = document.getElementById('checkout-total');
    if(el) { const c = getStorage(KEY_CART); el.innerText = c.reduce((s, i) => s + parseFloat(i.price), 0); }
}

// --- ADMIN LOGIC ---

function checkAdminAuth() { if (!sessionStorage.getItem(KEY_ADMIN_LOGGED)) window.location.href = 'admin_login.html'; }

// Admin Messages (New)
function initAdminMessages() {
    const tbody = document.querySelector('#messages-table tbody');
    const messages = getStorage(KEY_MESSAGES);
    tbody.innerHTML = messages.length ? messages.map((m, i) => `
        <tr>
            <td>${m.date}</td>
            <td>${m.name}<br><small>${m.email}</small></td>
            <td>${m.subject}</td>
            <td>${m.text}</td>
            <td><button onclick="deleteMessage(${i})" style="color:#e74c3c; background:none; border:none; cursor:pointer;">Delete</button></td>
        </tr>`).join('') : '<tr><td colspan="5" style="text-align:center;">No messages.</td></tr>';
    
    window.deleteMessage = (i) => {
        if(confirm('Delete?')) {
            const m = getStorage(KEY_MESSAGES); m.splice(i, 1); setStorage(KEY_MESSAGES, m); initAdminMessages();
        }
    };
}

// Admin Products
function initAdminProducts() {
    const form = document.getElementById('add-product-form');
    const tbody = document.querySelector('#product-table tbody');
    const renderTable = () => {
        const p = getStorage(KEY_PRODUCTS);
        tbody.innerHTML = p.length ? p.map((x, i) => `
            <tr>
                <td><img src="${x.image || ''}" style="width:40px; height:40px; object-fit:cover;"></td>
                <td>${x.name}</td>
                <td>৳ ${x.price}</td>
                <td><button onclick="deleteProduct(${i})" style="color:#e74c3c; background:none; border:none; cursor:pointer;">Del</button></td>
            </tr>`).join('') : '<tr><td colspan="4" style="text-align:center;">Empty</td></tr>';
        document.getElementById('current-product-count').innerText = p.length;
    };
    renderTable();

    if(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const file = e.target.image.files[0];
            const reader = new FileReader();
            const save = (img) => {
                const p = getStorage(KEY_PRODUCTS);
                p.push({
                    id: Date.now(),
                    name: e.target.name.value,
                    price: parseFloat(e.target.price.value),
                    originalPrice: e.target.oldPrice.value ? parseFloat(e.target.oldPrice.value) : null,
                    isNewArrival: e.target.isNew.checked,
                    image: img
                });
                setStorage(KEY_PRODUCTS, p); e.target.reset(); renderTable(); alert('Added!');
            };
            if(file) { reader.onload = (ev) => save(ev.target.result); reader.readAsDataURL(file); } else save(null);
        });
    }
    window.deleteProduct = (i) => { if(confirm('Delete?')) { const p = getStorage(KEY_PRODUCTS); p.splice(i, 1); setStorage(KEY_PRODUCTS, p); renderTable(); }};
}

// Admin Orders
function initAdminOrders() {
    const tbody = document.querySelector('#orders-table tbody');
    let filter = 'All';
    const render = () => {
        const all = getStorage(KEY_ORDERS);
        const list = filter === 'All' ? all : all.filter(x => x.status === filter);
        tbody.innerHTML = list.length ? list.map(o => {
            const idx = all.findIndex(x => x.id === o.id);
            let c = o.status==='Pending'?'#ff9f43':o.status==='Delivered'?'#2ecc71':'#3498db';
            return `<tr>
                <td>${o.id}</td><td>${o.customer.name}</td><td>৳ ${o.total}</td>
                <td><select onchange="upStat(${idx}, this.value)" style="color:${c}; background:#222; border:1px solid ${c};">
                    <option ${o.status==='Pending'?'selected':''}>Pending</option>
                    <option ${o.status==='Shipped'?'selected':''}>Shipped</option>
                    <option ${o.status==='Delivered'?'selected':''}>Delivered</option>
                    <option ${o.status==='Cancelled'?'selected':''}>Cancelled</option>
                </select></td>
                <td><button onclick="viewOrd('${o.id}')" style="color:#fff; background:none; border:none; cursor:pointer;">View</button></td>
            </tr>`;
        }).join('') : '<tr><td colspan="5" style="text-align:center;">No orders</td></tr>';
    };
    render();
    window.filterOrders = (s) => { filter = s; render(); };
    window.upStat = (i, s) => { const o = getStorage(KEY_ORDERS); o[i].status = s; setStorage(KEY_ORDERS, o); render(); };
    window.viewOrd = (id) => {
        const o = getStorage(KEY_ORDERS).find(x => x.id === id);
        alert(`ID: ${o.id}\nCustomer: ${o.customer.name} (${o.customer.phone})\nAddress: ${o.customer.address}\nTotal: ৳ ${o.total}`);
    };
}

// Admin Dashboard
function initAdminDashboard() {
    const o = getStorage(KEY_ORDERS);
    const rev = o.filter(x => x.status === 'Delivered').reduce((s, i) => s + parseFloat(i.total), 0);
    document.getElementById('stat-revenue').innerText = '৳ ' + rev;
    document.getElementById('stat-pending').innerText = o.filter(x => x.status === 'Pending').length;
    document.getElementById('stat-delivered').innerText = o.filter(x => x.status === 'Delivered').length;
    document.getElementById('stat-cancelled').innerText = o.filter(x => x.status === 'Cancelled').length;
    document.getElementById('stat-products').innerText = getStorage(KEY_PRODUCTS).length;
}
