// script.js - The Brain of LYNEX

// --- LOCAL STORAGE KEYS ---
const KEY_PRODUCTS = 'lynex_products';
const KEY_CART = 'lynex_cart';
const KEY_ORDERS = 'lynex_orders';
const KEY_ADMIN_LOGGED = 'lynex_admin_logged';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Navigation Logic (Mobile Menu)
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    }
    
    // Initialize Cart Count on load
    updateCartCount();

    // 2. Routing Logic (কোন পেজে কি কাজ হবে)
    const path = window.location.pathname;
    
    // --- WEBSITE PAGES ---
    if (path.includes('index.html') || path.includes('products.html')) {
        loadProductsDisplay();
    } 
    else if (path.includes('cart.html')) {
        loadCartDisplay();
    } 
    else if (path.includes('checkout.html')) {
        handleCheckoutForm();
    } 
    
    // --- ADMIN PAGES ROUTING & SECURITY ---
    // [FIXED] রিফ্রেশ সমস্যা সমাধান: যদি পেজটি admin হয় কিন্তু login পেজ না হয়, তবেই চেক করবে।
    else if (path.includes('admin_') && !path.includes('login')) {
        
        checkAdminAuth(); // Security Check

        // Load specific admin page functions
        if (path.includes('dashboard')) loadAdminDashboard(); // ড্যাশবোর্ড লোড হবে (যদি থাকে)
        if (path.includes('products')) loadAdminProducts();
        if (path.includes('orders')) loadAdminOrders();
        if (path.includes('customers')) loadAdminCustomers();
        if (path.includes('analytics')) loadAdminAnalytics();
    }
    
    // --- ADMIN LOGIN HANDLER ---
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const user = e.target.username.value;
            const pass = e.target.password.value;

            // Simple Credential Check
            if (user === 'admin' && pass === '1234') {
                sessionStorage.setItem(KEY_ADMIN_LOGGED, 'true');
                window.location.href = 'admin_products.html'; // লগইনের পর প্রোডাক্ট পেজে যাবে
            } else {
                alert('ভুল ইউজারনেম বা পাসওয়ার্ড!');
            }
        });
    }
});

// --- CORE FUNCTIONS (সাহায্যকারী ফাংশন) ---

function getStorage(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function setStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function updateCartCount() {
    const cart = getStorage(KEY_CART);
    const icons = document.querySelectorAll('.cart-icon');
    icons.forEach(icon => icon.innerHTML = `<i class="fas fa-shopping-cart"></i> (${cart.length})`);
}

// --- WEBSITE LOGIC (Product & Cart) ---

// প্রোডাক্ট দেখানোর ফাংশন (Index & Products page)
function loadProductsDisplay() {
    const grid = document.querySelector('.product-grid');
    if (!grid) return;
    
    const products = getStorage(KEY_PRODUCTS);
    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #fff; border-radius: 8px;"><h3>কোনো পণ্য নেই</h3><p>অ্যাডমিন প্যানেল থেকে পণ্য যুক্ত করুন।</p></div>';
        return;
    }

    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        // Note: Image is dummy placeholder
        card.innerHTML = `
            <div class="product-image" style="background:#f9f9f9; height:250px; display:flex; align-items:center; justify-content:center; margin-bottom:15px; border-radius:4px;">
                <i class="fas fa-tshirt" style="font-size:3em; color:#ddd;"></i>
            </div>
            <h3>${p.name}</h3>
            <p style="font-weight:bold; color:#d10000; font-size: 1.1em;">৳ ${p.price}</p>
            <button onclick="addToCart('${p.id}')" class="btn primary-btn" style="margin-top:10px; width:100%;">Add to Cart</button>
        `;
        grid.appendChild(card);
    });
}

// কার্টে প্রোডাক্ট যোগ করা
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

// কার্ট পেজ লোড করা
function loadCartDisplay() {
    const container = document.querySelector('.cart-items');
    const summaryTotal = document.getElementById('cart-total');
    if (!container) return;

    const cart = getStorage(KEY_CART);
    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 20px;">আপনার কার্ট খালি।</p>';
        if(summaryTotal) summaryTotal.innerText = '0';
        return;
    }

    cart.forEach((item, index) => {
        total += parseFloat(item.price);
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px;">
                <div style="width:50px; height:50px; background:#eee; display:flex; align-items:center; justify-content:center;"><i class="fas fa-tshirt"></i></div>
                <div>
                    <h4 style="margin:0;">${item.name}</h4>
                    <p style="margin:0; color:#777;">৳ ${item.price}</p>
                </div>
            </div>
            <button onclick="removeFromCart(${index})" style="color:red; background:none; border:none; cursor:pointer; font-weight:bold;"><i class="fas fa-trash"></i></button>
        `;
        container.appendChild(div);
    });

    if(summaryTotal) summaryTotal.innerText = total;
}

// কার্ট থেকে রিমুভ করা
window.removeFromCart = function(index) {
    const cart = getStorage(KEY_CART);
    cart.splice(index, 1);
    setStorage(KEY_CART, cart);
    loadCartDisplay();
    updateCartCount();
};

// --- CHECKOUT LOGIC ---

function handleCheckoutForm() {
    const form = document.getElementById('checkout-form');
    const cart = getStorage(KEY_CART);
    const totalEl = document.getElementById('checkout-total');
    
    // Calculate Total
    let total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
    if(totalEl) totalEl.innerText = total;

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if(cart.length === 0) {
                alert("কার্ট খালি! অর্ডার করা যাবে না।");
                return;
            }

            const order = {
                id: 'ORD-' + Math.floor(Math.random() * 10000), // Random ID
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
            orders.unshift(order); // Add new order to top
            setStorage(KEY_ORDERS, orders);

            // Clear Cart
            setStorage(KEY_CART, []);
            
            alert('অর্ডার সফল হয়েছে! ধন্যবাদ।');
            window.location.href = 'index.html';
        });
    }
}

// --- ADMIN PANEL LOGIC (লগইন, প্রোডাক্ট, অর্ডার) ---

function checkAdminAuth() {
    if (!sessionStorage.getItem(KEY_ADMIN_LOGGED)) {
        window.location.href = 'admin_login.html';
    }
}

// 1. Admin Products Page Functions
function loadAdminProducts() {
    const form = document.getElementById('add-product-form');
    const tableBody = document.querySelector('#product-table tbody');

    // টেবিল আপডেট করা
    const renderTable = () => {
        const products = getStorage(KEY_PRODUCTS);
        tableBody.innerHTML = '';
        
        if (products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">কোনো পণ্য নেই</td></tr>';
            return;
        }

        products.forEach((p, index) => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${p.name}</td>
                <td>৳ ${p.price}</td>
                <td><button onclick="deleteProduct(${index})" class="action-btn" style="color:red; border-color:red;"><i class="fas fa-trash"></i> Delete</button></td>
            `;
        });
    };
    renderTable();

    // নতুন পণ্য যোগ করা
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const newProduct = {
                id: Date.now(),
                name: e.target.name.value,
                price: e.target.price.value
            };
            const products = getStorage(KEY_PRODUCTS);
            products.push(newProduct);
            setStorage(KEY_PRODUCTS, products);
            e.target.reset();
            alert('পণ্য যুক্ত হয়েছে!');
            renderTable();
        });
    }

    // পণ্য ডিলিট করা
    window.deleteProduct = function(index) {
        if(confirm('আপনি কি এই পণ্যটি ডিলিট করতে চান?')) {
            const products = getStorage(KEY_PRODUCTS);
            products.splice(index, 1);
            setStorage(KEY_PRODUCTS, products);
            renderTable();
        }
    };
}

// 2. Admin Orders Page Functions
function loadAdminOrders() {
    const tableBody = document.querySelector('#orders-table tbody');
    const orders = getStorage(KEY_ORDERS);
    
    tableBody.innerHTML = '';

    if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">কোনো অর্ডার নেই</td></tr>';
        return;
    }

    orders.forEach((order, index) => {
        const row = tableBody.insertRow();
        
        // Status Color Coding
        let statusColor = '#f39c12'; // Pending
        if (order.status === 'Shipped') statusColor = '#2980b9';
        if (order.status === 'Delivered') statusColor = '#27ae60';
        if (order.status === 'Cancelled') statusColor = '#c0392b';

        row.innerHTML = `
            <td><small>${order.id}</small></td>
            <td>
                <strong>${order.customer.name}</strong><br>
                <small>${order.customer.phone}</small>
            </td>
            <td>৳ ${order.total}</td>
            <td>
                <select onchange="updateOrderStatus(${index}, this.value)" class="status-select" style="border-color:${statusColor}; color:${statusColor}; font-weight:bold;">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td><button onclick="viewOrderDetails(${index})" class="action-btn"><i class="fas fa-eye"></i> View</button></td>
        `;
    });

    window.updateOrderStatus = function(index, newStatus) {
        orders[index].status = newStatus;
        setStorage(KEY_ORDERS, orders);
        loadAdminOrders(); // Reload to update color
    };

    window.viewOrderDetails = function(index) {
        const o = orders[index];
        const itemsList = o.items.map(i => `- ${i.name} (৳${i.price})`).join('\n');
        alert(`অর্ডার ডিটেইলস:\n\nঠিকানা: ${o.customer.address}\n\nপণ্য:\n${itemsList}\n\nমোট: ৳${o.total}`);
    };
}

// 3. Admin Customers Page Functions
function loadAdminCustomers() {
    const tableBody = document.querySelector('#customers-table tbody');
    const orders = getStorage(KEY_ORDERS);
    
    // ফোন নাম্বার দিয়ে ইউনিক কাস্টমার বের করা
    const customers = {};
    orders.forEach(o => {
        if (!customers[o.customer.phone]) {
            customers[o.customer.phone] = {
                name: o.customer.name,
                phone: o.customer.phone,
                address: o.customer.address,
                ordersCount: 0,
                totalSpent: 0
            };
        }
        customers[o.customer.phone].ordersCount++;
        customers[o.customer.phone].totalSpent += parseFloat(o.total);
    });

    tableBody.innerHTML = '';
    const customerArray = Object.values(customers);

    if (customerArray.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">কোনো কাস্টমার ডাটা নেই</td></tr>';
        return;
    }

    customerArray.forEach(c => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${c.name}</td>
            <td>${c.phone}</td>
            <td>${c.address}</td>
            <td>${c.ordersCount}</td>
            <td>৳ ${c.totalSpent}</td>
        `;
    });
}

// 4. Admin Analytics Page Functions
function loadAdminAnalytics() {
    const orders = getStorage(KEY_ORDERS);
    
    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total), 0);
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
    
    if(document.getElementById('stat-revenue')) document.getElementById('stat-revenue').innerText = '৳ ' + totalRevenue;
    if(document.getElementById('stat-orders')) document.getElementById('stat-orders').innerText = totalOrders;
    if(document.getElementById('stat-delivered')) document.getElementById('stat-delivered').innerText = deliveredOrders;
}
