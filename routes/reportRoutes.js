const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/authMiddleware");

const {
  createReport,
  getReportsByItem,
  getMyReports,
  approveReport,
  rejectReport,
} = require("../controllers/reportController");

// =====================================================
// CREATE CLAIM
// POST /api/reports
// =====================================================

router.post(
  "/",
  authenticate,
  createReport
);

// =====================================================
// MY CLAIMS
// GET /api/reports/my
//
// Existing endpoint
// =====================================================

router.get(
  "/my",
  authenticate,
  getMyReports
);

// =====================================================
// MY CLAIMS
// GET /api/reports/my-claims
//
// Alias for MyClaims.jsx
// This allows the existing frontend to work without
// changing MyClaims.jsx.
//
// MyClaims.jsx calls:
// GET /api/reports/my-claims
// =====================================================

router.get(
  "/my-claims",
  authenticate,
  getMyReports
);

// =====================================================
// CLAIMS FOR ITEM
// GET /api/reports/item/:itemId
// =====================================================

router.get(
  "/item/:itemId",
  authenticate,
  getReportsByItem
);

// =====================================================
// OWNER APPROVES CLAIM
// PUT /api/reports/:id/approve
// =====================================================

router.put(
  "/:id/approve",
  authenticate,
  approveReport
);

// =====================================================
// OWNER REJECTS CLAIM
// PUT /api/reports/:id/reject
// =====================================================

router.put(
  "/:id/reject",
  authenticate,
  rejectReport
);

module.exports = router;