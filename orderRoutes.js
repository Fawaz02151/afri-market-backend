const express = require("express");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const router = express.Router();

// Route test
router.get("/test", (req, res) => {
  res.json({ message: "Route commandes fonctionne !" });
});

// GET - Récupérer les commandes d'un utilisateur
router.get("/user/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .populate("items.product", "title image")
      .populate("items.productOwner", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Erreur récupération commandes:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// POST - Créer une commande depuis le panier
router.post("/create", async (req, res) => {
  try {
    const { userId, location } = req.body;

    // Récupérer le panier
    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Panier vide",
      });
    }

    // Vérifier les stocks avant de créer la commande
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant pour ${product.title} - Il ne reste que ${product.quantity} unités`,
        });
      }
    }

    // Créer la commande
    const order = new Order({
      user: userId,
      items: cart.items.map((item) => ({
        product: item.product._id,
        productOwner: item.productOwner,
        quantity: item.quantity,
        price: item.price,
        productName: item.productName,
        productImage: item.productImage,
      })),
      promoCode: cart.promoCode,
      discount: cart.discount,
      subtotal: cart.subtotal,
      total: cart.total,
      location: {
        type: "Point",
        coordinates: location.coordinates || [0, 0],
      },
    });

    await order.save();

    // Mettre à jour les stocks des produits
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { quantity: -item.quantity },
      });
    }

    // Vider le panier
    cart.items = [];
    cart.promoCode = null;
    cart.discount = 0;
    cart.subtotal = 0;
    cart.total = 0;
    await cart.save();

    // Populer les données pour la réponse
    await order.populate("items.product", "title image");
    await order.populate("items.productOwner", "firstName lastName");

    res.status(201).json({
      success: true,
      message: "Commande créée avec succès",
      data: order,
    });
  } catch (error) {
    console.error("Erreur création commande:", error);
    res.status(500).json({
      success: false,
      message: "Erreur création commande",
    });
  }
});

// GET - Détails d'une commande spécifique
router.get("/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("items.product", "title image description")
      .populate("items.productOwner", "firstName lastName email")
      .populate("user", "firstName lastName email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Erreur récupération commande:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// GET - Toutes les commandes (pour l'admin)
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "firstName lastName email")
      .populate("items.product", "title")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Erreur récupération commandes:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// PUT - Mettre à jour le statut d'une commande
router.put("/:orderId/status", async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    )
      .populate("items.product", "title image")
      .populate("items.productOwner", "firstName lastName");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée",
      });
    }

    res.json({
      success: true,
      message: "Statut de commande mis à jour",
      data: order,
    });
  } catch (error) {
    console.error("Erreur mise à jour statut:", error);
    res.status(500).json({
      success: false,
      message: "Erreur mise à jour statut",
    });
  }
});

module.exports = router;
