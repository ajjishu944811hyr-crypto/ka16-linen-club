const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Mongoose Models
const Product = require('./models/Product');
const NewArrival = require('./models/NewArrival');
const Offer = require('./models/Offer');
const Gallery = require('./models/Gallery');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true
}));

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ka16-linen-club',
  api_key: process.env.CLOUDINARY_API_KEY || '12345',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'dummy'
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { family: 4 })
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas.');
    seedDatabaseIfNeeded();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Memory Fallback Seed Arrays for local testing when MongoDB Atlas is disconnected
const MEMORY_PRODUCTS = [
  {
    id: "prod_shirts",
    name: "Signature Linen Shirts",
    price: 1899,
    fabric: "Pure Organic Linen",
    sizes: { S: 5, M: 2, L: 0, XL: 3 },
    waistSizes: {},
    description: "Pastel linen shirts tailored for everyday executive elegance. Natural flax high-density fibers.",
    img: "img/cat_shirts_1779287336079.png",
    enabled: true
  },
  {
    id: "prod_fabrics",
    name: "Royal Linen Fabric",
    price: 1499,
    fabric: "Tailor-Grade Natural Linen",
    sizes: {},
    waistSizes: {},
    description: "Superfine linen suitings and shirting fabric materials by the meter. Exquisite textures for bespoke couture.",
    img: "img/cat_wedding_1779287445980.png",
    enabled: true
  },
  {
    id: "prod_coords",
    name: "Premium Leisure Coordinates",
    price: 4599,
    fabric: "Raw Textured Linen Blend",
    sizes: { S: 4, M: 2, L: 0, XL: 1, XXL: 0, XXXL: 2 },
    waistSizes: { "28": 2, "30": 3, "32": 0, "34": 4, "36": 0 },
    description: "Casual high-drape coordinate sets containing classic Cuban collars and comfortable matching trousers.",
    img: "img/cat_outfits_1779287514198.png",
    enabled: true
  }
];

const MEMORY_NEW_ARRIVALS = [
  {
    id: "arr_indigo_suit",
    name: "Royal Navy Indigo Suit",
    fabric: "Premium Italian Linen",
    description: "3-piece formal tailored suit in organic navy blue linen. Breathable lining, structured premium shoulders.",
    tag: "New",
    published: true,
    variants: [
      {
        colorName: "Navy Indigo",
        colorHex: "#1b2a47",
        price: 9499,
        img: "img/arrivals_banner.jpg",
        sizes: { S: 5, M: 2, L: 0, XL: 3, XXL: 0, XXXL: 1 },
        waistSizes: { "30": 2, "32": 4, "34": 0, "36": 3 }
      },
      {
        colorName: "Ash Grey",
        colorHex: "#5c626b",
        price: 9899,
        img: "img/cat_shirts_1779287336079.png",
        sizes: { M: 2, L: 3, XL: 0, XXL: 1, XXXL: 0 },
        waistSizes: { "34": 2, "36": 0, "38": 4, "40": 0 }
      }
    ]
  },
  {
    id: "arr_safari",
    name: "Olive Safari Jacket",
    fabric: "Premium Raw Linen",
    description: "Utilitarian safari field jacket in signature structured linen weave.",
    tag: "Signature",
    published: true,
    variants: [
      {
        colorName: "Olive Drab",
        colorHex: "#5b6348",
        price: 6899,
        img: "img/hero_model_1779287264386.png",
        sizes: { S: 2, M: 4, L: 1, XL: 0, XXL: 2 },
        waistSizes: {}
      }
    ]
  }
];

const MEMORY_OFFERS = {
  vouchers: [
    { id: "gold15", code: "KA16GOLD", discount: "15% OFF", minPurchase: "On orders above ₹5,000", desc: "Gold tier exclusive club privilege voucher code." },
    { id: "festive20", code: "KA16FESTIVE", discount: "₹2,000 OFF", minPurchase: "On orders above ₹10,000", desc: "Limited seasonal celebratory discount voucher code." }
  ],
  bundles: [
    { id: "bundle_wedding", name: "Imperial Wedding Styling Set", price: 14999, description: "Bespoke customized wedding bundle: full blazer length fabric, two coordinated premium shirting materials, and luxury styling accessories.", img: "img/cat_wedding_1779287445980.png", enabled: true }
  ]
};

const MEMORY_GALLERY = [
  { orderIndex: 0, label: "Milano Spring Runway '26 Showcase", img: "img/runway_showcase_1779291914345.png" },
  { orderIndex: 1, label: "Classic Navy Couture Suitings", img: "img/cat_wedding_1779287445980.png" }
];

// ==============================================================================
// JWT SECURITY AUTH GUARD
// ==============================================================================
const JWT_SECRET = process.env.JWT_SECRET || 'ka16_luxury_secret_key_2026';

const requireAuth = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Access denied. Sign in required.' });
  }
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session token.' });
  }
};

// ==============================================================================
// AUTHENTICATION ROUTES
// ==============================================================================
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'ka16_secure_admin_2026';
  
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  // Support plain text fallback or standard comparison
  if (password === adminPassword) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 Hours
    });
    return res.json({ success: true, message: 'Logged in successfully.' });
  } else {
    return res.status(401).json({ error: 'Incorrect credentials. Try again.' });
  }
});

app.get('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

app.get('/api/auth/verify', requireAuth, (req, res) => {
  res.json({ success: true, message: 'Authorized session active.' });
});

// ==============================================================================
// CLOUDINARY MEDIA UPLOADER API
// ==============================================================================
app.post('/api/upload', requireAuth, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image base64 data provided' });
    }

    // Direct Base64 upload to Cloudinary CDN
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'ka16_linen_club'
    });

    res.json({ url: uploadResponse.secure_url });
  } catch (err) {
    console.error('Cloudinary upload failure:', err);
    res.status(500).json({ error: 'CDN media upload failed: ' + err.message });
  }
});

// ==============================================================================
// PRODUCTS REST API
// ==============================================================================
app.get('/api/products', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(MEMORY_PRODUCTS);
    }
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.json(MEMORY_PRODUCTS);
  }
});

app.post('/api/products', requireAuth, async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const updated = await Product.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/products/:id', requireAuth, async (req, res) => {
  try {
    await Product.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, message: 'Catalog item deleted successfully.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==============================================================================
// NEW ARRIVALS REST API
// ==============================================================================
app.get('/api/new-arrivals', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(MEMORY_NEW_ARRIVALS);
    }
    const arrivals = await NewArrival.find().sort({ createdAt: 1 });
    res.json(arrivals);
  } catch (err) {
    res.json(MEMORY_NEW_ARRIVALS);
  }
});

app.post('/api/new-arrivals', requireAuth, async (req, res) => {
  try {
    const newItem = new NewArrival(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/new-arrivals/:id', requireAuth, async (req, res) => {
  try {
    const updated = await NewArrival.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/new-arrivals/:id', requireAuth, async (req, res) => {
  try {
    await NewArrival.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, message: 'New arrival item deleted.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==============================================================================
// OFFERS REST API
// ==============================================================================
app.get('/api/offers', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(MEMORY_OFFERS);
    }
    let offers = await Offer.findOne({ key: 'global_offers' });
    if (!offers) {
      offers = new Offer({ vouchers: [], bundles: [] });
      await offers.save();
    }
    res.json(offers);
  } catch (err) {
    res.json(MEMORY_OFFERS);
  }
});

app.post('/api/offers/vouchers', requireAuth, async (req, res) => {
  try {
    let offers = await Offer.findOne({ key: 'global_offers' });
    if (!offers) offers = new Offer();
    offers.vouchers.push(req.body);
    await offers.save();
    res.status(201).json(offers);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/offers/bundles', requireAuth, async (req, res) => {
  try {
    let offers = await Offer.findOne({ key: 'global_offers' });
    if (!offers) offers = new Offer();
    offers.bundles.push(req.body);
    await offers.save();
    res.status(201).json(offers);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/offers/:type/:id', requireAuth, async (req, res) => {
  try {
    const { type, id } = req.params;
    let offers = await Offer.findOne({ key: 'global_offers' });
    if (!offers) return res.status(404).json({ error: 'Offers container not found' });
    
    if (type === 'vouchers') {
      offers.vouchers = offers.vouchers.filter(v => v.id !== id);
    } else if (type === 'bundles') {
      offers.bundles = offers.bundles.filter(b => b.id !== id);
    }
    await offers.save();
    res.json(offers);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/offers/bundles/:id/toggle', requireAuth, async (req, res) => {
  try {
    let offers = await Offer.findOne({ key: 'global_offers' });
    if (!offers) return res.status(404).json({ error: 'Offers container not found' });

    const idx = offers.bundles.findIndex(b => b.id === req.params.id);
    if (idx !== -1) {
      offers.bundles[idx].enabled = req.body.enabled;
      await offers.save();
      return res.json(offers.bundles[idx]);
    }
    res.status(404).json({ error: 'Bundle not found' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==============================================================================
// RUNWAY GALLERY REST API
// ==============================================================================
app.get('/api/gallery', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(MEMORY_GALLERY);
    }
    const slides = await Gallery.find().sort({ orderIndex: 1 });
    res.json(slides);
  } catch (err) {
    res.json(MEMORY_GALLERY);
  }
});

app.post('/api/gallery', requireAuth, async (req, res) => {
  try {
    const count = await Gallery.countDocuments();
    const newSlide = new Gallery({ ...req.body, orderIndex: count });
    await newSlide.save();
    res.status(201).json(newSlide);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/gallery/:index', requireAuth, async (req, res) => {
  try {
    const idx = parseInt(req.params.index);
    const slides = await Gallery.find().sort({ orderIndex: 1 });
    if (idx >= 0 && idx < slides.length) {
      await Gallery.deleteOne({ _id: slides[idx]._id });
      // Re-index remaining
      const remaining = await Gallery.find().sort({ orderIndex: 1 });
      for (let i = 0; i < remaining.length; i++) {
        remaining[i].orderIndex = i;
        await remaining[i].save();
      }
      return res.json({ success: true, message: 'Runway slide deleted.' });
    }
    res.status(400).json({ error: 'Invalid slide index.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/gallery/reorder', requireAuth, async (req, res) => {
  try {
    const { slides } = req.body; // Array of IDs in the new order
    for (let i = 0; i < slides.length; i++) {
      await Gallery.findByIdAndUpdate(slides[i], { orderIndex: i });
    }
    res.json({ success: true, message: 'Runway sequence reordered.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Reset Collections back to premium defaults
app.post('/api/cms/reset', requireAuth, async (req, res) => {
  try {
    await Product.deleteMany({});
    await NewArrival.deleteMany({});
    await Offer.deleteMany({});
    await Gallery.deleteMany({});

    await seedDatabase(true);
    res.json({ success: true, message: 'All database records successfully reset to premium defaults.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// PUBLIC STATIC FILE SERVING
// ==============================================================================
app.use(express.static(path.join(__dirname, '.')));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`KA-16 LINEN CLUB server running locally at http://localhost:${PORT}`);
});

// ==============================================================================
// DOCK SEEDER MODULE
// ==============================================================================
async function seedDatabaseIfNeeded() {
  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    console.log('Mongoose tables are empty. Initiating premium catalog seeder...');
    await seedDatabase(false);
  }
}

async function seedDatabase(forced) {
  // Default Catalog Products
  const defaultProducts = [
    {
      id: "prod_shirts",
      name: "Signature Linen Shirts",
      price: 1899,
      fabric: "Pure Organic Linen",
      sizes: { S: 5, M: 2, L: 0, XL: 3 },
      waistSizes: {},
      description: "Pastel linen shirts tailored for everyday executive elegance. Natural flax high-density fibers.",
      img: "img/cat_shirts_1779287336079.png",
      enabled: true
    },
    {
      id: "prod_fabrics",
      name: "Royal Linen Fabric",
      price: 1499,
      fabric: "Tailor-Grade Natural Linen",
      sizes: {},
      waistSizes: {},
      description: "Superfine linen suitings and shirting fabric materials by the meter. Exquisite textures for bespoke couture.",
      img: "img/cat_wedding_1779287445980.png",
      enabled: true
    },
    {
      id: "prod_coords",
      name: "Premium Leisure Coordinates",
      price: 4599,
      fabric: "Raw Textured Linen Blend",
      sizes: { S: 4, M: 2, L: 0, XL: 1, XXL: 0, XXXL: 2 },
      waistSizes: { "28": 2, "30": 3, "32": 0, "34": 4, "36": 0 },
      description: "Casual high-drape coordinate sets containing classic Cuban collars and comfortable matching trousers.",
      img: "img/cat_outfits_1779287514198.png",
      enabled: true
    }
  ];

  // Default Runway New Arrivals
  const defaultNewArrivals = [
    {
      id: "arr_indigo_suit",
      name: "Royal Navy Indigo Suit",
      fabric: "Premium Italian Linen",
      description: "3-piece formal tailored suit in organic navy blue linen. Breathable lining, structured premium shoulders.",
      tag: "New",
      published: true,
      variants: [
        {
          colorName: "Navy Indigo",
          colorHex: "#1b2a47",
          price: 9499,
          img: "img/arrivals_banner_1779290841203.png",
          sizes: { S: 5, M: 2, L: 0, XL: 3, XXL: 0, XXXL: 1 },
          waistSizes: { "30": 2, "32": 4, "34": 0, "36": 3 }
        },
        {
          colorName: "Ash Grey",
          colorHex: "#5c626b",
          price: 9899,
          img: "img/cat_shirts_1779287336079.png",
          sizes: { M: 2, L: 3, XL: 0, XXL: 1, XXXL: 0 },
          waistSizes: { "34": 2, "36": 0, "38": 4, "40": 0 }
        }
      ]
    },
    {
      id: "arr_safari",
      name: "Olive Safari Jacket",
      fabric: "Premium Raw Linen",
      description: "Cinematic vintage safari jacket with chest pockets, belt fastening, and premium tortoiseshell buttons.",
      tag: "New",
      published: true,
      variants: [
        {
          colorName: "Sage Olive",
          colorHex: "#475244",
          price: 3899,
          img: "img/arrivals_product_1_1779290884369.png",
          sizes: { S: 5, M: 2, L: 1, XL: 0, XXL: 4 },
          waistSizes: {}
        },
        {
          colorName: "Desert Sand",
          colorHex: "#c7b79d",
          price: 3899,
          img: "img/arrivals_product_2_1779290933723.png",
          sizes: { M: 0, L: 3, XL: 1, XXL: 0 },
          waistSizes: {}
        }
      ]
    },
    {
      id: "arr_overshirt",
      name: "Natural Cream Overshirt",
      fabric: "organic Textured Linen",
      description: "A versatile layering overshirt in raw textured organic cream linen. Flat chest flap utility pockets.",
      tag: "New",
      published: true,
      variants: [
        {
          colorName: "Natural Cream",
          colorHex: "#eae4d5",
          price: 2199,
          img: "img/arrivals_product_2_1779290933723.png",
          sizes: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
          waistSizes: { "30": 0, "32": 0, "34": 0 }
        },
        {
          colorName: "Charcoal Black",
          colorHex: "#1c1d1f",
          price: 2299,
          img: "img/arrivals_banner_1779290841203.png",
          sizes: { S: 4, M: 2, L: 0, XL: 1 },
          waistSizes: {}
        }
      ]
    }
  ];

  // Default Offers
  const defaultOffers = {
    vouchers: [
      {
        id: "voucher_wedding",
        code: "FESTIVE15",
        valueType: "percent",
        value: 15,
        title: "Wedding Trousseau Package",
        descr: "Save on comprehensive wedding attire coordinates when purchasing a full groom ensemble. Valid on premium fabrics and customizations.",
        enabled: true
      },
      {
        id: "voucher_corp",
        code: "LINENCLUB2000",
        valueType: "flat",
        value: 2000,
        title: "Corporate Wardrobe Kit",
        descr: "Redeem flat cashback on purchasing a bundle of 5 bespoke pure linen shirts. Ideal for upgrading your executive seasonal fits.",
        enabled: true
      }
    ],
    bundles: [
      {
        id: "off_wedding_bundle",
        name: "Groom Trousseau Bundle",
        price: 10499,
        descr: "Includes a bespoke wedding suit, coordinating pure white linen shirt, and gold-ivory pocket square.",
        img: "img/cat_wedding_1779287445980.png",
        sizes: { S: 3, M: 5, L: 0, XL: 2 },
        waistSizes: {},
        badge: "Wedding Trousseau",
        enabled: true,
        countdownDate: "2026-06-30T23:59:59"
      },
      {
        id: "off_corp_bundle",
        name: "Executive Wardrobe Bundle",
        price: 7999,
        descr: "Includes three pastel corporate linen shirts and two tailored leisure trousers for standard executive wear.",
        img: "img/cat_outfits_1779287514198.png",
        sizes: { S: 5, M: 2, L: 4, XL: 0 },
        waistSizes: {},
        badge: "Corporate Special",
        enabled: true,
        countdownDate: ""
      }
    ]
  };

  // Default Gallery
  const defaultGallery = [
    {
      img: "img/hero_model_1779287264386.png",
      typo: "LINEN CLUB",
      bg: "radial-gradient(circle at center, #27211e 0%, #0d0c0b 100%)",
      label: "Campaign SS26",
      desc: "Tailor-grade linen draping styled for absolute prestige.",
      orderIndex: 0
    },
    {
      img: "img/arrivals_product_1_1779290884369.png",
      typo: "PREMIUM FIT",
      bg: "radial-gradient(circle at center, #1c2721 0%, #0c0d0c 100%)",
      label: "Vintage Safari",
      desc: "Custom linen safari coord coordinates detailing luxury heritage.",
      orderIndex: 1
    },
    {
      img: "img/cat_wedding_1779287445980.png",
      typo: "LUXURY LINEN",
      bg: "radial-gradient(circle at center, #27261e 0%, #0d0d0c 100%)",
      label: "Ceremonial Ivory",
      desc: "Pure organic cream blazers designed for elite wedding grooms.",
      orderIndex: 2
    },
    {
      img: "img/arrivals_product_2_1779290933723.png",
      typo: "MODERN MEN",
      bg: "radial-gradient(circle at center, #1e2227 0%, #0c0c0d 100%)",
      label: "Raw Coordinates",
      desc: "Breathable beige coordinates for high-end resort leisure wear.",
      orderIndex: 3
    },
    {
      img: "img/cat_outfits_1779287514198.png",
      typo: "COUTURE ATELIER",
      bg: "radial-gradient(circle at center, #251e27 0%, #0c0b0c 100%)",
      label: "Resort Layering",
      desc: "Gold-accented linen combinations designed for premium lifestyles.",
      orderIndex: 4
    }
  ];

  try {
    await Product.insertMany(defaultProducts);
    await NewArrival.insertMany(defaultNewArrivals);
    
    const offers = new Offer({ key: 'global_offers', ...defaultOffers });
    await offers.save();

    await Gallery.insertMany(defaultGallery);
    
    console.log('Seeder ran successfully. All tables fully loaded.');
  } catch (err) {
    console.error('Error seeding premium e-commerce database:', err);
  }
}
