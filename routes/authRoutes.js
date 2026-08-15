const express = require("express");

const router = express.Router();

const {
  signup,
  login,
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/authController");

const authenticate =
  require("../middleware/authMiddleware");


// =====================================================
// AUTH
// =====================================================

// SIGNUP
router.post(
  "/signup",
  signup
);


// LOGIN
router.post(
  "/login",
  login
);


// =====================================================
// PROFILE
// =====================================================

// GET CURRENT USER
// IMPORTANT: Profile.jsx calls /api/auth/me
router.get(
  "/me",
  authenticate,
  getProfile
);


// GET PROFILE
router.get(
  "/profile",
  authenticate,
  getProfile
);


// UPDATE PROFILE
router.put(
  "/profile",
  authenticate,
  updateProfile
);


// =====================================================
// CHANGE PASSWORD
// =====================================================

router.put(
  "/change-password",
  authenticate,
  changePassword
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;