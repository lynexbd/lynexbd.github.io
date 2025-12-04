// DUMMY Variables
const DUMMY_USER = 'asadul_hasan';
const DUMMY_PASS = 'admin123';
let isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true'; // Check session storage

// DUMMY Product Data (Initially Empty as requested)
let productsData = []; 
let cartItems = [];
let cartCount = 0;


document.addEventListener('DOMContentLoaded', function() {
    // --- Front-end Website Logic ---
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    const cartIcon = document.querySelector('.cart-icon');

    // 1. Navigation Toggle
    if (menuToggle && navList) {
        menuToggle.addEventListener('click', function() {
            navList.classList.toggle('active');
        });
    }

    // 2. Initialize Cart Counter
    if (cartIcon) {
        cartIcon.innerHTML = `<i class="fas fa-shopping-cart"></i> (${cartItems.length})`;
    }

    // 3. Product Loading (Simulated from Admin Panel)
    const productGrid = document.querySelector('.product-grid');
    if (productGrid) {
        // Function to dynamically render products or empty state
        function renderProducts() {
            productGrid.innerHTML = ''; // Clear existing content
            if (productsData.length === 0) {
                // Display Empty State
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.innerHTML = `<h3>No Products Available Yet.</h3><p>Please check back later or contact us.</p>`;
                productGrid.parentNode.insertBefore(emptyState, productGrid.nextSibling);
                productGrid.remove(); // Remove the product grid if empty
            } else {
                // Render products (DUMMY CODE)
                productsData.forEach(product => {
                    const card = document.createElement('div');
                    card.className = 'product-card';
                    card.innerHTML = `
                        <div class="product-image">[attachment_0](attachment)</div>
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-price">৳ ${product.price.toLocaleString()}</p>
                        <div class="product-actions">
                            <button class="btn cart-btn" data-id="${product.id}">Add to Cart</button>
                            <button class="btn buy-btn">Buy Now</button>
                        </div>
                    `;
                    productGrid.appendChild(card);
                });
                
                // Re-attach event listeners for newly rendered buttons
                attachProductButtonListeners();
            }
        }
        
        // Load initial state
        renderProducts();
    }
    
    // 4. Attach Listeners for DUMMY Cart
    function attachProductButtonListeners() {
        const cartButtons = document.querySelectorAll('.cart-btn');
        cartButtons.forEach(button => {
            button.addEventListener('click', function() {
                // DUMMY Add to Cart Logic
                cartItems.push({ id: button.dataset.id, name: 'Item', price: 'Price' });
                if (cartIcon) {
                    cartIcon.innerHTML = `<i class="fas fa-shopping-cart"></i> (${cartItems.length})`;
                }
                alert('Item added to cart! Total items: ' + cartItems.length);
            });
        });
        const buyButtons = document.querySelectorAll('.buy-btn');
        buyButtons.forEach(button => {
            button.addEventListener('click', function() {
                alert('Redirecting to secure Checkout...');
            });
        });
    }

    // 5. Simple Remove Item from Cart (DUMMY - Cart Page)
    const removeButtons = document.querySelectorAll('.item-remove button');
    removeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const itemRow = button.closest('.cart-item');
            if (itemRow) {
                if (confirm("Are you sure you want to remove this item?")) {
                    itemRow.remove();
                    // DUMMY Logic for cartItems removal would be here
                    alert("Item removed. (Cart count not updated in this DUMMY view)"); 
                }
            }
        });
    });


    // --- Admin Panel Logic ---

    // 6. Admin Login Check/Redirect
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = e.target.username.value;
            const password = e.target.password.value;

            if (username === DUMMY_USER && password === DUMMY_PASS) {
                sessionStorage.setItem('adminLoggedIn', 'true'); // Set session flag
                window.location.href = 'admin_dashboard.html'; 
            } else {
                alert('Login Failed: Incorrect Username or Password.');
            }
        });
    }

    // 7. Check if user is on a protected admin page without logging in
    const protectedAdminPages = ['admin_dashboard.html', 'admin_products.html', 'admin_orders.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedAdminPages.includes(currentPage) && !isLoggedIn) {
        alert("Access Denied. Please log in first.");
        window.location.href = 'admin_login.html';
    }

    // 8. DUMMY Product Management Logic (Admin Products Page)
    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = e.target.name.value;
            const price = parseFloat(e.target.price.value);
            
            if (name && !isNaN(price)) {
                const newProduct = {
                    id: 'PRO' + (productsData.length + 1).toString().padStart(3, '0'),
                    name: name,
                    price: price
                };
                productsData.push(newProduct);
                alert(`SUCCESS! DUMMY Product Added: ${name} (Price: ৳ ${price})`);
                e.target.reset(); // Clear form
                // In a real app, this would update the database and redirect/refresh the product list.
            } else {
                alert('Please enter valid product details.');
            }
        });
    }
});
