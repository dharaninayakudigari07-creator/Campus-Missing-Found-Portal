const prisma = require("../config/prisma");

// =====================================================
// POINTS CONFIGURATION
// =====================================================

const FOUND_ITEM_POINTS = 10;


// =====================================================
// HELPER - CREATE IMAGE URL
// =====================================================

const getImageUrl = (req, image) => {
  if (!image) {
    return null;
  }

  // Already a complete URL
  if (
    typeof image === "string" &&
    (
      image.startsWith("http://") ||
      image.startsWith("https://")
    )
  ) {
    return image.replace(/^http:\/\//, "https://");
  }

  const cleanImage = String(image).replace(/^\/+/, "");

  const host = req.get("host");

  // Image already contains uploads/
  if (cleanImage.startsWith("uploads/")) {
    return `https://${host}/${cleanImage}`;
  }

  // Normal uploaded filename
  return `https://${host}/uploads/${cleanImage}`;
};


// =====================================================
// CREATE CLAIM
// POST /api/reports
// =====================================================

const createReport = async (req, res) => {
  try {
    const {
      itemId,
      message,
    } = req.body;

    const userId = Number(req.user.id);

    if (!itemId) {
      return res.status(400).json({
        message: "Item ID is required.",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Claim message is required.",
      });
    }

    const numericItemId = Number(itemId);

    if (!Number.isInteger(numericItemId)) {
      return res.status(400).json({
        message: "Invalid item ID.",
      });
    }

    const item = await prisma.item.findUnique({
      where: {
        id: numericItemId,
      },
    });

    if (!item) {
      return res.status(404).json({
        message: "Item not found.",
      });
    }

    if (Number(item.userId) === userId) {
      return res.status(403).json({
        message: "You cannot submit a claim for your own item.",
      });
    }

    if (
      String(item.status).toUpperCase() ===
      "RETURNED"
    ) {
      return res.status(400).json({
        message:
          "Claims are closed because this item has already been returned.",
      });
    }

    const existingReport =
      await prisma.report.findFirst({
        where: {
          itemId: numericItemId,
          userId,
        },
      });

    if (existingReport) {
      return res.status(400).json({
        message:
          "You have already submitted a claim for this item.",
      });
    }

    const report =
      await prisma.report.create({
        data: {
          itemId: numericItemId,
          userId,
          message: message.trim(),
          status: "PENDING",
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              studentId: true,
              department: true,
              points: true,
            },
          },

          item: true,
        },
      });

    const reportWithImageUrl = {
      ...report,

      item: report.item
        ? {
            ...report.item,

            imageUrl: getImageUrl(
              req,
              report.item.image
            ),
          }
        : null,
    };

    return res.status(201).json({
      message: "Claim submitted successfully.",
      report: reportWithImageUrl,
    });

  } catch (error) {
    console.error(
      "CREATE REPORT ERROR:",
      error
    );

    return res.status(500).json({
      message: "Unable to submit claim.",
      error: error.message,
    });
  }
};


// =====================================================
// GET CLAIMS FOR ITEM
// GET /api/reports/item/:itemId
// =====================================================

const getReportsByItem = async (req, res) => {
  try {
    const itemId = Number(
      req.params.itemId
    );

    if (!Number.isInteger(itemId)) {
      return res.status(400).json({
        message: "Invalid item ID.",
      });
    }

    const reports =
      await prisma.report.findMany({
        where: {
          itemId,
        },

        orderBy: {
          createdAt: "desc",
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              studentId: true,
              department: true,
              points: true,
            },
          },

          item: true,
        },
      });

    const reportsWithImages =
      reports.map((report) => ({
        ...report,

        item: report.item
          ? {
              ...report.item,

              imageUrl: getImageUrl(
                req,
                report.item.image
              ),
            }
          : null,
      }));

    return res.json(
      reportsWithImages
    );

  } catch (error) {
    console.error(
      "GET ITEM REPORTS ERROR:",
      error
    );

    return res.status(500).json({
      message: "Unable to fetch claims.",
      error: error.message,
    });
  }
};


// =====================================================
// GET MY CLAIMS
// GET /api/reports/my
// GET /api/reports/my-claims
// =====================================================

const getMyReports = async (req, res) => {
  try {
    const userId = Number(
      req.user.id
    );

    const reports =
      await prisma.report.findMany({
        where: {
          userId,
        },

        orderBy: {
          createdAt: "desc",
        },

        include: {
          item: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  department: true,
                  points: true,
                },
              },
            },
          },
        },
      });

    const reportsWithImages =
      reports.map((report) => ({
        ...report,

        item: report.item
          ? {
              ...report.item,

              imageUrl: getImageUrl(
                req,
                report.item.image
              ),
            }
          : null,
      }));

    return res.json(
      reportsWithImages
    );

  } catch (error) {
    console.error(
      "GET MY CLAIMS ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to fetch your claims.",

      error:
        error.message,
    });
  }
};


// =====================================================
// APPROVE CLAIM
// PUT /api/reports/:id/approve
// =====================================================

const approveReport = async (req, res) => {
  try {
    const reportId = Number(
      req.params.id
    );

    const userId = Number(
      req.user.id
    );

    if (!Number.isInteger(reportId)) {
      return res.status(400).json({
        message: "Invalid claim ID.",
      });
    }

    const report =
      await prisma.report.findUnique({
        where: {
          id: reportId,
        },

        include: {
          item: true,
          user: true,
        },
      });

    if (!report) {
      return res.status(404).json({
        message: "Claim not found.",
      });
    }

    // =================================================
    // ONLY ITEM OWNER CAN APPROVE
    // =================================================

    if (
      Number(report.item.userId) !==
      userId
    ) {
      return res.status(403).json({
        message:
          "Only the student who reported this item can approve the claim.",
      });
    }

    // =================================================
    // CLAIM MUST BE PENDING
    // =================================================

    if (
      String(report.status).toUpperCase() !==
      "PENDING"
    ) {
      return res.status(400).json({
        message:
          `This claim is already ${String(
            report.status
          ).toLowerCase()}.`,
      });
    }

    // =================================================
    // ITEM ALREADY RETURNED
    // =================================================

    if (
      String(report.item.status).toUpperCase() ===
      "RETURNED"
    ) {
      return res.status(400).json({
        message:
          "This item has already been returned.",
      });
    }

    // =================================================
    // APPROVE CLAIM + AWARD POINTS
    // =================================================

    const result =
      await prisma.$transaction(
        async (tx) => {

          // -------------------------------------------
          // 1. APPROVE CLAIM
          // -------------------------------------------

          const approvedReport =
            await tx.report.update({
              where: {
                id: reportId,
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
                    studentId: true,
                    department: true,
                    points: true,
                  },
                },

                item: true,
              },
            });


          // -------------------------------------------
          // 2. MARK CLAIM APPROVED ON ITEM
          // -------------------------------------------

          await tx.item.update({
            where: {
              id: report.itemId,
            },

            data: {
              claimApproved: true,
            },
          });


          // -------------------------------------------
          // 3. AWARD POINTS
          // -------------------------------------------

          const itemStatus =
            String(
              report.item.status
            ).toUpperCase();

          if (itemStatus === "FOUND") {

            await tx.user.update({
              where: {
                id: Number(
                  report.item.userId
                ),
              },

              data: {
                points: {
                  increment:
                    FOUND_ITEM_POINTS,
                },
              },
            });

            console.log(
              `Awarded ${FOUND_ITEM_POINTS} points to user ${report.item.userId}`
            );
          }


          // -------------------------------------------
          // 4. REJECT OTHER PENDING CLAIMS
          // -------------------------------------------

          await tx.report.updateMany({
            where: {
              itemId: report.itemId,

              id: {
                not: reportId,
              },

              status: "PENDING",
            },

            data: {
              status: "REJECTED",
              verified: false,
              verifiedAt: null,
            },
          });


          return approvedReport;
        }
      );


    // =================================================
    // GET UPDATED POINTS
    // =================================================

    const updatedItemOwner =
      await prisma.user.findUnique({
        where: {
          id: Number(
            report.item.userId
          ),
        },

        select: {
          id: true,
          name: true,
          email: true,
          studentId: true,
          department: true,
          points: true,
        },
      });


    const resultWithImageUrl = {
      ...result,

      item: result.item
        ? {
            ...result.item,

            imageUrl: getImageUrl(
              req,
              result.item.image
            ),
          }
        : null,
    };


    // =================================================
    // RESPONSE
    // =================================================

    const isFound =
      String(
        report.item.status
      ).toUpperCase() === "FOUND";

    return res.json({
      message: isFound
        ? `Claim approved successfully. ${FOUND_ITEM_POINTS} points awarded to the person who reported the found item.`
        : "Claim approved successfully.",

      report: resultWithImageUrl,

      pointsAwarded: isFound
        ? FOUND_ITEM_POINTS
        : 0,

      itemReporter:
        updatedItemOwner,
    });

  } catch (error) {
    console.error(
      "APPROVE REPORT ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to approve claim.",

      error:
        error.message,
    });
  }
};


// =====================================================
// REJECT CLAIM
// PUT /api/reports/:id/reject
// =====================================================

const rejectReport = async (req, res) => {
  try {
    const reportId = Number(
      req.params.id
    );

    const userId = Number(
      req.user.id
    );

    if (!Number.isInteger(reportId)) {
      return res.status(400).json({
        message: "Invalid claim ID.",
      });
    }

    const report =
      await prisma.report.findUnique({
        where: {
          id: reportId,
        },

        include: {
          item: true,
        },
      });

    if (!report) {
      return res.status(404).json({
        message: "Claim not found.",
      });
    }

    if (
      Number(report.item.userId) !==
      userId
    ) {
      return res.status(403).json({
        message:
          "Only the item owner can reject the claim.",
      });
    }

    if (
      String(report.status).toUpperCase() !==
      "PENDING"
    ) {
      return res.status(400).json({
        message:
          `This claim is already ${String(
            report.status
          ).toLowerCase()}.`,
      });
    }

    const rejectedReport =
      await prisma.report.update({
        where: {
          id: reportId,
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
              studentId: true,
              department: true,
              points: true,
            },
          },

          item: true,
        },
      });

    const rejectedReportWithImageUrl = {
      ...rejectedReport,

      item: rejectedReport.item
        ? {
            ...rejectedReport.item,

            imageUrl: getImageUrl(
              req,
              rejectedReport.item.image
            ),
          }
        : null,
    };

    return res.json({
      message:
        "Claim rejected successfully.",

      report:
        rejectedReportWithImageUrl,
    });

  } catch (error) {
    console.error(
      "REJECT REPORT ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to reject claim.",

      error:
        error.message,
    });
  }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createReport,
  getReportsByItem,
  getMyReports,
  approveReport,
  rejectReport,
};