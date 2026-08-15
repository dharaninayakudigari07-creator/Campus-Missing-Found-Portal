const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/authMiddleware");

const {
  payReward,
  getPayments,
} = require("../controllers/paymentController");


// =====================================================
// PAY REWARD
// =====================================================

router.post(
  "/pay",
  authenticate,
  payReward
);


// =====================================================
// PAYMENT HISTORY
// =====================================================

router.get(
  "/history",
  authenticate,
  getPayments
);


module.exports = router;