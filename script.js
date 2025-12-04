// script.js - The Brain of LYNEX (Fully Functional)

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
    
    // Cart Count Update
    updateCartCount();

    // 2. Routing Logic
    const path = window.location.pathname;
    const page = path.split("/").pop(); 
    
    // Website Pages
    if (page === 'index.html' || page === '' || page === 'products.html') {
        loadProductsDisplay();
    } 
    else if (page === 'cart.html') {
        loadCartDisplay();
    } 
    else if (page === 'checkout.html') {
        handleCheckoutForm();
        loadCartSummaryForCheckout();
    } 
    
    // Admin Pages Logic
    else if (page.includes('admin_') && !page.includes('login')) {
        checkAdminAuth(); // Security Check
        
        // Load specific dashboard functions
        if (page.includes('products')) {
            initAdminProducts();
        } else if (page.includes('orders')) {
            initAdminOrders();
        } else if (page.includes('dashboard')) {
            initAdminDashboard();
        }
    }
    
    // Admin Login Handler
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const user = e.target.username.value;
            const pass = e.target.password.value;
            if (user === 'admin' && pass === '1234') {
                sessionStorage.setItem(KEY_ADMIN_LOGGED, 'true');
                window.location.href = 'admin_products.html';
            } else {
                alert('Login Failed!');
            }
        });
    }
});

// --- HELPER FUNCTIONS ---
function getStorage(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function setStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function updateCartCount() {
    const cart = getStorage(KEY_CART);
    const icons = document.querySelectorAll('.cart-count');
    icons.forEach(el => el.innerText = `(${cart.length})`);
}

// --- WEBSITE FUNCTIONS ---

// Load Products on Website
function loadProductsDisplay() {
    const grid = document.querySelector('.product-grid');
    if (!grid) return;
    
    const products = getStorage(KEY_PRODUCTS);
    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px; background:#1e1e1e; border-radius:8px;"><h3>No Products Available</h3><p>Please add products from Admin Panel</p></div>';
        return;
    }

    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">
                <i class="fas fa-tshirt" style="font-size:3em; color:#555;"></i>
            </div>
            <h3>${p.name}</h3>
            <p>৳ ${p.price}</p>
            <button onclick="addToCart(${p.id})" class="btn primary-btn" style="width:100%;">Add to Cart</button>
        `;
        grid.appendChild(card);
    });
}

// Add to Cart Logic
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

// Load Cart Page
function loadCartDisplay() {
    const container = document.querySelector('.cart-items');
    const totalEl = document.getElementById('cart-total');
    if (!container) return;

    const cart = getStorage(KEY_CART);
    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center;">Your cart is empty.</p>';
        if(totalEl) totalEl.innerText = '0';
        // Hide checkout button logic can be added here
        return;
    }

    cart.forEach((item, index) => {
        total += parseFloat(item.price);
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px;">
                <div style="width:50px; height:50px; background:#2a2a2a; display:flex; align-items:center; justify-content:center;"><i class="fas fa-tshirt"></i></div>
                <div><h4>${item.name}</h4><p>৳ ${item.price}</p></div>
            </div>
            <button onclick="removeFromCart(${index})" style="color:#ff9f43; background:none; border:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
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

// Checkout Summary
function loadCartSummaryForCheckout() {
    const totalEl = document.getElementById('checkout-total');
    if(!totalEl) return;
    const cart = getStorage(KEY_CART);
    const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
    totalEl.innerText = total;
}

// Handle Checkout
function handleCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const cart = getStorage(KEY_CART);
            if(cart.length === 0) { alert("Cart is empty!"); return; }

            const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
            const order = {
                id: 'ORD-' + Math.floor(Math.random() * 100000),
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
            setStorage(KEY_CART, []); // Clear cart
            
            alert('Order Placed Successfully!');
            window.location.href = 'index.html';
        });
    }
}

// --- ADMIN FUNCTIONS ---

function checkAdminAuth() {
    if (!sessionStorage.getItem(KEY_ADMIN_LOGGED)) {
        window.location.href = 'admin_login.html';
    }
}

// 1. ADMIN PRODUCTS LOGIC
function initAdminProducts() {
    const form = document.getElementById('add-product-form');
    const tableBody = document.querySelector('#product-table tbody');
    
    // Function to render table
    const renderTable = () => {
        const products = getStorage(KEY_PRODUCTS);
        tableBody.innerHTML = '';
        
        if (products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No products found</td></tr>';
            document.getElementById('current-product-count').innerText = 0;
            return;
        }

        products.forEach((p, index) => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${p.name}</td>
                <td>৳ ${p.price}</td>
                <td><button onclick="deleteProduct(${index})" class="action-btn" style="color:#ff9f43; border:1px solid #ff9f43; padding:5px 10px; background:none; cursor:pointer;">Delete</button></td>
            `;
        });
        document.getElementById('current-product-count').innerText = products.length;
    };

    // Initial render
    renderTable();

    // Add Product Event
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = e.target.name.value;
            const price = e.target.price.value;

            if(name && price) {
                const newProduct = {
                    id: Date.now(),
                    name: name,
                    price: price
                };
                
                const products = getStorage(KEY_PRODUCTS);
                products.push(newProduct);
                setStorage(KEY_PRODUCTS, products);
                
                e.target.reset();
                alert('Product Added Successfully!');
                renderTable(); // Update table immediately
            }
        });
    }

    // Global Delete Function
    window.deleteProduct = function(index) {
        if(confirm('Are you sure you want to delete this product?')) {
            const products = getStorage(KEY_PRODUCTS);
            products.splice(index, 1);
            setStorage(KEY_PRODUCTS, products);
            renderTable(); // Update table immediately
        }
    };
}

// 2. ADMIN ORDERS LOGIC
function initAdminOrders() {
    const tableBody = document.querySelector('#orders-table tbody');
    const orders = getStorage(KEY_ORDERS);
    
    tableBody.innerHTML = '';
    
    if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No orders found</td></tr>';
        return;
    }

    orders.forEach((order, index) => {
        const row = tableBody.insertRow();
        let color = '#ff9f43';
        if(order.status === 'Shipped') color = '#3498db';
        if(order.status === 'Delivered') color = '#2ecc71';

        row.innerHTML = `
            <td><small>${order.id}</small></td>
            <td>${order.customer.name}<br><small>${order.customer.phone}</small></td>
            <td>৳ ${order.total}</td>
            <td>
                <select onchange="updateOrderStatus(${index}, this.value)" class="status-select" style="color:${color}; border-color:${color}; padding:5px; background:#2a2a2a;">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td><button onclick="viewOrderDetails(${index})" style="color:#fff; background:#333; border:none; padding:5px 10px; cursor:pointer;">View</button></td>
        `;
    });

    window.updateOrderStatus = function(index, newStatus) {
        const currentOrders = getStorage(KEY_ORDERS);
        currentOrders[index].status = newStatus;
        setStorage(KEY_ORDERS, currentOrders);
        initAdminOrders(); // Reload table
    };

    window.viewOrderDetails = function(index) {
        const o = orders[index];
        const items = o.items.map(i => `- ${i.name} (৳${i.price})`).join('\n');
        alert(`Order Details:\n\nCustomer: ${o.customer.name}\nAddress: ${o.customer.address}\n\nItems:\n${items}\n\nTotal: ৳${o.total}`);
    };
}

// 3. ADMIN DASHBOARD LOGIC
function initAdminDashboard() {
    const orders = getStorage(KEY_ORDERS);
    const products = getStorage(KEY_PRODUCTS);
    
    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total), 0);
    const pendingCount = orders.filter(o => o.status === 'Pending').length;
    
    if(document.getElementById('stat-revenue')) document.getElementById('stat-revenue').innerText = '৳ ' + totalRevenue;
    if(document.getElementById('stat-pending')) document.getElementById('stat-pending').innerText = pendingCount;
    if(document.getElementById('stat-products')) document.getElementById('stat-products').innerText = products.length;
}
