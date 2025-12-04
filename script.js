// script.js - Updated Logic

// --- LOCAL STORAGE KEYS ---
const KEY_PRODUCTS = 'lynex_products';
const KEY_CART = 'lynex_cart';
const KEY_ORDERS = 'lynex_orders';
const KEY_ADMIN_LOGGED = 'lynex_admin_logged';

document.addEventListener('DOMContentLoaded', function() {
    // Navigation
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle) menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    
    updateCartCount();

    // Routing
    const path = window.location.pathname;
    const page = path.split("/").pop();

    if (page === 'index.html' || page === '') loadHomePage(); // New Arrival Logic
    else if (page === 'products.html') loadAllProductsPage();
    else if (page === 'cart.html') loadCartDisplay();
    else if (page === 'checkout.html') { handleCheckoutForm(); loadCartSummaryForCheckout(); }
    else if (page.includes('admin_') && !page.includes('login')) {
        checkAdminAuth();
        if (page.includes('dashboard')) initAdminDashboard();
        if (page.includes('products')) initAdminProducts();
        if (page.includes('orders')) initAdminOrders();
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

// --- HELPER ---
function getStorage(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function setStorage(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function updateCartCount() {
    const cart = getStorage(KEY_CART);
    document.querySelectorAll('.cart-count').forEach(el => el.innerText = `(${cart.length})`);
}

// --- PRODUCT DISPLAY LOGIC ---

// Product Card Generator
function createProductCard(p) {
    // ডিসকাউন্ট ক্যালকুলেশন
    let priceHTML = `<span class="current-price">৳ ${p.price}</span>`;
    let discountBadge = '';
    
    if (p.originalPrice && p.originalPrice > p.price) {
        priceHTML = `
            <span class="old-price">৳ ${p.originalPrice}</span>
            <span class="current-price">৳ ${p.price}</span>
        `;
        const percent = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
        discountBadge = `<span class="discount-badge">-${percent}%</span>`;
    }

    // ছবি হ্যান্ডেলিং (যদি ছবি না থাকে ডিফল্ট আইকন)
    let imageHTML = p.image 
        ? `<img src="${p.image}" alt="${p.name}">` 
        : `<i class="fas fa-tshirt" style="font-size:3em; color:#555;"></i>`;

    return `
        <div class="product-card">
            ${discountBadge}
            <div class="product-image">${imageHTML}</div>
            <h3>${p.name}</h3>
            <div class="price-container">${priceHTML}</div>
            <button onclick="addToCart('${p.id}')" class="btn primary-btn" style="width:100%;">Add to Cart</button>
        </div>
    `;
}

// Home Page: Only New Arrivals
function loadHomePage() {
    const grid = document.querySelector('#latest-products .product-grid');
    if (!grid) return;
    const products = getStorage(KEY_PRODUCTS).filter(p => p.isNewArrival); // ফিল্টার
    grid.innerHTML = products.length ? products.map(createProductCard).join('') : '<p style="text-align:center; color:#777; width:100%;">No new arrivals yet.</p>';
}

// All Products Page
function loadAllProductsPage() {
    const grid = document.querySelector('.product-grid');
    if (!grid) return;
    const products = getStorage(KEY_PRODUCTS);
    grid.innerHTML = products.length ? products.map(createProductCard).join('') : '<p style="text-align:center;">No products available.</p>';
}

// Add to Cart
window.addToCart = function(id) {
    const product = getStorage(KEY_PRODUCTS).find(p => p.id == id);
    if (product) {
        const cart = getStorage(KEY_CART);
        cart.push(product);
        setStorage(KEY_CART, cart);
        updateCartCount();
        alert('Product added!');
    }
};

// --- ADMIN LOGIC ---

// 1. PRODUCTS MANAGEMENT (Image & Options)
function initAdminProducts() {
    const form = document.getElementById('add-product-form');
    const tableBody = document.querySelector('#product-table tbody');

    const renderTable = () => {
        const products = getStorage(KEY_PRODUCTS);
        tableBody.innerHTML = products.length ? products.map((p, i) => `
            <tr>
                <td><img src="${p.image || ''}" style="width:40px; height:40px; object-fit:cover; border-radius:4px; background:#333;"></td>
                <td>${p.name} ${p.isNewArrival ? '<span style="color:#2ecc71; font-size:0.8em;">(New)</span>' : ''}</td>
                <td>৳ ${p.price} ${p.originalPrice ? `<small style="text-decoration:line-through; color:#777;">${p.originalPrice}</small>` : ''}</td>
                <td><button onclick="deleteProduct(${i})" style="color:#e74c3c; background:none; border:none; cursor:pointer;">Delete</button></td>
            </tr>
        `).join('') : '<tr><td colspan="4" style="text-align:center;">No products</td></tr>';
        document.getElementById('current-product-count').innerText = products.length;
    };
    renderTable();

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Image processing
            const fileInput = e.target.image;
            const reader = new FileReader();

            const saveProduct = (imgData) => {
                const newProduct = {
                    id: Date.now(),
                    name: e.target.name.value,
                    price: parseFloat(e.target.price.value),
                    originalPrice: e.target.oldPrice.value ? parseFloat(e.target.oldPrice.value) : null,
                    isNewArrival: e.target.isNew.checked,
                    image: imgData
                };
                const products = getStorage(KEY_PRODUCTS);
                products.push(newProduct);
                setStorage(KEY_PRODUCTS, products);
                e.target.reset();
                renderTable();
                alert('Product Added!');
            };

            if (fileInput.files && fileInput.files[0]) {
                reader.onload = function(evt) { saveProduct(evt.target.result); };
                reader.readAsDataURL(fileInput.files[0]);
            } else {
                saveProduct(null); // No image
            }
        });
    }

    window.deleteProduct = (i) => {
        if(confirm('Delete?')) {
            const p = getStorage(KEY_PRODUCTS);
            p.splice(i, 1);
            setStorage(KEY_PRODUCTS, p);
            renderTable();
        }
    };
}

// 2. DASHBOARD (Revenue & Status Counts)
function initAdminDashboard() {
    const orders = getStorage(KEY_ORDERS);
    const products = getStorage(KEY_PRODUCTS);

    // Filter Logic
    const delivered = orders.filter(o => o.status === 'Delivered');
    const pending = orders.filter(o => o.status === 'Pending');
    const cancelled = orders.filter(o => o.status === 'Cancelled');

    // Revenue Calculation (Only Delivered)
    const revenue = delivered.reduce((sum, o) => sum + parseFloat(o.total), 0);

    // Update UI
    const setTxt = (id, val) => { if(document.getElementById(id)) document.getElementById(id).innerText = val; };
    
    setTxt('stat-revenue', '৳ ' + revenue);
    setTxt('stat-pending', pending.length);
    setTxt('stat-delivered', delivered.length);
    setTxt('stat-cancelled', cancelled.length);
    setTxt('stat-products', products.length);
}

// 3. ORDERS (Filtering)
function initAdminOrders() {
    const tableBody = document.querySelector('#orders-table tbody');
    let currentFilter = 'All';

    const renderOrders = () => {
        const allOrders = getStorage(KEY_ORDERS);
        // Filter Logic
        const orders = currentFilter === 'All' ? allOrders : allOrders.filter(o => o.status === currentFilter);

        tableBody.innerHTML = orders.length ? orders.map((o, i) => {
            // Find actual index in main array for updates
            const realIndex = allOrders.findIndex(ao => ao.id === o.id);
            let color = o.status === 'Pending' ? '#ff9f43' : o.status === 'Delivered' ? '#2ecc71' : o.status === 'Cancelled' ? '#e74c3c' : '#3498db';
            
            return `
            <tr>
                <td><small>${o.id}</small></td>
                <td>${o.customer.name}</td>
                <td>৳ ${o.total}</td>
                <td>
                    <select onchange="updateStatus(${realIndex}, this.value)" style="color:${color}; border:1px solid ${color}; padding:5px; border-radius:4px; background:#222;">
                        <option value="Pending" ${o.status === 'Pending'?'selected':''}>Pending</option>
                        <option value="Shipped" ${o.status === 'Shipped'?'selected':''}>Shipped</option>
                        <option value="Delivered" ${o.status === 'Delivered'?'selected':''}>Delivered</option>
                        <option value="Cancelled" ${o.status === 'Cancelled'?'selected':''}>Cancelled</option>
                    </select>
                </td>
                <td><button onclick="alert('Addr: ${o.customer.address}')" style="color:#fff; background:none; border:none; cursor:pointer;">View</button></td>
            </tr>`;
        }).join('') : '<tr><td colspan="5" style="text-align:center;">No orders found</td></tr>';
    };

    renderOrders();

    // Filter Buttons Logic
    window.filterOrders = (status) => {
        currentFilter = status;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.filter-btn[onclick="filterOrders('${status}')"]`).classList.add('active');
        renderOrders();
    };

    window.updateStatus = (index, status) => {
        const orders = getStorage(KEY_ORDERS);
        orders[index].status = status;
        setStorage(KEY_ORDERS, orders);
        renderOrders(); // Refresh table color
    };
}

// Security
function checkAdminAuth() {
    if (!sessionStorage.getItem(KEY_ADMIN_LOGGED)) window.location.href = 'admin_login.html';
}

// Cart & Checkout (Standard)
function loadCartDisplay() { /* ... Same as before ... */ 
    const container = document.querySelector('.cart-items');
    const totalEl = document.getElementById('cart-total');
    if (!container) return;
    const cart = getStorage(KEY_CART);
    container.innerHTML = cart.length ? cart.map((item, i) => `
        <div class="cart-item">
            <div style="display:flex; align-items:center; gap:15px;">
                <img src="${item.image || ''}" style="width:50px; height:50px; background:#333; object-fit:cover;">
                <div><h4>${item.name}</h4><p>৳ ${item.price}</p></div>
            </div>
            <button onclick="removeFromCart(${i})" style="color:#e74c3c; background:none; border:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
        </div>`).join('') : '<p style="text-align:center;">Empty Cart</p>';
    if(totalEl) totalEl.innerText = cart.reduce((sum, i) => sum + i.price, 0);
}
window.removeFromCart = (i) => { const c=getStorage(KEY_CART); c.splice(i,1); setStorage(KEY_CART,c); loadCartDisplay(); updateCartCount(); };
function handleCheckoutForm() { /* ... Same as before logic ... */ 
     const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const cart = getStorage(KEY_CART);
            if(cart.length === 0) { alert("Cart Empty"); return; }
            const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
            const order = {
                id: 'ORD-' + Math.floor(Math.random() * 10000),
                date: new Date().toLocaleDateString(),
                customer: { name: e.target.name.value, phone: e.target.phone.value, address: e.target.address.value },
                items: cart,
                total: total,
                status: 'Pending' // Default Status
            };
            const orders = getStorage(KEY_ORDERS);
            orders.unshift(order);
            setStorage(KEY_ORDERS, orders);
            setStorage(KEY_CART, []);
            alert('Order Placed!');
            window.location.href = 'index.html';
        });
    }
}
function loadCartSummaryForCheckout() {
    const el = document.getElementById('checkout-total');
    if(el) { const c=getStorage(KEY_CART); el.innerText = c.reduce((s,i)=>s+i.price,0); }
}
