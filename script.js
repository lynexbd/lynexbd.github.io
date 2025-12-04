// script.js - The Functional Logic

// --- LOCAL STORAGE KEYS ---
const KEY_PRODUCTS = 'lynex_products';
const KEY_CART = 'lynex_cart';
const KEY_ORDERS = 'lynex_orders';
const KEY_ADMIN_LOGGED = 'lynex_admin_logged';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Navigation Logic
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => navList.classList.toggle('active'));
    }
    updateCartCount();

    // 2. Page Specific Logic routing
    const path = window.location.pathname;
    
    if (path.includes('index.html') || path.includes('products.html')) {
        loadProductsDisplay();
    } else if (path.includes('cart.html')) {
        loadCartDisplay();
    } else if (path.includes('checkout.html')) {
        handleCheckoutForm();
    } else if (path.includes('admin_')) {
        checkAdminAuth(); // Protect Admin Pages
        if (path.includes('dashboard')) loadAdminDashboard();
        if (path.includes('products')) loadAdminProducts();
        if (path.includes('orders')) loadAdminOrders();
        if (path.includes('customers')) loadAdminCustomers();
        if (path.includes('analytics')) loadAdminAnalytics();
    }
    
    // Admin Login Handler
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Simple check (In real world, use backend)
            if (e.target.username.value === 'admin' && e.target.password.value === '1234') {
                sessionStorage.setItem(KEY_ADMIN_LOGGED, 'true');
                window.location.href = 'admin_dashboard.html';
            } else {
                alert('Invalid Credentials!');
            }
        });
    }
});

// --- CORE FUNCTIONS ---

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

// --- PRODUCT & CART LOGIC ---

function loadProductsDisplay() {
    const grid = document.querySelector('.product-grid');
    if (!grid) return;
    
    const products = getStorage(KEY_PRODUCTS);
    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No products available. Please add from Admin Panel.</p>';
        return;
    }

    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        // Note: Image is dummy placeholder for logic demo
        card.innerHTML = `
            <div class="product-image" style="background:#eee; height:250px; display:flex; align-items:center; justify-content:center; margin-bottom:15px;">
                <i class="fas fa-tshirt" style="font-size:3em; color:#ccc;"></i>
            </div>
            <h3>${p.name}</h3>
            <p style="font-weight:bold; color:#d10000;">৳ ${p.price}</p>
            <button onclick="addToCart('${p.id}')" class="btn primary-btn" style="margin-top:10px;">Add to Cart</button>
        `;
        grid.appendChild(card);
    });
}

window.addToCart = function(id) {
    const products = getStorage(KEY_PRODUCTS);
    const product = products.find(p => p.id == id);
    if (product) {
        const cart = getStorage(KEY_CART);
        cart.push(product);
        setStorage(KEY_CART, cart);
        updateCartCount();
        alert('Product added to cart!');
    }
};

function loadCartDisplay() {
    const container = document.querySelector('.cart-items');
    const summaryTotal = document.getElementById('cart-total');
    if (!container) return;

    const cart = getStorage(KEY_CART);
    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p>Your cart is empty.</p>';
        if(summaryTotal) summaryTotal.innerText = '0';
        return;
    }

    cart.forEach((item, index) => {
        total += parseFloat(item.price);
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.style.borderBottom = '1px solid #eee';
        div.style.padding = '15px 0';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.innerHTML = `
            <div>
                <h4>${item.name}</h4>
                <p>৳ ${item.price}</p>
            </div>
            <button onclick="removeFromCart(${index})" style="color:red; background:none; border:none; cursor:pointer;">Remove</button>
        `;
        container.appendChild(div);
    });

    if(summaryTotal) summaryTotal.innerText = total;
}

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
                alert("Cart is empty!");
                return;
            }

            const order = {
                id: 'ORD-' + Date.now(),
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
            
            alert('Order Placed Successfully!');
            window.location.href = 'index.html';
        });
    }
}

// --- ADMIN LOGIC ---

function checkAdminAuth() {
    if (!sessionStorage.getItem(KEY_ADMIN_LOGGED)) {
        window.location.href = 'admin_login.html';
    }
}

// 1. Admin Products
function loadAdminProducts() {
    const form = document.getElementById('add-product-form');
    const tableBody = document.querySelector('#product-table tbody');

    // Display Products
    const renderTable = () => {
        const products = getStorage(KEY_PRODUCTS);
        tableBody.innerHTML = '';
        products.forEach((p, index) => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${p.name}</td>
                <td>৳ ${p.price}</td>
                <td><button onclick="deleteProduct(${index})" style="color:red;">Delete</button></td>
            `;
        });
    };
    renderTable();

    // Add Product
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
            renderTable();
        });
    }

    window.deleteProduct = function(index) {
        if(confirm('Delete this product?')) {
            const products = getStorage(KEY_PRODUCTS);
            products.splice(index, 1);
            setStorage(KEY_PRODUCTS, products);
            renderTable();
        }
    };
}

// 2. Admin Orders
function loadAdminOrders() {
    const tableBody = document.querySelector('#orders-table tbody');
    const orders = getStorage(KEY_ORDERS);
    
    tableBody.innerHTML = '';
    orders.forEach((order, index) => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.customer.name}<br><small>${order.customer.phone}</small></td>
            <td>৳ ${order.total}</td>
            <td>
                <select onchange="updateOrderStatus(${index}, this.value)" class="status-select">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td><button onclick="viewOrderDetails(${index})">View</button></td>
        `;
    });

    window.updateOrderStatus = function(index, newStatus) {
        orders[index].status = newStatus;
        setStorage(KEY_ORDERS, orders);
        alert('Order status updated!');
    };

    window.viewOrderDetails = function(index) {
        const o = orders[index];
        alert(`Address: ${o.customer.address}\nItems: ${o.items.map(i => i.name).join(', ')}`);
    };
}

// 3. Admin Customers (New Feature)
function loadAdminCustomers() {
    const tableBody = document.querySelector('#customers-table tbody');
    const orders = getStorage(KEY_ORDERS);
    
    // Extract unique customers based on phone number
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
        customers[o.customer.phone].totalSpent += o.total;
    });

    tableBody.innerHTML = '';
    Object.values(customers).forEach(c => {
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

// 4. Admin Analytics (New Feature)
function loadAdminAnalytics() {
    const orders = getStorage(KEY_ORDERS);
    
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
    
    document.getElementById('stat-revenue').innerText = '৳ ' + totalRevenue;
    document.getElementById('stat-orders').innerText = totalOrders;
    document.getElementById('stat-delivered').innerText = deliveredOrders;
}
