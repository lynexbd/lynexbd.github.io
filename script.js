// script.js - The Brain of LYNEX (Fully Fixed)

// --- LOCAL STORAGE KEYS ---
const KEY_PRODUCTS = 'lynex_products';
const KEY_CART = 'lynex_cart';
const KEY_ORDERS = 'lynex_orders';
const KEY_ADMIN_LOGGED = 'lynex_admin_logged';
const KEY_ORDER_COUNT = 'lynex_order_count'; // অর্ডার সিরিয়াল মেইনটেইন করার জন্য

document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Navigation Logic
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    }
    
    updateCartCount();

    // 2. Routing Logic
    const path = window.location.pathname;
    const page = path.split("/").pop(); 
    
    // Website Pages
    if (page === 'index.html' || page === '' || page === 'products.html') {
        loadProductsDisplay(page === 'index.html' || page === ''); // true for homepage (only new arrivals)
    } 
    else if (page === 'cart.html') {
        loadCartDisplay();
    } 
    else if (page === 'checkout.html') {
        handleCheckoutForm();
        loadCartSummaryForCheckout();
    } 
    
    // Admin Pages
    else if (page.includes('admin_') && !page.includes('login')) {
        checkAdminAuth();
        if (page.includes('dashboard')) initAdminDashboard();
        if (page.includes('products')) initAdminProducts();
        if (page.includes('orders')) initAdminOrders();
    }
    
    // Login
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (e.target.username.value === 'admin' && e.target.password.value === '1234') {
                sessionStorage.setItem(KEY_ADMIN_LOGGED, 'true');
                window.location.href = 'admin_dashboard.html';
            } else {
                alert('ভুল ইউজারনেম বা পাসওয়ার্ড!');
            }
        });
    }
});

// --- HELPER FUNCTIONS ---
function getStorage(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function setStorage(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

function updateCartCount() {
    const cart = getStorage(KEY_CART);
    const icons = document.querySelectorAll('.cart-count');
    icons.forEach(el => el.innerText = `(${cart.length})`);
}

// --- PRODUCT DISPLAY LOGIC (Website) ---

function loadProductsDisplay(isHome) {
    let grid = document.querySelector('.product-grid');
    if (!grid) return;
    
    let products = getStorage(KEY_PRODUCTS);
    
    // হোম পেজে শুধুমাত্র New Arrival দেখাবে
    if (isHome) {
        products = products.filter(p => p.isNewArrival);
    }

    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px; background:#1e1e1e; border-radius:8px; border:1px solid #333;"><h3>কোনো পণ্য নেই</h3><p>অ্যাডমিন প্যানেল থেকে পণ্য যুক্ত করুন।</p></div>';
        return;
    }

    products.forEach(p => {
        // প্রাইস ডিসপ্লে লজিক (ডিসকাউন্ট সহ)
        let priceHTML = `<span class="current-price">৳ ${p.price}</span>`;
        let discountBadge = '';
        
        if (p.originalPrice && p.originalPrice > p.price) {
            priceHTML = `
                <span class="old-price">৳ ${p.originalPrice}</span>
                <span class="current-price">৳ ${p.price}</span>
            `;
            // ডিসকাউন্ট পার্সেন্টেজ বের করা
            const percent = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
            discountBadge = `<span class="discount-badge">-${percent}%</span>`;
        }

        // ইমেজ হ্যান্ডেলিং
        let imgHTML = p.image 
            ? `<img src="${p.image}" alt="${p.name}">` 
            : `<i class="fas fa-tshirt" style="font-size:3em; color:#555;"></i>`;

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            ${discountBadge}
            <div class="product-image">
                ${imgHTML}
            </div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <div class="price-container">${priceHTML}</div>
                <div class="product-actions">
                    <button onclick="addToCart(${p.id})" class="btn secondary-btn" style="flex:1;">Add to Cart</button>
                    <button onclick="buyNow(${p.id})" class="btn primary-btn" style="flex:1;">Buy Now</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Add to Cart
window.addToCart = function(id) {
    const products = getStorage(KEY_PRODUCTS);
    const product = products.find(p => p.id == id);
    if (product) {
        const cart = getStorage(KEY_CART);
        cart.push(product);
        setStorage(KEY_CART, cart);
        updateCartCount();
        alert('প্রোডাক্ট কার্টে যুক্ত হয়েছে!');
    }
};

// Buy Now (Add to cart & redirect to checkout)
window.buyNow = function(id) {
    const products = getStorage(KEY_PRODUCTS);
    const product = products.find(p => p.id == id);
    if (product) {
        const cart = getStorage(KEY_CART);
        cart.push(product);
        setStorage(KEY_CART, cart);
        updateCartCount();
        window.location.href = 'checkout.html'; // সরাসরি চেকআউটে
    }
};

// --- CART & CHECKOUT ---

function loadCartDisplay() {
    const container = document.querySelector('.cart-items');
    const totalEl = document.getElementById('cart-total');
    if (!container) return;

    const cart = getStorage(KEY_CART);
    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center;">আপনার কার্ট খালি।</p>';
        if(totalEl) totalEl.innerText = '0';
        const checkoutBtn = document.querySelector('.checkout-btn');
        if(checkoutBtn) { checkoutBtn.style.display = 'none'; }
        return;
    }

    cart.forEach((item, index) => {
        total += parseFloat(item.price);
        const div = document.createElement('div');
        div.className = 'cart-item';
        // কার্টে ইমেজ দেখানো
        let imgHTML = item.image 
            ? `<img src="${item.image}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">` 
            : `<div style="width:50px; height:50px; background:#2a2a2a; display:flex; align-items:center; justify-content:center;"><i class="fas fa-tshirt"></i></div>`;

        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px;">
                ${imgHTML}
                <div>
                    <h4 style="margin:0; font-size:1em;">${item.name}</h4>
                    <p style="margin:0; font-size:0.9em;">৳ ${item.price}</p>
                </div>
            </div>
            <button onclick="removeFromCart(${index})" style="color:#e74c3c; background:none; border:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
        `;
        container.appendChild(div);
    });

    if(totalEl) totalEl.innerText = total;
}

window.removeFromCart = function(index) {
    const cart = getStorage(KEY_CART);
    cart.splice(index, 1);
    setStorage(KEY_CART, cart);
    loadCartDisplay();
    updateCartCount();
};

function loadCartSummaryForCheckout() {
    const totalEl = document.getElementById('checkout-total');
    if(!totalEl) return;
    const cart = getStorage(KEY_CART);
    const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
    totalEl.innerText = total;
}

function handleCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const cart = getStorage(KEY_CART);
            if(cart.length === 0) { alert("Cart Empty"); return; }
            
            const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
            
            // সিরিয়াল অর্ডার আইডি জেনারেট করা
            let orderCount = parseInt(localStorage.getItem(KEY_ORDER_COUNT)) || 0;
            orderCount++;
            localStorage.setItem(KEY_ORDER_COUNT, orderCount);
            const orderId = 'ORD-' + String(orderCount).padStart(3, '0'); // ORD-001, ORD-002...

            const order = {
                id: orderId,
                date: new Date().toLocaleDateString(),
                customer: {
                    name: e.target.name.value,
                    phone: e.target.phone.value,
                    address: e.target.address.value
                },
                items: cart,
                total: total,
                status: 'Pending'
            };

            const orders = getStorage(KEY_ORDERS);
            orders.unshift(order);
            setStorage(KEY_ORDERS, orders);
            setStorage(KEY_CART, []); // কার্ট ক্লিয়ার
            
            alert('অর্ডার সফল হয়েছে! অর্ডার আইডি: ' + orderId);
            window.location.href = 'index.html';
        });
    }
}

// --- ADMIN LOGIC ---

function checkAdminAuth() {
    if (!sessionStorage.getItem(KEY_ADMIN_LOGGED)) window.location.href = 'admin_login.html';
}

// 1. PRODUCTS (Image, New Arrival, Discount)
function initAdminProducts() {
    const form = document.getElementById('add-product-form');
    const tableBody = document.querySelector('#product-table tbody');

    const renderTable = () => {
        const products = getStorage(KEY_PRODUCTS);
        tableBody.innerHTML = products.length ? products.map((p, i) => `
            <tr>
                <td><img src="${p.image || ''}" style="width:40px; height:40px; object-fit:cover; border-radius:4px; background:#333;" alt="img"></td>
                <td>${p.name} ${p.isNewArrival ? '<span style="color:#2ecc71; font-size:0.8em;">(New)</span>' : ''}</td>
                <td>
                    <div style="display:flex; flex-direction:column;">
                        <span>৳ ${p.price}</span>
                        ${p.originalPrice ? `<span style="text-decoration:line-through; color:#777; font-size:0.8em;">৳ ${p.originalPrice}</span>` : ''}
                    </div>
                </td>
                <td><button onclick="deleteProduct(${i})" style="color:#e74c3c; background:none; border:none; cursor:pointer;">Delete</button></td>
            </tr>
        `).join('') : '<tr><td colspan="4" style="text-align:center;">কোনো পণ্য নেই</td></tr>';
        
        if(document.getElementById('current-product-count')) 
            document.getElementById('current-product-count').innerText = products.length;
    };
    renderTable();

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // ইমেজ ফাইল রিড করা
            const fileInput = e.target.image;
            const reader = new FileReader();

            const saveProduct = (imgData) => {
                const newProduct = {
                    id: Date.now(),
                    name: e.target.name.value,
                    price: parseFloat(e.target.price.value),
                    originalPrice: e.target.oldPrice.value ? parseFloat(e.target.oldPrice.value) : null,
                    isNewArrival: e.target.isNew.checked,
                    image: imgData // Base64 স্ট্রিং হিসেবে ইমেজ সেভ হবে
                };
                const products = getStorage(KEY_PRODUCTS);
                products.push(newProduct);
                setStorage(KEY_PRODUCTS, products);
                e.target.reset();
                renderTable();
                alert('পণ্য সফলভাবে যুক্ত হয়েছে!');
            };

            if (fileInput.files && fileInput.files[0]) {
                reader.onload = function(evt) { saveProduct(evt.target.result); };
                reader.readAsDataURL(fileInput.files[0]);
            } else {
                saveProduct(null); // ইমেজ ছাড়াও প্রোডাক্ট সেভ হবে
            }
        });
    }

    window.deleteProduct = (i) => {
        if(confirm('মুছে ফেলতে চান?')) {
            const p = getStorage(KEY_PRODUCTS);
            p.splice(i, 1);
            setStorage(KEY_PRODUCTS, p);
            renderTable();
        }
    };
}

// 2. DASHBOARD
function initAdminDashboard() {
    const orders = getStorage(KEY_ORDERS);
    const products = getStorage(KEY_PRODUCTS);

    const delivered = orders.filter(o => o.status === 'Delivered');
    const revenue = delivered.reduce((sum, o) => sum + parseFloat(o.total), 0);

    const setTxt = (id, val) => { if(document.getElementById(id)) document.getElementById(id).innerText = val; };
    
    setTxt('stat-revenue', '৳ ' + revenue);
    setTxt('stat-pending', orders.filter(o => o.status === 'Pending').length);
    setTxt('stat-delivered', delivered.length);
    setTxt('stat-cancelled', orders.filter(o => o.status === 'Cancelled').length);
    setTxt('stat-products', products.length);
}

// 3. ORDERS (View Fix & Filtering)
function initAdminOrders() {
    const tableBody = document.querySelector('#orders-table tbody');
    let currentFilter = 'All';

    const renderOrders = () => {
        const allOrders = getStorage(KEY_ORDERS);
        const orders = currentFilter === 'All' ? allOrders : allOrders.filter(o => o.status === currentFilter);

        tableBody.innerHTML = orders.length ? orders.map((o) => {
            // Find index in main storage array
            const realIndex = allOrders.findIndex(ao => ao.id === o.id);
            let color = o.status === 'Pending' ? '#ff9f43' : o.status === 'Delivered' ? '#2ecc71' : o.status === 'Cancelled' ? '#e74c3c' : '#3498db';
            
            return `
            <tr>
                <td><span style="font-family:monospace;">${o.id}</span></td>
                <td>${o.customer.name}</td>
                <td>৳ ${o.total}</td>
                <td>
                    <select onchange="updateStatus(${realIndex}, this.value)" style="color:${color}; border:1px solid ${color}; padding:5px; background:#222; cursor:pointer;">
                        <option value="Pending" ${o.status === 'Pending'?'selected':''}>Pending</option>
                        <option value="Shipped" ${o.status === 'Shipped'?'selected':''}>Shipped</option>
                        <option value="Delivered" ${o.status === 'Delivered'?'selected':''}>Delivered</option>
                        <option value="Cancelled" ${o.status === 'Cancelled'?'selected':''}>Cancelled</option>
                    </select>
                </td>
                <td><button onclick="viewOrderDetails('${o.id}')" class="action-btn">View</button></td>
            </tr>`;
        }).join('') : '<tr><td colspan="5" style="text-align:center;">কোনো অর্ডার নেই</td></tr>';
    };

    renderOrders();

    window.filterOrders = (status) => {
        currentFilter = status;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        // Find button with specific text content or onclick attribute could be tricky, 
        // simpler to rely on renderOrders using currentFilter global var.
        // For UI highlight:
        const btn = Array.from(document.querySelectorAll('.filter-btn')).find(b => b.textContent.includes(status === 'All' ? 'All' : status));
        if(btn) btn.classList.add('active');
        renderOrders();
    };

    window.updateStatus = (index, status) => {
        const orders = getStorage(KEY_ORDERS);
        orders[index].status = status;
        setStorage(KEY_ORDERS, orders);
        renderOrders();
    };

    // [FIXED] View Order Details
    window.viewOrderDetails = (orderId) => {
        const orders = getStorage(KEY_ORDERS);
        const o = orders.find(ord => ord.id === orderId);
        
        if (!o) return;

        const itemsList = o.items.map(i => `- ${i.name} (৳${i.price})`).join('\n');
        
        alert(
            `অর্ডার আইডি: ${o.id}\n` +
            `তারিখ: ${o.date}\n` +
            `স্ট্যাটাস: ${o.status}\n\n` +
            `কাস্টমার তথ্য:\n` +
            `নাম: ${o.customer.name}\n` +
            `ফোন: ${o.customer.phone}\n` +
            `ঠিকানা: ${o.customer.address}\n\n` +
            `অর্ডার আইটেম:\n${itemsList}\n\n` +
            `মোট বিল: ৳ ${o.total}`
        );
    };
}
