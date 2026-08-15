const jwt = require("jsonwebtoken");


// =====================================================
// AUTHENTICATE USER
// =====================================================

const authenticate = (
  req,
  res,
  next
) => {

  try {

    // -------------------------------------------------
    // GET AUTHORIZATION HEADER
    // -------------------------------------------------

    const authHeader =
      req.headers.authorization;

    if (!authHeader) {

      return res.status(401).json({
        message:
          "Authentication token is required.",
      });

    }


    // -------------------------------------------------
    // CHECK BEARER
    // -------------------------------------------------

    if (
      !authHeader.startsWith("Bearer ")
    ) {

      return res.status(401).json({
        message:
          "Invalid authentication format.",
      });

    }


    // -------------------------------------------------
    // EXTRACT TOKEN
    // -------------------------------------------------

    const token =
      authHeader.split(" ")[1];

    if (!token) {

      return res.status(401).json({
        message:
          "Authentication token is missing.",
      });

    }


    // -------------------------------------------------
    // VERIFY TOKEN
    // -------------------------------------------------

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );


    // -------------------------------------------------
    // STORE USER INFORMATION
    // -------------------------------------------------

    req.user = decoded;


    // -------------------------------------------------
    // CHECK USER ID
    // -------------------------------------------------

    if (!req.user.id) {

      return res.status(401).json({
        message:
          "Invalid authentication user.",
      });

    }


    next();

  } catch (error) {

    console.error(
      "AUTHENTICATION ERROR:",
      error
    );


    if (
      error.name ===
      "TokenExpiredError"
    ) {

      return res.status(401).json({
        message:
          "Your session has expired. Please login again.",
      });

    }


    return res.status(401).json({
      message:
        "Invalid or expired authentication token.",
    });

  }

};


module.exports =
  authenticate;