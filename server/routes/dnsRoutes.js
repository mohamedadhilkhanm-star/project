const express = require("express");
const dns = require("dns").promises;
const EventEmitter = require("events");

const DNSQuery = require("../models/DNSQuery");
const validateDomain = require("../utils/validator");

const router = express.Router();

const queryEvents = new EventEmitter();
const failedAttempts = new Map();

queryEvents.on("repeatedFailure", (domain) => {
  console.log(`SECURITY ALERT: Repeated DNS failures for ${domain}`);
});

const recordTypes = [
  "A",
  "AAAA",
  "MX",
  "NS",
  "CNAME",
  "TXT"
];

// Analyze domain
router.post("/analyze", async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain || typeof domain !== "string") {
      return res.status(400).json({
        success: false,
        message: "Please enter a domain name"
      });
    }

    const cleanDomain = domain.trim().toLowerCase();

    const isValid = validateDomain(cleanDomain);

    if (!isValid) {
      const result = await DNSQuery.create({
        domain: cleanDomain,
        isValid: false,
        status: "INVALID",
        message: "Invalid domain format"
      });

      return res.json({
        success: true,
        data: result
      });
    }

    const records = [];

    const results = await Promise.allSettled(
      recordTypes.map(async (type) => {
        const values = await dns.resolve(
          cleanDomain,
          type
        );

        return {
          type,
          values
        };
      })
    );

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        records.push(result.value);
      }
    });

    let status = records.length > 0 ? "SUCCESS" : "FAILED";
    let message =
      status === "SUCCESS"
        ? "DNS lookup successful"
        : "No DNS records found";

    let alert = false;

    if (status === "FAILED") {
      const count =
        (failedAttempts.get(cleanDomain) || 0) + 1;

      failedAttempts.set(cleanDomain, count);

      if (count >= 3) {
        alert = true;

        if (count === 3) {
          queryEvents.emit("repeatedFailure", cleanDomain);
        }

        message = "Repeated DNS lookup failures detected";
      }
    } else {
      failedAttempts.delete(cleanDomain);
    }

    const result = await DNSQuery.create({
      domain: cleanDomain,
      isValid: true,
      status,
      records,
      message,
      alert
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all query history
router.get("/history", async (req, res) => {
  try {
    const history = await DNSQuery.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Dashboard statistics
router.get("/stats", async (req, res) => {
  try {
    const total = await DNSQuery.countDocuments();
    const successful = await DNSQuery.countDocuments({
      status: "SUCCESS"
    });
    const failed = await DNSQuery.countDocuments({
      status: "FAILED"
    });
    const invalid = await DNSQuery.countDocuments({
      status: "INVALID"
    });
    const alerts = await DNSQuery.countDocuments({
      alert: true
    });

    res.json({
      success: true,
      data: {
        total,
        successful,
        failed,
        invalid,
        alerts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update query note
router.patch("/:id", async (req, res) => {
  try {
    const { note } = req.body;

    const updated = await DNSQuery.findByIdAndUpdate(
      req.params.id,
      { note },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Query not found"
      });
    }

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete query
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await DNSQuery.findByIdAndDelete(
      req.params.id
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Query not found"
      });
    }

    res.json({
      success: true,
      message: "Query deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;