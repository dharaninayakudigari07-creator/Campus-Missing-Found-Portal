const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// =====================================================
// SIGNUP
// =====================================================

const signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      studentId,
      department,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        password: hashedPassword,
        phone: phone || null,
        studentId: studentId || null,
        department: department || null,

        // IMPORTANT
        points: 0,
        certificates: 0,
      },
    });

    return res.status(201).json({
      message: "Signup successful",

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        studentId: user.studentId,
        department: user.department,
        role: user.role,

        // IMPORTANT
        points: user.points,
        certificates: user.certificates,
      },
    });

  } catch (error) {
    console.error(
      "SIGNUP ERROR:",
      error
    );

    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};


// =====================================================
// LOGIN
// =====================================================

const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const validPassword =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid Password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.json({
      message: "Login Successful",

      token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        studentId: user.studentId,
        department: user.department,
        role: user.role,

        // IMPORTANT
        points: user.points,
        certificates: user.certificates,
      },
    });

  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};


// =====================================================
// GET PROFILE / ME
// =====================================================

const getProfile = async (req, res) => {
  try {
    const userId =
      Number(req.user.id);

    if (!Number.isInteger(userId)) {
      return res.status(401).json({
        message: "Invalid user.",
      });
    }

    // =================================================
    // GET LATEST USER FROM DATABASE
    // =================================================

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          studentId: true,
          department: true,
          role: true,

          // IMPORTANT
          points: true,
          certificates: true,

          createdAt: true,
        },
      });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // =================================================
    // MY ITEMS
    // =================================================

    const items =
      await prisma.item.count({
        where: {
          userId,
        },
      });

    // =================================================
    // MY CLAIMS
    // =================================================

    const claims =
      await prisma.report.count({
        where: {
          userId,
        },
      });

    // =================================================
    // REWARDS
    // =================================================

    const rewards =
      await prisma.item.aggregate({
        where: {
          userId,
          rewardPaid: true,
        },

        _sum: {
          reward: true,
        },
      });

    // =================================================
    // AI MATCHES
    // =================================================

    const aiMatches =
      await prisma.item.count({
        where: {
          userId,

          aiScore: {
            gt: 60,
          },
        },
      });

    // =================================================
    // RESPONSE
    // =================================================

    return res.json({
      success: true,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        studentId: user.studentId,
        department: user.department,
        role: user.role,

        // VERY IMPORTANT
        points: Number(user.points || 0),
        certificates: Number(
          user.certificates || 0
        ),

        createdAt: user.createdAt,
      },

      items,
      claims,

      rewards:
        rewards._sum.reward || 0,

      aiMatches,
    });

  } catch (error) {
    console.error(
      "GET PROFILE ERROR:",
      error
    );

    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};


// =====================================================
// UPDATE PROFILE
// =====================================================

const updateProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      studentId,
      department,
    } = req.body;

    const userId =
      Number(req.user.id);

    const existingUser =
      await prisma.user.findFirst({
        where: {
          email,

          NOT: {
            id: userId,
          },
        },
      });

    if (existingUser) {
      return res.status(400).json({
        message:
          "Email already exists",
      });
    }

    const updatedUser =
      await prisma.user.update({
        where: {
          id: userId,
        },

        data: {
          name,
          email,
          phone,
          studentId,
          department,
        },

        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          studentId: true,
          department: true,
          role: true,
          points: true,
          certificates: true,
          createdAt: true,
        },
      });

    return res.json({
      message:
        "Profile Updated Successfully",

      user: updatedUser,
    });

  } catch (error) {
    console.error(
      "UPDATE PROFILE ERROR:",
      error
    );

    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};


// =====================================================
// CHANGE PASSWORD
// =====================================================

const changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
    } = req.body;

    const user =
      await prisma.user.findUnique({
        where: {
          id: Number(req.user.id),
        },
      });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const valid =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!valid) {
      return res.status(400).json({
        message:
          "Current password is incorrect",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10
      );

    await prisma.user.update({
      where: {
        id: Number(req.user.id),
      },

      data: {
        password:
          hashedPassword,
      },
    });

    return res.json({
      message:
        "Password Changed Successfully",
    });

  } catch (error) {
    console.error(
      "CHANGE PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      message: "Server Error",
    });
  }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
  signup,
  login,
  getProfile,
  updateProfile,
  changePassword,
};