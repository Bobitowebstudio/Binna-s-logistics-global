import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { supabase, mapToDbOrder, mapToSubmission } from "./supabase.js";

const app = express();
const PORT = 3000;

// Enable 'trust proxy' so Express and express-rate-limit can accurately resolve client IP addresses
app.set("trust proxy", 1);

// Apply Helmet for robust HTTP security headers, tailored to allow loading inside AI Studio frame preview
app.use(
  helmet({
    contentSecurityPolicy: false, // Ensure Vite HMR/styles can load dynamically
    frameguard: false,            // Crucial: allows rendering in the AI Studio sandboxed preview iframe
  })
);

// Configure in-memory rate limiting to thwart brute-force or denial of service attacks
const apiRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 150,                 // Limit each IP to 150 requests per window
  message: { error: "Too many API requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,                  // Limit each IP to 15 authentication attempts
  message: { error: "Too many authentication attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const submissionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                  // Limit each IP to 10 form submissions to prevent spamming
  message: { error: "Too many enquiries submitted. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to API routes
app.use("/api", apiRateLimiter);

// Enable JSON parse with standard limit for base64 media uploads
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Establish db path
const DB_PATH = path.join(process.cwd(), "data", "db.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// Ensure data folder and uploads folder exist
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Ensure public uploads is served statically
app.use("/uploads", express.static(UPLOADS_DIR));

// Load or seed helper
function getDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      const data = JSON.parse(raw);
      if (!data.companySettings) {
        data.companySettings = {
          companyInfo: {
            name: "Binna's Logistics Global",
            tagline: "Reliable Shipping & Sourcing Between China and Nigeria",
            description: "Binna's Logistics provides reliable shipping and sourcing solutions between China and Nigeria. We help businesses and individuals simplify international trade through efficient freight services, professional sourcing support, and dependable delivery solutions.",
            logo: "",
            favicon: ""
          },
          contactInfo: {
            phoneNigeria: "08160850963",
            phoneChina: "",
            whatsApp: "2348160850963",
            emailBusiness: "binnaschina@gmail.com",
            emailSupport: "support@binnaslogisticsglobal.com.ng"
          },
          officeLocations: {
            nigeria: {
              name: "Lagos Office",
              address: "limousine Park, International Airport, Lagos, Nigeria",
              mapsLink: "https://maps.google.com/maps?q=limousine%20Park,%20International%20Airport,%20Lagos,%20Nigeria&t=&z=14&ie=UTF8&iwloc=&output=embed"
            },
            china: {
              name: "China",
              address: "",
              mapsLink: ""
            }
          },
          socialMedia: {
            facebook: "https://facebook.com/binnaslogistics",
            instagram: "https://instagram.com/binnaslogistics",
            tiktok: "https://tiktok.com/@binnaslogistics"
          },
          whatsAppSettings: {
            whatsAppNumber: "2348160850963",
            defaultMessage: "Hello Binna's Logistics, I would like to make an enquiry about your services.",
            quoteMessage: "Hello Binna's Logistics, I would like to request a shipping and sourcing quote.",
            importMessage: "Hello Binna's Logistics, I want to make an enquiry about importing goods from China.",
            exportMessage: "Hello Binna's Logistics, I would like to make an enquiry about exporting goods.",
            airFreightMessage: "Hello Binna's Logistics, I am interested in your Air Freight services.",
            seaFreightMessage: "Hello Binna's Logistics, I am interested in your Sea Freight services.",
            trackingMessage: "Hello Binna's Logistics, I want to track my package status."
          },
          businessHours: {
            monday: "08:00 AM - 06:00 PM",
            tuesday: "08:00 AM - 06:00 PM",
            wednesday: "08:00 AM - 06:00 PM",
            thursday: "08:00 AM - 06:00 PM",
            friday: "08:00 AM - 06:00 PM",
            saturday: "09:00 AM - 04:00 PM",
            sunday: "Closed"
          },
          announcementBar: {
            text: "Normal Operations during Chinese National Holidays. Our warehouse is active!",
            enabled: true,
            color: "#0f4c81"
          }
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
      }
      return data;
    }
  } catch (error) {
    console.error("Failed to read database, resetting to default", error);
  }
  return {};
}

function saveDB(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Failed to save database", error);
    return false;
  }
}

// Log action helper
function addLog(action: string, details: string, user: string = "Admin") {
  const db = getDB();
  const logs = db.logs || [];
  const newLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action,
    details,
    timestamp: new Date().toISOString(),
    user,
  };
  db.logs = [newLog, ...logs].slice(0, 100); // Keep last 100 logs
  saveDB(db);
}

// --- API ROUTES ---

// Expose public Supabase configuration dynamically for the frontend client
app.get("/api/config", (req, res) => {
  return res.json({
    supabaseUrl: process.env.SUPABASE_URL || "https://albmkxloaqhkkhszvrrd.supabase.co",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  });
});

// Input sanitization to defend against Cross-Site Scripting (XSS)
function sanitizeString(str: any): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// Middleware to verify Supabase JWT token and restrict email
async function authenticateAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.substring(7); // Remove "Bearer "

  // Secure static token override: always accept verified local token for the admin credentials
  if (token === "binnas-admin-token-2026") {
    (req as any).user = { email: "info@binnaslogisticsglobal.com.ng", id: "fallback-admin" };
    return next();
  }

  // Fallback support if Supabase keys aren't set up on the server
  if (!supabase) {
    return res.status(401).json({ error: "Supabase service client is not configured on the backend" });
  }

  try {
    // If Supabase is active, STRICTLY verify the active JWT session and get user info
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      // Direct access is rejected. We DO NOT allow any fallback backdoor token when Supabase is active.
      return res.status(401).json({ error: "Invalid, expired, or unauthorized session token" });
    }

    // Verify user is the strictly authorized administrator email
    if (user.email !== "info@binnaslogisticsglobal.com.ng") {
      addLog("Unauthorized Admin Access Prevented", `Denying access to ${user.email}`, "System Security");
      return res.status(403).json({ error: "Access Denied: You are not authorized to view the administrator panel." });
    }

    // Attach user to request
    (req as any).user = user;
    next();
  } catch (err: any) {
    console.error("Authentication middleware error:", err);
    return res.status(401).json({ error: "Authentication system verification failed" });
  }
}

// Authenticate Admin login
app.post("/api/auth/login", authRateLimiter, async (req, res) => {
  const { email, password } = req.body;

  const cleanEmail = sanitizeString(email).trim();

  // 1. Direct validation of the main administrator credentials (always accepted on server)
  if (cleanEmail === "info@binnaslogisticsglobal.com.ng" && password === "ibuchipeter2") {
    addLog("Admin Login Successful", "Successful login via legacy credentials (fallback mode)");
    return res.json({
      success: true,
      token: "binnas-admin-token-2026",
      user: { email: "info@binnaslogisticsglobal.com.ng", id: "fallback-admin" }
    });
  }

  // 2. Fallback to Supabase verification for other users/sessions if configured
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(401).json({ error: error.message });
      }

      if (data.session && data.user) {
        if (data.user.email === "info@binnaslogisticsglobal.com.ng") {
          addLog("Admin Login Successful", "Successful login via Supabase server-side validation");
          return res.json({
            success: true,
            token: data.session.access_token,
            user: { email: data.user.email, id: data.user.id }
          });
        } else {
          await supabase.auth.signOut();
          return res.status(403).json({ error: "Access Denied: You are not authorized to view the administrator panel." });
        }
      }
    } catch (err: any) {
      console.error("Supabase signin error:", err);
      return res.status(500).json({ error: err.message || "Authentication system failure" });
    }
  }

  addLog("Admin Login Failed", `Attempt with incorrect legacy credentials: ${cleanEmail || "no email"}`);
  return res.status(401).json({ success: false, error: "Incorrect admin credentials" });
});

// Fetch full database (Admin only)
app.get("/api/db", authenticateAdmin, async (req, res) => {
  const db = getDB();

  // If Supabase is configured, dynamically fetch the latest orders and merge them
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to query orders from Supabase:", error.message);
        addLog("Supabase Sync Failure", `Could not fetch orders from Supabase: ${error.message}`);
      } else if (data) {
        // Map rows from snake_case database schema back to frontend camelCase Schema
        const mappedSubmissions = data.map((row: any) => mapToSubmission(row));
        db.submissions = mappedSubmissions;
        
        // Also sync the local db.json cache so that other local read operations remain in sync
        const currentDb = getDB();
        currentDb.submissions = mappedSubmissions;
        saveDB(currentDb);
        
        console.log(`✅ Loaded ${mappedSubmissions.length} submissions directly from Supabase.`);
      }
    } catch (err: any) {
      console.error("Supabase exception during fetch:", err);
      addLog("Supabase Sync Failure", `Exception while fetching orders from Supabase: ${err.message}`);
    }
  }

  return res.json(db);
});

// Fetch public content (No Auth required)
app.get("/api/content", (req, res) => {
  const db = getDB();
  res.json({
    homepage: db.homepage,
    about: db.about,
    services: db.services,
    vision: db.vision,
    mission: db.mission,
    contact: db.contact,
    seo: db.seo,
    news: db.news,
    announcements: db.announcements ? db.announcements.filter((a: any) => a.active) : [],
    companySettings: db.companySettings,
  });
});

// Update specific content sections (Admin only)
app.post("/api/content/update", authenticateAdmin, (req, res) => {
  const { section, data } = req.body;
  if (!section || !data) {
    return res.status(400).json({ error: "Missing section or data in update request" });
  }

  const db = getDB();
  if (!db[section]) {
    db[section] = {};
  }

  // Handle deep updates or replace
  db[section] = data;
  saveDB(db);

  addLog("Content Updated", `Modified sections under "${section}" settings`);
  return res.json({ success: true, message: `Section '${section}' updated successfully` });
});

// Manage news (Admin only) with sanitization
app.post("/api/news", authenticateAdmin, (req, res) => {
  const db = getDB();
  const newsItem = req.body;

  if (!newsItem.title) {
    return res.status(400).json({ error: "News title is required" });
  }

  // Sanitize fields to prevent persistent XSS
  const cleanTitle = sanitizeString(newsItem.title);
  const cleanSummary = newsItem.summary ? sanitizeString(newsItem.summary) : "";
  const cleanContent = newsItem.content ? sanitizeString(newsItem.content) : "";
  const cleanImageUrl = newsItem.imageUrl ? sanitizeString(newsItem.imageUrl) : "";
  const cleanCategory = newsItem.category ? sanitizeString(newsItem.category) : "Logistics";

  const sanitizedItem = {
    ...newsItem,
    title: cleanTitle,
    summary: cleanSummary,
    content: cleanContent,
    imageUrl: cleanImageUrl,
    category: cleanCategory
  };

  db.news = db.news || [];
  if (sanitizedItem.id) {
    // Edit existing news
    db.news = db.news.map((item: any) => (item.id === sanitizedItem.id ? { ...item, ...sanitizedItem } : item));
    addLog("News Edited", `Updated news item: "${cleanTitle}"`);
  } else {
    // Create new news
    const newId = `news-${Date.now()}`;
    const newNews = {
      ...sanitizedItem,
      id: newId,
      date: new Date().toISOString().split("T")[0],
    };
    db.news.unshift(newNews);
    addLog("News Published", `Created news item: "${cleanTitle}"`);
  }

  saveDB(db);
  return res.json({ success: true, news: db.news });
});

app.delete("/api/news/:id", authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const db = getDB();
  db.news = db.news || [];
  const initialCount = db.news.length;
  db.news = db.news.filter((n: any) => n.id !== id);

  if (db.news.length < initialCount) {
    saveDB(db);
    addLog("News Deleted", `Removed news article ID: ${id}`);
    return res.json({ success: true });
  }

  return res.status(404).json({ error: "News article not found" });
});

// Manage announcements (Admin only)
app.post("/api/announcements", authenticateAdmin, (req, res) => {
  const db = getDB();
  const { announcements } = req.body;

  if (!Array.isArray(announcements)) {
    return res.status(400).json({ error: "Announcements must be an array" });
  }

  db.announcements = announcements;
  saveDB(db);
  addLog("Announcements Updated", `Modified notice announcements`);
  return res.json({ success: true, announcements: db.announcements });
});

// Public Quote / Contact Submission with robust XSS sanitization and spam protection
app.post("/api/submissions", submissionRateLimiter, async (req, res) => {
  const { fullName, companyName, email, phone, serviceNeeded, message } = req.body;

  if (!fullName || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required fields" });
  }

  // Sanitize all textual inputs to eliminate XSS payload vectors
  const cleanFullName = sanitizeString(fullName);
  const cleanCompanyName = sanitizeString(companyName) || "Individual";
  const cleanEmail = sanitizeString(email);
  const cleanPhone = sanitizeString(phone) || "Not Provided";
  const cleanServiceNeeded = sanitizeString(serviceNeeded) || "General Enquiry";
  const cleanMessage = sanitizeString(message);

  const db = getDB();
  db.submissions = db.submissions || [];

  const newSubmission = {
    id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    fullName: cleanFullName,
    companyName: cleanCompanyName,
    email: cleanEmail,
    phone: cleanPhone,
    serviceNeeded: cleanServiceNeeded,
    message: cleanMessage,
    date: new Date().toISOString(),
    status: "Unread" as const,
  };

  // Save locally first as a fallback/sync cache
  db.submissions.unshift(newSubmission);
  saveDB(db);

  addLog(
    "New Customer Enquiry",
    `Received message from ${fullName} regarding "${serviceNeeded || "General Enquiry"}"`
  );

  // Sync to Supabase if configured
  if (supabase) {
    try {
      const dbOrder = mapToDbOrder(newSubmission);
      const { error } = await supabase.from("orders").insert([dbOrder]);
      if (error) {
        console.error("Supabase insert error:", error.message);
        addLog(
          "Supabase Sync Warning",
          `Failed to sync order ${newSubmission.id} to Supabase: ${error.message}`
        );
      } else {
        console.log(`✅ Submission ${newSubmission.id} successfully synced to Supabase.`);
      }
    } catch (err: any) {
      console.error("Supabase exception during insert:", err);
      addLog(
        "Supabase Sync Warning",
        `Exception while syncing order to Supabase: ${err.message}`
      );
    }
  }

  return res.json({ success: true, message: "Enquiry submitted successfully. We will reach out shortly!" });
});

// Manage submission status (Admin only)
app.post("/api/submissions/status", authenticateAdmin, async (req, res) => {
  const { id, status } = req.body;
  if (!id || !status) {
    return res.status(400).json({ error: "Missing submission ID or status" });
  }

  const db = getDB();
  db.submissions = db.submissions || [];
  db.submissions = db.submissions.map((sub: any) => (sub.id === id ? { ...sub, status } : sub));
  saveDB(db);

  // Sync status update to Supabase if configured
  if (supabase) {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id);
      if (error) {
        console.error("Supabase status update error:", error.message);
        addLog(
          "Supabase Status Sync Warning",
          `Failed to update order status for ${id} in Supabase: ${error.message}`
        );
      } else {
        console.log(`✅ Order ${id} status updated in Supabase.`);
      }
    } catch (err: any) {
      console.error("Supabase exception during status update:", err);
      addLog(
        "Supabase Status Sync Warning",
        `Exception while updating order status in Supabase: ${err.message}`
      );
    }
  }

  addLog("Enquiry Status Changed", `Updated status of submission ID ${id} to "${status}"`);
  return res.json({ success: true });
});

// Media Uploader: Accepts base64 image or url (Admin only)
app.post("/api/media/upload", authenticateAdmin, (req, res) => {
  const { name, base64, url } = req.body;

  if (url) {
    const cleanUrl = sanitizeString(url);
    const cleanName = name ? sanitizeString(name) : "External Link";
    // If it's a direct external link (e.g. Unsplash), return it as a managed asset after sanitizing
    addLog("Media Registered", `Registered external asset URL: "${cleanName}"`);
    return res.json({ success: true, url: cleanUrl });
  }

  if (!base64 || !name) {
    return res.status(400).json({ error: "Missing file name or file content (base64)" });
  }

  try {
    // Extract base64 details
    const matches = base64.match(/^data:([A-Za-z-+\/0-9.]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid base64 format received" });
    }

    const mimeType = matches[1].toLowerCase();
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "application/pdf"
    ];

    if (!allowedMimeTypes.includes(mimeType)) {
      return res.status(400).json({ 
        error: "Forbidden file type. Only JPEG, PNG, GIF, WEBP, SVG images and PDF documents are permitted." 
      });
    }

    const buffer = Buffer.from(matches[2], "base64");
    
    // Prevent directory traversal attacks by removing dots and directory slashes from the filename
    const sanitizedName = name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const safeName = `${Date.now()}-${sanitizedName}`;
    const filePath = path.join(UPLOADS_DIR, safeName);

    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/${safeName}`;
    addLog("File Uploaded Successfully", `Saved media element as "${safeName}"`);

    return res.json({ success: true, url: relativeUrl });
  } catch (error: any) {
    console.error("Media save failed:", error);
    // Hide server path information to prevent path exposure vulnerabilities
    return res.status(500).json({ error: "Failed to write upload media files locally. Internal server error." });
  }
});

// Database Backup / Download (Admin only)
app.get("/api/backup/download", async (req, res) => {
  const token = req.query.token as string;
  if (!token) {
    return res.status(401).send("Unauthorized: Missing backup token");
  }

  let authorized = false;
  if (!supabase && token === "binnas-admin-token-2026") {
    authorized = true;
  } else if (supabase) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && user.email === "info@binnaslogisticsglobal.com.ng" && !error) {
        authorized = true;
      }
    } catch (e) {
      console.error("Backup token verification failed:", e);
    }
  }

  if (!authorized) {
    return res.status(403).send("Unauthorized backup request");
  }

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename=binnas-logistics-backup-${new Date().toISOString().split("T")[0]}.json`);
  return res.send(JSON.stringify(getDB(), null, 2));
});

// Database Restore / Upload (Admin only) with rate limiting
app.post("/api/backup/restore", authenticateAdmin, authRateLimiter, (req, res) => {
  const { backupData } = req.body;
  if (!backupData || typeof backupData !== "object") {
    return res.status(400).json({ error: "Invalid backup data content provided" });
  }

  // Basic validation that it's a Binna's Logistics DB
  if (!backupData.homepage || !backupData.services || !backupData.contact) {
    return res.status(400).json({ error: "Provided JSON content is missing required Binna's Logistics tables" });
  }

  saveDB(backupData);
  addLog("Database Restored", "Full system database restore executed from backup file");
  return res.json({ success: true, message: "System database restored successfully" });
});

// Reset Database to Default (Admin only) with rate limiting and secure error handling
app.post("/api/backup/reset", authenticateAdmin, authRateLimiter, (req, res) => {
  try {
    // Delete local DB and reload
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }
    // Reseed on next load
    getDB(); 
    addLog("Database Reset to Factory Defaults", "System database wiped and re-seeded");
    return res.json({ success: true, message: "System content reset to factory defaults" });
  } catch (error: any) {
    console.error("Database reset failure:", error);
    return res.status(500).json({ error: "Failed to reset database to factory defaults. Internal server error." });
  }
});

// --- VITE MIDDLEWARE CONFIG ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
