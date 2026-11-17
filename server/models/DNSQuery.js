const mongoose = require("mongoose");

const dnsQuerySchema = new mongoose.Schema(
  {
    domain: {
      type: String,
      required: true,
      trim: true
    },
    isValid: {
      type: Boolean,
      required: true
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "INVALID"],
      required: true
    },
    records: {
      type: Array,
      default: []
    },
    message: {
      type: String,
      default: ""
    },
    alert: {
      type: Boolean,
      default: false
    },
    note: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DNSQuery", dnsQuerySchema);