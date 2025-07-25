require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const compression = require("compression");
const client = require("prom-client"); // Prometheus client

const app = express();
const PORT = process.env.PORT || 8080;

// MongoDB Connection
mongoose
    .connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/eventspark-dev",
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    )
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));

// ─────────── Prometheus Setup ─────────── //
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestErrors = new client.Counter({
    name: 'http_request_errors_total',
    help: 'Total HTTP request errors',
    labelNames: ['method', 'route', 'code']
});
register.registerMetric(httpRequestErrors);

const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 2, 5] // buckets in seconds
});
register.registerMetric(httpRequestDurationMicroseconds);

// Track request durations for each route
app.use((req, res, next) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
        end({ method: req.method, route: req.route?.path || req.path, code: res.statusCode });
    });
    next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// ─────────── Security Headers ─────────── //
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://apis.google.com",
                    "https://cdn.jsdelivr.net"
                ],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://fonts.googleapis.com",
                    "https://cdn.jsdelivr.net"
                ],
                imgSrc: ["'self'", "data:", "https://*.googleusercontent.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                connectSrc: ["'self'", "https://*.googleapis.com"],
                objectSrc: ["'none'"],
                frameSrc: ["'self'", "https://accounts.google.com"],
                frameAncestors: ["'none'"],
                formAction: ["'self'"],
                upgradeInsecureRequests: []
            }
        },
        frameguard: { action: "deny" },
        hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
        xssFilter: true,
        noSniff: true,
        referrerPolicy: { policy: "strict-origin-when-cross-origin" }
    })
);

// Additional security headers
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=()");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    next();
});

// ─────────── Logging and Compression ─────────── //
app.use(morgan("combined"));

app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression'] ||
            req.path.includes('/api/auth') ||
            req.path.includes('/api/bookings')) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

app.use(express.json());

// ─────────── CORS Configuration ─────────── //
const allowedProd = [
    "https://event-spark-self.vercel.app",
    "https://event-spark-prod.vercel.app",
    "https://advwebassignment3.netlify.app"
];

app.use(
    cors({
        origin: (origin, cb) => {
            if (!origin) return cb(null, true);
            if (origin.startsWith("http://localhost")) return cb(null, true);
            return allowedProd.includes(origin)
                ? cb(null, true)
                : cb(new Error(`CORS blocked for origin: ${origin}`));
        },
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        exposedHeaders: ["Content-Length", "X-Request-ID"],
        maxAge: 86400,
        credentials: true,
        preflightContinue: false,
        optionsSuccessStatus: 204
    })
);

// ─────────── Routes ─────────── //
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/healthRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));

// ─────────── Error Handling ─────────── //
app.use((err, req, res, next) => {
    console.error(err.stack);
    httpRequestErrors.inc({
        method: req.method,
        route: req.originalUrl || req.path,
        code: res.statusCode
    });
    res.status(500).json({
        success: false,
        message: "An error occurred",
    });
});

app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: "Endpoint not found",
    });
});

app.listen(PORT, () => {
    console.log(`EventSpark Auth Backend is running on port ${PORT}!`);
});

module.exports = app;
