const prisma = require("../config/prisma");

// ======================================
// Dashboard Statistics
// ======================================
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();

    const totalItems = await prisma.item.count();

    const totalClaims = await prisma.report.count();

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

    const rewards = await prisma.item.aggregate({
      _sum: {
        reward: true,
      },
      where: {
        rewardPaid: true,
      },
    });

    res.json({
      totalUsers,
      totalItems,
      totalClaims,
      pendingClaims,
      approvedClaims,
      rejectedClaims,
      lostItems,
      foundItems,
      returnedItems,
      rewardsPaid: rewards._sum.reward || 0,
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// ======================================
// Get All Claims
// ======================================
const getAllClaims = async (req, res) => {
  try {

    const claims = await prisma.report.findMany({
      include: {
        user: true,
        item: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(claims);

  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// ======================================
// Approve Claim
// ======================================
const approveClaim = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const report = await prisma.report.update({
      where: {
        id,
      },
      data: {
        status: "APPROVED",
      },
      include: {
        user: true,
        item: true,
      },
    });

    res.json({
      success: true,
      message: "Claim Approved Successfully",
      report,
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
// ======================================
// Reject Claim
// ======================================
const rejectClaim = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const report = await prisma.report.update({
      where: {
        id,
      },
      data: {
        status: "REJECTED",
      },
      include: {
        user: true,
        item: true,
      },
    });

    res.json({
      success: true,
      message: "Claim Rejected Successfully",
      report,
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ======================================
// Export
// ======================================
module.exports = {
  getDashboardStats,
  getAllClaims,
  approveClaim,
  rejectClaim,
};