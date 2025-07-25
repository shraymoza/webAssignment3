const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seatNumber: {
      type: String,
      required: true,
    },
    ticketPrice: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },
    qrCode: {
      type: String,
      required: true,
      unique: true,
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "refunded"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Add indexes for optimization
bookingSchema.index({ eventId: 1 });
bookingSchema.index({ userId: 1 });

// Generate QR code
bookingSchema.methods.generateQRCode = function () {
  const bookingData = {
    bookingId: this._id,
    eventId: this.eventId,
    userId: this.userId,
    seatNumber: this.seatNumber,
  };
  this.qrCode = Buffer.from(JSON.stringify(bookingData)).toString("base64");
  return this.qrCode;
};

// Pre-save middleware to generate QR code if not exists
bookingSchema.pre("save", function (next) {
  if (!this.qrCode) {
    this.generateQRCode();
  }
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
