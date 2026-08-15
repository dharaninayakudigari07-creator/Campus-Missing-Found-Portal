const prisma = require("../config/prisma");

// =====================================================
// PAY REWARD
// Reward can ONLY be paid after item is RETURNED
// =====================================================

const payReward = async (req, res) => {
  try {
    const { itemId } = req.body;

    // -------------------------------------------------
    // Validate item ID
    // -------------------------------------------------

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: "Item ID is required",
      });
    }

    const numericItemId = Number(itemId);

    if (!Number.isInteger(numericItemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Item ID",
      });
    }

    // -------------------------------------------------
    // Find item
    // -------------------------------------------------

    const item = await prisma.item.findUnique({
      where: {
        id: numericItemId,
      },
      include: {
        user: true,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // -------------------------------------------------
    // CHECK ITEM STATUS
    // IMPORTANT:
    // Reward cannot be paid before RETURNED
    // -------------------------------------------------

    if (item.status !== "RETURNED") {
      return res.status(400).json({
        success: false,
        message:
          "Reward can only be paid after the item has been returned.",
      });
    }

    // -------------------------------------------------
    // CHECK REWARD
    // -------------------------------------------------

    if (!item.reward || Number(item.reward) <= 0) {
      return res.status(400).json({
        success: false,
        message: "No reward is available for this item.",
      });
    }

    // -------------------------------------------------
    // CHECK ALREADY PAID
    // -------------------------------------------------

    if (item.rewardPaid) {
      return res.status(400).json({
        success: false,
        message: "Reward has already been paid.",
      });
    }

    // -------------------------------------------------
    // CHECK CURRENT USER
    // Only item owner can pay reward
    // -------------------------------------------------

    if (
      req.user &&
      item.userId !== Number(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the person who reported the item can pay the reward.",
      });
    }

    // -------------------------------------------------
    // PAYMENT
    // IMPORTANT:
    // We DO NOT change status here.
    // Status must already be RETURNED.
    // -------------------------------------------------

    const updatedItem = await prisma.item.update({
      where: {
        id: numericItemId,
      },
      data: {
        rewardPaid: true,
      },
    });

    // -------------------------------------------------
    // SUCCESS
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Reward payment successful.",
      item: updatedItem,
    });

  } catch (error) {
    console.error(
      "PAY REWARD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


// =====================================================
// PAYMENT HISTORY
// =====================================================

const getPayments = async (req, res) => {
  try {

    const payments = await prisma.item.findMany({
      where: {
        rewardPaid: true,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      payments,
    });

  } catch (error) {

    console.error(
      "GET PAYMENTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};


module.exports = {
  payReward,
  getPayments,
};