document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    const navList = document.getElementById('nav-list');
    const cartIcon = document.querySelector('.cart-icon');
    let cartCount = 0;

    // 1. Toggle mobile menu visibility on click
    if (menuToggle && navList) {
        menuToggle.addEventListener('click', function() {
            navList.classList.toggle('active');
        });

        // Close menu when a link is clicked (for mobile)
        const navLinks = navList.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    navList.classList.remove('active');
                }
            });
        });
    }

    // 2. Simple functionality for Add to Cart (DUMMY)
    const cartButtons = document.querySelectorAll('.cart-btn');
    
    cartButtons.forEach(button => {
        button.addEventListener('click', function() {
            cartCount++;
            alert('Item added to cart! Total items: ' + cartCount);
            if (cartIcon) {
                cartIcon.innerHTML = `<i class="fas fa-shopping-cart"></i> (${cartCount})`;
            }
        });
    });
    
    // Simple Buy Now alert (DUMMY)
    const buyButtons = document.querySelectorAll('.buy-btn');
    buyButtons.forEach(button => {
        button.addEventListener('click', function() {
            alert('Redirecting to secure Checkout...');
        });
    });

    // 3. Simple Remove Item from Cart (DUMMY - Cart Page)
    const removeButtons = document.querySelectorAll('.item-remove button');
    removeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const itemRow = button.closest('.cart-item');
            if (itemRow) {
                if (confirm("Are you sure you want to remove this item?")) {
                    itemRow.remove();
                    alert("Item removed. Please refresh the page to update the total."); 
                    // Note: In real JS, this would recalculate the totals instantly.
                }
            }
        });
    });
});
