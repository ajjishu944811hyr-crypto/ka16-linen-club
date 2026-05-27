/**
 * KA-16 LINEN CLUB
 * Central CMS Storage Manager and Data Sync Adapter (MongoDB Atlas + Cloudinary CDN)
 */

(function() {
    // Local memory caches
    let products = [];
    let newArrivals = [];
    let offers = { vouchers: [], bundles: [] };
    let gallery = [];

    // Helper: Upload Base64 image dropzone payload to Cloudinary via backend secure API
    async function uploadToCloudinary(imgStr) {
        if (imgStr && imgStr.startsWith('data:image/')) {
            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: imgStr })
                });
                if (res.ok) {
                    const data = await res.json();
                    return data.url; // Cloudinary secure CDN URL
                } else {
                    console.error("Cloudinary upload rejected:", await res.text());
                }
            } catch (e) {
                console.error("Cloudinary connection failed:", e);
            }
        }
        return imgStr;
    }

    // Public API adapter exposed globally
    window.KA16_CMS = {
        // Parallel loader: Synchronizes memory caches from MongoDB Atlas at page startup
        loadFromCloud: async function() {
            try {
                const [arrRes, offRes, galRes, prodRes] = await Promise.all([
                    fetch('/api/new-arrivals').then(r => r.json()),
                    fetch('/api/offers').then(r => r.json()),
                    fetch('/api/gallery').then(r => r.json()),
                    fetch('/api/products').then(r => r.json())
                ]);
                
                newArrivals = arrRes || [];
                offers = offRes || { vouchers: [], bundles: [] };
                gallery = galRes || [];
                products = prodRes || [];
                
                console.log("KA-16 CMS: Cloud collections synchronized successfully.");
            } catch (e) {
                console.error("KA-16 CMS: Failed to sync database collections from cloud:", e);
            }
        },

        // 1. PRODUCTS LAYER
        getProducts: function() {
            return [...products];
        },
        saveProducts: async function(updatedList) {
            // Find difference to detect Add, Delete, or Edit
            const cacheIds = products.map(x => x.id);
            const addedItem = updatedList.find(x => !cacheIds.includes(x.id));

            if (addedItem) {
                // Add item
                addedItem.img = await uploadToCloudinary(addedItem.img);
                try {
                    await fetch('/api/products', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(addedItem)
                    });
                } catch (e) { console.error("CMS Product Add Failed:", e); }
            } else if (updatedList.length < products.length) {
                // Delete item
                const remainingIds = updatedList.map(x => x.id);
                const deletedItem = products.find(x => !remainingIds.includes(x.id));
                if (deletedItem) {
                    try {
                        await fetch(`/api/products/${deletedItem.id}`, { method: 'DELETE' });
                    } catch (e) { console.error("CMS Product Delete Failed:", e); }
                }
            } else {
                // Edit / Update item stock or properties
                for (let i = 0; i < updatedList.length; i++) {
                    const item = updatedList[i];
                    const cacheItem = products.find(x => x.id === item.id);
                    if (cacheItem && JSON.stringify(item) !== JSON.stringify(cacheItem)) {
                        item.img = await uploadToCloudinary(item.img);
                        try {
                            await fetch(`/api/products/${item.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(item)
                            });
                        } catch (e) { console.error("CMS Product Update Failed:", e); }
                    }
                }
            }
            await this.loadFromCloud();
        },

        // 2. NEW ARRIVALS LAYER (Campaign coordinates)
        getNewArrivals: function() {
            return [...newArrivals];
        },
        saveNewArrivals: async function(updatedList) {
            const cacheIds = newArrivals.map(x => x.id);
            const addedItem = updatedList.find(x => !cacheIds.includes(x.id));

            if (addedItem) {
                // Add item
                addedItem.img = await uploadToCloudinary(addedItem.img);
                // Loop through variants to convert base64 images to Cloudinary
                if (addedItem.variants) {
                    for (let v of addedItem.variants) {
                        v.img = await uploadToCloudinary(v.img);
                    }
                }
                try {
                    await fetch('/api/new-arrivals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(addedItem)
                    });
                } catch (e) { console.error("CMS Arrival Add Failed:", e); }
            } else if (updatedList.length < newArrivals.length) {
                // Delete item
                const remainingIds = updatedList.map(x => x.id);
                const deletedItem = newArrivals.find(x => !remainingIds.includes(x.id));
                if (deletedItem) {
                    try {
                        await fetch(`/api/new-arrivals/${deletedItem.id}`, { method: 'DELETE' });
                    } catch (e) { console.error("CMS Arrival Delete Failed:", e); }
                }
            } else {
                // Edit / Update sizes or variants
                for (let i = 0; i < updatedList.length; i++) {
                    const item = updatedList[i];
                    const cacheItem = newArrivals.find(x => x.id === item.id);
                    if (cacheItem && JSON.stringify(item) !== JSON.stringify(cacheItem)) {
                        if (item.variants) {
                            for (let v of item.variants) {
                                v.img = await uploadToCloudinary(v.img);
                            }
                        }
                        try {
                            await fetch(`/api/new-arrivals/${item.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(item)
                            });
                        } catch (e) { console.error("CMS Arrival Update Failed:", e); }
                    }
                }
            }
            await this.loadFromCloud();
        },

        // 3. OFFERS LAYER
        getOffers: function() {
            return {
                vouchers: [...(offers.vouchers || [])],
                bundles: [...(offers.bundles || [])]
            };
        },
        saveOffers: async function(updatedOffers) {
            // Compare vouchers
            const cacheVoucherIds = offers.vouchers.map(x => x.id);
            const addedVoucher = updatedOffers.vouchers.find(x => !cacheVoucherIds.includes(x.id));
            if (addedVoucher) {
                try {
                    await fetch('/api/offers/vouchers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(addedVoucher)
                    });
                } catch (e) { console.error("CMS Voucher Add Failed:", e); }
            } else if (updatedOffers.vouchers.length < offers.vouchers.length) {
                const remainingIds = updatedOffers.vouchers.map(x => x.id);
                const deleted = offers.vouchers.find(x => !remainingIds.includes(x.id));
                if (deleted) {
                    try {
                        await fetch(`/api/offers/vouchers/${deleted.id}`, { method: 'DELETE' });
                    } catch (e) { console.error("CMS Voucher Delete Failed:", e); }
                }
            }

            // Compare bundles
            const cacheBundleIds = offers.bundles.map(x => x.id);
            const addedBundle = updatedOffers.bundles.find(x => !cacheBundleIds.includes(x.id));
            if (addedBundle) {
                addedBundle.img = await uploadToCloudinary(addedBundle.img);
                try {
                    await fetch('/api/offers/bundles', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(addedBundle)
                    });
                } catch (e) { console.error("CMS Bundle Add Failed:", e); }
            } else if (updatedOffers.bundles.length < offers.bundles.length) {
                const remainingIds = updatedOffers.bundles.map(x => x.id);
                const deleted = offers.bundles.find(x => !remainingIds.includes(x.id));
                if (deleted) {
                    try {
                        await fetch(`/api/offers/bundles/${deleted.id}`, { method: 'DELETE' });
                    } catch (e) { console.error("CMS Bundle Delete Failed:", e); }
                }
            } else {
                // Check for enabled/disabled state toggles
                for (let i = 0; i < updatedOffers.bundles.length; i++) {
                    const item = updatedOffers.bundles[i];
                    const cacheItem = offers.bundles.find(x => x.id === item.id);
                    if (cacheItem && item.enabled !== cacheItem.enabled) {
                        try {
                            await fetch(`/api/offers/bundles/${item.id}/toggle`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ enabled: item.enabled })
                            });
                        } catch (e) { console.error("CMS Bundle Toggle Failed:", e); }
                    }
                }
            }
            await this.loadFromCloud();
        },

        // 4. RUNWAY GALLERY LAYER
        getGallery: function() {
            return [...gallery];
        },
        saveGallery: async function(updatedSlides) {
            // Find added slide by label comparison
            const cacheLabels = gallery.map(x => x.label);
            const addedSlide = updatedSlides.find(x => !cacheLabels.includes(x.label));

            if (addedSlide) {
                addedSlide.img = await uploadToCloudinary(addedSlide.img);
                try {
                    await fetch('/api/gallery', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(addedSlide)
                    });
                } catch (e) { console.error("CMS Slide Add Failed:", e); }
            } else if (updatedSlides.length < gallery.length) {
                // Delete item (find the deleted index)
                const remainingLabels = updatedSlides.map(x => x.label);
                const deletedIdx = gallery.findIndex(x => !remainingLabels.includes(x.label));
                if (deletedIdx !== -1) {
                    try {
                        await fetch(`/api/gallery/${deletedIdx}`, { method: 'DELETE' });
                    } catch (e) { console.error("CMS Slide Delete Failed:", e); }
                }
            } else {
                // Assume sequence reordered drag operation save
                const slideIds = updatedSlides.map(s => s._id).filter(Boolean);
                if (slideIds.length === updatedSlides.length) {
                    try {
                        await fetch('/api/gallery/reorder', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ slides: slideIds })
                        });
                    } catch (e) { console.error("CMS Gallery Reorder Failed:", e); }
                }
            }
            await this.loadFromCloud();
        },

        // Reset database collections back to defaults
        resetToDefaults: async function() {
            try {
                const res = await fetch('/api/cms/reset', { method: 'POST' });
                if (res.ok) {
                    await this.loadFromCloud();
                    return true;
                }
            } catch (e) {
                console.error("CMS Database Reset Failed:", e);
            }
            return false;
        }
    };
})();
