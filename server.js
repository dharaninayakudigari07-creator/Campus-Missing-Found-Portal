const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reportRoutes = require("./routes/reportRoutes");
const itemRoutes = require("./routes/itemRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// =====================================================
// UPLOADS DIRECTORY
// =====================================================

const uploadsPath = path.join(__dirname, "uploads");

console.log("========================================");
console.log("UPLOADS DIRECTORY:", uploadsPath);
console.log(
  "UPLOADS EXISTS:",
  fs.existsSync(uploadsPath)
);
console.log("========================================");

// Make sure uploads directory exists
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, {
    recursive: true,
  });

  console.log(
    "Uploads directory created:",
    uploadsPath
  );
}

// =====================================================
// STATIC UPLOADS
// =====================================================

app.use(
  "/uploads",
  express.static(uploadsPath)
);

// =====================================================
// TEST IMAGE ROUTE
// =====================================================

app.get("/uploads-test", (req, res) => {
  try {
    const files = fs.readdirSync(uploadsPath);

    res.json({
      success: true,
      uploadsPath,
      files,
      count: files.length,
    });
  } catch (error) {
    console.error(
      "UPLOAD TEST ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =====================================================
// API ROUTES
// =====================================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

app.use(
  "/api/reports",
  reportRoutes
);

app.use(
  "/api/items",
  itemRoutes
);

app.use(
  "/api/payment",
  paymentRoutes
);

// =====================================================
// ROOT
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "AI Campus Lost & Found API is running",
  });
});

// =====================================================
// 404
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// =====================================================
// ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error(
    "SERVER ERROR:",
    err
  );

  res.status(500).json({
    success: false,
    message:
      "Internal Server Error",
  });
});

// =====================================================
// SERVER
// =====================================================

const PORT =
  process.env.PORT || 5000;

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Server running on port ${PORT}`
    );

    console.log(
      `Uploads folder: ${uploadsPath}`
    );
  }
);