const express = require("express");
const Product = require("../models/Product");
const Category = require("../models/Category");
const auth = require("../middleware/auth");

const router = express.Router();

// Route test produits
router.get("/test", (req, res) => {
  res.json({ message: "Route produits fonctionne !" });
});

// GET - Tous les produits (accessible sans auth)
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate("category", "title")
      .populate("user", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Erreur récupération produits:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// GET - Produits par catégorie
router.get("/category/:categoryId", async (req, res) => {
  try {
    const products = await Product.find({
      category: req.params.categoryId,
      isActive: true,
    })
      .populate("category", "title")
      .populate("user", "firstName lastName");

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Erreur produits par catégorie:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// POST - Créer un produit (nécessite auth)
router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      quantity,
      image,
      categoryId,
      userId,
      userFullName,
    } = req.body;

    // Vérifier que la catégorie existe
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Catégorie non trouvée",
      });
    }

    const product = new Product({
      title,
      description,
      price,
      quantity,
      image,
      category: categoryId,
      user: userId,
      userFullName,
    });

    await product.save();

    // Populer les données pour la réponse
    await product.populate("category", "title");
    await product.populate("user", "firstName lastName");

    res.status(201).json({
      success: true,
      message: "Produit créé avec succès",
      data: product,
    });
  } catch (error) {
    console.error("Erreur création produit:", error);
    res.status(500).json({
      success: false,
      message: "Erreur création produit",
    });
  }
});

// PUT - Modifier un produit
router.put("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("category", "title")
      .populate("user", "firstName lastName");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produit non trouvé",
      });
    }

    res.json({
      success: true,
      message: "Produit modifié avec succès",
      data: product,
    });
  } catch (error) {
    console.error("Erreur modification produit:", error);
    res.status(500).json({
      success: false,
      message: "Erreur modification produit",
    });
  }
});

module.exports = router;
