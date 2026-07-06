import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { supabase, mapToDbOrder, mapToSubmission } from "./supabase.js";

const app = express();
const PORT = 3000;

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
      return JSON.parse(raw);
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

// Middleware to verify Supabase JWT token and restrict email
async function authenticateAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.substring(7); // Remove "Bearer "

  // Fallback support if Supabase keys aren't set up on the server
  if (!supabase) {
    if (token === "binnas-admin-token-2026") {
      return next();
    }
    return res.status(401).json({ error: "Supabase service client is not configured on the backend" });
  }

  try {
    // Call Supabase Auth to verify the active JWT session and get user info
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      // Gracefully check if they used the legacy fallback token instead
      if (token === "binnas-admin-token-2026") {
        return next();
      }
      return res.status(401).json({ error: "Invalid, expired, or unauthorized session token" });
    }

    // Verify user is the strictly authorized administrator email
    if (user.email !== "admin@binnaslogisticsglobal.com.ng") {
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

// Authenticate Admin
app.post("/api/auth/login", (req, res) => {
  const { password } = req.body;
  if (password === "ibuchipeter2") {
    addLog("Admin Login Successful", "Successful login via dashboard credentials");
    return res.json({ success: true, token: "binnas-admin-token-2026" });
  } else {
    addLog("Admin Login Failed", `Attempt with incorrect credentials: ${password ? "******" : "empty"}`);
    return res.status(401).json({ success: false, error: "Incorrect admin password" });
  }
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

// Manage news (Admin only)
app.post("/api/news", authenticateAdmin, (req, res) => {
  const db = getDB();
  const newsItem = req.body;

  if (!newsItem.title) {
    return res.status(400).json({ error: "News title is required" });
  }

  db.news = db.news || [];
  if (newsItem.id) {
    // Edit existing news
    db.news = db.news.map((item: any) => (item.id === newsItem.id ? { ...item, ...newsItem } : item));
    addLog("News Edited", `Updated news item: "${newsItem.title}"`);
  } else {
    // Create new news
    const newId = `news-${Date.now()}`;
    const newNews = {
      ...newsItem,
      id: newId,
      date: new Date().toISOString().split("T")[0],
    };
    db.news.unshift(newNews);
    addLog("News Published", `Created news item: "${newsItem.title}"`);
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

// Public Quote / Contact Submission
app.post("/api/submissions", async (req, res) => {
  const { fullName, companyName, email, phone, serviceNeeded, message } = req.body;

  if (!fullName || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required fields" });
  }

  const db = getDB();
  db.submissions = db.submissions || [];

  const newSubmission = {
    id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    fullName,
    companyName: companyName || "Individual",
    email,
    phone: phone || "Not Provided",
    serviceNeeded: serviceNeeded || "General Enquiry",
    message,
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

// Media Uploader: Accepts base64 image or url
app.post("/api/media/upload", authenticateAdmin, (req, res) => {
  const { name, base64, url } = req.body;

  if (url) {
    // If it's a direct external link (e.g. Unsplash), return it as a managed asset
    addLog("Media Registered", `Registered external asset URL: "${name || url}"`);
    return res.json({ success: true, url });
  }

  if (!base64 || !name) {
    return res.status(400).json({ error: "Missing file name or file content (base64)" });
  }

  try {
    // Extract base64 details
    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid base64 format" });
    }

    const buffer = Buffer.from(matches[2], "base64");
    // Clean filename
    const safeName = `${Date.now()}-${name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;
    const filePath = path.join(UPLOADS_DIR, safeName);

    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/${safeName}`;
    addLog("File Uploaded Successfully", `Saved media element as "${safeName}"`);

    return res.json({ success: true, url: relativeUrl });
  } catch (error: any) {
    console.error("Media save failed", error);
    return res.status(500).json({ error: "Failed to write upload media files locally", details: error.message });
  }
});

// Database Backup / Download (Admin only)
app.get("/api/backup/download", async (req, res) => {
  const token = req.query.token as string;
  if (!token) {
    return res.status(401).send("Unauthorized: Missing backup token");
  }

  let authorized = false;
  if (token === "binnas-admin-token-2026") {
    authorized = true;
  } else if (supabase) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && user.email === "admin@binnaslogisticsglobal.com.ng") {
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

// Database Restore / Upload (Admin only)
app.post("/api/backup/restore", authenticateAdmin, (req, res) => {
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

// Reset Database to Default (Admin only)
app.post("/api/backup/reset", authenticateAdmin, (req, res) => {
  try {
    // Delete local DB and reload
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }
    // Reseed on next load or right here
    const freshData = getDB(); 
    addLog("Database Reset to Factory Defaults", "System database wiped and re-seeded");
    return res.json({ success: true, message: "System content reset to factory defaults" });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to reset database", details: error.message });
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
