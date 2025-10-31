const express = require("express");
const upload = require("../middleware/upload");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Route test
router.get("/test", (req, res) => {
  res.json({ message: "Route upload fonctionne !" });
});

// POST - Upload d'image unique
router.post("/image", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Aucun fichier uploadé",
      });
    }

    // Construire l'URL de l'image
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;

    res.json({
      success: true,
      message: "Image uploadée avec succès",
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: imageUrl,
      },
    });
  } catch (error) {
    console.error("Erreur upload image:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'upload",
    });
  }
});

// POST - Upload multiple d'images
router.post("/images", upload.array("images", 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Aucun fichier uploadé",
      });
    }

    const uploadedFiles = req.files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
    }));

    res.json({
      success: true,
      message: `${req.files.length} image(s) uploadée(s) avec succès`,
      data: uploadedFiles,
    });
  } catch (error) {
    console.error("Erreur upload images:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'upload",
    });
  }
});

// GET - Servir les fichiers uploadés
router.get("/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "../../uploads", filename);

    // Vérifier que le fichier existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Fichier non trouvé",
      });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error("Erreur serveur fichier:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// DELETE - Supprimer une image
router.delete("/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "../../uploads", filename);

    // Vérifier que le fichier existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Fichier non trouvé",
      });
    }

    // Supprimer le fichier
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: "Fichier supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur suppression fichier:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression",
    });
  }
});

module.exports = router;
