const Event = require("../models/Events");
const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");

// Configure AWS S3
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const s3 = new AWS.S3();

// Multer S3 storage
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, `events/${Date.now()}_${file.originalname}`);
    },
  }),
});

// Middleware for single image upload
exports.uploadEventImage = upload.single("image");

/* ─────────────  CREATE  ─────────────────────────────────────── */
exports.createEvent = async (req, res, next) => {
  try {
    let imageUrl = req.file ? req.file.location : "";
    const event = await Event.create({
      ...req.body,
      imageUrl,
      createdBy: req.user.id,
    });
    res.status(201).json({ success: true, data: { event } });
  } catch (err) {
    next(err);
  }
};

/* ─────────────  READ — list  ────────────────────────────────── */
exports.getEvents = async (req, res, next) => {
  try {
    const { category, search, date } = req.query;
    const q = {};
    if (category) q.category = category;
    if (date) q.date = date;
    if (search)
      q.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];

    // Role-based filtering
    if (req.user.role === "organizer") {
      q.createdBy = req.user.id;
    } else if (req.user.role === "user") {
      // Only upcoming events
      q.date = { $gt: new Date().toISOString().slice(0, 10) };
    }
    // Admin sees all events

    const events = await Event.find(q)
      .populate("createdBy", "name email _id")
      .sort({ date: 1, time: 1 });

    res.json({ success: true, data: { events } });
  } catch (err) {
    next(err);
  }
};

/* ─────────────  READ — single  ──────────────────────────────── */
exports.getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "createdBy",
      "name email _id"
    );

    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });

    res.json({ success: true, data: { event } });
  } catch (err) {
    next(err);
  }
};

/* ─────────────  UPDATE  ─────────────────────────────────────── */
exports.updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });

    if (String(event.createdBy) !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (req.file) {
      req.body.imageUrl = req.file.location;
    }
    Object.assign(event, req.body);
    await event.save();

    res.json({ success: true, data: { event } });
  } catch (err) {
    next(err);
  }
};

/* ─────────────  DELETE  ─────────────────────────────────────── */
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });

    if (String(event.createdBy) !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    await event.deleteOne();
    res.json({ success: true, message: "Event deleted" });
  } catch (err) {
    next(err);
  }
};
