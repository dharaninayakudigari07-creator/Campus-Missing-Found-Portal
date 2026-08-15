const stringSimilarity = require("string-similarity");

// =====================================================
// TEXT SIMILARITY
// =====================================================

function similarity(a, b) {
  if (!a || !b) {
    return 0;
  }

  return stringSimilarity.compareTwoStrings(
    String(a).toLowerCase().trim(),
    String(b).toLowerCase().trim()
  );
}

// =====================================================
// CALCULATE AI MATCH
// =====================================================

function calculateMatch(newItem, existingItem) {
  if (!newItem || !existingItem) {
    return 0;
  }

  // ---------------------------------------------------
  // TITLE
  // ---------------------------------------------------

  const titleScore = similarity(
    newItem.title,
    existingItem.title
  );

  // ---------------------------------------------------
  // DESCRIPTION
  // ---------------------------------------------------

  const descScore = similarity(
    newItem.description,
    existingItem.description
  );

  // ---------------------------------------------------
  // CATEGORY
  // ---------------------------------------------------

  const categoryScore =
    newItem.category &&
    existingItem.category &&
    String(newItem.category)
      .toLowerCase()
      .trim() ===
      String(existingItem.category)
        .toLowerCase()
        .trim()
      ? 1
      : 0;

  // ---------------------------------------------------
  // LOCATION
  // ---------------------------------------------------

  const locationScore = similarity(
    newItem.location,
    existingItem.location
  );

  // ---------------------------------------------------
  // FINAL SCORE
  // ---------------------------------------------------

  const finalScore =
    titleScore * 0.45 +
    descScore * 0.30 +
    categoryScore * 0.15 +
    locationScore * 0.10;

  const score = Math.round(
    finalScore * 100
  );

  return Math.min(
    Math.max(score, 0),
    100
  );
}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  similarity,
  calculateMatch,
};