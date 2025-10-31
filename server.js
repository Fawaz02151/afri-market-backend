const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Connexion MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connecté à MongoDB Atlas"))
  .catch((err) => console.log("❌ Erreur MongoDB:", err));

// Import des routes
const authRoutes = require("./src/routes/authRoutes");
const productRoutes = require("./src/routes/productRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const cartRoutes = require("./src/routes/cartRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const userRoutes = require("./src/routes/userRoutes");
const uploadRoutes = require("./src/routes/uploadRoutes");

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);

// Route de base
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 API Afri_Market - Backend fonctionnel !",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      products: "/api/products",
      categories: "/api/categories",
      test_auth: "/api/auth/test",
      test_products: "/api/products/test",
      test_categories: "/api/categories/test",
      cart: "/api/cart",
      test_cart: "/api/cart/test",
      orders: "/api/orders",
      test_orders: "/api/orders/test",
      users: "/api/users",
      test_users: "/api/users/test",
      upload: "/api/upload",
      test_upload: "/api/upload/test",
    },
  });
});

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route API non trouvée",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📱 API: http://localhost:${PORT}`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth/test`);
  console.log(`📦 Products: http://localhost:${PORT}/api/products/test`);
  console.log(`📂 Categories: http://localhost:${PORT}/api/categories/test`);
  console.log(`🛒 Cart: http://localhost:${PORT}/api/cart/test`);
  console.log(`📦 Orders: http://localhost:${PORT}/api/orders/test`);
  console.log(`👤 Users: http://localhost:${PORT}/api/users/test`);
  console.log(`📸 Upload: http://localhost:${PORT}/api/upload/test`);
});
