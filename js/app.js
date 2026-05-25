// KA-16 LINEN CLUB — Redesigned Interactive and E-Commerce Cart Engine
// Manages: Custom trailing cursor, navbar transitions, GSAP reveals, image lightbox, 
// and a fully-featured e-commerce shopping cart system with WhatsApp checkout compiler.

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialise Dynamic Client Views (New Arrivals, Offers) from CMS after cloud synchronisation
    if (window.KA16_CMS && window.KA16_CMS.loadFromCloud) {
        await window.KA16_CMS.loadFromCloud();
    }
    renderDynamicClientViews();

    // 2. Initialise Core Animations & UI Components
    initCustomCursor();
    initHeaderScroll();
    initMobileNavigation();
    initGsapScrollReveals();
    initGalleryLightbox();

    // 3. Initialise E-Commerce Cart System
    initShoppingSystem();

    // 4. Initialise Premium Cinematic 3D Fashion Carousel
    init3DCarousel();
});

/* ==========================================================================
   1. CUSTOM INERTIAL TRAILING CURSOR
   ========================================================================== */
function initCustomCursor() {
    const cursor = document.createElement('div');
    const cursorDot = document.createElement('div');

    cursor.className = 'custom-cursor';
    cursorDot.className = 'custom-cursor-dot';

    document.body.appendChild(cursor);
    document.body.appendChild(cursorDot);

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        cursorDot.style.left = `${mouseX}px`;
        cursorDot.style.top = `${mouseY}px`;
    });

    function updateCursorPosition() {
        const dx = mouseX - cursorX;
        const dy = mouseY - cursorY;

        cursorX += dx * 0.15;
        cursorY += dy * 0.15;

        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;

        requestAnimationFrame(updateCursorPosition);
    }
    updateCursorPosition();

    // Custom hover trigger setups
    function attachCursorHoverEffects() {
        const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, .gallery-item, .runway-item, .qty-btn');
        interactiveElements.forEach(elem => {
            // Remove first to prevent double bindings
            elem.removeEventListener('mouseenter', addHoverClass);
            elem.removeEventListener('mouseleave', removeHoverClass);

            elem.addEventListener('mouseenter', addHoverClass);
            elem.addEventListener('mouseleave', removeHoverClass);
        });
    }

    function addHoverClass() { cursor.classList.add('cursor-hover'); }
    function removeHoverClass() { cursor.classList.remove('cursor-hover'); }

    attachCursorHoverEffects();

    // Expose this globally so newly rendered elements can re-bind hover states
    window.refreshCursorBinds = attachCursorHoverEffects;
}

/* ==========================================================================
   2. NAVBAR STYLING ON SCROLL
   ========================================================================== */
function initHeaderScroll() {
    const header = document.querySelector('.main-header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

/* ==========================================================================
   3. MOBILE NAVIGATION DRAWER
   ========================================================================== */
function initMobileNavigation() {
    const toggle = document.querySelector('.mobile-toggle');
    const nav = document.querySelector('.nav-links');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        nav.classList.toggle('mobile-active');
        toggle.classList.toggle('active');
    });

    const links = nav.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('mobile-active');
            toggle.classList.remove('active');
        });
    });
}

/* ==========================================================================
   4. SCROLL REVEALS (Viewport Intersection System)
   ========================================================================== */
function initGsapScrollReveals() {
    const reveals = document.querySelectorAll('.gsap-reveal');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.getAttribute('data-delay') || 0;
                setTimeout(() => {
                    entry.target.classList.add('active');
                }, delay);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    reveals.forEach(element => {
        revealObserver.observe(element);
    });
}

/* ==========================================================================
   5. GALLERY LIGHTBOX SYSTEM
   ========================================================================== */
function initGalleryLightbox() {
    const items = document.querySelectorAll('.gallery-item, .runway-item');
    if (items.length === 0) return;

    let modal = document.querySelector('.lightbox-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'lightbox-modal';
        modal.innerHTML = `
            <div class="lightbox-content">
                <button class="lightbox-close">&times;</button>
                <img class="lightbox-img" src="" alt="Premium Menswear Gallery Preview">
            </div>
        `;
        document.body.appendChild(modal);
    }

    const modalImg = modal.querySelector('.lightbox-img');
    const closeBtn = modal.querySelector('.lightbox-close');

    items.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            if (!img) return;

            modalImg.src = img.src;
            modalImg.alt = img.alt;
            modal.classList.add('active');
        });
    });

    const closeModal = () => modal.classList.remove('active');

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

/* ==========================================================================
   6. COMPLETE ADD TO CART SYSTEM & WHATSAPP CHECKOUT
   ========================================================================== */
function initShoppingSystem() {
    // 1. Core State Array - Load from local storage for multi-page persistence
    let cart = JSON.parse(localStorage.getItem('ka16_cart')) || [];

    // 2. Inject Cart Drawer Markup Dynamically if missing (so all subpages share it easily)
    injectCartDrawerMarkup();

    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    const closeBtn = document.getElementById('cart-close-btn');
    const toggleCartIcons = document.querySelectorAll('.cart-toggle-btn');
    const checkoutBtn = document.getElementById('cart-checkout-btn');

    // 3. Register Event Listeners for Cart Drawer visibility
    toggleCartIcons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            drawer.classList.add('active');
            overlay.classList.add('active');
        });
    });

    const closeCartDrawer = () => {
        drawer.classList.remove('active');
        overlay.classList.remove('active');
    };

    if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);
    if (overlay) overlay.addEventListener('click', closeCartDrawer);

    // 4. Register Event Listeners for 'Add to Cart' buttons in catalogs
    document.body.addEventListener('click', (e) => {
        const addBtn = e.target.closest('.add-to-cart-btn');
        if (addBtn) {
            e.preventDefault();
            const id = addBtn.getAttribute('data-id');
            const name = addBtn.getAttribute('data-name');
            const price = parseInt(addBtn.getAttribute('data-price'));
            const img = addBtn.getAttribute('data-img');
            const color = addBtn.getAttribute('data-color') || '';

            // Find size in data-size attribute
            const size = addBtn.getAttribute('data-size') || 'M';

            addToCart(id, name, price, size, img, color);
        }
    });

    // 5. Cart Operations
    function addToCart(id, name, price, size, img, color = '') {
        // Check if identical product (ID + Size + Color) exists
        const existingIndex = cart.findIndex(item => item.id === id && item.size === size && item.color === color);

        if (existingIndex > -1) {
            cart[existingIndex].qty += 1;
        } else {
            cart.push({ id, name, price, size, img, color, qty: 1 });
        }

        updateStorage();
        renderCart();

        // Auto open cart drawer to verify addition beautifully
        drawer.classList.add('active');
        overlay.classList.add('active');
    }

    function updateQty(id, size, color, change) {
        const itemIndex = cart.findIndex(item => item.id === id && item.size === size && item.color === color);
        if (itemIndex > -1) {
            cart[itemIndex].qty += change;
            if (cart[itemIndex].qty <= 0) {
                cart.splice(itemIndex, 1);
            }
            updateStorage();
            renderCart();
        }
    }

    function deleteItem(id, size, color) {
        cart = cart.filter(item => !(item.id === id && item.size === size && item.color === color));
        updateStorage();
        renderCart();
    }

    function updateStorage() {
        localStorage.setItem('ka16_cart', JSON.stringify(cart));
    }

    // 6. Draw Cart items inside drawer
    function renderCart() {
        const cartBody = document.getElementById('cart-body-content');
        const cartBadge = document.querySelectorAll('.cart-badge');
        const subtotalEl = document.getElementById('cart-total-value');

        if (!cartBody || !subtotalEl) return;

        // Calculate badges and totals
        let totalItems = 0;
        let totalVal = 0;

        if (cart.length === 0) {
            cartBody.innerHTML = `<p class="cart-empty-text">Your luxury shopping cart is empty.</p>`;
            subtotalEl.textContent = '₹0';
            checkoutBtn.style.opacity = '0.5';
            checkoutBtn.style.pointerEvents = 'none';
        } else {
            cartBody.innerHTML = '';
            checkoutBtn.style.opacity = '1';
            checkoutBtn.style.pointerEvents = 'all';

            cart.forEach(item => {
                totalItems += item.qty;
                totalVal += item.price * item.qty;

                const row = document.createElement('div');
                row.className = 'cart-item-row';
                row.innerHTML = `
                    <img src="${item.img}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <span class="item-size">${item.color ? `Color: ${item.color} | ` : ''}Size: ${isNaN(item.size) ? item.size : `Waist ${item.size}`}</span>
                        <div class="cart-item-qty">
                            <button class="qty-btn dec-qty" data-id="${item.id}" data-size="${item.size}" data-color="${item.color || ''}"><i class="fa-solid fa-minus"></i></button>
                            <span class="qty-val">${item.qty}</span>
                            <button class="qty-btn inc-qty" data-id="${item.id}" data-size="${item.size}" data-color="${item.color || ''}"><i class="fa-solid fa-plus"></i></button>
                        </div>
                    </div>
                    <div class="cart-item-right">
                        <span class="cart-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')}</span>
                        <button class="cart-item-delete" data-id="${item.id}" data-size="${item.size}" data-color="${item.color || ''}"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                `;
                cartBody.appendChild(row);
            });

            subtotalEl.textContent = `₹${totalVal.toLocaleString('en-IN')}`;
        }

        // Update counts in badges across pages
        cartBadge.forEach(badge => {
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'flex' : 'none';
        });

        // Register handlers for new dynamic controls
        const decButtons = cartBody.querySelectorAll('.dec-qty');
        const incButtons = cartBody.querySelectorAll('.inc-qty');
        const deleteButtons = cartBody.querySelectorAll('.cart-item-delete');

        decButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                updateQty(btn.getAttribute('data-id'), btn.getAttribute('data-size'), btn.getAttribute('data-color') || '', -1);
            });
        });

        incButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                updateQty(btn.getAttribute('data-id'), btn.getAttribute('data-size'), btn.getAttribute('data-color') || '', 1);
            });
        });

        deleteButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                deleteItem(btn.getAttribute('data-id'), btn.getAttribute('data-size'), btn.getAttribute('data-color') || '');
            });
        });

        // Re-align pointer cursor triggers for gold hover
        if (window.refreshCursorBinds) window.refreshCursorBinds();
    }

    // Initial render
    renderCart();

    // 7. Inject Cart Drawer Elements
    function injectCartDrawerMarkup() {
        if (document.getElementById('cart-drawer')) return; // Already exists

        // Create overlay
        const overlayDiv = document.createElement('div');
        overlayDiv.id = 'cart-drawer-overlay';
        overlayDiv.className = 'cart-drawer-overlay';
        document.body.appendChild(overlayDiv);

        // Create drawer
        const drawerDiv = document.createElement('div');
        drawerDiv.id = 'cart-drawer';
        drawerDiv.className = 'cart-drawer';

        drawerDiv.innerHTML = `
            <div class="cart-header">
                <h3>Shopping Bag</h3>
                <button id="cart-close-btn" class="cart-close-btn">&times;</button>
            </div>
            <div class="cart-body" id="cart-body-content">
                <!-- Cart items load here dynamically -->
            </div>
            <div class="cart-footer">
                <div class="cart-subtotal">
                    <span>Estimated Total</span>
                    <h4 id="cart-total-value">₹0</h4>
                </div>
                <button id="cart-checkout-btn" class="btn-primary cart-checkout-btn"><i class="fa-brands fa-whatsapp"></i> Order on WhatsApp</button>
            </div>
        `;
        document.body.appendChild(drawerDiv);
    }

    // ==========================================================================
    // WHATSAPP INTEGRATION & DYNAMIC ORDER SYSTEM
    // ==========================================================================
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) return;
            
            // Sizing validation: check if any cart item exceeds available stock
            let oosItems = [];
            
            cart.forEach(item => {
                // Find product in catalog or arrivals
                const product = KA16_CMS.getProducts().find(p => p.id === item.id);
                if (product) {
                    const szStock = (product.sizes && product.sizes[item.size] !== undefined) ? product.sizes[item.size] : 
                                    ((product.waistSizes && product.waistSizes[item.size] !== undefined) ? product.waistSizes[item.size] : 0);
                    if (szStock < item.qty) {
                        oosItems.push(`${item.name} (${item.size}) - Available: ${szStock}, in cart: ${item.qty}`);
                    }
                } else {
                    const arrival = KA16_CMS.getNewArrivals().find(p => p.id === item.id);
                    if (arrival) {
                        // Find matching variant
                        const variant = arrival.variants.find(v => v.colorName === item.color);
                        if (variant) {
                            const szStock = (variant.sizes && variant.sizes[item.size] !== undefined) ? variant.sizes[item.size] : 
                                            ((variant.waistSizes && variant.waistSizes[item.size] !== undefined) ? variant.waistSizes[item.size] : 0);
                            if (szStock < item.qty) {
                                oosItems.push(`${item.name} (${item.size}, ${item.color}) - Available: ${szStock}, in cart: ${item.qty}`);
                            }
                        }
                    }
                }
            });

            if (oosItems.length > 0) {
                alert(`⚠️ Some items in your cart are currently out of stock or exceed available quantities:\n\n${oosItems.join('\n')}\n\nPlease adjust your cart before checking out.`);
                return;
            }
            
            openCheckoutDetailsModal();
        });
    }

    function openCheckoutDetailsModal() {
        let checkoutModal = document.getElementById('checkout-modal');

        if (!checkoutModal) {
            checkoutModal = document.createElement('div');
            checkoutModal.id = 'checkout-modal';
            checkoutModal.className = 'checkout-modal';

            checkoutModal.innerHTML = `
                <div class="checkout-modal-content">
                    <button class="checkout-close-btn" id="checkout-modal-close">&times;</button>
                    <span class="section-label" style="font-size: 0.7rem;">Delivery details</span>
                    <h3 class="section-title" style="font-size: 1.5rem; margin-bottom: 25px;">Luxury Checkout</h3>
                    
                    <form id="checkout-info-form" class="contact-form">
                        <div class="form-field-wrapper">
                            <label for="checkout-name">Your Full Name *</label>
                            <input type="text" id="checkout-name" class="form-input" placeholder="e.g. Amit Kumar" required>
                        </div>
                        <div class="form-field-wrapper">
                            <label for="checkout-address">Delivery Address *</label>
                            <textarea id="checkout-address" class="form-input form-textarea" style="height: 80px;" placeholder="Full Address, Landmark, Town/City" required></textarea>
                        </div>
                        <button type="submit" class="btn-primary" style="width: 100%; margin-top: 15px;"><i class="fa-brands fa-whatsapp"></i> Complete WhatsApp Order</button>
                    </form>
                </div>
            `;
            document.body.appendChild(checkoutModal);

            const mClose = document.getElementById('checkout-modal-close');
            mClose.addEventListener('click', () => {
                checkoutModal.classList.remove('active');
            });

            checkoutModal.addEventListener('click', (e) => {
                if (e.target === checkoutModal) checkoutModal.classList.remove('active');
            });
        }

        checkoutModal.classList.add('active');

        // Form Submit
        const form = document.getElementById('checkout-info-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('checkout-name').value.trim();
            const address = document.getElementById('checkout-address').value.trim();

            if (!name || !address) return;

            submitWhatsAppOrder(name, address);
            checkoutModal.classList.remove('active');
            closeCartDrawer();
        });

        // Re-align pointer binds
        if (window.refreshCursorBinds) window.refreshCursorBinds();
    }

    function submitWhatsAppOrder(customerName, deliveryAddress) {
        const businessPhone = '918123555826'; // KA-16 Linen Club WhatsApp
        let totalVal = 0;
        let itemsText = '';

        cart.forEach((item, index) => {
            const itemCost = item.price * item.qty;
            totalVal += itemCost;

            itemsText += `${index + 1}. *${item.name}*\n`;
            const sizeLabel = isNaN(item.size) ? item.size : `Waist ${item.size}`;
            const colorLabel = item.color ? ` | Color: ${item.color}` : '';
            itemsText += `   Size: ${sizeLabel}${colorLabel} | Qty: ${item.qty} | Price: ₹${itemCost.toLocaleString('en-IN')}\n\n`;
        });

        const invoiceTemplate = `*KA-16 LINEN CLUB — CUSTOM ORDER*
---------------------------------------
*CUSTOMER DETAILS:*
*Name:* ${customerName}
*Address:* ${deliveryAddress}

*ORDER SUMMARY:*
${itemsText}*TOTAL ORDER VALUE:* ₹${totalVal.toLocaleString('en-IN')}
---------------------------------------
_Sent from KA-16 Linen Club Shopping Portal_`;

        const encodedMsg = encodeURIComponent(invoiceTemplate);
        const whatsappCheckoutUrl = `https://api.whatsapp.com/send?phone=${businessPhone}&text=${encodedMsg}`;

        // Clear cart values
        cart = [];
        updateStorage();
        renderCart();

        // Redirect user to submit
        setTimeout(() => {
            window.open(whatsappCheckoutUrl, '_blank');
        }, 300);
    }
}

/* ==========================================================================
   7. PREMIUM CINEMATIC 3D FASHION CAROUSEL ENGINE
   ========================================================================== */
function init3DCarousel() {
    const section = document.querySelector('.cinematic-carousel-section');
    const container = document.querySelector('.carousel-showcase-container');
    const typoBg = document.getElementById('carousel-bg-typo');
    if (!section || !container) return;

    // High fashion coordinates datasets
    const slidesData = (window.KA16_CMS) ? window.KA16_CMS.getGallery() : [
        {
            img: "img/hero_model_1779287264386.png",
            typo: "LINEN CLUB",
            bg: "radial-gradient(circle at center, #27211e 0%, #0d0c0b 100%)",
            label: "Campaign SS26",
            desc: "Tailor-grade linen draping styled for absolute prestige."
        },
        {
            img: "img/arrivals_product_1_1779290884369.png",
            typo: "PREMIUM FIT",
            bg: "radial-gradient(circle at center, #1c2721 0%, #0c0d0c 100%)",
            label: "Vintage Safari",
            desc: "Custom linen safari coord coordinates detailing luxury heritage."
        },
        {
            img: "img/cat_wedding_1779287445980.png",
            typo: "LUXURY LINEN",
            bg: "radial-gradient(circle at center, #27261e 0%, #0d0d0c 100%)",
            label: "Ceremonial Ivory",
            desc: "Pure organic cream blazers designed for elite wedding grooms."
        },
        {
            img: "img/arrivals_product_2_1779290933723.png",
            typo: "MODERN MEN",
            bg: "radial-gradient(circle at center, #1e2227 0%, #0c0c0d 100%)",
            label: "Raw Coordinates",
            desc: "Breathable beige coordinates for high-end resort leisure wear."
        },
        {
            img: "img/cat_outfits_1779287514198.png",
            typo: "COUTURE ATELIER",
            bg: "radial-gradient(circle at center, #251e27 0%, #0c0b0c 100%)",
            label: "Resort Layering",
            desc: "Gold-accented linen combinations designed for premium lifestyles."
        }
    ];

    let currentIndex = 0;
    const slides = [];

    // Render interactive cards dynamically
    container.innerHTML = '';
    slidesData.forEach((data, index) => {
        const slide = document.createElement('div');
        slide.className = 'showcase-slide';
        slide.innerHTML = `<img src="${data.img}" alt="${data.label}">`;
        container.appendChild(slide);
        slides.push(slide);

        // Click side card to translate directly
        slide.addEventListener('click', () => {
            if (index !== currentIndex) {
                currentIndex = index;
                updateCarousel();
            }
        });
    });

    const prevBtn = section.querySelector('.prev-btn');
    const nextBtn = section.querySelector('.next-btn');
    const labelEl = section.querySelector('.bottom-left-branding span');
    const descEl = section.querySelector('.bottom-left-branding p');

    // Coordinate sliding transitions
    function updateCarousel() {
        const len = slidesData.length;

        slides.forEach((slide, idx) => {
            slide.classList.remove('pos-active', 'pos-left', 'pos-right', 'pos-far-left', 'pos-far-right');

            let diff = idx - currentIndex;
            if (diff < -2) diff += len;
            if (diff > 2) diff -= len;

            if (diff === 0) {
                slide.classList.add('pos-active');
                slide.style.transform = `translate3d(-50%, -50%, 100px)`;
            } else {
                slide.style.transform = ''; // Clear inline styles so stylesheet classes work flawlessly
                if (diff === -1 || (diff === len - 1)) {
                    slide.classList.add('pos-left');
                } else if (diff === 1 || (diff === -len + 1)) {
                    slide.classList.add('pos-right');
                } else if (diff < -1) {
                    slide.classList.add('pos-far-left');
                } else if (diff > 1) {
                    slide.classList.add('pos-far-right');
                }
            }
        });

        // Update elements & metadata
        const activeData = slidesData[currentIndex];

        // 1. Pivot backdrop gradient colors
        section.style.background = activeData.bg;

        // 2. Animate giant back text
        if (typoBg) {
            typoBg.style.opacity = '0';
            typoBg.style.transform = 'translate(-50%, -50%) scale(0.92)';
            setTimeout(() => {
                typoBg.textContent = activeData.typo;
                typoBg.style.opacity = '0.035';
                typoBg.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 300);
        }

        // 3. Update active descriptors
        if (labelEl) labelEl.textContent = activeData.label;
        if (descEl) descEl.textContent = activeData.desc;

        // Refresh dynamic pointer bounds
        if (window.refreshCursorBinds) window.refreshCursorBinds();
    }

    // Nav Bindings
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex - 1 + slidesData.length) % slidesData.length;
            updateCarousel();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex + 1) % slidesData.length;
            updateCarousel();
        });
    }

    // Touch Swipe Mechanics
    let touchStartX = 0;
    let touchEndX = 0;
    section.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    section.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        if (touchStartX - touchEndX > 45) {
            currentIndex = (currentIndex + 1) % slidesData.length;
            updateCarousel();
        } else if (touchEndX - touchStartX > 45) {
            currentIndex = (currentIndex - 1 + slidesData.length) % slidesData.length;
            updateCarousel();
        }
    }

    // Interactive Mouse Reactive 3D depth tilt parallax
    section.addEventListener('mousemove', (e) => {
        const activeSlide = container.querySelector('.pos-active');
        if (!activeSlide) return;

        const rect = section.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;

        const maxTilt = 12; // Degrees
        const tiltX = (mouseY / (rect.height / 2)) * -maxTilt;
        const tiltY = (mouseX / (rect.width / 2)) * maxTilt;

        activeSlide.style.transform = `translate3d(-50%, -50%, 100px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;

        // Typography moves slightly opposite
        if (typoBg) {
            const shiftX = (mouseX / (rect.width / 2)) * -22;
            const shiftY = (mouseY / (rect.height / 2)) * -12;
            typoBg.style.transform = `translate(calc(-50% + ${shiftX}px), calc(-50% + ${shiftY}px)) scale(1.01)`;
        }
    });

    // Reset parallax on leave
    section.addEventListener('mouseleave', () => {
        const activeSlide = container.querySelector('.pos-active');
        if (activeSlide) {
            activeSlide.style.transform = `translate3d(-50%, -50%, 100px)`;
        }
        if (typoBg) {
            typoBg.style.transform = `translate(-50%, -50%) scale(1)`;
        }
    });

    // Initialise on load
    updateCarousel();
}

/* ==========================================================================
   8. DYNAMIC DUAL VIEW CMS PAGE COMPILE ENGINES
   ========================================================================== */
function renderSizeSelectorTiles(selectorWrapper, sizesMap, waistSizesMap, onSizeChangeCallback) {
    selectorWrapper.innerHTML = '';
    
    // Find all sizes with stock counts
    const upperEntries = Object.entries(sizesMap || {});
    const waistEntries = Object.entries(waistSizesMap || {});
    
    const allEntries = [...upperEntries, ...waistEntries];
    
    if (allEntries.length === 0) {
        selectorWrapper.innerHTML = '<span style="font-size:0.85rem; color:var(--text-muted);">Standard Fit</span>';
        if (onSizeChangeCallback) onSizeChangeCallback('Standard Fit', 999);
        return;
    }
    
    const tilesContainer = document.createElement('div');
    tilesContainer.className = 'size-tiles-container';
    
    const feedbackWrapper = document.createElement('div');
    feedbackWrapper.className = 'size-stock-feedback';
    feedbackWrapper.style.minHeight = '18px'; // Prevent layout shifts
    
    let firstAvailableSize = null;
    let firstAvailableStock = 0;
    
    allEntries.forEach(([sz, qty]) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'size-tile-btn';
        btn.setAttribute('data-size', sz);
        btn.setAttribute('data-qty', qty);
        btn.textContent = sz;
        
        if (qty <= 0) {
            btn.classList.add('out-of-stock');
            btn.disabled = true;
            btn.title = "Out of Stock";
        } else {
            if (!firstAvailableSize) {
                firstAvailableSize = sz;
                firstAvailableStock = qty;
            }
        }
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            tilesContainer.querySelectorAll('.size-tile-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show low stock warning if qty is 1 or 2
            feedbackWrapper.innerHTML = '';
            if (qty === 1 || qty === 2) {
                feedbackWrapper.innerHTML = `<span class="low-stock-alert"><i class="fa-solid fa-triangle-exclamation"></i> Only ${qty} left!</span>`;
            }
            
            if (onSizeChangeCallback) onSizeChangeCallback(sz, qty);
        });
        
        tilesContainer.appendChild(btn);
    });
    
    selectorWrapper.appendChild(tilesContainer);
    selectorWrapper.appendChild(feedbackWrapper);
    
    // Trigger default selection of first available size
    if (firstAvailableSize) {
        const firstBtn = tilesContainer.querySelector(`.size-tile-btn[data-size="${firstAvailableSize}"]`);
        if (firstBtn) firstBtn.click();
    } else {
        // All sizes out of stock!
        feedbackWrapper.innerHTML = '<span style="font-size:0.75rem; color:#ef4444; font-weight:600; text-transform:uppercase;">Out of Stock</span>';
        if (onSizeChangeCallback) onSizeChangeCallback(null, 0);
    }
}

function renderDynamicClientViews() {
    // 1. New Arrivals catalog rendering
    const arrivalsGrid = document.getElementById('new-arrivals-grid');
    if (arrivalsGrid && window.KA16_CMS) {
        const arrivals = window.KA16_CMS.getNewArrivals();
        arrivalsGrid.innerHTML = '';

        arrivals.forEach((item, index) => {
            if (!item.published) return;

            const card = document.createElement('div');
            card.className = 'collection-card gsap-reveal';
            card.style.animationDelay = `${index * 100}ms`;

            // Backwards compatibility fallback if item doesn't have variants yet
            const variants = item.variants && item.variants.length > 0 ? item.variants : [
                {
                    colorName: "Original",
                    colorHex: "#c8a96b",
                    stock: 10,
                    price: item.price || 0,
                    img: item.img || "img/arrivals_banner_1779290841203.png",
                    sizes: item.sizes || {}
                }
            ];

            const primaryVar = variants[0];
            const defaultPrice = primaryVar.price || item.price || 0;

            // Render HSL/Hex Color Selection Dots if more than 1 variant is available
            let colorDotsHtml = '';
            if (variants.length > 1) {
                colorDotsHtml = `
                    <div class="color-selector-dots">
                        ${variants.map((v, i) => `
                            <span class="color-dot ${i === 0 ? 'active' : ''}" 
                                style="background-color: ${v.colorHex}; border: ${v.colorHex.toLowerCase() === '#ffffff' ? '1px solid #ddd' : 'none'};" 
                                data-idx="${i}" 
                                title="${v.colorName}"></span>
                        `).join('')}
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="collection-img-box">
                    <img src="${primaryVar.img}" alt="${item.name}" class="collection-img">
                    <div class="collection-card-overlay">
                        <div class="overlay-content">
                            <p>${item.fabric}</p>
                            <h3>${item.name}</h3>
                        </div>
                    </div>
                </div>
                <div class="collection-info" style="background-color: #121212; border: 1px solid var(--border-light); border-top: none;">
                    <h3 style="color: var(--secondary);">${item.name}</h3>
                    <p style="color: var(--text-muted);">${item.description}</p>
                    
                    ${colorDotsHtml}
                    
                    <p class="cart-item-price" style="margin-top: 10px; font-weight:600; font-size:1.15rem; color:var(--accent);">₹${defaultPrice.toLocaleString()}</p>
                    
                    <div class="product-size-selector size-selector-wrap" id="size-selector-${item.id}">
                        <!-- Dynamic tiles will be rendered here -->
                    </div>
                    
                    <button class="btn-primary add-to-cart-btn" style="width:100%; margin-top:15px; padding:12px; font-size:0.8rem;"
                        data-id="${item.id}" data-name="${item.name}" data-price="${defaultPrice}" data-img="${primaryVar.img}" data-color="${primaryVar.colorName}">
                        <i class="fa-solid fa-bag-shopping"></i> Add to Cart
                    </button>
                </div>
            `;
            
            arrivalsGrid.appendChild(card);

            // Bind click event listeners to color dots
            const imgEl = card.querySelector('.collection-img');
            const priceEl = card.querySelector('.cart-item-price');
            const sizeSelectorWrap = card.querySelector(`.size-selector-wrap`);
            const cartBtn = card.querySelector('.add-to-cart-btn');
            const dots = card.querySelectorAll('.color-dot');

            function setupSizingForVariant(selectedVar) {
                // Check if all sizes are out of stock in this variant
                const totalVarStock = Object.values(selectedVar.sizes || {}).reduce((a, b) => a + b, 0) + 
                                     Object.values(selectedVar.waistSizes || {}).reduce((a, b) => a + b, 0);
                                     
                if (totalVarStock === 0) {
                    card.classList.add('sold-out');
                    if (!card.querySelector('.sold-out-badge')) {
                        const badge = document.createElement('span');
                        badge.className = 'sold-out-badge';
                        badge.textContent = 'Sold Out';
                        card.querySelector('.collection-img-box').appendChild(badge);
                    }
                } else {
                    card.classList.remove('sold-out');
                    const badge = card.querySelector('.sold-out-badge');
                    if (badge) badge.remove();
                }

                renderSizeSelectorTiles(sizeSelectorWrap, selectedVar.sizes, selectedVar.waistSizes, (sz, qty) => {
                    if (!sz) {
                        cartBtn.disabled = true;
                        cartBtn.classList.add('disabled-soldout');
                        cartBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Out of Stock';
                        cartBtn.setAttribute('data-size', '');
                    } else {
                        cartBtn.disabled = false;
                        cartBtn.classList.remove('disabled-soldout');
                        cartBtn.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> Add to Cart';
                        cartBtn.setAttribute('data-size', sz);
                    }
                });
            }

            // Setup default variant sizing
            setupSizingForVariant(primaryVar);

            dots.forEach(dot => {
                dot.addEventListener('click', () => {
                    const idx = parseInt(dot.getAttribute('data-idx'));
                    const selectedVar = variants[idx];

                    // Swap active class on dots
                    dots.forEach(d => d.classList.remove('active'));
                    dot.classList.add('active');

                    // Crossfade Image smoothly
                    imgEl.classList.add('swapping');
                    setTimeout(() => {
                        imgEl.src = selectedVar.img;
                        imgEl.classList.remove('swapping');
                    }, 200);

                    // Update dynamic price
                    const displayPrice = selectedVar.price || item.price || 0;
                    priceEl.textContent = `₹${displayPrice.toLocaleString()}`;

                    // Update sizes selector
                    setupSizingForVariant(selectedVar);

                    // Bind updated attributes to add-to-cart button
                    cartBtn.setAttribute('data-price', displayPrice);
                    cartBtn.setAttribute('data-img', selectedVar.img);
                    cartBtn.setAttribute('data-color', selectedVar.colorName);
                });
            });
        });
    }

    // 2. Vouchers rendering
    const vouchersGrid = document.getElementById('vouchers-grid');
    if (vouchersGrid && window.KA16_CMS) {
        const offers = window.KA16_CMS.getOffers();
        vouchersGrid.innerHTML = '';

        offers.vouchers.forEach((item, index) => {
            if (!item.enabled) return;

            const card = document.createElement('div');
            card.className = 'coupon-card gsap-reveal';
            card.style.animationDelay = `${index * 100}ms`;

            card.innerHTML = `
                <div>
                    <div class="coupon-value">${item.valueType === 'percent' ? `${item.value}% <span>OFF</span>` : `₹${item.value.toLocaleString()} <span>OFF</span>`}</div>
                    <h3 class="coupon-title">${item.title}</h3>
                    <p class="coupon-descr">${item.descr}</p>
                </div>
                <div class="coupon-code">CODE: ${item.code}</div>
            `;
            vouchersGrid.appendChild(card);
        });
    }

    // 3. Bundles rendering
    const bundlesGrid = document.getElementById('bundles-grid');
    if (bundlesGrid && window.KA16_CMS) {
        const offers = window.KA16_CMS.getOffers();
        bundlesGrid.innerHTML = '';

        offers.bundles.forEach((item, index) => {
            if (!item.enabled) return;

            const card = document.createElement('div');
            card.className = 'collection-card gsap-reveal';
            card.style.animationDelay = `${index * 100}ms`;

            let countdownHtml = '';
            if (item.countdownDate) {
                const timerId = `timer-${item.id}`;
                countdownHtml = `<div class="offer-timer" id="${timerId}" style="margin: 10px 0; color: var(--accent); font-weight: 700; font-size: 0.85rem; letter-spacing:0.05em;"></div>`;

                setTimeout(() => {
                    initOfferCountdown(item.countdownDate, timerId);
                }, 100);
            }

            card.innerHTML = `
                <div class="collection-img-box">
                    <img src="${item.img}" alt="${item.name}" class="collection-img">
                    <div class="collection-card-overlay">
                        <div class="overlay-content">
                            <p>${item.badge}</p>
                            <h3>${item.name}</h3>
                        </div>
                    </div>
                </div>
                <div class="collection-info">
                    <h3>${item.name}</h3>
                    <p>${item.descr}</p>
                    ${countdownHtml}
                    <p class="cart-item-price" style="margin-top: 10px; font-weight:600; font-size:1.15rem; color:var(--accent);">₹${item.price.toLocaleString()}</p>
                    
                    <div class="product-size-selector size-selector-wrap" id="size-selector-${item.id}">
                        <!-- Dynamic tiles will be rendered here -->
                    </div>
                    
                    <button class="btn-primary add-to-cart-btn" style="width:100%; margin-top:15px; padding:12px; font-size:0.8rem;"
                        data-id="${item.id}" data-name="${item.name}" data-price="${item.price}" data-img="${item.img}">
                        <i class="fa-solid fa-bag-shopping"></i> Add to Cart
                    </button>
                </div>
            `;
            bundlesGrid.appendChild(card);

            const sizeSelectorWrap = card.querySelector(`.size-selector-wrap`);
            const cartBtn = card.querySelector('.add-to-cart-btn');

            // Setup sizing
            const totalStock = Object.values(item.sizes || {}).reduce((a, b) => a + b, 0) + 
                               Object.values(item.waistSizes || {}).reduce((a, b) => a + b, 0);
                               
            if (totalStock === 0) {
                card.classList.add('sold-out');
                const badge = document.createElement('span');
                badge.className = 'sold-out-badge';
                badge.textContent = 'Sold Out';
                card.querySelector('.collection-img-box').appendChild(badge);
            }

            renderSizeSelectorTiles(sizeSelectorWrap, item.sizes, item.waistSizes, (sz, qty) => {
                if (!sz) {
                    cartBtn.disabled = true;
                    cartBtn.classList.add('disabled-soldout');
                    cartBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Out of Stock';
                    cartBtn.setAttribute('data-size', '');
                } else {
                    cartBtn.disabled = false;
                    cartBtn.classList.remove('disabled-soldout');
                    cartBtn.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> Add to Cart';
                    cartBtn.setAttribute('data-size', sz);
                }
            });
        });
    }

    // 4. Standard Products Catalog rendering (on index.html)
    const indexProductsGrid = document.getElementById('index-products-grid');
    if (indexProductsGrid && window.KA16_CMS) {
        const products = window.KA16_CMS.getProducts();
        indexProductsGrid.innerHTML = '';

        products.forEach((item, index) => {
            if (!item.enabled) return;

            const card = document.createElement('div');
            card.className = 'collection-card gsap-reveal';
            card.style.animationDelay = `${index * 100}ms`;

            card.innerHTML = `
                <div class="collection-img-box">
                    <img src="${item.img}" alt="${item.name}" class="collection-img">
                    <div class="collection-card-overlay">
                        <div class="overlay-content">
                            <p>${item.fabric}</p>
                            <h3>${item.name}</h3>
                        </div>
                    </div>
                </div>
                <div class="collection-info" style="background-color: #121212; border: 1px solid var(--border-light); border-top: none;">
                    <h3 style="color: var(--secondary);">${item.name}</h3>
                    <p style="color: var(--text-muted);">${item.description}</p>
                    <p class="cart-item-price" style="margin-top: 10px; font-weight:600; font-size:1.15rem; color:var(--accent);">₹${item.price.toLocaleString()}</p>
                    
                    <div class="product-size-selector size-selector-wrap" id="size-selector-${item.id}">
                        <!-- Dynamic tiles will be rendered here -->
                    </div>
                    
                    <button class="btn-primary add-to-cart-btn" style="width:100%; margin-top:15px; padding:12px; font-size:0.8rem;"
                        data-id="${item.id}" data-name="${item.name}" data-price="${item.price}" data-img="${item.img}">
                        <i class="fa-solid fa-bag-shopping"></i> Add to Cart
                    </button>
                </div>
            `;
            indexProductsGrid.appendChild(card);

            const sizeSelectorWrap = card.querySelector(`.size-selector-wrap`);
            const cartBtn = card.querySelector('.add-to-cart-btn');

            // Setup sizing
            const totalStock = Object.values(item.sizes || {}).reduce((a, b) => a + b, 0) + 
                               Object.values(item.waistSizes || {}).reduce((a, b) => a + b, 0);
                               
            if (totalStock === 0) {
                card.classList.add('sold-out');
                if (!card.querySelector('.sold-out-badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'sold-out-badge';
                    badge.textContent = 'Sold Out';
                    card.querySelector('.collection-img-box').appendChild(badge);
                }
            }

            renderSizeSelectorTiles(sizeSelectorWrap, item.sizes, item.waistSizes, (sz, qty) => {
                if (!sz) {
                    cartBtn.disabled = true;
                    cartBtn.classList.add('disabled-soldout');
                    cartBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Out of Stock';
                    cartBtn.setAttribute('data-size', '');
                } else {
                    cartBtn.disabled = false;
                    cartBtn.classList.remove('disabled-soldout');
                    cartBtn.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> Add to Cart';
                    cartBtn.setAttribute('data-size', sz);
                }
            });
        });
    }
}

function initOfferCountdown(targetDateStr, elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const targetDate = new Date(targetDateStr).getTime();

    function updateTimer() {
        const now = Date.now();
        const diff = targetDate - now;

        if (diff <= 0) {
            el.innerHTML = '<i class="fa-solid fa-hourglass-end"></i> Limited Sale Ended';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        el.innerHTML = `<i class="fa-solid fa-hourglass-half"></i> Sale Ends: ${days}d ${hours}h ${mins}m ${secs}s`;
    }

    updateTimer();
    setInterval(updateTimer, 1000);
}

