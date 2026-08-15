const express = require("express");

const router = express.Router();

const prisma = require("../config/prisma");

const authenticate = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// =====================================================
// ADMIN AUTHENTICATION
// =====================================================

router.use(authenticate);
router.use(adminMiddleware);

// =====================================================
// GET ALL ITEMS
// GET /api/admin/items
// =====================================================

router.get("/items", async (req, res) => {
    try {
        const items = await prisma.item.findMany({
            orderBy: {
                createdAt: "desc",
            },

            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },

                reports: {
                    select: {
                        id: true,
                        message: true,
                        status: true,
                        verified: true,
                        createdAt: true,

                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        res.json(items);
    } catch (error) {
        console.error("ADMIN ITEMS ERROR:", error);

        res.status(500).json({
            message: "Failed to load items",
            error: error.message,
        });
    }
});

// =====================================================
// GET SINGLE ITEM
// GET /api/admin/items/:id
// =====================================================

router.get("/items/:id", async (req, res) => {
    try {
        const itemId = Number(req.params.id);

        if (Number.isNaN(itemId)) {
            return res.status(400).json({
                message: "Invalid item ID",
            });
        }

        const item = await prisma.item.findUnique({
            where: {
                id: itemId,
            },

            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },

                reports: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!item) {
            return res.status(404).json({
                message: "Item not found",
            });
        }

        res.json(item);
    } catch (error) {
        console.error("GET SINGLE ITEM ERROR:", error);

        res.status(500).json({
            message: "Failed to load item",
            error: error.message,
        });
    }
});

// =====================================================
// DELETE ITEM
// DELETE /api/admin/items/:id
// =====================================================

router.delete("/items/:id", async (req, res) => {
    try {
        const itemId = Number(req.params.id);

        if (Number.isNaN(itemId)) {
            return res.status(400).json({
                message: "Invalid item ID",
            });
        }

        const item = await prisma.item.findUnique({
            where: {
                id: itemId,
            },
        });

        if (!item) {
            return res.status(404).json({
                message: "Item not found",
            });
        }

        await prisma.item.delete({
            where: {
                id: itemId,
            },
        });

        res.json({
            message: "Item deleted successfully",
        });
    } catch (error) {
        console.error("DELETE ITEM ERROR:", error);

        res.status(500).json({
            message: "Failed to delete item",
            error: error.message,
        });
    }
});

// =====================================================
// RETURN ITEM
// PUT /api/admin/items/:id/return
// =====================================================

router.put("/items/:id/return", async (req, res) => {
    try {
        const itemId = Number(req.params.id);

        if (Number.isNaN(itemId)) {
            return res.status(400).json({
                message: "Invalid item ID",
            });
        }

        const item = await prisma.item.findUnique({
            where: {
                id: itemId,
            },
        });

        if (!item) {
            return res.status(404).json({
                message: "Item not found",
            });
        }

        const updatedItem = await prisma.item.update({
            where: {
                id: itemId,
            },

            data: {
                status: "RETURNED",
            },
        });

        res.json({
            message: "Item marked as returned",
            item: updatedItem,
        });
    } catch (error) {
        console.error("RETURN ITEM ERROR:", error);

        res.status(500).json({
            message: "Failed to return item",
            error: error.message,
        });
    }
});

// =====================================================
// GET ALL CLAIMS
// GET /api/admin/claims
// =====================================================

router.get("/claims", async (req, res) => {
    try {
        const claims = await prisma.report.findMany({
            orderBy: {
                createdAt: "desc",
            },

            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },

                item: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        category: true,
                        location: true,
                        status: true,
                        reward: true,
                        image: true,
                    },
                },
            },
        });

        res.json(claims);
    } catch (error) {
        console.error("ADMIN CLAIMS ERROR:", error);

        res.status(500).json({
            message: "Failed to load claims",
            error: error.message,
        });
    }
});

// =====================================================
// GET SINGLE CLAIM
// GET /api/admin/claims/:id
// =====================================================

router.get("/claims/:id", async (req, res) => {
    try {
        const claimId = Number(req.params.id);

        if (Number.isNaN(claimId)) {
            return res.status(400).json({
                message: "Invalid claim ID",
            });
        }

        const claim = await prisma.report.findUnique({
            where: {
                id: claimId,
            },

            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },

                item: true,
            },
        });

        if (!claim) {
            return res.status(404).json({
                message: "Claim not found",
            });
        }

        res.json(claim);
    } catch (error) {
        console.error("GET CLAIM ERROR:", error);

        res.status(500).json({
            message: "Failed to load claim",
            error: error.message,
        });
    }
});

// =====================================================
// APPROVE CLAIM
// PUT /api/admin/claims/:id/approve
// =====================================================

router.put("/claims/:id/approve", async (req, res) => {
    try {
        const claimId = Number(req.params.id);

        if (Number.isNaN(claimId)) {
            return res.status(400).json({
                message: "Invalid claim ID",
            });
        }

        const claim = await prisma.report.findUnique({
            where: {
                id: claimId,
            },

            include: {
                item: true,
                user: true,
            },
        });

        if (!claim) {
            return res.status(404).json({
                message: "Claim not found",
            });
        }

        if (claim.status === "APPROVED") {
            return res.status(400).json({
                message: "Claim is already approved",
            });
        }

        const updatedClaim = await prisma.report.update({
            where: {
                id: claimId,
            },

            data: {
                status: "APPROVED",
                verified: true,
                verifiedAt: new Date(),
            },

            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },

                item: true,
            },
        });

        // Mark item as claimed/approved
        await prisma.item.update({
            where: {
                id: claim.itemId,
            },

            data: {
                claimApproved: true,
            },
        });

        res.json({
            message: "Claim approved successfully",
            claim: updatedClaim,
        });
    } catch (error) {
        console.error("APPROVE CLAIM ERROR:", error);

        res.status(500).json({
            message: "Failed to approve claim",
            error: error.message,
        });
    }
});

// =====================================================
// REJECT CLAIM
// PUT /api/admin/claims/:id/reject
// =====================================================

router.put("/claims/:id/reject", async (req, res) => {
    try {
        const claimId = Number(req.params.id);

        if (Number.isNaN(claimId)) {
            return res.status(400).json({
                message: "Invalid claim ID",
            });
        }

        const claim = await prisma.report.findUnique({
            where: {
                id: claimId,
            },
        });

        if (!claim) {
            return res.status(404).json({
                message: "Claim not found",
            });
        }

        const updatedClaim = await prisma.report.update({
            where: {
                id: claimId,
            },

            data: {
                status: "REJECTED",
                verified: false,
                verifiedAt: null,
            },

            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },

                item: true,
            },
        });

        res.json({
            message: "Claim rejected successfully",
            claim: updatedClaim,
        });
    } catch (error) {
        console.error("REJECT CLAIM ERROR:", error);

        res.status(500).json({
            message: "Failed to reject claim",
            error: error.message,
        });
    }
});

// =====================================================
// ADMIN STATISTICS
// GET /api/admin/stats
// =====================================================

router.get("/stats", async (req, res) => {
    try {
        const totalUsers = await prisma.user.count();

        const totalItems = await prisma.item.count();

        const totalClaims = await prisma.report.count();

        const lostItems = await prisma.item.count({
            where: {
                status: "LOST",
            },
        });

        const foundItems = await prisma.item.count({
            where: {
                status: "FOUND",
            },
        });

        const returnedItems = await prisma.item.count({
            where: {
                status: "RETURNED",
            },
        });

        const pendingClaims = await prisma.report.count({
            where: {
                status: "PENDING",
            },
        });

        const approvedClaims = await prisma.report.count({
            where: {
                status: "APPROVED",
            },
        });

        const rejectedClaims = await prisma.report.count({
            where: {
                status: "REJECTED",
            },
        });

        const rewardResult = await prisma.item.aggregate({
            _sum: {
                reward: true,
            },
        });

        res.json({
            totalUsers,
            totalItems,
            totalClaims,
            lostItems,
            foundItems,
            returnedItems,
            pendingClaims,
            approvedClaims,
            rejectedClaims,
            totalRewards: rewardResult._sum.reward || 0,
        });
    } catch (error) {
        console.error("ADMIN STATS ERROR:", error);

        res.status(500).json({
            message: "Failed to load statistics",
            error: error.message,
        });
    }
});

module.exports = router;