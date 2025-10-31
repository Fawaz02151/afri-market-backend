const express = require("express");
const User = require("../models/User");
const LoginHistory = require("../models/LoginHistory");
const Product = require("../models/Product");
const Category = require("../models/Category");
const bcrypt = require("bcryptjs");

const router = express.Router();

// Route test
router.get("/test", (req, res) => {
  res.json({ message: "Route utilisateur fonctionne !" });
});

// GET - Profil utilisateur
router.get("/profile/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Compter les produits et catégories de l'utilisateur
    const productsCount = await Product.countDocuments({
      user: req.params.userId,
      isActive: true,
    });

    const categoriesCount = await Category.countDocuments({
      user: req.params.userId,
      isActive: true,
    });

    res.json({
      success: true,
      data: {
        user,
        stats: {
          products: productsCount,
          categories: categoriesCount,
        },
      },
    });
  } catch (error) {
    console.error("Erreur récupération profil:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// PUT - Modifier le profil
router.put("/profile/:userId", async (req, res) => {
  try {
    const { firstName, lastName, email, profileImage } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        firstName,
        lastName,
        email,
        profileImage,
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    res.json({
      success: true,
      message: "Profil mis à jour avec succès",
      data: user,
    });
  } catch (error) {
    console.error("Erreur modification profil:", error);
    res.status(500).json({
      success: false,
      message: "Erreur modification profil",
    });
  }
});

// PUT - Changer le mot de passe
router.put("/password/:userId", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await user.correctPassword(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Mot de passe actuel incorrect",
      });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Mot de passe modifié avec succès",
    });
  } catch (error) {
    console.error("Erreur changement mot de passe:", error);
    res.status(500).json({
      success: false,
      message: "Erreur changement mot de passe",
    });
  }
});

// GET - Historique des connexions
router.get("/login-history/:userId", async (req, res) => {
  try {
    const history = await LoginHistory.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error("Erreur historique connexions:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// POST - Ajouter une entrée d'historique de connexion
router.post("/login-history", async (req, res) => {
  try {
    const { userId, device, ipAddress, location } = req.body;

    const loginHistory = new LoginHistory({
      user: userId,
      device: device || "Unknown",
      ipAddress: ipAddress || "Unknown",
      location: location || { type: "Point", coordinates: [0, 0] },
    });

    await loginHistory.save();

    res.status(201).json({
      success: true,
      message: "Historique de connexion enregistré",
      data: loginHistory,
    });
  } catch (error) {
    console.error("Erreur enregistrement historique:", error);
    res.status(500).json({
      success: false,
      message: "Erreur enregistrement historique",
    });
  }
});

// GET - Produits de l'utilisateur
router.get("/products/:userId", async (req, res) => {
  try {
    const products = await Product.find({
      user: req.params.userId,
      isActive: true,
    })
      .populate("category", "title")
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

// GET - Catégories de l'utilisateur
router.get("/categories/:userId", async (req, res) => {
  try {
    const categories = await Category.find({
      user: req.params.userId,
      isActive: true,
    }).sort({ title: 1 });

    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Erreur récupération catégories:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

module.exports = router;
