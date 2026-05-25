# KA-16 LINEN CLUB — PRODUCTION DEPLOYMENT & OPERATIONS MANUAL

Welcome to the official deployment and operations manual for the fullstack, cloud-based **KA-16 LINEN CLUB** e-commerce platform. This document guides you through finalizing environment settings, cloud database hosting, media server hookups, public hosting launches, and shop management protocols.

---

## 📁 1. Project Directory Overview

Your fullstack project is organized as follows:
* `server.js` — Core Express backend serving APIs and static pages.
* `package.json` — Declares runtime dependencies.
* `models/` — Persists products, new arrivals, offers, and runway slides in MongoDB.
* `css/`, `js/`, `img/`, `index.html`, `admin.html`, `login.html` — Served statically by Express.

---

## ⚙️ 2. Environment Variables Configuration

To run the application, copy the template `.env` settings or create a file named `.env` in the root workspace folder with the following variables:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/ka16_linen_club?retryWrites=true&w=majority
JWT_SECRET=your_custom_cryptographic_jwt_signature_secret_phrase
ADMIN_PASSWORD=your_secure_boutique_admin_passphrase
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

---

## ☁️ 3. Cloud Infrastructure Provisioning

### A. MongoDB Atlas Cloud Database (Free Tier)
1. Sign up for a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new shared Cluster (choose the free **M0 Sandbox**).
3. Under **Database Access**, create a user credentials pair (e.g. username `ka16_admin`). Note down the password.
4. Under **Network Access**, click **Add IP Address** and choose **Allow Access From Anywhere** (`0.0.0.0/0`) so your public hosting provider can access the database.
5. Go to your cluster dashboard, click **Connect**, select **Drivers**, and copy the **Connection String**.
6. Replace `<username>` and `<password>` with your database user credentials and set it as `MONGODB_URI` in `.env`.

### B. Cloudinary Media Hosting CDN (Free Tier)
1. Sign up for a free account at [Cloudinary](https://cloudinary.com).
2. Open your dashboard and locate your **Product Environment Credentials**:
   * Cloud Name
   * API Key
   * API Secret
3. Copy these values into your `.env` variables list.
4. Product images uploaded via the uploader dropzones will now automatically write directly to this high-performance visual CDN.

---

## 🚀 4. How to Run the Project Locally

To run the fullstack server on your local machine:

1. **Install Dependencies:**
   Ensure Node.js (version 18 or higher) is installed. Run in your terminal:
   ```bash
   npm install
   ```

2. **Start the Express Server:**
   Launch the server locally:
   ```bash
   npm start
   ```
   *The server will start at:* **`http://localhost:5000`**

3. **Automatic Database Seeding:**
   On initial launch, if your database has no records, the server will **automatically seed** standard catalog products, runway arrivals with variant stock, seasonal vouchers/bundles, and 3D runway slides into MongoDB.

---

## 🔐 5. How to Access the Admin Dashboard

1. Open your browser and navigate to: **`http://localhost:5000/admin.html`** (or your public URL once deployed, e.g., `https://ka16-linen-club.render.com/admin.html`).
2. The security gate will immediately intercept the request, hide the dashboard, and redirect you to the luxury **Sign In Portal** at `/login.html`.
3. Enter your configured `ADMIN_PASSWORD` (default: `ka16_secure_admin_2026`).
4. Upon successful validation, a secure JWT cookie valid for 24 hours is issued, and you are redirected back to the **Visual CMS Dashboard**.
5. To log out, simply click the red **Sign Out** button in the header navbar.

---

## 🌐 6. Public Cloud Hosting & Deployment Setup

To make the platform publicly accessible to customers worldwide, you can host the Node.js Express server on premium platforms like **Render**, **Railway**, or **Vercel** for free.

### A. Deploying to Render (Option 1: Render Blueprint - Recommended)
1. Push your project files to a **GitHub repository** (public or private).
2. Sign up at [Render](https://render.com).
3. Go to the dashboard and click **New** -> **Blueprint**.
4. Select your connected `ka16-linen-club` repository.
5. Render will automatically detect the `render.yaml` configuration file!
6. Enter the secure environment values (MongoDB URI, Cloudinary settings, and custom Admin password) as prompted by the Blueprint UI.
7. Click **Apply**. Render will automatically build the Express server, initialize environment variables, secure sessions, and deploy your live store!

### B. Deploying to Render (Option 2: Manual Web Service Setup)
1. Push your project files to a **GitHub repository**.
2. Sign up at [Render](https://render.com) and click **New** -> **Web Service**.
3. Link your GitHub account and select your `ka16-linen-club` repository.
4. Configure the Web Service settings:
   * **Name:** `ka16-linen-club`
   * **Environment:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
   * **Plan:** `Free`
5. Click **Advanced**, and add your environment variables (`MONGODB_URI`, `JWT_SECRET`, `ADMIN_PASSWORD`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
6. Click **Deploy Web Service**. Render will automatically clone your project, build dependencies, connect to MongoDB, seed collections, and host your store online!

---

## 🛍️ 7. Merchant Operations Guide (Post-Launch Management)

Once launched, the shop owner can manage all inventory dynamically via the dashboard:

### 1. Adding a Product
* Go to the **Products** tab in the CMS.
* Provide the Name, Fabric description, Price, and description.
* Fill in precise **Stock Quantities** for every size (Shirt sizes `S-XXXXXL` or Waist sizes `28-42`).
* Drag-and-drop or select a product image. The image is instantly uploaded to Cloudinary, and the product is saved globally in MongoDB, reflecting immediately on the store.

### 2. Sizing Stock Control (Out-of-Stock Disabling)
* To disable a size, simply set its stock quantity input to `0` in the CMS and click save.
* The public storefront will **automatically grey out**, cross out, and disable that size. Customers cannot select or checkout with unavailable sizes.
* If a size is low in stock (`1` or `2` remaining), the customer storefront will display a subtle gold warning: `⚠️ Only [N] left!`, encouraging swift purchases.

### 3. Campaign & Color Variations (New Arrivals)
* In the **New Arrivals** tab, the merchant can publish coordinate coordinates and add **independent color variants** (e.g. Navy Indigo vs Ash Grey).
* Each variant carries its own price, Cloudinary image, and size-specific stock. Selecting a color on the client storefront instantly crossfades the image and updates available sizes in real-time.
