// shop.js - Complete Functional Shop Section

document.addEventListener('DOMContentLoaded', function() {
    // Sample product data (20 products)
    const products = [
        {
            id: 1,
            title: "Solid Mahogany Door",
            description: "Handcrafted from premium mahogany with elegant finish",
            category: "doors",
            image: "door1.jpg"
        },
        {
            id: 2,
            title: "Oak Wooden Frame",
            description: "Durable oak frame for windows and doors",
            category: "frames",
            image: "frame1.jpg"
        },
        {
            id: 3,
            title: "Spiral Wooden Staircase",
            description: "Custom designed spiral staircase with handrails",
            category: "staircases",
            image: "staircase1.jpg"
        },
        {
            id: 4,
            title: "Executive Office Desk",
            description: "Large executive desk made from teak wood",
            category: "furniture",
            image: "desk1.jpg"
        },
        {
            id: 5,
            title: "Custom Carved Door",
            description: "Beautifully carved door with traditional designs",
            category: "doors",
            image: "door2.jpg"
        },
        {
            id: 6,
            title: "Modern TV Stand",
            description: "Contemporary TV stand with shelving",
            category: "furniture",
            image: "tvstand1.jpg"
        },
        {
            id: 7,
            title: "French Window Frames",
            description: "Elegant french-style window frames",
            category: "frames",
            image: "frame2.jpg"
        },
        {
            id: 8,
            title: "Floating Staircase",
            description: "Modern floating staircase design",
            category: "staircases",
            image: "staircase2.jpg"
        },
        {
            id: 9,
            title: "Dining Table Set",
            description: "6-seater dining table with chairs",
            category: "furniture",
            image: "dining1.jpg"
        },
        {
            id: 10,
            title: "Rustic Barn Door",
            description: "Charming rustic-style sliding barn door",
            category: "doors",
            image: "door3.jpg"
        },
        {
            id: 11,
            title: "Bedroom Wardrobe",
            description: "Spacious wardrobe with mirror doors",
            category: "furniture",
            image: "wardrobe1.jpg"
        },
        {
            id: 12,
            title: "Custom Arch Frame",
            description: "Arched doorway frame for elegant entryways",
            category: "frames",
            image: "frame3.jpg"
        },
        {
            id: 13,
            title: "Outdoor Deck Stairs",
            description: "Weather-resistant stairs for decks",
            category: "staircases",
            image: "staircase3.jpg"
        },
        {
            id: 14,
            title: "Coffee Table",
            description: "Handcrafted wooden coffee table",
            category: "furniture",
            image: "coffee1.jpg"
        },
        {
            id: 15,
            title: "Security Door",
            description: "Reinforced solid wood security door",
            category: "doors",
            image: "door4.jpg"
        },
        {
            id: 16,
            title: "Bookshelf",
            description: "Floor-to-ceiling wooden bookshelf",
            category: "furniture",
            image: "bookshelf1.jpg"
        },
        {
            id: 17,
            title: "Bay Window Frame",
            description: "Custom frame for bay windows",
            category: "frames",
            image: "frame4.jpg"
        },
        {
            id: 18,
            title: "L-Shaped Staircase",
            description: "Space-saving L-shaped staircase",
            category: "staircases",
            image: "staircase4.jpg"
        },
        {
            id: 19,
            title: "Bed Frame",
            description: "Queen size wooden bed frame",
            category: "furniture",
            image: "bed1.jpg"
        },
        {
            id: 20,
            title: "Custom Design Consultation",
            description: "Personalized design service for your project",
            category: "custom",
            image: "custom1.jpg"
        }
    ];

    // DOM Elements
    const productsContainer = document.getElementById('productsContainer');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const searchBtn = document.getElementById('searchBtn');
    const paginationContainer = document.getElementById('paginationContainer');
    
    // Pagination variables
    const productsPerPage = 10;
    let currentPage = 1;
    let filteredProducts = [];

    // Initialize the shop
    function initShop() {
        filteredProducts = [...products];
        displayProducts();
        setupEventListeners();
    }

    // Display products with pagination
    function displayProducts() {
        // Calculate pagination
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const productsToDisplay = filteredProducts.slice(startIndex, endIndex);
        
        // Clear container
        productsContainer.innerHTML = '';

        if (productsToDisplay.length === 0) {
            productsContainer.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-box-open"></i>
                    <p>No products found matching your criteria.</p>
                </div>
            `;
            return;
        }

        // Display products
        productsToDisplay.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-image">
                    <img src="assets/images/products/${product.image}" alt="${product.title}" loading="lazy">
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <p class="product-category">${formatCategory(product.category)}</p>
                    <p class="product-description">${product.description}</p>
                    <button class="quote-btn" data-product-title="${product.title}">
                        <i class="fab fa-whatsapp"></i> Request Quote
                    </button>
                </div>
            `;
            productsContainer.appendChild(productCard);
        });

        // Add event listeners to quote buttons
        document.querySelectorAll('.quote-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const productTitle = this.getAttribute('data-product-title');
                openWhatsApp(productTitle);
            });
        });

        // Update pagination controls
        updatePaginationControls();
    }

    // Update pagination controls
    function updatePaginationControls() {
        const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
        
        // Hide pagination if 10 or fewer products
        if (filteredProducts.length <= productsPerPage) {
            paginationContainer.style.display = 'none';
            return;
        }
        
        // Show pagination if more than 10 products
        paginationContainer.style.display = 'flex';
        paginationContainer.innerHTML = '';
        
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.className = 'pagination-btn';
        prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayProducts();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        paginationContainer.appendChild(prevButton);
        
        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // First page and ellipsis
        if (startPage > 1) {
            const firstPageButton = createPageButton(1);
            paginationContainer.appendChild(firstPageButton);
            
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'pagination-ellipsis';
                ellipsis.textContent = '...';
                paginationContainer.appendChild(ellipsis);
            }
        }
        
        // Visible page range
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = createPageButton(i);
            paginationContainer.appendChild(pageButton);
        }
        
        // Last page and ellipsis
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'pagination-ellipsis';
                ellipsis.textContent = '...';
                paginationContainer.appendChild(ellipsis);
            }
            
            const lastPageButton = createPageButton(totalPages);
            paginationContainer.appendChild(lastPageButton);
        }
        
        // Next button
        const nextButton = document.createElement('button');
        nextButton.className = 'pagination-btn';
        nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                displayProducts();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        paginationContainer.appendChild(nextButton);
    }
    
    // Helper function to create page buttons
    function createPageButton(pageNumber) {
        const pageButton = document.createElement('button');
        pageButton.className = `pagination-btn ${pageNumber === currentPage ? 'active' : ''}`;
        pageButton.textContent = pageNumber;
        pageButton.addEventListener('click', () => {
            currentPage = pageNumber;
            displayProducts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        return pageButton;
    }

    // Filter products based on search and category
    function filterProducts() {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;

        filteredProducts = products.filter(product => {
            const matchesSearch = product.title.toLowerCase().includes(searchTerm) || 
                                 product.description.toLowerCase().includes(searchTerm);
            const matchesCategory = category === 'all' || product.category === category;
            
            return matchesSearch && matchesCategory;
        });

        // Reset to first page when filtering
        currentPage = 1;
        displayProducts();
    }

    // Function to open WhatsApp with prefilled message
    function openWhatsApp(productTitle) {
        const message = `Hello Shachavir Timber, I'm interested in your ${productTitle}. Please share more details and pricing.`;
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/254721499606?text=${encodedMessage}`, '_blank');
    }

    // Helper function to format category names
    function formatCategory(category) {
        const categories = {
            'doors': 'Doors',
            'frames': 'Frames',
            'staircases': 'Staircases',
            'furniture': 'Furniture',
            'custom': 'Custom Order'
        };
        return categories[category] || category;
    }

    // Setup event listeners
    function setupEventListeners() {
        searchInput.addEventListener('input', filterProducts);
        categoryFilter.addEventListener('change', filterProducts);
        searchBtn.addEventListener('click', filterProducts);
        
        // Handle Enter key in search
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                filterProducts();
            }
        });
    }

    // Initialize the shop
    initShop();

    // Featured Products: Select 3 random products from the shop section

    // Use the same products array as your shop section
    const featuredProducts = [
        {
            id: 1,
            title: "Solid Mahogany Door",
            description: "Handcrafted from premium mahogany with elegant finish",
            category: "doors",
            image: "door1.jpg"
        },
        {
            id: 2,
            title: "Oak Wooden Frame",
            description: "Durable oak frame for windows and doors",
            category: "frames",
            image: "frame1.jpg"
        },
        {
            id: 3,
            title: "Spiral Wooden Staircase",
            description: "Custom designed spiral staircase with handrails",
            category: "staircases",
            image: "staircase1.jpg"
        },
        {
            id: 4,
            title: "Executive Office Desk",
            description: "Large executive desk made from teak wood",
            category: "furniture",
            image: "desk1.jpg"
        },
        {
            id: 5,
            title: "Custom Carved Door",
            description: "Beautifully carved door with traditional designs",
            category: "doors",
            image: "door2.jpg"
        },
        {
            id: 6,
            title: "Modern TV Stand",
            description: "Contemporary TV stand with shelving",
            category: "furniture",
            image: "tvstand1.jpg"
        },
        {
            id: 7,
            title: "French Window Frames",
            description: "Elegant french-style window frames",
            category: "frames",
            image: "frame2.jpg"
        },
        {
            id: 8,
            title: "Floating Staircase",
            description: "Modern floating staircase design",
            category: "staircases",
            image: "staircase2.jpg"
        },
        {
            id: 9,
            title: "Dining Table Set",
            description: "6-seater dining table with chairs",
            category: "furniture",
            image: "dining1.jpg"
        },
        {
            id: 10,
            title: "Rustic Barn Door",
            description: "Charming rustic-style sliding barn door",
            category: "doors",
            image: "door3.jpg"
        },
        {
            id: 11,
            title: "Bedroom Wardrobe",
            description: "Spacious wardrobe with mirror doors",
            category: "furniture",
            image: "wardrobe1.jpg"
        },
        {
            id: 12,
            title: "Custom Arch Frame",
            description: "Arched doorway frame for elegant entryways",
            category: "frames",
            image: "frame3.jpg"
        },
        {
            id: 13,
            title: "Outdoor Deck Stairs",
            description: "Weather-resistant stairs for decks",
            category: "staircases",
            image: "staircase3.jpg"
        },
        {
            id: 14,
            title: "Coffee Table",
            description: "Handcrafted wooden coffee table",
            category: "furniture",
            image: "coffee1.jpg"
        },
        {
            id: 15,
            title: "Security Door",
            description: "Reinforced solid wood security door",
            category: "doors",
            image: "door4.jpg"
        },
        {
            id: 16,
            title: "Bookshelf",
            description: "Floor-to-ceiling wooden bookshelf",
            category: "furniture",
            image: "bookshelf1.jpg"
        },
        {
            id: 17,
            title: "Bay Window Frame",
            description: "Custom frame for bay windows",
            category: "frames",
            image: "frame4.jpg"
        },
        {
            id: 18,
            title: "L-Shaped Staircase",
            description: "Space-saving L-shaped staircase",
            category: "staircases",
            image: "staircase4.jpg"
        },
        {
            id: 19,
            title: "Bed Frame",
            description: "Queen size wooden bed frame",
            category: "furniture",
            image: "bed1.jpg"
        },
        {
            id: 20,
            title: "Custom Design Consultation",
            description: "Personalized design service for your project",
            category: "custom",
            image: "custom1.jpg"
        }
    ];

    // Helper to get 3 random unique products
    function getRandomProducts(arr, n) {
        const result = [];
        const taken = new Set();
        while (result.length < n && result.length < arr.length) {
            const idx = Math.floor(Math.random() * arr.length);
            if (!taken.has(idx)) {
                result.push(arr[idx]);
                taken.add(idx);
            }
        }
        return result;
    }

    // Render featured products
    const featuredContainer = document.getElementById('featuredProductsContainer');
    if (featuredContainer) {
        featuredContainer.innerHTML = '';
        const featured = getRandomProducts(products, 3);
        featured.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="assets/images/products/${product.image}" alt="${product.title}">
                <div class="product-title">${product.title}</div>
                <div class="product-category">${product.category.charAt(0).toUpperCase() + product.category.slice(1)}</div>
                <div class="product-description">${product.description}</div>
                <button class="quote-btn"><i class="fab fa-whatsapp"></i> Request Quote</button>
            `;
            card.querySelector('.quote-btn').addEventListener('click', function() {
                const msg = encodeURIComponent(`Hello Shachavir Timber, I'm interested in your featured product: ${product.title}`);
                window.open(`https://wa.me/254721499606?text=${msg}`, '_blank');
            });
            featuredContainer.appendChild(card);
        });
    }
});