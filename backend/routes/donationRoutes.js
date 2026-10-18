const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const { createDonation } = require("../controllers/donationController");

const router = express.Router();

router.post("/", protect, authorize("donor"), createDonation);

router.get("/", protect, (req, res) => {
  res.json({ message: "Donation routes placeholder - build me out!" });
});

module.exports = router;
