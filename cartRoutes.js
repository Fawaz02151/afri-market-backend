const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const router = express.Router();

// Route test
router.get("/test", (req, res) => {
  res.json({ message: "Route panier fonctionne !" });
});

// GET - Récupérer le panier d'un utilisateur
router.get("/:userId", async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.params.userId })
      .populate("items.product", "title price image quantity")
      .populate("items.productOwner", "firstName lastName");

    if (!cart) {
      cart = new Cart({ user: req.params.userId, items: [] });
      await cart.save();
    }

    res.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error("Erreur récupération panier:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// POST - Ajouter un produit au panier
router.post("/:userId/add", async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.params.userId;

    // Récupérer le produit
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produit non trouvé",
      });
    }

    // Vérifier que l'utilisateur n'achète pas son propre produit
    if (product.user.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "Vous ne pouvez pas ajouter vos propres produits au panier",
      });
    }

    // Vérifier le stock
    if (product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Stock insuffisant - Il ne reste que ${product.quantity} unités disponibles`,
      });
    }

    // Récupérer ou créer le panier
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Vérifier si le produit est déjà dans le panier
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      // Mettre à jour la quantité
      existingItem.quantity += quantity;
    } else {
      // Ajouter nouveau produit
      cart.items.push({
        product: productId,
        productOwner: product.user,
        quantity,
        price: product.price,
        productName: product.title,
        productImage: product.image,
      });
    }

    await cart.save();
    await cart.populate("items.product", "title price image");
    await cart.populate("items.productOwner", "firstName lastName");

    res.json({
      success: true,
      message: "Produit ajouté au panier",
      data: cart,
    });
  } catch (error) {
    console.error("Erreur ajout panier:", error);
    res.status(500).json({
      success: false,
      message: "Erreur ajout au panier",
    });
  }
});

// PUT - Mettre à jour la quantité d'un produit
router.put("/:userId/update/:productId", async (req, res) => {
  try {
    const { quantity } = req.body;
    const { userId, productId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Panier non trouvé",
      });
    }

    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Produit non trouvé dans le panier",
      });
    }

    // Vérifier le stock
    const product = await Product.findById(productId);
    if (product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Stock insuffisant - Il ne reste que ${product.quantity} unités disponibles`,
      });
    }

    item.quantity = quantity;
    await cart.save();

    await cart.populate("items.product", "title price image");
    await cart.populate("items.productOwner", "firstName lastName");

    res.json({
      success: true,
      message: "Quantité mise à jour",
      data: cart,
    });
  } catch (error) {
    console.error("Erreur mise à jour panier:", error);
    res.status(500).json({
      success: false,
      message: "Erreur mise à jour panier",
    });
  }
});

// DELETE - Supprimer un produit du panier
router.delete("/:userId/remove/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Panier non trouvé",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();
    await cart.populate("items.product", "title price image");
    await cart.populate("items.productOwner", "firstName lastName");

    res.json({
      success: true,
      message: "Produit supprimé du panier",
      data: cart,
    });
  } catch (error) {
    console.error("Erreur suppression panier:", error);
    res.status(500).json({
      success: false,
      message: "Erreur suppression panier",
    });
  }
});

// POST - Appliquer un code promo
router.post("/:userId/promo", async (req, res) => {
  try {
    const { promoCode } = req.body;
    const userId = req.params.userId;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Panier non trouvé",
      });
    }

    // Vérifier le code promo (exemple simple)
    if (promoCode && promoCode.length === 5) {
      cart.promoCode = promoCode;
      cart.discount = cart.subtotal * 0.05; // 5% de réduction
    } else {
      cart.promoCode = null;
      cart.discount = 0;
    }

    await cart.save();
    await cart.populate("items.product", "title price image");
    await cart.populate("items.productOwner", "firstName lastName");

    res.json({
      success: true,
      message: cart.promoCode ? "Code promo appliqué" : "Code promo retiré",
      data: cart,
    });
  } catch (error) {
    console.error("Erreur code promo:", error);
    res.status(500).json({
      success: false,
      message: "Erreur application code promo",
    });
  }
});

module.exports = router;
