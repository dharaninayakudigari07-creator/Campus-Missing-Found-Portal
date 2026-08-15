const prisma = require("../config/prisma");
const { calculateMatch } = require("../services/aiMatcher");

// =====================================================
// HELPER: GET BEST AI MATCH
// =====================================================

const getBestMatch = async (item) => {
  try {
    if (
      item.status !== "LOST" &&
      item.status !== "FOUND"
    ) {
      return {
        matchPercentage: 0,
        bestMatch: null,
      };
    }

    const oppositeStatus =
      item.status === "LOST"
        ? "FOUND"
        : "LOST";

    const existingItems =
      await prisma.item.findMany({
        where: {
          status: oppositeStatus,
          id: {
            not: item.id,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    if (existingItems.length === 0) {
      return {
        matchPercentage: 0,
        bestMatch: null,
      };
    }

    let bestMatch = null;
    let bestScore = 0;

    for (const existingItem of existingItems) {
      const score = calculateMatch(
        item,
        existingItem
      );

      console.log(
        `AI MATCH: Item ${item.id} ↔ Item ${existingItem.id} = ${score}%`
      );

      if (score > bestScore) {
        bestScore = score;

        bestMatch = {
          id: existingItem.id,
          title: existingItem.title,
          description: existingItem.description,
          category: existingItem.category,
          location: existingItem.location,
          latitude: existingItem.latitude,
          longitude: existingItem.longitude,
          status: existingItem.status,
          image: existingItem.image,
          reward: existingItem.reward,
          similarity: score,
        };
      }
    }

    return {
      matchPercentage: bestScore,
      bestMatch,
    };
  } catch (error) {
    console.error(
      "GET BEST MATCH ERROR:",
      error
    );

    return {
      matchPercentage: 0,
      bestMatch: null,
    };
  }
};


// =====================================================
// CREATE ITEM
// =====================================================

const createItem = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      latitude,
      longitude,
      status,
      reward,
    } = req.body;

    const image = req.file
      ? req.file.filename
      : null;

    if (
      !title ||
      !description ||
      !category ||
      !location ||
      !status
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please fill all required fields",
      });
    }

    const normalizedStatus =
      String(status)
        .trim()
        .toUpperCase();

    if (
      normalizedStatus !== "LOST" &&
      normalizedStatus !== "FOUND"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be LOST or FOUND",
      });
    }

    const item =
      await prisma.item.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          category: category.trim(),
          location: location.trim(),

          latitude:
            latitude !== undefined &&
            latitude !== null &&
            latitude !== ""
              ? Number(latitude)
              : null,

          longitude:
            longitude !== undefined &&
            longitude !== null &&
            longitude !== ""
              ? Number(longitude)
              : null,

          reward:
            reward !== undefined &&
            reward !== null &&
            reward !== ""
              ? Number(reward)
              : 0,

          rewardPaid: false,

          status: normalizedStatus,

          image,

          userId: Number(req.user.id),
        },
      });

    // =================================================
    // AI MATCHING
    // =================================================

    const oppositeStatus =
      normalizedStatus === "LOST"
        ? "FOUND"
        : "LOST";

    const existingItems =
      await prisma.item.findMany({
        where: {
          status: oppositeStatus,
          id: {
            not: item.id,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    const aiMatches =
      existingItems
        .map((existingItem) => {
          const similarity =
            calculateMatch(
              item,
              existingItem
            );

          return {
            id: existingItem.id,
            title: existingItem.title,
            description: existingItem.description,
            category: existingItem.category,
            location: existingItem.location,
            latitude: existingItem.latitude,
            longitude: existingItem.longitude,
            status: existingItem.status,
            image: existingItem.image,
            reward: existingItem.reward,
            similarity,
          };
        })
        .sort(
          (a, b) =>
            b.similarity - a.similarity
        );

    const bestMatch =
      aiMatches.length > 0
        ? aiMatches[0]
        : null;

    const matchPercentage =
      bestMatch?.similarity || 0;

    return res.status(201).json({
      success: true,
      message:
        "Item Added Successfully",
      item,
      aiMatches,
      matchPercentage,
      bestMatch,
    });
  } catch (error) {
    console.error(
      "CREATE ITEM ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};


// =====================================================
// GET ALL ITEMS
// =====================================================

const getItems = async (req, res) => {
  try {
    const items =
      await prisma.item.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    const activeItems =
      items.filter(
        (item) =>
          item.status === "LOST" ||
          item.status === "FOUND"
      );

    const itemsWithMatch =
      items.map((item) => {
        if (
          item.status !== "LOST" &&
          item.status !== "FOUND"
        ) {
          return {
            ...item,
            matchPercentage: 0,
            bestMatch: null,
          };
        }

        const oppositeItems =
          activeItems.filter(
            (existingItem) =>
              existingItem.status !==
                item.status &&
              existingItem.id !== item.id
          );

        let bestScore = 0;
        let bestMatch = null;

        oppositeItems.forEach(
          (existingItem) => {
            const score =
              calculateMatch(
                item,
                existingItem
              );

            if (score > bestScore) {
              bestScore = score;

              bestMatch = {
                id: existingItem.id,
                title: existingItem.title,
                description:
                  existingItem.description,
                category:
                  existingItem.category,
                location:
                  existingItem.location,
                latitude:
                  existingItem.latitude,
                longitude:
                  existingItem.longitude,
                status:
                  existingItem.status,
                image:
                  existingItem.image,
                reward:
                  existingItem.reward,
                similarity: score,
              };
            }
          }
        );

        return {
          ...item,
          matchPercentage: bestScore,
          bestMatch,
        };
      });

    return res.status(200).json(
      itemsWithMatch
    );
  } catch (error) {
    console.error(
      "GET ITEMS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};


// =====================================================
// GET MY ITEMS
// =====================================================

const getMyItems = async (req, res) => {
  try {
    const items =
      await prisma.item.findMany({
        where: {
          userId: Number(req.user.id),
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
            },
          },

          reports: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  department: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    const itemsWithMatch = [];

    for (const item of items) {
      const matchData =
        await getBestMatch(item);

      itemsWithMatch.push({
        ...item,
        matchPercentage:
          matchData.matchPercentage,
        bestMatch:
          matchData.bestMatch,
      });
    }

    return res.status(200).json(
      itemsWithMatch
    );
  } catch (error) {
    console.error(
      "GET MY ITEMS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};


// =====================================================
// GET ITEM BY ID
// =====================================================

const getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Item ID is missing",
      });
    }

    const itemId = Number(id);

    if (!Number.isInteger(itemId)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid item ID",
      });
    }

    const item =
      await prisma.item.findUnique({
        where: {
          id: itemId,
        },

        include: {
          user: true,

          reports: {
            include: {
              user: true,
            },
          },
        },
      });

    if (!item) {
      return res.status(404).json({
        success: false,
        message:
          "Item not found",
      });
    }

    const matchData =
      await getBestMatch(item);

    return res.status(200).json({
      ...item,

      matchPercentage:
        matchData.matchPercentage,

      bestMatch:
        matchData.bestMatch,
    });
  } catch (error) {
    console.error(
      "GET ITEM BY ID ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};


// =====================================================
// UPDATE ITEM
// =====================================================

const updateItem = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      latitude,
      longitude,
      status,
      reward,
      rewardPaid,
    } = req.body;

    const { id } = req.params;

    const itemId = Number(id);

    if (!Number.isInteger(itemId)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid item ID",
      });
    }

    const data = {
      title,
      description,
      category,
      location,

      latitude:
        latitude !== undefined &&
        latitude !== null &&
        latitude !== ""
          ? Number(latitude)
          : null,

      longitude:
        longitude !== undefined &&
        longitude !== null &&
        longitude !== ""
          ? Number(longitude)
          : null,

      reward:
        reward !== undefined &&
        reward !== null &&
        reward !== ""
          ? Number(reward)
          : 0,

      rewardPaid:
        rewardPaid === true ||
        rewardPaid === "true",
    };

    if (status) {
      data.status =
        String(status)
          .trim()
          .toUpperCase();
    }

    if (req.file) {
      data.image =
        req.file.filename;
    }

    const item =
      await prisma.item.update({
        where: {
          id: itemId,
        },
        data,
      });

    const matchData =
      await getBestMatch(item);

    return res.status(200).json({
      success: true,
      message:
        "Item updated successfully",
      item,
      matchPercentage:
        matchData.matchPercentage,
      bestMatch:
        matchData.bestMatch,
    });
  } catch (error) {
    console.error(
      "UPDATE ITEM ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};


// =====================================================
// DELETE ITEM
// =====================================================

const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const itemId = Number(id);

    if (!Number.isInteger(itemId)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid item ID",
      });
    }

    await prisma.item.delete({
      where: {
        id: itemId,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Item deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE ITEM ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};


// =====================================================
// MARK ITEM AS RETURNED
// =====================================================
//
// IMPORTANT:
// When owner marks item as returned:
//
// 1. Item becomes RETURNED
// 2. Approved claimant gets 10 points
// 3. Certificate count is recalculated
//    based on total points / 50
//
// Example:
// 40 points -> +10 -> 50 points -> 1 certificate
//
// 90 points -> +10 -> 100 points -> 2 certificates
//
// =====================================================

const markReturned = async (req, res) => {
  try {
    const { id } = req.params;

    const itemId = Number(id);
    const ownerId = Number(req.user.id);

    if (!Number.isInteger(itemId)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid item ID",
      });
    }

    // =================================================
    // FIND ITEM
    // =================================================

    const item =
      await prisma.item.findUnique({
        where: {
          id: itemId,
        },

        include: {
          reports: {
            where: {
              status: "APPROVED",
            },

            include: {
              user: true,
            },
          },
        },
      });

    if (!item) {
      return res.status(404).json({
        success: false,
        message:
          "Item not found",
      });
    }

    // =================================================
    // ONLY OWNER CAN MARK RETURNED
    // =================================================

    if (
      Number(item.userId) !==
      ownerId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the item owner can mark this item as returned.",
      });
    }

    // =================================================
    // ALREADY RETURNED
    // =================================================

    if (
      String(item.status).toUpperCase() ===
      "RETURNED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This item has already been returned.",
      });
    }

    // =================================================
    // FIND APPROVED CLAIM
    // =================================================

    const approvedClaim =
      item.reports.find(
        (report) =>
          String(
            report.status
          ).toUpperCase() ===
          "APPROVED"
      );

    if (!approvedClaim) {
      return res.status(400).json({
        success: false,
        message:
          "Please approve a claim before marking the item as returned.",
      });
    }

    // =================================================
    // CLAIMANT
    // =================================================

    const claimantId =
      Number(
        approvedClaim.userId
      );

    // =================================================
    // POINTS FOR SUCCESSFUL RECOVERY
    // =================================================

    const POINTS_PER_RETURN = 10;
    const CERTIFICATE_THRESHOLD = 50;

    // =================================================
    // TRANSACTION
    // =================================================

    const result =
      await prisma.$transaction(
        async (tx) => {

          // -------------------------------------------
          // MARK ITEM RETURNED
          // -------------------------------------------

          const returnedItem =
            await tx.item.update({
              where: {
                id: itemId,
              },

              data: {
                status: "RETURNED",
              },
            });

          // -------------------------------------------
          // GET CLAIMANT
          // -------------------------------------------

          const claimant =
            await tx.user.findUnique({
              where: {
                id: claimantId,
              },
            });

          if (!claimant) {
            throw new Error(
              "Claimant user not found."
            );
          }

          // -------------------------------------------
          // ADD 10 POINTS
          // -------------------------------------------

          const oldPoints =
            Number(
              claimant.points || 0
            );

          const newPoints =
            oldPoints +
            POINTS_PER_RETURN;

          // -------------------------------------------
          // CALCULATE CERTIFICATES
          // -------------------------------------------
          //
          // 0-49   => 0
          // 50-99  => 1
          // 100-149 => 2
          // 150-199 => 3
          //
          // -------------------------------------------

          const newCertificates =
            Math.floor(
              newPoints /
              CERTIFICATE_THRESHOLD
            );

          // -------------------------------------------
          // UPDATE USER
          // -------------------------------------------

          const updatedUser =
            await tx.user.update({
              where: {
                id: claimantId,
              },

              data: {
                points: newPoints,

                certificates:
                  newCertificates,
              },
            });

          // -------------------------------------------
          // RETURN RESULT
          // -------------------------------------------

          return {
            returnedItem,
            updatedUser,
          };
        }
      );

    // =================================================
    // RESPONSE
    // =================================================

    const pointsEarned =
      10;

    const certificateEarned =
      result.updatedUser.certificates >
      Math.floor(
        (result.updatedUser.points -
          pointsEarned) /
          50
      );

    return res.status(200).json({
      success: true,

      message:
        certificateEarned
          ? "Item returned successfully. 10 points earned and a certificate has been unlocked!"
          : "Item returned successfully. 10 points have been added to the claimant.",

      item:
        result.returnedItem,

      claimant: {
        id:
          result.updatedUser.id,

        name:
          result.updatedUser.name,

        points:
          result.updatedUser.points,

        certificates:
          result.updatedUser.certificates,
      },

      pointsEarned,

      certificateEarned,
    });

  } catch (error) {
    console.error(
      "MARK RETURNED ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to mark item as returned.",
      error: error.message,
    });
  }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createItem,
  getItems,
  getMyItems,
  getItemById,
  updateItem,
  deleteItem,
  markReturned,
};