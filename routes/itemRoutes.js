const express = require("express");

const router = express.Router();

const upload = require("../config/multer");

const authenticate = require("../middleware/authMiddleware");

const {
  createItem,
  getItems,
  getMyItems,
  getItemById,
  updateItem,
  deleteItem,
  markReturned,
} = require("../controllers/itemController");


// =====================================================
// CREATE ITEM
// =====================================================

router.post(
  "/",
  authenticate,
  upload.single("image"),
  createItem
);


// =====================================================
// GET MY ITEMS
// IMPORTANT: BEFORE /:id
// =====================================================

router.get(
  "/my/items",
  authenticate,
  getMyItems
);


// =====================================================
// GET ALL ITEMS
// =====================================================

router.get(
  "/",
  getItems
);


// =====================================================
// GET SINGLE ITEM
// =====================================================

router.get(
  "/:id",
  getItemById
);


// =====================================================
// UPDATE ITEM
// =====================================================

router.put(
  "/:id",
  authenticate,
  upload.single("image"),
  updateItem
);


// =====================================================
// MARK ITEM AS RETURNED
// =====================================================

router.put(
  "/:id/returned",
  authenticate,
  markReturned
);


// =====================================================
// DELETE ITEM
// =====================================================

router.delete(
  "/:id",
  authenticate,
  deleteItem
);


module.exports = router;