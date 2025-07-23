const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    date: { type: String, required: true }, // ISO or yyyy-mm-dd
    time: { type: String, required: true }, // HH:mm
    venue: { type: String, required: true },
    category: { type: String, required: true },
    totalSeats: { type: Number, required: true },
    imageUrl: { type: String }, // optional
    // Ticket pricing fields
    ticketPrice: {
      type: Number,
      required: true,
      min: [0, "Ticket price cannot be negative"],
      default: 0,
    },
    dynamicPricing: {
      enabled: { type: Boolean, default: false },
      rules: [
        {
          threshold: { type: Number, required: true }, // seats remaining threshold
          percentage: { type: Number, required: true }, // price increase percentage
          description: { type: String },
        },
      ],
    },
    soldTickets: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    createdBy: {
      // linkage to User
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Virtual for available seats
eventSchema.virtual("availableSeats").get(function () {
  return this.totalSeats - this.soldTickets;
});

// Virtual for current ticket price based on dynamic pricing
eventSchema.virtual("currentTicketPrice").get(function () {
  if (!this.dynamicPricing.enabled) {
    return this.ticketPrice;
  }

  const availableSeats = this.availableSeats;
  let currentPrice = this.ticketPrice;

  // Apply dynamic pricing rules in order
  for (const rule of this.dynamicPricing.rules) {
    if (availableSeats <= rule.threshold) {
      currentPrice = currentPrice * (1 + rule.percentage / 100);
    }
  }

  return Math.round(currentPrice * 100) / 100; // Round to 2 decimal places
});

// Method to calculate revenue
eventSchema.methods.calculateRevenue = function () {
  return this.soldTickets * this.ticketPrice;
};

// Method to update revenue
eventSchema.methods.updateRevenue = function () {
  this.revenue = this.calculateRevenue();
  return this.save();
};

module.exports = mongoose.model("Event", eventSchema);
