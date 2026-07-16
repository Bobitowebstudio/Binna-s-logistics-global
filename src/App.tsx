import React, { useState, useEffect } from "react";
import {
  Plane,
  Ship,
  Search,
  FileText,
  CreditCard,
  PackageOpen,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit,
  Upload,
  Download,
  RefreshCw,
  AlertTriangle,
  LogOut,
  Eye,
  EyeOff,
  User,
  Settings,
  Database,
  Newspaper,
  Megaphone,
  MessageSquare,
  TrendingUp,
  Users,
  Globe,
  Lock,
  ChevronDown,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Check,
  Send,
  Loader2,
  Bell,
  Printer,
  X
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import Header from "./components/Header";
import Footer from "./components/Footer";
import SubpageHeroSlider from "./components/SubpageHeroSlider";
import ProtectedRoute from "./components/ProtectedRoute";
import { WebsiteDatabase, Submission, NewsItem, Announcement, ServiceCard } from "./types";

const WHATSAPP_TEMPLATES = [
  {
    id: "shipping_quote",
    name: "Shipping Quote Request",
    text: `Hello {customer_name},

Thank you for contacting Binna's Logistics Global.

We received your inquiry regarding {service}.

Kindly provide:
• Product description
• Weight
• Quantity
• Pickup location in China

After receiving these details, we will send you an accurate quotation.

Regards,
Binna's Logistics Global`
  },
  {
    id: "payment_request",
    name: "Payment Request",
    text: `Hello {customer_name},

Your quotation has been prepared.

Kindly make payment using the invoice provided.

Once payment is confirmed, your shipment will be processed immediately.

Thank you.`
  },
  {
    id: "shipment_update",
    name: "Shipment Update",
    text: `Hello {customer_name},

Your shipment is currently in transit.

We will continue to provide updates until delivery.

Thank you for choosing Binna's Logistics Global.`
  },
  {
    id: "shipment_arrived",
    name: "Shipment Arrived",
    text: `Hello {customer_name},

Great news!

Your shipment has arrived safely in Lagos.

Please contact us to arrange pickup or delivery.

Thank you.`
  },
  {
    id: "delivery_completed",
    name: "Delivery Completed",
    text: `Hello {customer_name},

Your shipment has been delivered successfully.

Thank you for choosing Binna's Logistics Global.

We look forward to serving you again.`
  },
  {
    id: "custom",
    name: "Custom Message (Manual Typing)",
    text: ""
  }
];

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [db, setDb] = useState<WebsiteDatabase | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Home Hero Slider State
  const [activeSlide, setActiveSlide] = useState<number>(0);

  // Admin Authentication & Session
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem("binnas_admin_token") || sessionStorage.getItem("binnas_admin_token");
  });
  const [adminUser, setAdminUser] = useState<any>(() => {
    const token = localStorage.getItem("binnas_admin_token") || sessionStorage.getItem("binnas_admin_token");
    if (token) {
      return { email: "info@binnaslogisticsglobal.com.ng", id: "admin-user" };
    }
    return null;
  });
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [adminLoggingIn, setAdminLoggingIn] = useState<boolean>(false);

  // Supabase dynamic client & session state
  const [supabase, setSupabase] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Admin Dashboard Tabs: 'overview', 'content', 'services', 'news', 'announcements', 'enquiries', 'media', 'seo', 'backup'
  const [adminTab, setAdminTab] = useState<string>("overview");

  // Customer WhatsApp Communication Modal State
  const [activeInquiryForWhatsApp, setActiveInquiryForWhatsApp] = useState<Submission | null>(null);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState<boolean>(false);
  const [selectedWhatsAppTemplate, setSelectedWhatsAppTemplate] = useState<string>("shipping_quote");
  const [whatsAppMessageText, setWhatsAppMessageText] = useState<string>("");
  const [activeInquiryTab, setActiveInquiryTab] = useState<Record<string, "details" | "history">>({});

  // Public Contact / Quote Form State
  const [contactForm, setContactForm] = useState({
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    serviceNeeded: "Product Sourcing",
    message: "",
  });
  const [contactSubmitting, setContactSubmitting] = useState<boolean>(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);

  // Toast State
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "error" | "info" }[]>([]);

  // Active Map Selection
  const [activeMap, setActiveMap] = useState<"lagos" | "abuja">("lagos");

  // Selected Service detail modal state
  const [selectedService, setSelectedService] = useState<ServiceCard | null>(null);

  // Sourcing Quick Calculator Tool state on Home
  const [calcCargoType, setCalcCargoType] = useState<string>("air");
  const [calcWeight, setCalcWeight] = useState<string>("10");
  const [calcResult, setCalcResult] = useState<{ cost: number; days: string } | null>({ cost: 85, days: "2 - 3 Days" });

  // Invoice/Receipt Generator Modal State
  const [activeInquiryForInvoice, setActiveInquiryForInvoice] = useState<Submission | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<{ description: string; quantity: number; unitPrice: number }[]>([
    { description: "Air Freight Shipping (Cargo)", quantity: 1, unitPrice: 450 },
    { description: "Customs Clearance & Documentation", quantity: 1, unitPrice: 120 },
  ]);
  const [invoiceId, setInvoiceId] = useState<string>("INV-2026-001");
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [invoiceDueDate, setInvoiceDueDate] = useState<string>(new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().substring(0, 10));
  const [invoiceCurrency, setInvoiceCurrency] = useState<string>("USD");
  const [showInvoiceEmailView, setShowInvoiceEmailView] = useState<boolean>(false);

  // --- Admin Editing Forms State ---
  const [editHomepage, setEditHomepage] = useState<any>(null);
  const [editAbout, setEditAbout] = useState<any>(null);
  const [editVision, setEditVision] = useState<any>(null);
  const [editMission, setEditMission] = useState<any>(null);
  const [editContact, setEditContact] = useState<any>(null);
  const [editSeo, setEditSeo] = useState<any>(null);
  const [editCompanySettings, setEditCompanySettings] = useState<any>(null);

  // Edit single news state
  const [editingNews, setEditingNews] = useState<Partial<NewsItem> | null>(null);
  // Edit announcement lists
  const [editingAnnouncements, setEditingAnnouncements] = useState<Announcement[]>([]);
  // Media manager state
  const [mediaUploadName, setMediaUploadName] = useState<string>("");
  const [mediaUploadBase64, setMediaUploadBase64] = useState<string>("");
  const [mediaUploadUrl, setMediaUploadUrl] = useState<string>("");
  const [mediaUploading, setMediaUploading] = useState<boolean>(false);

  // Preset media options to select quickly for slider backgrounds or news
  const presetImages = [
    { name: "Container Port Cargo", url: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80" },
    { name: "Warehouse Logistics", url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80" },
    { name: "Air Freight Loading", url: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1200&q=80" },
    { name: "Cargo Container Ship", url: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1200&q=80" },
    { name: "Guangzhou Wholesalers Hub", url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80" },
    { name: "Corporate Trade Handshake", url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80" }
  ];

  // Load public Supabase config & initialize Client-side Auth
  useEffect(() => {
    let active = true;

    const initSupabase = async () => {
      try {
        const res = await fetch("/api/config");
        if (!res.ok) throw new Error("Failed to load configuration");
        const config = await res.json();
        
        if (!active) return;

        if (config.supabaseUrl && config.supabaseAnonKey) {
          const client = createClient(config.supabaseUrl, config.supabaseAnonKey);
          setSupabase(client);
        }
      } catch (err) {
        console.error("Supabase dynamic initialization failed:", err);
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    };

    initSupabase();

    return () => {
      active = false;
    };
  }, []);

  // Protect Admin dashboard routes and manage direct URL navigation
  useEffect(() => {
    const handleNavigationCheck = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash.replace("#", "");

      // Normalize check: Admin login page is active if pathname is /admin/login OR hash is admin/login or admin-login
      if (pathname === "/admin/login" || pathname === "/admin/login/" || hash === "admin/login" || hash === "admin-login") {
        if (authLoading) return; // Wait for session load
        if (!adminToken || !adminUser) {
          setCurrentTab("admin-login");
          if (window.location.hash !== "#admin/login") {
            window.location.hash = "admin/login";
          }
        } else {
          setCurrentTab("admin");
          if (window.location.hash !== "#admin") {
            window.location.hash = "admin";
          }
        }
      } else {
        // Pathname/hash is not /admin/login
        if (hash === "admin") {
          if (authLoading) return;
          if (!adminToken || !adminUser) {
            setCurrentTab("admin-login");
            window.location.hash = "admin/login";
          } else {
            setCurrentTab("admin");
          }
        } else if (hash && ["home", "about", "services", "vision", "mission", "contact"].includes(hash)) {
          setCurrentTab(hash);
        } else {
          setCurrentTab("home");
        }
      }
    };

    handleNavigationCheck();
    window.addEventListener("hashchange", handleNavigationCheck);
    window.addEventListener("popstate", handleNavigationCheck);
    return () => {
      window.removeEventListener("hashchange", handleNavigationCheck);
      window.removeEventListener("popstate", handleNavigationCheck);
    };
  }, [adminToken, adminUser, authLoading]);

  // Fetch DB function
  const fetchDB = async () => {
    try {
      setLoading(true);
      // Fetch public content first
      const res = await fetch("/api/content");
      if (!res.ok) throw new Error("Failed to load website content from database.");
      const data = await res.json();
      setDb(data);

      // If admin is authorized, fetch full backend db
      if (adminToken) {
        await fetchAdminData();
      }
      setError(null);
    } catch (e: any) {
      setError(e.message || "An error occurred while communicating with the logistics database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDB();
  }, [adminToken]);

  useEffect(() => {
    if (db?.companySettings && !editCompanySettings) {
      setEditCompanySettings(JSON.parse(JSON.stringify(db.companySettings)));
    }
  }, [db?.companySettings, editCompanySettings]);

  const fetchAdminData = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch("/api/db", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (res.status === 401 || res.status === 403) {
        // Token expired or invalid
        handleLogout();
        return;
      }
      const fullDb = await res.json();
      // Merge logs & submissions to our local state
      setDb((prev: any) => ({ ...prev, ...fullDb }));
      
      // Seed admin edit forms
      if (fullDb.homepage) setEditHomepage(JSON.parse(JSON.stringify(fullDb.homepage)));
      if (fullDb.about) setEditAbout(JSON.parse(JSON.stringify(fullDb.about)));
      if (fullDb.vision) setEditVision(JSON.parse(JSON.stringify(fullDb.vision)));
      if (fullDb.mission) setEditMission(JSON.parse(JSON.stringify(fullDb.mission)));
      if (fullDb.contact) setEditContact(JSON.parse(JSON.stringify(fullDb.contact)));
      if (fullDb.seo) setEditSeo(JSON.parse(JSON.stringify(fullDb.seo)));
      if (fullDb.companySettings) setEditCompanySettings(JSON.parse(JSON.stringify(fullDb.companySettings)));
      if (fullDb.announcements) setEditingAnnouncements(JSON.parse(JSON.stringify(fullDb.announcements)));
    } catch (e) {
      console.error("Failed to load full admin data context", e);
    }
  };

  // Toast helper
  const addToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Auto-play hero slider
  useEffect(() => {
    if (currentTab !== "home" || !db?.homepage?.slides) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % db.homepage.slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [currentTab, db?.homepage?.slides?.length]);

  // Handle Admin Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoggingIn(true);
    setAdminLoginError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Incorrect admin credentials");
      }

      if (data.success && data.token) {
        if (rememberMe) {
          localStorage.setItem("binnas_admin_token", data.token);
          localStorage.removeItem("binnas_admin_token_session");
        } else {
          sessionStorage.setItem("binnas_admin_token", data.token);
          localStorage.removeItem("binnas_admin_token");
        }
        setAdminToken(data.token);
        setAdminUser(data.user);
        setAdminPassword("");
        setAdminEmail("");
        addToast("Secure administrator session successfully verified.", "success");
        setCurrentTab("admin");
        window.location.hash = "admin";
      } else {
        throw new Error("Authentication failed");
      }
    } catch (err: any) {
      setAdminLoginError(err.message || "An error occurred during authentication.");
      addToast(err.message || "An error occurred during authentication.", "error");
    } finally {
      setAdminLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("binnas_admin_token");
    sessionStorage.removeItem("binnas_admin_token");
    setAdminToken(null);
    setAdminUser(null);
    addToast("Logged out of Admin Portal", "info");
    setCurrentTab("admin-login");
    window.location.hash = "admin/login";
  };

  // Sourcing cargo cost tool calculation
  useEffect(() => {
    const w = parseFloat(calcWeight);
    if (isNaN(w) || w <= 0) {
      setCalcResult(null);
      return;
    }
    if (calcCargoType === "air") {
      // e.g. Air freight rate is $8.50 per kg
      setCalcResult({
        cost: Math.round(w * 8.5 * 100) / 100,
        days: "2 - 3 Days"
      });
    } else {
      // e.g. Sea cargo groupage per kg is $2.80
      setCalcResult({
        cost: Math.round(w * 2.8 * 100) / 100,
        days: "35 - 45 Days (Guangzhou to Lagos)"
      });
    }
  }, [calcCargoType, calcWeight]);

  // Submit contact enquiry
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    setContactSuccess(null);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      const data = await res.json();
      if (res.ok) {
        setContactSuccess(data.message || "Enquiry saved! Opening your email client to deliver to binnaschina@gmail.com...");
        addToast("Enquiry recorded. Opening email client...", "success");

        // Formulate a clean email subject and body for binnaschina@gmail.com
        const subject = encodeURIComponent(`Binna's Logistics Website Enquiry: ${contactForm.serviceNeeded}`);
        const body = encodeURIComponent(
          `Hello Binna's Logistics,\n\n` +
          `A new customer inquiry has been submitted from the website:\n\n` +
          `----------------------------------------\n` +
          `Full Name: ${contactForm.fullName}\n` +
          `Company: ${contactForm.companyName || "N/A"}\n` +
          `Email: ${contactForm.email}\n` +
          `Phone: ${contactForm.phone || "N/A"}\n` +
          `Service Required: ${contactForm.serviceNeeded}\n` +
          `----------------------------------------\n\n` +
          `Message:\n${contactForm.message}\n\n` +
          `Best regards,\n` +
          `${contactForm.fullName}`
        );

        // Direct mailto link trigger
        window.location.href = `mailto:binnaschina@gmail.com?subject=${subject}&body=${body}`;

        // Reset form but retain some info if they want to submit more
        setContactForm({
          fullName: "",
          companyName: "",
          email: "",
          phone: "",
          serviceNeeded: contactForm.serviceNeeded,
          message: "",
        });
      } else {
        addToast(data.error || "Submission failed", "error");
      }
    } catch (err) {
      addToast("Network failure. Please try again.", "error");
    } finally {
      setContactSubmitting(false);
    }
  };

  // Admin Change Inquiry Status
  const handleUpdateInquiryStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/submissions/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        addToast(`Enquiry status updated to ${status}`, "success");
        fetchAdminData();
      } else {
        addToast("Failed to update status", "error");
      }
    } catch (err) {
      addToast("Failed to connect to server", "error");
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedWhatsAppTemplate(templateId);
    const found = WHATSAPP_TEMPLATES.find((t) => t.id === templateId);
    if (found) {
      if (templateId === "custom") {
        setWhatsAppMessageText("");
      } else {
        const sub = activeInquiryForWhatsApp;
        if (sub) {
          const text = found.text
            .replace(/{customer_name}/g, sub.fullName)
            .replace(/{service}/g, sub.serviceNeeded || "General Enquiry");
          setWhatsAppMessageText(text);
        }
      }
    }
  };

  const handleSendWhatsApp = async () => {
    if (!activeInquiryForWhatsApp) return;
    if (!whatsAppMessageText.trim()) {
      addToast("Please enter a message to send", "error");
      return;
    }

    try {
      // 1. Save the conversation in DB / Supabase
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          customer_name: activeInquiryForWhatsApp.fullName,
          phone: activeInquiryForWhatsApp.phone || "Not Provided",
          service: activeInquiryForWhatsApp.serviceNeeded || "General Enquiry",
          message: whatsAppMessageText,
          direction: "Outgoing",
        }),
      });

      if (!res.ok) {
        console.warn("Could not save conversation history, continuing with WhatsApp dispatch");
      }

      // 2. Automatically update inquiry status from "Unread" to "Replied" (unless admin changes it manually)
      if (activeInquiryForWhatsApp.status === "Unread") {
        await fetch("/api/submissions/status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ id: activeInquiryForWhatsApp.id, status: "Replied" }),
        });
      }

      addToast("WhatsApp message logged successfully", "success");
      
      // Refresh admin data to reload conversations history and updated status
      fetchAdminData();

      // Clean/prepare phone number for WhatsApp Link
      let cleanedPhone = activeInquiryForWhatsApp.phone || "";
      cleanedPhone = cleanedPhone.replace(/\D/g, "");
      if (cleanedPhone.startsWith("0") && !cleanedPhone.startsWith("234")) {
        cleanedPhone = "234" + cleanedPhone.substring(1);
      }

      // Close modal
      setWhatsAppModalOpen(false);
      setActiveInquiryForWhatsApp(null);

      // Open WhatsApp
      const url = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(whatsAppMessageText)}`;
      window.open(url, "_blank");
    } catch (err) {
      console.error("Error dispatching WhatsApp communication:", err);
      addToast("An error occurred. Opening WhatsApp anyway.", "error");

      // Attempt fallback direct open
      let cleanedPhone = activeInquiryForWhatsApp.phone || "";
      cleanedPhone = cleanedPhone.replace(/\D/g, "");
      if (cleanedPhone.startsWith("0") && !cleanedPhone.startsWith("234")) {
        cleanedPhone = "234" + cleanedPhone.substring(1);
      }
      const url = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(whatsAppMessageText)}`;
      window.open(url, "_blank");
    }
  };

  // Save specific section content via API
  const handleSaveSection = async (section: string, data: any) => {
    try {
      const res = await fetch("/api/content/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ section, data }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        addToast(`Section '${section}' saved successfully!`, "success");
        fetchDB(); // reload
      } else {
        addToast(result.error || "Update failed", "error");
      }
    } catch (err) {
      addToast("Network error while saving changes.", "error");
    }
  };

  // Manage News: Create or Edit
  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNews?.title || !editingNews?.content) {
      addToast("Title and content are required for articles", "error");
      return;
    }
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(editingNews),
      });
      if (res.ok) {
        addToast(editingNews.id ? "News article updated" : "News article created", "success");
        setEditingNews(null);
        fetchDB();
      } else {
        addToast("Error publishing article", "error");
      }
    } catch (err) {
      addToast("Failed to publish", "error");
    }
  };

  // Manage News: Delete
  const handleDeleteNews = async (id: string) => {
    if (!window.confirm("Are you absolutely sure you want to delete this news article?")) return;
    try {
      const res = await fetch(`/api/news/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (res.ok) {
        addToast("News article deleted", "success");
        fetchDB();
      } else {
        addToast("Error deleting article", "error");
      }
    } catch (err) {
      addToast("Server connection error", "error");
    }
  };

  // Announcements save
  const handleSaveAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ announcements: editingAnnouncements }),
      });
      if (res.ok) {
        addToast("Announcements updated successfully", "success");
        fetchDB();
      } else {
        addToast("Error updating announcements", "error");
      }
    } catch (err) {
      addToast("Server communication failed", "error");
    }
  };

  // Handle files upload (base64)
  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      addToast("File is too large. Max size allowed is 8MB.", "error");
      return;
    }
    setMediaUploadName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaUploadBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit media upload
  const handleUploadMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUploadUrl && !mediaUploadBase64) {
      addToast("Please select a file or input an external URL", "error");
      return;
    }
    setMediaUploading(true);
    try {
      const payload = mediaUploadUrl 
        ? { name: mediaUploadName || "External Asset", url: mediaUploadUrl }
        : { name: mediaUploadName, base64: mediaUploadBase64 };

      const res = await fetch("/api/media/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        addToast("Media item loaded successfully!", "success");
        // Clear forms
        setMediaUploadName("");
        setMediaUploadBase64("");
        setMediaUploadUrl("");
        // Show the link so user can copy it
        alert(`Your uploaded image is ready! Use this URL in any image field:\n\n${data.url}`);
        fetchDB();
      } else {
        addToast(data.error || "Media registration failed", "error");
      }
    } catch (err) {
      addToast("Network error uploading image", "error");
    } finally {
      setMediaUploading(false);
    }
  };

  // Database Backup Actions
  const handleTriggerRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const backupData = JSON.parse(evt.target?.result as string);
        if (!window.confirm("Warning: Restoring backup will overwrite all current website content, news, and client requests. Do you wish to proceed?")) return;
        
        const res = await fetch("/api/backup/restore", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ backupData }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          addToast("Database restored successfully!", "success");
          fetchDB();
        } else {
          addToast(data.error || "Restore process failed", "error");
        }
      } catch (err) {
        addToast("Invalid JSON file provided", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDefault = async () => {
    if (!window.confirm("Are you absolutely sure you want to reset all content, news, and logs back to factory default?")) return;
    try {
      const res = await fetch("/api/backup/reset", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast("Website content reset successfully!", "success");
        fetchDB();
      } else {
        addToast(data.error || "Reset failed", "error");
      }
    } catch (err) {
      addToast("Server connection failure", "error");
    }
  };

  if (loading && !db) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 space-y-6">
        <div className="text-center">
          <span className="text-3xl sm:text-4xl font-black tracking-tight leading-none block select-none mb-2 animate-pulse">
            <span className="text-[#0f172a]">Binna's</span>{" "}
            <span className="text-[#0f4c81]">Logistics</span>{" "}
            <span className="text-[#dc2626]">Global</span>
          </span>
          <p className="text-[10px] text-gray-400 font-extrabold tracking-widest uppercase">Connecting to Secure Infrastructure</p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-10 h-10 text-[#0f4c81] animate-spin" />
          <h3 className="text-xs font-bold text-gray-500">Establishing Database Pipeline...</h3>
        </div>
      </div>
    );
  }

  // Fallback data if DB fails to render
  const homepage = db?.homepage || {
    welcomeTitle: "Welcome to Binna's Logistics",
    welcomeText: "Your premium China-Nigeria supply chain bridge.",
    slides: [],
    whyChooseUs: { title: "Why Choose Us", subtitle: "", items: [] },
    stats: { yearsOfExperience: "8+", successfulShipments: "10k+", satisfiedClients: "4k+", countriesConnected: "China & Nigeria" },
    cta: { headline: "Ready to Move Your Cargo With Confidence?", subheadline: "", buttonText: "Request a Quote" }
  };
  const about = db?.about || { title: "About us", content: "", companyOverview: "", ourStory: "", ourValues: [], whyClientsTrustUs: "" };
  const services = db?.services || [];
  const vision = db?.vision || { title: "Our Vision", content: "", statement: "", longTermGoals: "", growthStrategy: "", commitmentToExcellence: "" };
  const mission = db?.mission || { title: "Our Mission", content: "", customerCommitment: "", serviceExcellence: "", innovation: "", reliability: "", transparency: "" };
  const contact = db?.contact || { title: "Contact us", officeAddressNigeria: "", officeAddressChina: "", phoneNigeria: "", phoneChina: "", whatsApp: "", email: "", businessHours: "" };
  const news = db?.news || [];
  const announcements = db?.announcements || [];
  const activeAnnouncements = announcements.filter((a) => a.active);
  const submissions = (db as any)?.submissions || [];
  const logs = (db as any)?.logs || [];

  // Dynamic Company Settings Extraction
  const companySettings = db?.companySettings;
  const companyName = companySettings?.companyInfo?.name || "Binna's Logistics Global";
  const phoneNigeria = companySettings?.contactInfo?.phoneNigeria || "08160850963";
  const phoneChina = companySettings?.contactInfo?.phoneChina || "";
  const emailBusiness = companySettings?.contactInfo?.emailBusiness || "info@binnaslogisticsglobal.com.ng";
  const emailSupport = companySettings?.contactInfo?.emailSupport || "support@binnaslogisticsglobal.com.ng";
  const whatsAppNumber = companySettings?.whatsAppSettings?.whatsAppNumber || "2348160850963";

  const addressNigeria = companySettings?.officeLocations?.nigeria?.address || "Limousine Park, International Airport, Lagos, Nigeria / International Airport, Abuja, Nigeria";
  const nameNigeria = companySettings?.officeLocations?.nigeria?.name || "Nigeria Office";
  const mapNigeria = companySettings?.officeLocations?.nigeria?.mapsLink || "https://maps.google.com";

  const addressChina = companySettings?.officeLocations?.china?.address || "";
  const nameChina = companySettings?.officeLocations?.china?.name || "China";
  const mapChina = companySettings?.officeLocations?.china?.mapsLink || "";

  // WhatsApp Messages
  const defaultMsg = companySettings?.whatsAppSettings?.defaultMessage || "Hello Binna's Logistics, I would like to make an enquiry about your services.";
  const quoteMsg = companySettings?.whatsAppSettings?.quoteMessage || "Hello Binna's Logistics, I would like to request a shipping quote.";
  const importMsg = companySettings?.whatsAppSettings?.importMessage || "Hello, I want to make an enquiry about importing items from China.";
  const trackingMsg = companySettings?.whatsAppSettings?.trackingMessage || "Hello, I would like to track my package status.";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col font-sans" id="applet-root">
      
      {/* Toast Overlay */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-lg flex items-start gap-3 border animate-in slide-in-from-bottom-4 ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : toast.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            <CheckCircle className={`w-5 h-5 flex-shrink-0 ${toast.type === "success" ? "text-emerald-500" : "hidden"}`} />
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${toast.type === "error" ? "text-red-500" : "hidden"}`} />
            <div className="text-sm font-medium">{toast.message}</div>
          </div>
        ))}
      </div>

      {/* Homepage Announcement Bar from Company Settings */}
      {db?.companySettings?.announcementBar?.enabled && (
        <div 
          className="w-full text-white text-center py-2.5 px-4 font-bold text-xs tracking-wider transition-all duration-200 shadow-sm"
          style={{ backgroundColor: db.companySettings.announcementBar.color || "#0f4c81" }}
        >
          {db.companySettings.announcementBar.text}
        </div>
      )}

      <Header currentTab={currentTab} setCurrentTab={setCurrentTab} announcements={announcements} companySettings={db?.companySettings} />

      {/* Main Content Render */}
      <main className="flex-grow w-full">
        {error && (
          <div className="max-w-7xl mx-auto my-6 p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-900 text-sm rounded-r-md flex items-center justify-between shadow-sm">
            <span>{error}</span>
            <button onClick={fetchDB} className="flex items-center gap-1 bg-amber-200 hover:bg-amber-300 px-3 py-1.5 rounded-md font-bold transition-all text-xs">
              <RefreshCw size={12} /> Retry Database Sync
            </button>
          </div>
        )}

        {/* ==================== 1. HOME TAB ==================== */}
        {currentTab === "home" && (
          <div id="home-page-view">
            {/* 1. Hero Slider */}
            <div className="relative w-full h-[550px] bg-slate-900 text-white overflow-hidden" id="hero-slider">
              {homepage.slides && homepage.slides.length > 0 ? (
                homepage.slides.map((slide: any, idx: number) => {
                  const isActive = idx === activeSlide;
                  return (
                    <div
                      key={slide.id}
                      className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                        isActive ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 pointer-events-none z-0"
                      }`}
                    >
                      {/* Image background overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-transparent z-1" />
                      <img
                        src={slide.image}
                        alt={slide.headline}
                        className="w-full h-full object-cover"
                      />

                      {/* Content block inside slide */}
                      <div className="absolute inset-0 z-2 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
                        <div className="max-w-2xl text-left space-y-6">
                          <span className="inline-flex items-center gap-2 bg-red-600 text-white font-extrabold text-xs uppercase tracking-widest px-3.5 py-1 rounded-full shadow-md">
                            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                            China to Nigeria Direct Network
                          </span>
                          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white">
                            {slide.headline}
                          </h1>
                          <p className="text-lg text-gray-200 font-medium leading-relaxed max-w-xl">
                            {slide.subheadline}
                          </p>
                          <div className="flex flex-wrap gap-4 pt-2">
                            <button
                              onClick={() => {
                                setCurrentTab(slide.cta1Link || "contact");
                                window.location.hash = slide.cta1Link || "contact";
                              }}
                              className="bg-[#dc2626] hover:bg-red-700 text-white font-extrabold px-8 py-3.5 rounded-lg text-sm transition-all shadow-lg hover:shadow-red-600/20 flex items-center gap-2 cursor-pointer"
                            >
                              {slide.cta1Text} <ArrowRight size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setCurrentTab(slide.cta2Link || "contact");
                                window.location.hash = slide.cta2Link || "contact";
                              }}
                              className="bg-white/10 hover:bg-white/20 text-white font-bold border border-white/20 px-6 py-3.5 rounded-lg text-sm transition-all backdrop-blur-xs flex items-center gap-2 cursor-pointer"
                            >
                              {slide.cta2Text}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-full">No active slides registered</div>
              )}

              {/* Slider Arrows */}
              {homepage.slides && homepage.slides.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveSlide((prev) => (prev - 1 + homepage.slides.length) % homepage.slides.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-red-600 hover:scale-105 text-white flex items-center justify-center transition-all cursor-pointer"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={() => setActiveSlide((prev) => (prev + 1) % homepage.slides.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-red-600 hover:scale-105 text-white flex items-center justify-center transition-all cursor-pointer"
                  >
                    <ChevronRight size={24} />
                  </button>

                  {/* Indicator Dots */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    {homepage.slides.map((_: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSlide(idx)}
                        className={`h-2 rounded-full transition-all ${idx === activeSlide ? "w-8 bg-red-600" : "w-2 bg-white/45 hover:bg-white"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 2. Services Section */}
            <section className="py-20 bg-white" id="home-services">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                  <span className="text-[#0f4c81] text-xs font-black uppercase tracking-widest block">Our Solutions</span>
                  <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Services & Cargo Solutions</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Professional, secure, and stress-free shipping pathways optimized for your trade from China to Nigeria.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {services.slice(0, 6).map((service: any) => {
                    const getIconComponent = (iconName: string) => {
                      switch (iconName) {
                        case "Search": return <Search size={24} className="text-[#0f4c81]" />;
                        case "Plane": return <Plane size={24} className="text-[#0f4c81]" />;
                        case "Ship": return <Ship size={24} className="text-[#0f4c81]" />;
                        case "PackageOpen": return <PackageOpen size={24} className="text-[#0f4c81]" />;
                        case "FileText": return <FileText size={24} className="text-[#0f4c81]" />;
                        case "CreditCard": return <CreditCard size={24} className="text-[#0f4c81]" />;
                        default: return <CheckCircle size={24} className="text-[#0f4c81]" />;
                      }
                    };

                    return (
                      <div
                        key={service.id}
                        className="bg-gray-50 rounded-2xl border border-gray-100 hover:border-red-200 p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                      >
                        <div className="space-y-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-50/80 flex items-center justify-center">
                            {getIconComponent(service.icon)}
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">{service.title}</h3>
                          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{service.description}</p>
                        </div>
                        <div className="pt-4 border-t border-gray-100 mt-4 flex justify-between items-center text-xs">
                          <button
                            onClick={() => {
                              setContactForm((prev) => ({
                                ...prev,
                                serviceNeeded: service.title,
                                message: `Hi Binna's Logistics! I am interested in your "${service.title}" services.`
                              }));
                              setCurrentTab("contact");
                              window.location.hash = "contact";
                            }}
                            className="font-extrabold text-[#0f4c81] hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            Learn More <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center mt-12">
                  <button
                    onClick={() => {
                      setCurrentTab("services");
                      window.location.hash = "services";
                    }}
                    className="bg-[#0f4c81] hover:bg-blue-800 text-white font-extrabold text-xs px-6 py-3 rounded-lg shadow-sm transition-all"
                  >
                    View All Services & Operations
                  </button>
                </div>
              </div>
            </section>

            {/* 3. Why Choose Us Section */}
            <section className="py-20 bg-gray-50 border-t border-gray-100" id="why-choose-sec">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                  <span className="text-[#0f4c81] text-xs font-black uppercase tracking-widest block">Safe Passage</span>
                  <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{homepage.whyChooseUs?.title || "Why Choose Us"}</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {homepage.whyChooseUs?.subtitle || "Unbeatable reliability and specialized expertise in China-Nigeria cargo networks."}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {homepage.whyChooseUs?.items?.map((item: any) => (
                    <div key={item.id} className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 hover:shadow-md hover:border-[#0f4c81]/20 transition-all duration-300 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0f4c81] flex items-center justify-center font-bold">
                          ✓
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
                      </div>
                      <div className="pt-4 border-t border-gray-50 mt-4 flex items-center text-xs font-bold text-[#0f4c81]">
                        Guaranteed Service Outcome
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 4. Shipping Updates & Announcements Section */}
            <section className="py-20 bg-white border-t border-gray-100" id="home-shipping-updates">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                  <span className="text-red-600 text-xs font-black uppercase tracking-widest block">Operational Dispatch</span>
                  <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Latest News & Shipping Updates</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Stay informed with our direct weekly operational announcements and bilateral customs updates.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Active Notice Alerts (Announcements) */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                      <Bell className="text-red-600 animate-bounce" size={20} />
                      <h3 className="text-lg font-extrabold text-gray-900">Emergency & Custom Notice Alerts</h3>
                    </div>

                    {activeAnnouncements.length > 0 ? (
                      <div className="space-y-4">
                        {activeAnnouncements.map((announcement: any) => (
                          <div key={announcement.id} className="bg-red-50/50 border border-red-100 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-xs">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-red-600/5 rounded-full" />
                            <div className="flex items-center gap-2">
                              <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full animate-pulse">
                                CRITICAL UPDATE
                              </span>
                              {announcement.date && (
                                <span className="text-xs text-gray-400 font-medium">Published: {announcement.date}</span>
                              )}
                            </div>
                            <h4 className="font-bold text-gray-900 text-base">{announcement.title}</h4>
                            <p className="text-xs text-gray-600 leading-relaxed">{announcement.content}</p>
                            <div className="text-[10px] text-red-700 font-bold bg-white/60 border border-red-50 p-2.5 rounded-lg">
                              Advice: Confirm logistics compliance before dropping cargo at Guangzhou.
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 text-center space-y-3">
                        <CheckCircle size={28} className="text-[#0f4c81] mx-auto" />
                        <h4 className="font-bold text-gray-900 text-sm">All Pipelines Active & Smooth</h4>
                        <p className="text-xs text-gray-500">
                          No emergency custom restrictions or container delays are currently active. Safe sailing!
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Weekly News Articles */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Newspaper className="text-[#0f4c81]" size={20} />
                        <h3 className="text-lg font-extrabold text-gray-900">Weekly Trade & Cargo News</h3>
                      </div>
                      <button
                        onClick={() => {
                          const elem = document.getElementById("footer-subscribe");
                          if (elem) elem.scrollIntoView({ behavior: "smooth" });
                          addToast("Subscribe below to receive weekly rate updates directly!", "info");
                        }}
                        className="text-xs font-bold text-[#0f4c81] hover:text-red-600 transition-colors"
                      >
                        Subscribe to Newsletter
                      </button>
                    </div>

                    {news && news.length > 0 ? (
                      <div className="space-y-4">
                        {news.slice(0, 3).map((item: any) => (
                          <div key={item.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:border-blue-200 transition-all flex flex-col justify-between shadow-xs">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="bg-[#0f4c81]/10 text-[#0f4c81] text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md">
                                  {item.category}
                                </span>
                                <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                                  <Clock size={10} /> {item.date}
                                </span>
                              </div>
                              <h4 className="font-bold text-gray-900 text-base">{item.title}</h4>
                              <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{item.summary}</p>
                              <div className="text-[11px] text-gray-500 bg-white p-2 rounded-lg border border-gray-100 italic mt-2">
                                "{item.content}"
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-xs text-gray-400">
                        No trade news registered at the moment.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Other Business Sections: Introduction & Freight Estimator */}
            <section className="py-20 bg-gray-50 border-t border-gray-100" id="intro-sec">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  <div className="lg:col-span-7 space-y-6">
                    <div className="w-12 h-1.5 bg-red-600 rounded-full" />
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                      {homepage.welcomeTitle}
                    </h2>
                    <p className="text-lg text-gray-600 leading-relaxed font-medium">
                      {homepage.welcomeText}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      <div className="flex gap-3 items-start p-4 bg-blue-50/50 rounded-xl border border-blue-50">
                        <CheckCircle size={20} className="text-[#0f4c81] mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">Official China Warehousing</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Secure collection & sorting centres in Guangzhou and Yiwu.</p>
                        </div>
                      </div>
                      <div className="flex gap-3 items-start p-4 bg-red-50/50 rounded-xl border border-red-50">
                        <CheckCircle size={20} className="text-[#dc2626] mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">Guaranteed Clearing</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Stress-free Lagos port customs clearing included in our rate sheets.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Direct Shipping Channels & Schedules */}
                  <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-5">
                    <div className="space-y-1">
                      <span className="text-[10px] bg-red-600/20 text-red-400 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Bilateral Schedules
                      </span>
                      <h3 className="font-extrabold text-xl text-white">Direct Shipping Channels</h3>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        We offer simplified door-to-door cargo handling from Guangzhou/Yiwu directly to Lagos and Abuja.
                      </p>
                    </div>

                    <div className="space-y-4 pt-1">
                      {/* Air Cargo Item */}
                      <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-800 flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-lg bg-[#0f4c81] flex items-center justify-center text-white font-bold flex-shrink-0">
                          🛫
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-white">Air Cargo Express</h4>
                          <p className="text-[11px] text-gray-300">
                            <strong>Departures:</strong> Bi-weekly (Tuesdays & Fridays)
                          </p>
                          <p className="text-[11px] text-gray-400">
                            <strong>Transit Time:</strong> 2 - 3 Days to Lagos & Abuja (Customs Cleared)
                          </p>
                        </div>
                      </div>

                      {/* Sea Freight Item */}
                      <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-800 flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center font-bold flex-shrink-0 border border-red-900/30">
                          🚢
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-white">Sea Freight Groupage</h4>
                          <p className="text-[11px] text-gray-300">
                            <strong>Departures:</strong> Weekly (Friday Loading Cycle)
                          </p>
                          <p className="text-[11px] text-gray-400">
                            <strong>Transit Time:</strong> 35 - 45 Days to Lagos Port (Customs Cleared)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => {
                          setCurrentTab("contact");
                          window.location.hash = "contact";
                        }}
                        className="bg-[#0f4c81] hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-lg transition-all uppercase tracking-wider text-center cursor-pointer"
                      >
                        Request Quote
                      </button>
                      <a
                        href={`https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(quoteMsg)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-lg transition-all uppercase tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer text-decoration-none"
                      >
                        WhatsApp Chat
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. Other Business Sections: Statistics Section */}
            <section className="py-16 bg-[#0f4c81] text-white relative overflow-hidden" id="stats-sec">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.15),transparent)] pointer-events-none" />
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-1">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                  <div className="space-y-2">
                    <span className="text-4xl sm:text-5xl font-black text-white block tracking-tight">
                      {homepage.stats?.yearsOfExperience || "8+"}
                    </span>
                    <span className="text-xs uppercase font-extrabold tracking-wider text-gray-300 block">
                      Years of Experience
                    </span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-4xl sm:text-5xl font-black text-red-500 block tracking-tight">
                      {homepage.stats?.successfulShipments || "15,200+"}
                    </span>
                    <span className="text-xs uppercase font-extrabold tracking-wider text-gray-300 block">
                      Successful Shipments
                    </span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-4xl sm:text-5xl font-black text-white block tracking-tight">
                      {homepage.stats?.satisfiedClients || "4,500+"}
                    </span>
                    <span className="text-xs uppercase font-extrabold tracking-wider text-gray-300 block">
                      Satisfied Clients
                    </span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-4xl sm:text-5xl font-black text-red-500 block tracking-tight animate-pulse">
                      {homepage.stats?.countriesConnected || "China & Nigeria"}
                    </span>
                    <span className="text-xs uppercase font-extrabold tracking-wider text-gray-300 block">
                      Active Supply Line
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* 7. Other Business Sections: Call To Action Section */}
            <section className="bg-slate-900 text-white relative py-20 overflow-hidden" id="home-cta">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(15,76,129,0.35),transparent)] pointer-events-none" />
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-1 space-y-6">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  {homepage.cta?.headline || "Ready to Move Your Cargo With Confidence?"}
                </h2>
                <p className="text-gray-300 max-w-2xl mx-auto text-base">
                  {homepage.cta?.subheadline || "Partner with Binna's Logistics for seamless sourcing, custom clearing, and shipping solutions."}
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setCurrentTab("contact");
                      window.location.hash = "contact";
                    }}
                    className="bg-[#dc2626] hover:bg-red-700 text-white font-extrabold px-10 py-4 rounded-xl text-sm tracking-wide transition-all uppercase shadow-lg hover:shadow-red-600/30 inline-flex items-center gap-2 cursor-pointer"
                  >
                    {homepage.cta?.buttonText || "Request a Quote"} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </section>

            {/* 8. Contact Information Section */}
            <section className="py-20 bg-gray-50 border-t border-gray-100" id="home-contact-info">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                  <span className="text-[#0f4c81] text-xs font-black uppercase tracking-widest block">Get In Touch</span>
                  <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Our Direct Office Branches</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Connect directly with our bilateral warehouse and office coordinators in Lagos or Guangzhou.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                  {/* Lagos Office branch */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                        <span className="text-2xl">🇳🇬</span>
                        <h4 className="font-extrabold text-gray-900 text-sm">Lagos Office</h4>
                      </div>
                      <div className="space-y-3 text-xs text-gray-600">
                        <div className="flex items-start gap-2.5">
                          <MapPin size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                          <span>{addressNigeria.split("/")[0]?.trim() || addressNigeria}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Phone size={15} className="text-red-500 flex-shrink-0" />
                          <span>Phone: {phoneNigeria}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-emerald-500 font-bold flex-shrink-0">WhatsApp:</span>
                          <span>+{whatsAppNumber}</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-50 mt-4 text-[10px] font-bold text-gray-400">
                      Lagos Airport Hub
                    </div>
                  </div>

                  {/* Abuja Office branch */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                        <span className="text-2xl">🇳🇬</span>
                        <h4 className="font-extrabold text-gray-900 text-sm">Abuja Office</h4>
                      </div>
                      <div className="space-y-3 text-xs text-gray-600">
                        <div className="flex items-start gap-2.5">
                          <MapPin size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                          <span>{addressNigeria.split("/")[1]?.trim() || "International Airport, Abuja, Nigeria"}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Phone size={15} className="text-red-500 flex-shrink-0" />
                          <span>Phone: {phoneNigeria}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-emerald-500 font-bold flex-shrink-0">WhatsApp:</span>
                          <span>+{whatsAppNumber}</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-50 mt-4 text-[10px] font-bold text-gray-400">
                      Abuja Airport Hub
                    </div>
                  </div>

                  {/* Guangzhou Office branch */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                        <span className="text-2xl">🇨🇳</span>
                        <h4 className="font-extrabold text-gray-900 text-sm">{nameChina}</h4>
                      </div>
                      <div className="space-y-3 text-xs text-gray-600">
                        <div className="flex items-start gap-2.5">
                          <MapPin size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                          <span>{addressChina || "China"}</span>
                        </div>
                        {phoneChina && (
                          <div className="flex items-center gap-2.5">
                            <Phone size={15} className="text-red-500 flex-shrink-0" />
                            <span>China Line: {phoneChina}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2.5 text-gray-500">
                          <span className="font-bold text-red-500">Email:</span>
                          <span>{emailBusiness}</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-50 mt-4 text-[10px] font-bold text-gray-400">
                      Guangzhou Collection Hub
                    </div>
                  </div>

                  {/* Business Hours & Support Card */}
                  <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                        <Clock size={18} className="text-red-500" />
                        <h4 className="font-extrabold text-white text-sm">Business Hours</h4>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xl font-black text-red-500 block">24/7 Operations</span>
                        <p className="text-[11px] text-gray-300 leading-relaxed">
                          Our support channels, website quotation engines, and tracking services are fully operational 24 hours a day, 7 days a week.
                        </p>
                      </div>
                    </div>
                    <div className="pt-3">
                      <button
                        onClick={() => {
                          setCurrentTab("contact");
                          window.location.hash = "contact";
                        }}
                        className="w-full bg-[#dc2626] hover:bg-red-700 text-white font-extrabold text-[10px] py-2.5 rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Send Enquiry <ArrowRight size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ==================== 2. ABOUT US TAB ==================== */}
        {currentTab === "about" && (
          <div id="about-page-view" className="space-y-0">
            <SubpageHeroSlider 
              title={about.title} 
              subtitle="Our story of building a seamless, secure, and hyper-efficient bilateral trade bridge connecting China directly to Nigeria." 
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

              {/* Main Content & Story */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                
                {/* Left hand details text */}
                <div className="lg:col-span-7 space-y-8">
                  <div className="prose max-w-none">
                    <p className="text-lg text-gray-700 leading-relaxed font-semibold whitespace-pre-line">
                      {about.content}
                    </p>
                  </div>

                  <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-xs space-y-4">
                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-red-600 rounded-full" />
                      The Cargo Link We Build
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {about.companyOverview}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-gray-900">Our Origin Story</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {about.ourStory}
                    </p>
                  </div>
                </div>

                {/* Right hand values summary card */}
                <div className="lg:col-span-5 bg-gradient-to-br from-[#0f4c81] to-slate-900 text-white rounded-3xl p-8 shadow-xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-xl pointer-events-none" />
                  <h3 className="text-xl font-extrabold text-white">Why Clients Trust Us</h3>
                  <p className="text-sm text-gray-200 leading-relaxed">
                    {about.whyClientsTrustUs}
                  </p>

                  <div className="pt-4 border-t border-white/10 space-y-4">
                    <span className="text-xs font-black uppercase tracking-widest text-red-500 block">Our Core Pillars</span>
                    <div className="grid grid-cols-1 gap-4">
                      {about.ourValues?.map((value: any, idx: number) => (
                        <div key={value.id} className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-white/15 text-red-500 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">{value.title}</h4>
                            <p className="text-xs text-gray-300 mt-0.5">{value.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ==================== 3. SERVICES TAB ==================== */}
        {currentTab === "services" && (
          <div id="services-page-view" className="space-y-0">
            <SubpageHeroSlider 
              title="Comprehensive Logistics Services" 
              subtitle="End-to-end global supply chain solutions spanning product procurement, secure Chinese warehousing, consolidated shipping, and customs clearing." 
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <p className="text-sm text-gray-500 max-w-xl mx-auto">
                  Simplify and optimize imports from major manufacturing hubs in China to local commercial distribution centres across Nigeria.
                </p>
                <div className="w-24 h-1.5 bg-[#0f4c81] mx-auto rounded-full" />
              </div>

              {/* Grid Layout of Service Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((service: ServiceCard) => {
                  // Select dynamic icons for card header
                  const getIconComponent = (iconName: string) => {
                    switch (iconName) {
                      case "Search": return <Search size={24} className="text-[#0f4c81]" />;
                      case "Plane": return <Plane size={24} className="text-[#0f4c81]" />;
                      case "Ship": return <Ship size={24} className="text-[#0f4c81]" />;
                      case "PackageOpen": return <PackageOpen size={24} className="text-[#0f4c81]" />;
                      case "FileText": return <FileText size={24} className="text-[#0f4c81]" />;
                      case "CreditCard": return <CreditCard size={24} className="text-[#0f4c81]" />;
                      default: return <CheckCircle size={24} className="text-[#0f4c81]" />;
                    }
                  };

                  return (
                    <div
                      key={service.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-lg hover:border-[#0f4c81] transition-all duration-300 overflow-hidden flex flex-col justify-between"
                    >
                      <div className="p-6 sm:p-8 space-y-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50/80 flex items-center justify-center">
                          {getIconComponent(service.icon)}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{service.title}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{service.description}</p>
                        
                        <div className="pt-4 border-t border-gray-50 mt-4 bg-gray-50/50 p-4 rounded-xl text-xs text-gray-600 leading-relaxed">
                          <strong>Operational Detail:</strong> {service.details}
                        </div>
                      </div>

                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                        <button
                          onClick={() => {
                            setContactForm((prev) => ({
                              ...prev,
                              serviceNeeded: service.title,
                              message: `Hi Binna's Logistics! I would like to request assistance regarding your "${service.title}" services mentioned on the website.`
                            }));
                            setCurrentTab("contact");
                            window.location.hash = "contact";
                            addToast(`Selected ${service.title}. Quote request filled.`, "info");
                          }}
                          className="text-xs font-extrabold text-[#0f4c81] hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          Book this Service <ArrowRight size={13} />
                        </button>
                        <span className="text-[10px] bg-red-50 text-red-600 font-extrabold px-2 py-0.5 rounded-full">Active Pathway</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sourcing warning note */}
              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-2xl max-w-4xl mx-auto space-y-2">
                <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-600" />
                  Important Sourcing & Freight Advice
                </h4>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Avoid paying unknown brokers in China directly. Our Guangzhou office offers a secured Naira payment terminal where we inspect the quality of your electronics, fabrics, or machines before your supplier is paid. Contact us immediately before placing bulk funds transfers.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* ==================== 4. VISION TAB ==================== */}
        {currentTab === "vision" && (
          <div id="vision-page-view" className="space-y-0">
            <SubpageHeroSlider 
              title={vision.title} 
              subtitle="Pioneering the future of bilateral trade and innovative multi-modal supply chains between Asia and West Africa." 
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

              <div className="max-w-4xl mx-auto space-y-12">
                {/* Vision Box */}
                <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-xs space-y-6 text-center max-w-3xl mx-auto">
                  <span className="text-xs bg-red-50 text-red-600 font-extrabold tracking-widest uppercase px-3 py-1 rounded-full">
                    Official Vision Statement
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-[#0f4c81] leading-relaxed">
                    "{vision.content}"
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    — {vision.statement}
                  </p>
                </div>

                {/* Subsections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                  <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-3">
                    <span className="text-red-500 font-black text-xs uppercase tracking-widest block">01. Growth Strategy</span>
                    <h3 className="font-bold text-lg text-white">Scale & Scope</h3>
                    <p className="text-xs text-gray-300 leading-relaxed">{vision.growthStrategy}</p>
                  </div>

                  <div className="bg-white text-gray-800 rounded-2xl p-6 border border-gray-100 shadow-xs space-y-3">
                    <span className="text-[#0f4c81] font-black text-xs uppercase tracking-widest block">02. Long-Term Goals</span>
                    <h3 className="font-bold text-lg text-gray-900">Bilateral Mastery</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{vision.longTermGoals}</p>
                  </div>

                  <div className="bg-[#0f4c81] text-white rounded-2xl p-6 space-y-3">
                    <span className="text-red-300 font-black text-xs uppercase tracking-widest block">03. Commitment</span>
                    <h3 className="font-bold text-lg text-white">Absolute Excellence</h3>
                    <p className="text-xs text-blue-100 leading-relaxed">{vision.commitmentToExcellence}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== 5. MISSION TAB ==================== */}
        {currentTab === "mission" && (
          <div id="mission-page-view" className="space-y-0">
            <SubpageHeroSlider 
              title={mission.title} 
              subtitle="Empowering retail and commercial traders across Nigeria with direct access to secure global procurement, sorting, and shipping pipelines." 
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

              <div className="max-w-4xl mx-auto space-y-12">
                {/* Statement block */}
                <div className="bg-[#0f4c81] text-white rounded-3xl p-8 sm:p-10 text-center space-y-4 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-red-600/10 rounded-full blur-xl pointer-events-none" />
                  <p className="text-lg sm:text-xl font-bold leading-relaxed max-w-2xl mx-auto text-blue-50">
                    "{mission.content}"
                  </p>
                </div>

                {/* Grid list of missions values */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                  
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0f4c81] flex items-center justify-center font-black">
                        1
                      </div>
                      <h4 className="font-bold text-gray-900">Customer Commitment</h4>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{mission.customerCommitment}</p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-black">
                        2
                      </div>
                      <h4 className="font-bold text-gray-900">Service Excellence</h4>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{mission.serviceExcellence}</p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0f4c81] flex items-center justify-center font-black">
                        3
                      </div>
                      <h4 className="font-bold text-gray-900">Technical Innovation</h4>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{mission.innovation}</p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-black">
                        4
                      </div>
                      <h4 className="font-bold text-gray-900">Absolute Transparency</h4>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{mission.transparency}</p>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== 6. CONTACT US TAB ==================== */}
        {currentTab === "contact" && (
          <div id="contact-page-view" className="space-y-0">
            <SubpageHeroSlider 
              title={contact.title} 
              subtitle="Get in touch with our on-ground office and warehouse coordinators in Lagos, Abuja, and Guangzhou. We are available 24/7 to support you." 
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <p className="text-sm text-gray-500">
                  Connect with our on-ground office staff in Lagos or Guangzhou. We reply to all queries within minutes.
                </p>
                <div className="w-24 h-1.5 bg-red-600 mx-auto rounded-full" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                
                {/* Contact Form Block */}
                <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xs space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Send an Enquiry</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Whether you need urgent product sourcing or direct sea/air quote confirmations, submit details below.
                    </p>
                  </div>

                  {contactSuccess ? (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-emerald-500" size={24} />
                        <h4 className="font-bold text-emerald-950">Message Transmitted Successfully!</h4>
                      </div>
                      <p className="text-sm leading-relaxed">{contactSuccess}</p>
                      <button
                        onClick={() => setContactSuccess(null)}
                        className="bg-[#0f4c81] hover:bg-blue-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all"
                      >
                        Submit another enquiry
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Full Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Aliko Chinedu"
                            value={contactForm.fullName}
                            onChange={(e) => setContactForm({ ...contactForm, fullName: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Company Name (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. Chinedu Garments Ltd"
                            value={contactForm.companyName}
                            onChange={(e) => setContactForm({ ...contactForm, companyName: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Email Address *</label>
                          <input
                            type="email"
                            required
                            placeholder="e.g. chinedu@domain.com"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Phone Number</label>
                          <input
                            type="tel"
                            placeholder="e.g. +234 80 1234 5678"
                            value={contactForm.phone}
                            onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Service Needed *</label>
                        <select
                          required
                          value={contactForm.serviceNeeded}
                          onChange={(e) => setContactForm({ ...contactForm, serviceNeeded: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium text-gray-700"
                        >
                          <option value="Product Sourcing">Product Sourcing</option>
                          <option value="Air Freight">Air Freight</option>
                          <option value="Sea Freight">Sea Freight</option>
                          <option value="Cargo Consolidation">Cargo Consolidation</option>
                          <option value="Customs Assistance">Customs Assistance</option>
                          <option value="Procurement Support">Procurement Support</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Your Message *</label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Please provide shipment details: weight, dimensions, supplier locations in China, or items to be sourced..."
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="pt-2 flex flex-wrap gap-4">
                        <button
                          type="submit"
                          disabled={contactSubmitting}
                          className="bg-[#0f4c81] hover:bg-blue-800 text-white font-extrabold text-sm px-8 py-3.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {contactSubmitting ? (
                            <>
                              <Loader2 size={16} className="animate-spin" /> Sending...
                            </>
                          ) : (
                            <>
                              Send Message <Send size={16} />
                            </>
                          )}
                        </button>
                        <button
                          type="submit"
                          disabled={contactSubmitting}
                          className="bg-[#dc2626] hover:bg-red-700 text-white font-bold text-sm px-6 py-3.5 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                        >
                          Request Custom Invoice Rate
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Right hand Office Address information card */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Nigeria - Lagos Office */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                      <span className="text-xl">🇳🇬</span>
                      <h4 className="font-extrabold text-gray-900">{nameNigeria.includes("Lagos") ? nameNigeria : "Lagos Head Office"}</h4>
                    </div>
                    <div className="space-y-3 text-xs text-gray-600">
                      <div className="flex items-start gap-2.5">
                        <MapPin size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <span>{addressNigeria.split("/")[0]?.trim() || addressNigeria}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Phone size={15} className="text-red-500 flex-shrink-0" />
                        <span>Phone: {phoneNigeria}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-emerald-500 font-bold flex-shrink-0">WhatsApp:</span>
                        <span>+{whatsAppNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Nigeria - Abuja Office */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                      <span className="text-xl">🇳🇬</span>
                      <h4 className="font-extrabold text-gray-900">{nameNigeria.includes("Abuja") ? nameNigeria : "Abuja Office"}</h4>
                    </div>
                    <div className="space-y-3 text-xs text-gray-600">
                      <div className="flex items-start gap-2.5">
                        <MapPin size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <span>{addressNigeria.split("/")[1]?.trim() || "International Airport, Abuja, Nigeria"}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Phone size={15} className="text-red-500 flex-shrink-0" />
                        <span>Phone: {phoneNigeria}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-emerald-500 font-bold flex-shrink-0">WhatsApp:</span>
                        <span>+{whatsAppNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* China Office */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                      <span className="text-xl">🇨🇳</span>
                      <h4 className="font-extrabold text-gray-900">{nameChina}</h4>
                    </div>
                    <div className="space-y-3 text-xs text-gray-600">
                      <div className="flex items-start gap-2.5">
                        <MapPin size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <span>{addressChina || "China"}</span>
                      </div>
                      {phoneChina && (
                        <div className="flex items-center gap-2.5">
                          <Phone size={15} className="text-red-500 flex-shrink-0" />
                          <span>China Line: {phoneChina}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Band hours */}
                  <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-3">
                    <h4 className="font-bold text-sm text-red-500">Business Hours</h4>
                    <p className="text-xs text-gray-300 leading-relaxed">24/7 Operations</p>
                    <div className="pt-2 flex items-center gap-2 text-[11px] text-gray-400">
                      <Clock size={12} />
                      <span>Support, quoting & shipment collections active 24/7.</span>
                    </div>
                  </div>

                  {/* Styled Google Maps Interactive Embed with Switcher */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-xs font-black text-gray-900 uppercase tracking-wider">Interactive Map</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveMap("lagos")}
                          className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${
                            activeMap === "lagos"
                              ? "bg-[#0f4c81] text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          Lagos Hub
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveMap("abuja")}
                          className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${
                            activeMap === "abuja"
                              ? "bg-[#0f4c81] text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          Abuja Hub
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-slate-100 rounded-xl h-64 overflow-hidden border border-gray-100 relative">
                      {activeMap === "lagos" ? (
                        <iframe
                          id="lagos-map-iframe"
                          title="Binna's Logistics Lagos Office Map"
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(addressNigeria.split("/")[0]?.trim() || addressNigeria)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen={true}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      ) : (
                        <iframe
                          id="abuja-map-iframe"
                          title="Binna's Logistics Abuja Office Map"
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(addressNigeria.split("/")[1]?.trim() || "International Airport, Abuja, Nigeria")}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen={true}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>
        )}

        {/* ==================== 7. ADMIN LOGIN PAGE ==================== */}
        {currentTab === "admin-login" && (
          <div className="min-h-[800px] bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" id="admin-login-view">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-gray-150 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#0f4c81] to-[#dc2626]"></div>
              
              <div className="text-center space-y-4">
                <div className="bg-slate-50 px-4 py-3 rounded-2xl inline-block border border-gray-100 shadow-sm">
                  <span className="text-xl sm:text-2xl font-black tracking-tight leading-none block select-none">
                    <span className="text-[#0f172a]">Binna's</span>{" "}
                    <span className="text-[#0f4c81]">Logistics</span>{" "}
                    <span className="text-[#dc2626]">Global</span>
                  </span>
                </div>
                <div className="border-b border-gray-100 pb-2">
                  <h2 className="text-sm font-black text-gray-500 tracking-widest uppercase">
                    Secure Admin Access
                  </h2>
                </div>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Sign in to manage platform settings, databases, and client enquiries.
                </p>
              </div>

              {adminLoginError && (
                <div className="rounded-xl bg-red-50 border border-red-150 p-4 text-xs font-semibold text-red-700 flex items-start gap-3 animate-in fade-in duration-200">
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-red-800 block mb-0.5">Authentication Issue</span>
                    {adminLoginError}
                  </div>
                </div>
              )}

              <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="admin-email-field" className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                      Administrator Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <User className="h-4.5 w-4.5 text-gray-400" />
                      </div>
                      <input
                        id="admin-email-field"
                        type="email"
                        required
                        placeholder="info@binnaslogisticsglobal.com.ng"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c81] focus:border-transparent font-medium text-gray-800 transition-all duration-150"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="admin-password-field" className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                      Security Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-4.5 w-4.5 text-gray-400" />
                      </div>
                      <input
                        id="admin-password-field"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="•••••••••••••"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="block w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c81] focus:border-transparent font-semibold text-gray-800 transition-all duration-150"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4.5 w-4.5" />
                        ) : (
                          <Eye className="h-4.5 w-4.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="remember-me-checkbox"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-[#0f4c81] focus:ring-[#0f4c81] border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="remember-me-checkbox" className="ml-2 block text-xs text-gray-700 font-semibold select-none cursor-pointer">
                      Remember Me
                    </label>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={adminLoggingIn}
                    className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-extrabold rounded-xl text-white bg-[#0f4c81] hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0f4c81] transition-all duration-150 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {adminLoggingIn ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5 text-white mr-2" />
                        Authenticating credentials...
                      </>
                    ) : (
                      "Sign In as System Director"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================== 7. ADMIN DASHBOARD ==================== */}
        {currentTab === "admin" && (
          <ProtectedRoute
            isAuthenticated={!!adminToken}
            userEmail={adminUser?.email || null}
            loading={authLoading}
            onRedirect={() => {
              setCurrentTab("admin-login");
              window.location.hash = "admin-login";
            }}
          >
            <div className="py-12 bg-gray-100 min-h-[700px]" id="admin-page-view">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {!adminToken || !adminUser ? (
                /* Redirecting state */
                <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-gray-100 shadow-md text-center space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-[#0f4c81] mx-auto" />
                  <h3 className="text-lg font-extrabold text-gray-900">Securing Session Context...</h3>
                  <p className="text-xs text-gray-500">
                    Verifying secure administrator JWT access token. Redirecting to login portal...
                  </p>
                </div>
              ) : (
                /* Authenticated Dashboard */
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12" id="admin-authenticated-dashboard">
                  
                  {/* Left Sidebar Menu */}
                  <aside className="lg:col-span-3 bg-slate-900 text-gray-300 border-r border-gray-200 flex flex-col justify-between">
                    <div>
                      {/* Admin Identity header */}
                      <div className="p-6 border-b border-slate-800 space-y-4">
                        <div className="bg-white/95 px-3 py-2 rounded-xl flex items-center justify-center shadow-sm">
                          <span className="text-sm font-black tracking-tight leading-none select-none">
                            <span className="text-[#0f172a]">Binna's</span>{" "}
                            <span className="text-[#0f4c81]">Logistics</span>{" "}
                            <span className="text-[#dc2626]">Global</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="overflow-hidden">
                            <span className="text-xs font-black text-white block truncate" title={adminUser?.email || "System Director"}>
                              {adminUser?.email || "System Director"}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase block">● ONLINE CONTEXT</span>
                          </div>
                        </div>
                      </div>

                      {/* Menu navigation */}
                      <nav className="p-4 space-y-1">
                        {[
                          { id: "overview", label: "Analytics Overview", icon: <TrendingUp size={16} /> },
                          { id: "content", label: "Edit Site Pages", icon: <Edit size={16} /> },
                          { id: "services", label: "Manage Services", icon: <Sliders size={16} /> },
                          { id: "news", label: "Manage News/Update", icon: <Newspaper size={16} /> },
                          { id: "announcements", label: "Emergency Notice", icon: <Megaphone size={16} /> },
                          { id: "enquiries", label: "Client Enquiries", icon: <MessageSquare size={16} /> },
                          { id: "media", label: "Media Manager", icon: <Upload size={16} /> },
                          { id: "seo", label: "SEO Meta Settings", icon: <Globe size={16} /> },
                          { id: "settings", label: "Company Settings", icon: <Settings size={16} /> },
                          { id: "backup", label: "Backup & Restore", icon: <Database size={16} /> },
                        ].map((btn) => (
                          <button
                            key={btn.id}
                            onClick={() => setAdminTab(btn.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                              adminTab === btn.id
                                ? "bg-[#0f4c81] text-white"
                                : "hover:bg-slate-800 hover:text-white"
                            }`}
                          >
                            {btn.icon} {btn.label}
                          </button>
                        ))}
                      </nav>
                    </div>

                    {/* Footer log out action */}
                    <div className="p-4 border-t border-slate-800">
                      <button
                        onClick={handleLogout}
                        className="w-full bg-red-950 hover:bg-red-700 text-red-200 hover:text-white py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <LogOut size={14} /> Exit Admin Portal
                      </button>
                    </div>
                  </aside>

                  {/* Right main working console panel */}
                  <section className="lg:col-span-9 p-6 sm:p-8 space-y-6 bg-white overflow-y-auto max-h-[800px]">
                    
                    {/* Tab Header title */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-gray-100 gap-4">
                      <div>
                        <h2 className="text-2xl font-black text-gray-900 capitalize">
                          {adminTab} Workspace
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                          Direct real-time operations on the Binna's Logistics database.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs bg-slate-100 px-3 py-1.5 rounded-lg text-gray-600 font-bold self-start">
                        <Clock size={12} /> Local Time: 2026-07-03
                      </div>
                    </div>

                    {/* ================= ADMIN TAB: OVERVIEW ================= */}
                    {adminTab === "overview" && (
                      <div className="space-y-6" id="admin-overview">
                        {/* Highlights cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-2">
                            <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">Total Client Enquiries</span>
                            <span className="text-3xl font-black text-gray-900 block">{submissions.length}</span>
                            <span className="text-[10px] text-gray-500 block">All time submissions</span>
                          </div>
                          <div className="bg-red-50 p-5 rounded-2xl border border-red-100 space-y-2">
                            <span className="text-xs font-bold text-red-500 block uppercase tracking-wider">Unread Messages</span>
                            <span className="text-3xl font-black text-red-600 block">
                              {submissions.filter((s: Submission) => s.status === "Unread").length}
                            </span>
                            <span className="text-[10px] text-red-400 block">Awaiting response call</span>
                          </div>
                          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 space-y-2">
                            <span className="text-xs font-bold text-[#0f4c81] block uppercase tracking-wider">Active News & Updates</span>
                            <span className="text-3xl font-black text-[#0f4c81] block">{news.length}</span>
                            <span className="text-[10px] text-gray-500 block">Published to home feed</span>
                          </div>
                        </div>

                        {/* Auditing logs */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h3 className="font-bold text-sm text-gray-800">Recent User Security Logs</h3>
                            <button
                              onClick={fetchAdminData}
                              className="text-xs text-[#0f4c81] font-bold hover:underline"
                            >
                              Refresh Audit Trail
                            </button>
                          </div>
                          
                          <div className="bg-gray-50 rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                            {logs && logs.length > 0 ? (
                              logs.slice(0, 10).map((log: any) => (
                                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs gap-2">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-gray-900">{log.action}</span>
                                      <span className="bg-slate-200 px-1.5 py-0.5 rounded text-[9px] font-bold text-gray-500">{log.user}</span>
                                    </div>
                                    <p className="text-gray-500 font-medium">{log.details}</p>
                                  </div>
                                  <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">{log.timestamp}</span>
                                </div>
                              ))
                            ) : (
                              <div className="p-6 text-center text-gray-500">No logs on record</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ================= ADMIN TAB: EDIT CONTENT ================= */}
                    {adminTab === "content" && editHomepage && (
                      <div className="space-y-6" id="admin-content-pages">
                        <div className="bg-amber-50 p-4 rounded-xl text-amber-900 text-xs leading-relaxed border border-amber-200/50 mb-4">
                          Select a section below to edit the live contents of the website. Once you click save, your updates are stored in the database.
                        </div>

                        {/* Part 1: Homepage Main intro Welcome */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                          <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-2">Welcome Section Info</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">Welcome Title Heading</label>
                              <input
                                type="text"
                                value={editHomepage.welcomeTitle}
                                onChange={(e) => setEditHomepage({ ...editHomepage, welcomeTitle: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">Welcome Text Copy</label>
                              <textarea
                                value={editHomepage.welcomeText}
                                rows={3}
                                onChange={(e) => setEditHomepage({ ...editHomepage, welcomeText: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => handleSaveSection("homepage", editHomepage)}
                            className="bg-[#0f4c81] hover:bg-blue-800 text-white font-extrabold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors"
                          >
                            Save Welcome Texts
                          </button>
                        </div>

                        {/* Part 2: About Us Contents */}
                        {editAbout && (
                          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                            <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-2">About Page Core Content</h3>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Page Title</label>
                                <input
                                  type="text"
                                  value={editAbout.title}
                                  onChange={(e) => setEditAbout({ ...editAbout, title: e.target.value })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Main Body Text</label>
                                <textarea
                                  value={editAbout.content}
                                  rows={5}
                                  onChange={(e) => setEditAbout({ ...editAbout, content: e.target.value })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Company Overview Detail</label>
                                <textarea
                                  value={editAbout.companyOverview}
                                  rows={3}
                                  onChange={(e) => setEditAbout({ ...editAbout, companyOverview: e.target.value })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Our Story</label>
                                <textarea
                                  value={editAbout.ourStory}
                                  rows={3}
                                  onChange={(e) => setEditAbout({ ...editAbout, ourStory: e.target.value })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => handleSaveSection("about", editAbout)}
                              className="bg-[#0f4c81] hover:bg-blue-800 text-white font-extrabold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors"
                            >
                              Save About Us Content
                            </button>
                          </div>
                        )}

                        {/* Part 3: Vision & Mission */}
                        {editVision && editMission && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                              <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-2">Vision Statements</h3>
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-bold text-gray-600 mb-1">Vision Statement Copy</label>
                                  <textarea
                                    value={editVision.content}
                                    rows={4}
                                    onChange={(e) => setEditVision({ ...editVision, content: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-gray-600 mb-1">Vision Slogan</label>
                                  <input
                                    type="text"
                                    value={editVision.statement}
                                    onChange={(e) => setEditVision({ ...editVision, statement: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => handleSaveSection("vision", editVision)}
                                className="bg-[#0f4c81] hover:bg-blue-800 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                              >
                                Save Vision
                              </button>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                              <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-2">Mission Statements</h3>
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-bold text-gray-600 mb-1">Mission Statement Copy</label>
                                  <textarea
                                    value={editMission.content}
                                    rows={4}
                                    onChange={(e) => setEditMission({ ...editMission, content: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => handleSaveSection("mission", editMission)}
                                className="bg-[#0f4c81] hover:bg-blue-800 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                              >
                                Save Mission
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Part 4: Slider Hero backgrounds */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                          <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-2">Manage Hero Slides</h3>
                          <div className="space-y-4">
                            {editHomepage.slides.map((slide: any, index: number) => (
                              <div key={slide.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                                <span className="font-bold text-xs text-[#0f4c81]">Slide #{index + 1}</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Headline</label>
                                    <input
                                      type="text"
                                      value={slide.headline}
                                      onChange={(e) => {
                                        const newSlides = [...editHomepage.slides];
                                        newSlides[index].headline = e.target.value;
                                        setEditHomepage({ ...editHomepage, slides: newSlides });
                                      }}
                                      className="w-full bg-white border border-gray-200 rounded p-2 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Subheadline</label>
                                    <input
                                      type="text"
                                      value={slide.subheadline}
                                      onChange={(e) => {
                                        const newSlides = [...editHomepage.slides];
                                        newSlides[index].subheadline = e.target.value;
                                        setEditHomepage({ ...editHomepage, slides: newSlides });
                                      }}
                                      className="w-full bg-white border border-gray-200 rounded p-2 text-xs"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Image URL</label>
                                    <input
                                      type="text"
                                      value={slide.image}
                                      onChange={(e) => {
                                        const newSlides = [...editHomepage.slides];
                                        newSlides[index].image = e.target.value;
                                        setEditHomepage({ ...editHomepage, slides: newSlides });
                                      }}
                                      className="w-full bg-white border border-gray-200 rounded p-2 text-xs"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2 pt-4">
                                    <span className="text-[10px] text-gray-500 italic">Preview Background:</span>
                                    <img src={slide.image} className="w-12 h-8 rounded object-cover border border-gray-200" alt="slide preview" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => handleSaveSection("homepage", editHomepage)}
                            className="bg-[#0f4c81] hover:bg-blue-800 text-white font-extrabold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors"
                          >
                            Save Slides Settings
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ================= ADMIN TAB: MANAGE SERVICES ================= */}
                    {adminTab === "services" && db?.services && (
                      <div className="space-y-6" id="admin-services-panel">
                        <div className="bg-blue-50 text-blue-950 p-4 rounded-xl text-xs leading-relaxed border border-blue-200/50 mb-4">
                          Modify the core 6 services that users select on the public menu. Keep the icons relevant (Search, Plane, Ship, PackageOpen, FileText, CreditCard).
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {db.services.map((service: ServiceCard, index: number) => (
                            <div key={service.id} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <span className="font-extrabold text-sm text-[#0f4c81]">{service.title}</span>
                                <span className="text-[10px] uppercase bg-slate-100 px-2 py-0.5 rounded font-black text-gray-500">
                                  {service.icon} Icon
                                </span>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Service Headline</label>
                                  <input
                                    type="text"
                                    value={service.title}
                                    onChange={(e) => {
                                      const updated = [...db.services];
                                      updated[index].title = e.target.value;
                                      setDb({ ...db, services: updated });
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Short Description</label>
                                  <input
                                    type="text"
                                    value={service.description}
                                    onChange={(e) => {
                                      const updated = [...db.services];
                                      updated[index].description = e.target.value;
                                      setDb({ ...db, services: updated });
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Service Details (Expanded modal info)</label>
                                  <textarea
                                    value={service.details}
                                    rows={2}
                                    onChange={(e) => {
                                      const updated = [...db.services];
                                      updated[index].details = e.target.value;
                                      setDb({ ...db, services: updated });
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-xs animate-none"
                                  />
                                </div>
                              </div>

                              <button
                                onClick={() => handleSaveSection("services", db.services)}
                                className="bg-[#0f4c81] hover:bg-blue-800 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-md cursor-pointer"
                              >
                                Save service settings
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ================= ADMIN TAB: MANAGE NEWS ================= */}
                    {adminTab === "news" && (
                      <div className="space-y-6" id="admin-news-panel">
                        {/* Editor form */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                          <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-2">
                            {editingNews?.id ? "Edit News Article" : "Write New Announcement/News Article"}
                          </h3>
                          <form onSubmit={handleSaveNews} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Title *</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Weekly Flight rate decrease"
                                  value={editingNews?.title || ""}
                                  onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Category *</label>
                                <select
                                  value={editingNews?.category || "Shipping"}
                                  onChange={(e) => setEditingNews({ ...editingNews, category: e.target.value })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-semibold text-gray-700"
                                >
                                  <option value="Shipping">Shipping</option>
                                  <option value="Sourcing">Sourcing</option>
                                  <option value="Warehousing">Warehousing</option>
                                  <option value="Rates Special">Rates Special</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">Summary *</label>
                              <input
                                type="text"
                                required
                                placeholder="Short excerpt for homepage listing..."
                                value={editingNews?.summary || ""}
                                onChange={(e) => setEditingNews({ ...editingNews, summary: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">Article Body Content *</label>
                              <textarea
                                required
                                rows={4}
                                placeholder="Write the full detail content here..."
                                value={editingNews?.content || ""}
                                onChange={(e) => setEditingNews({ ...editingNews, content: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                              />
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="submit"
                                className="bg-[#dc2626] hover:bg-red-700 text-white font-extrabold text-xs px-5 py-2 rounded-lg cursor-pointer transition-colors"
                              >
                                {editingNews?.id ? "Update Article" : "Publish to Site"}
                              </button>
                              {editingNews && (
                                <button
                                  type="button"
                                  onClick={() => setEditingNews(null)}
                                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs px-4 py-2 rounded-lg"
                                >
                                  Clear / Cancel
                                </button>
                              )}
                            </div>
                          </form>
                        </div>

                        {/* List of current news articles */}
                        <div className="space-y-3">
                          <h3 className="font-extrabold text-sm text-gray-900">Current Site Articles ({news.length})</h3>
                          <div className="grid grid-cols-1 gap-3">
                            {news.map((item: NewsItem) => (
                              <div key={item.id} className="bg-gray-50 p-4 rounded-xl border border-gray-150 flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-blue-100 text-[#0f4c81] text-[9px] font-black px-2 py-0.5 rounded uppercase">
                                      {item.category}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-bold">{item.date}</span>
                                  </div>
                                  <h4 className="font-bold text-sm text-gray-900">{item.title}</h4>
                                  <p className="text-xs text-gray-500 line-clamp-1">{item.summary}</p>
                                </div>

                                <div className="flex gap-2 flex-shrink-0">
                                  <button
                                    onClick={() => setEditingNews(item)}
                                    className="p-1.5 text-gray-500 hover:text-[#0f4c81] hover:bg-white rounded border border-transparent hover:border-gray-100"
                                    title="Edit"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteNews(item.id)}
                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-gray-100"
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ================= ADMIN TAB: ANNOUNCEMENTS ================= */}
                    {adminTab === "announcements" && (
                      <div className="space-y-6" id="admin-announcements-panel">
                        <div className="bg-red-50 text-red-950 p-4 rounded-xl text-xs leading-relaxed border border-red-200/50 mb-4">
                          Announcements display immediately in the red banner alert at the very top of the website for all public pages. Useful for holiday alerts or pricing warnings.
                        </div>

                        <div className="space-y-4">
                          {editingAnnouncements.map((ann: Announcement, index: number) => (
                            <div key={ann.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-xs text-gray-800">Alert Notification #{index + 1}</span>
                                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                                  <input
                                    type="checkbox"
                                    checked={ann.active}
                                    onChange={(e) => {
                                      const updated = [...editingAnnouncements];
                                      updated[index].active = e.target.checked;
                                      setEditingAnnouncements(updated);
                                    }}
                                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                  />
                                  Active (Shown in Top Bar)
                                </label>
                              </div>

                              <div className="grid grid-cols-1 gap-2">
                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Headline Alert Label</label>
                                  <input
                                    type="text"
                                    value={ann.title}
                                    onChange={(e) => {
                                      const updated = [...editingAnnouncements];
                                      updated[index].title = e.target.value;
                                      setEditingAnnouncements(updated);
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Alert Content Body</label>
                                  <input
                                    type="text"
                                    value={ann.content}
                                    onChange={(e) => {
                                      const updated = [...editingAnnouncements];
                                      updated[index].content = e.target.value;
                                      setEditingAnnouncements(updated);
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={handleSaveAnnouncements}
                          className="bg-[#dc2626] hover:bg-red-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-xs cursor-pointer transition-colors"
                        >
                          Save Announcements alerts
                        </button>
                      </div>
                    )}

                    {/* ================= ADMIN TAB: ENQUIRIES ================= */}
                    {adminTab === "enquiries" && (
                      <div className="space-y-6" id="admin-enquiries-panel">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <h3 className="font-extrabold text-sm text-gray-900">Submitted Client Quotes ({submissions.length})</h3>
                          <span className="text-xs text-[#0f4c81] font-bold">Manage pipeline leads securely</span>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {submissions && submissions.length > 0 ? (
                            submissions.map((sub: Submission) => (
                              <div key={sub.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-200/80 space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h4 className="font-black text-base text-gray-900">{sub.fullName}</h4>
                                      <span className="bg-blue-100 text-[#0f4c81] text-[10px] font-black px-2 py-0.5 rounded">
                                        {sub.serviceNeeded}
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-500 font-bold">{sub.companyName} • {new Date(sub.date).toLocaleDateString()}</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <label className="text-xs font-bold text-gray-500">Status:</label>
                                    <select
                                      value={sub.status}
                                      onChange={(e) => handleUpdateInquiryStatus(sub.id, e.target.value)}
                                      className={`text-xs font-extrabold rounded-lg px-2.5 py-1 focus:outline-none border ${
                                        sub.status === "Unread"
                                          ? "bg-red-50 text-red-600 border-red-200"
                                          : sub.status === "Read"
                                          ? "bg-amber-50 text-amber-600 border-amber-200"
                                          : sub.status === "Contacted"
                                          ? "bg-blue-50 text-blue-600 border-blue-200"
                                          : sub.status === "Replied"
                                          ? "bg-purple-50 text-purple-600 border-purple-200"
                                          : "bg-emerald-50 text-emerald-600 border-emerald-200"
                                      }`}
                                    >
                                      <option value="Unread">🔴 Unread</option>
                                      <option value="Read">🟡 Read</option>
                                      <option value="Contacted">🔵 Contacted</option>
                                      <option value="Replied">🟣 Replied</option>
                                      <option value="Resolved">🟢 Resolved</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Inquiry Tabs Layout */}
                                <div className="border-b border-gray-200/80 flex space-x-4">
                                  <button
                                    onClick={() => {
                                      setActiveInquiryTab(prev => ({ ...prev, [sub.id]: "details" }));
                                    }}
                                    className={`pb-2 text-xs font-bold transition-all border-b-2 ${
                                      activeInquiryTab[sub.id] !== "history"
                                        ? "text-[#0f4c81] border-[#0f4c81]"
                                        : "text-gray-400 border-transparent hover:text-gray-600"
                                    }`}
                                  >
                                    📝 Inquiry Details
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveInquiryTab(prev => ({ ...prev, [sub.id]: "history" }));
                                    }}
                                    className={`pb-2 text-xs font-bold transition-all border-b-2 ${
                                      activeInquiryTab[sub.id] === "history"
                                        ? "text-[#0f4c81] border-[#0f4c81]"
                                        : "text-gray-400 border-transparent hover:text-gray-600"
                                    }`}
                                  >
                                    💬 Conversation History
                                  </button>
                                </div>

                                {activeInquiryTab[sub.id] === "history" ? (
                                  <div className="bg-white p-4 rounded-xl border border-gray-150 text-xs text-gray-700 font-medium leading-relaxed max-h-48 overflow-y-auto space-y-3">
                                    {(() => {
                                      const customerConvs = (db as any)?.customer_conversations || [];
                                      const matchedConvs = customerConvs.filter(
                                        (c: any) =>
                                          (c.phone && sub.phone && c.phone.trim() === sub.phone.trim()) ||
                                          (c.customer_name && sub.fullName && c.customer_name.toLowerCase() === sub.fullName.toLowerCase())
                                      );

                                      if (matchedConvs.length === 0) {
                                        return (
                                          <div className="text-center py-4 text-gray-400 italic">
                                            No previous WhatsApp conversation history found for this customer.
                                          </div>
                                        );
                                      }

                                      return matchedConvs.map((c: any) => (
                                        <div key={c.id} className="border-b border-gray-100 pb-2.5 last:border-0 last:pb-0">
                                          <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold mb-1">
                                            <span>📞 Outgoing via WhatsApp</span>
                                            <span>{new Date(c.created_at).toLocaleString()}</span>
                                          </div>
                                          <p className="whitespace-pre-wrap text-gray-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-sans">
                                            {c.message}
                                          </p>
                                        </div>
                                      ));
                                    })()}
                                  </div>
                                ) : (
                                  <div className="bg-white p-4 rounded-xl border border-gray-100 text-xs text-gray-700 font-medium leading-relaxed italic">
                                    "{sub.message}"
                                  </div>
                                )}

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t border-gray-150 gap-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <Mail size={13} className="text-[#0f4c81] flex-shrink-0" /> Email: <span className="text-gray-900 font-bold break-all">{sub.email}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Phone size={13} className="text-[#0f4c81] flex-shrink-0" /> Phone: <span className="text-gray-900 font-bold">{sub.phone || "Not provided"}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      onClick={() => {
                                        setActiveInquiryForWhatsApp(sub);
                                        setWhatsAppModalOpen(true);
                                        const defaultTemplate = WHATSAPP_TEMPLATES[0].text
                                          .replace(/{customer_name}/g, sub.fullName)
                                          .replace(/{service}/g, sub.serviceNeeded || "General Enquiry");
                                        setWhatsAppMessageText(defaultTemplate);
                                        setSelectedWhatsAppTemplate("shipping_quote");
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-3.5 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider cursor-pointer whitespace-nowrap"
                                    >
                                      <span>💬 Reply on WhatsApp</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        setActiveInquiryForInvoice(sub);
                                        setInvoiceId(`INV-${new Date().getFullYear()}-${sub.id.substring(0, 4).toUpperCase()}`);
                                        setInvoiceItems([
                                          { description: `${sub.serviceNeeded} Transit Logistics Service`, quantity: 1, unitPrice: 480 },
                                          { description: "Customs Clearing & Sourcing Admin Handling", quantity: 1, unitPrice: 150 },
                                        ]);
                                        setShowInvoiceEmailView(false);
                                      }}
                                      className="bg-[#0f4c81] hover:bg-blue-800 text-white font-extrabold text-[10px] px-3.5 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider cursor-pointer whitespace-nowrap"
                                    >
                                      <span>🧾 Generate Invoice / Receipt</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-2xl italic border border-gray-150">
                              No client quote submissions found on the database.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ================= ADMIN TAB: MEDIA MANAGER ================= */}
                    {adminTab === "media" && (
                      <div className="space-y-6" id="admin-media-panel">
                        <div className="bg-blue-50 text-blue-950 p-4 rounded-xl text-xs leading-relaxed border border-blue-200/50 mb-4">
                          Upload your custom cargo or warehouse photos to our server, or select preset premium unsplash freight image links below to easily use in news articles or sliders.
                        </div>

                        {/* Upload Form */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                          <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-2">Load Custom Image File</h3>
                          <form onSubmit={handleUploadMedia} className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Image Asset Name *</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Guangzhou Warehouse Inside"
                                  value={mediaUploadName}
                                  onChange={(e) => setMediaUploadName(e.target.value)}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Method 1: Upload File (PNG/JPG)</label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleMediaFileChange}
                                  className="w-full text-xs"
                                />
                              </div>
                            </div>

                            <div className="text-xs font-bold text-gray-400 text-center uppercase tracking-widest my-2">— OR —</div>

                            <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">Method 2: Directly input external URL (Unsplash, etc.)</label>
                              <input
                                type="text"
                                placeholder="https://images.unsplash.com/photo-..."
                                value={mediaUploadUrl}
                                onChange={(e) => setMediaUploadUrl(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={mediaUploading}
                              className="bg-[#0f4c81] hover:bg-blue-800 text-white font-extrabold text-xs px-5 py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              {mediaUploading ? (
                                <>
                                  <Loader2 size={13} className="animate-spin" /> Storing...
                                </>
                              ) : (
                                "Register Image Asset"
                              )}
                            </button>
                          </form>
                        </div>

                        {/* Preset images reference list */}
                        <div className="space-y-3">
                          <h3 className="font-extrabold text-sm text-gray-900">Preset High-Resolution Freight Images</h3>
                          <p className="text-xs text-gray-500">Click any button below to instantly copy its URL, then paste it in Slide background or News images fields!</p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {presetImages.map((img, idx) => (
                              <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex gap-3 items-center">
                                <img src={img.url} className="w-16 h-12 rounded object-cover border border-gray-200 flex-shrink-0" alt="Preset" />
                                <div className="space-y-1">
                                  <span className="font-bold text-xs text-gray-900 block leading-tight">{img.name}</span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(img.url);
                                      addToast("Preset Image URL Copied to clipboard!", "success");
                                    }}
                                    className="text-[10px] text-red-600 font-extrabold hover:underline"
                                  >
                                    Copy Link URL
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ================= ADMIN TAB: SEO ================= */}
                    {adminTab === "seo" && editSeo && (
                      <div className="space-y-6" id="admin-seo-panel">
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                          <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-2">Meta Engine Configuration</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">Global Website Meta Title</label>
                              <input
                                type="text"
                                value={editSeo.metaTitle}
                                onChange={(e) => setEditSeo({ ...editSeo, metaTitle: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">Global Meta Description</label>
                              <textarea
                                value={editSeo.metaDescription}
                                rows={3}
                                onChange={(e) => setEditSeo({ ...editSeo, metaDescription: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1">SEO Keywords (Comma Separated)</label>
                              <input
                                type="text"
                                value={editSeo.keywords}
                                onChange={(e) => setEditSeo({ ...editSeo, keywords: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => handleSaveSection("seo", editSeo)}
                            className="bg-[#0f4c81] hover:bg-blue-800 text-white font-extrabold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors"
                          >
                            Save SEO Settings
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ================= ADMIN TAB: COMPANY SETTINGS ================= */}
                    {adminTab === "settings" && editCompanySettings && (
                      <div className="space-y-8" id="admin-settings-panel">
                        <div className="bg-blue-50 text-blue-950 p-4 rounded-xl text-xs leading-relaxed border border-blue-200/50">
                          Configure your company profile, contacts, office locations, social media, custom WhatsApp message strings, and active homepage announcement bar settings. All changes apply dynamically across the entire website.
                        </div>

                        <div className="space-y-6">
                          {/* 1. Company Information */}
                          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                            <h3 className="font-extrabold text-base text-gray-900 border-b border-gray-150 pb-2 flex items-center gap-2">
                              <span className="w-1.5 h-5 bg-[#0f4c81] rounded-full" />
                              Company Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-600 mb-1">Company Name</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.companyInfo?.name || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    companyInfo: { ...editCompanySettings.companyInfo, name: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-semibold"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-600 mb-1">Company Tagline</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.companyInfo?.tagline || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    companyInfo: { ...editCompanySettings.companyInfo, tagline: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-600 mb-1">Company Description</label>
                                <textarea
                                  rows={3}
                                  value={editCompanySettings.companyInfo?.description || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    companyInfo: { ...editCompanySettings.companyInfo, description: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Company Logo (Image URL)</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.companyInfo?.logo || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    companyInfo: { ...editCompanySettings.companyInfo, logo: e.target.value }
                                  })}
                                  placeholder="Leave blank for default icon brand"
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Company Favicon (Image URL)</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.companyInfo?.favicon || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    companyInfo: { ...editCompanySettings.companyInfo, favicon: e.target.value }
                                  })}
                                  placeholder="Favicon image link"
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                />
                              </div>
                            </div>
                          </div>

                          {/* 2. Contact Information */}
                          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                            <h3 className="font-extrabold text-base text-gray-900 border-b border-gray-150 pb-2 flex items-center gap-2">
                              <span className="w-1.5 h-5 bg-[#0f4c81] rounded-full" />
                              Contact Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Nigeria Phone Number</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.contactInfo?.phoneNigeria || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    contactInfo: { ...editCompanySettings.contactInfo, phoneNigeria: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">China Phone Number (Optional)</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.contactInfo?.phoneChina || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    contactInfo: { ...editCompanySettings.contactInfo, phoneChina: e.target.value }
                                  })}
                                  placeholder="e.g. +86..."
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">WhatsApp Number</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.contactInfo?.whatsApp || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    contactInfo: { ...editCompanySettings.contactInfo, whatsApp: e.target.value }
                                  })}
                                  placeholder="Numbers only, e.g. 2348160850963"
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Business Email</label>
                                <input
                                  type="email"
                                  value={editCompanySettings.contactInfo?.emailBusiness || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    contactInfo: { ...editCompanySettings.contactInfo, emailBusiness: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-600 mb-1">Support Email</label>
                                <input
                                  type="email"
                                  value={editCompanySettings.contactInfo?.emailSupport || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    contactInfo: { ...editCompanySettings.contactInfo, emailSupport: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                />
                              </div>
                            </div>
                          </div>

                          {/* 3. Office Locations */}
                          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                            <h3 className="font-extrabold text-base text-gray-900 border-b border-gray-150 pb-2 flex items-center gap-2">
                              <span className="w-1.5 h-5 bg-[#0f4c81] rounded-full" />
                              Office Locations
                            </h3>
                            <div className="space-y-4">
                              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-150 space-y-3">
                                <span className="text-xs font-black text-red-600 uppercase tracking-widest block">🇳🇬 Nigeria Office</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Office Name</label>
                                    <input
                                      type="text"
                                      value={editCompanySettings.officeLocations?.nigeria?.name || ""}
                                      onChange={(e) => setEditCompanySettings({
                                        ...editCompanySettings,
                                        officeLocations: {
                                          ...editCompanySettings.officeLocations,
                                          nigeria: { ...editCompanySettings.officeLocations?.nigeria, name: e.target.value }
                                        }
                                      })}
                                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-bold"
                                    />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Full Address</label>
                                    <input
                                      type="text"
                                      value={editCompanySettings.officeLocations?.nigeria?.address || ""}
                                      onChange={(e) => setEditCompanySettings({
                                        ...editCompanySettings,
                                        officeLocations: {
                                          ...editCompanySettings.officeLocations,
                                          nigeria: { ...editCompanySettings.officeLocations?.nigeria, address: e.target.value }
                                        }
                                      })}
                                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs"
                                    />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Google Maps Link</label>
                                    <input
                                      type="text"
                                      value={editCompanySettings.officeLocations?.nigeria?.mapsLink || ""}
                                      onChange={(e) => setEditCompanySettings({
                                        ...editCompanySettings,
                                        officeLocations: {
                                          ...editCompanySettings.officeLocations,
                                          nigeria: { ...editCompanySettings.officeLocations?.nigeria, mapsLink: e.target.value }
                                        }
                                      })}
                                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-150 space-y-3">
                                <span className="text-xs font-black text-red-600 uppercase tracking-widest block">🇨🇳 China Office</span>
                                <p className="text-[11px] text-gray-500">
                                  You specified you do not have a physical office address in China. Leave the address field blank to display only <strong>"China"</strong>. If an office address becomes available, enter it here to show it.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Office Name</label>
                                    <input
                                      type="text"
                                      value={editCompanySettings.officeLocations?.china?.name || ""}
                                      onChange={(e) => setEditCompanySettings({
                                        ...editCompanySettings,
                                        officeLocations: {
                                          ...editCompanySettings.officeLocations,
                                          china: { ...editCompanySettings.officeLocations?.china, name: e.target.value }
                                        }
                                      })}
                                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-bold"
                                    />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Full Address (Optional / Leave blank for just "China")</label>
                                    <input
                                      type="text"
                                      value={editCompanySettings.officeLocations?.china?.address || ""}
                                      onChange={(e) => setEditCompanySettings({
                                        ...editCompanySettings,
                                        officeLocations: {
                                          ...editCompanySettings.officeLocations,
                                          china: { ...editCompanySettings.officeLocations?.china, address: e.target.value }
                                        }
                                      })}
                                      placeholder="Leave blank if no physical office"
                                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs"
                                    />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Google Maps Link (Optional)</label>
                                    <input
                                      type="text"
                                      value={editCompanySettings.officeLocations?.china?.mapsLink || ""}
                                      onChange={(e) => setEditCompanySettings({
                                        ...editCompanySettings,
                                        officeLocations: {
                                          ...editCompanySettings.officeLocations,
                                          china: { ...editCompanySettings.officeLocations?.china, mapsLink: e.target.value }
                                        }
                                      })}
                                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 4. Social Media */}
                          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                            <h3 className="font-extrabold text-base text-gray-900 border-b border-gray-150 pb-2 flex items-center gap-2">
                              <span className="w-1.5 h-5 bg-[#0f4c81] rounded-full" />
                              Social Media
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Facebook URL</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.socialMedia?.facebook || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    socialMedia: { ...editCompanySettings.socialMedia, facebook: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Instagram URL</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.socialMedia?.instagram || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    socialMedia: { ...editCompanySettings.socialMedia, instagram: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">TikTok URL</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.socialMedia?.tiktok || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    socialMedia: { ...editCompanySettings.socialMedia, tiktok: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                />
                              </div>
                            </div>
                          </div>

                          {/* 5. WhatsApp Settings */}
                          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                            <h3 className="font-extrabold text-base text-gray-900 border-b border-gray-150 pb-2 flex items-center gap-2">
                              <span className="w-1.5 h-5 bg-[#0f4c81] rounded-full" />
                              WhatsApp Message Templates
                            </h3>
                            <p className="text-xs text-gray-500">
                              Configure target WhatsApp number and predefined template messages for buttons throughout the site. Keep messages URL-friendly (they will be pre-filled inside customer clicks).
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">WhatsApp Number (For links, numbers only e.g. 2348160850963)</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.whatsAppSettings?.whatsAppNumber || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    whatsAppSettings: { ...editCompanySettings.whatsAppSettings, whatsAppNumber: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Default Contact Message</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.whatsAppSettings?.defaultMessage || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    whatsAppSettings: { ...editCompanySettings.whatsAppSettings, defaultMessage: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Quote Request Message</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.whatsAppSettings?.quoteMessage || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    whatsAppSettings: { ...editCompanySettings.whatsAppSettings, quoteMessage: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Import from China Message</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.whatsAppSettings?.importMessage || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    whatsAppSettings: { ...editCompanySettings.whatsAppSettings, importMessage: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Export Message</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.whatsAppSettings?.exportMessage || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    whatsAppSettings: { ...editCompanySettings.whatsAppSettings, exportMessage: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Air Freight Message</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.whatsAppSettings?.airFreightMessage || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    whatsAppSettings: { ...editCompanySettings.whatsAppSettings, airFreightMessage: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Sea Freight Message</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.whatsAppSettings?.seaFreightMessage || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    whatsAppSettings: { ...editCompanySettings.whatsAppSettings, seaFreightMessage: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Package Tracking Message</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.whatsAppSettings?.trackingMessage || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    whatsAppSettings: { ...editCompanySettings.whatsAppSettings, trackingMessage: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                />
                              </div>
                            </div>
                          </div>

                          {/* 6. Business Hours */}
                          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                            <h3 className="font-extrabold text-base text-gray-900 border-b border-gray-150 pb-2 flex items-center gap-2">
                              <span className="w-1.5 h-5 bg-[#0f4c81] rounded-full" />
                              Business Hours
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Monday</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.businessHours?.monday || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    businessHours: { ...editCompanySettings.businessHours, monday: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-semibold"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Tuesday</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.businessHours?.tuesday || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    businessHours: { ...editCompanySettings.businessHours, tuesday: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-semibold"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Wednesday</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.businessHours?.wednesday || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    businessHours: { ...editCompanySettings.businessHours, wednesday: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-semibold"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Thursday</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.businessHours?.thursday || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    businessHours: { ...editCompanySettings.businessHours, thursday: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-semibold"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Friday</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.businessHours?.friday || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    businessHours: { ...editCompanySettings.businessHours, friday: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-semibold"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Saturday</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.businessHours?.saturday || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    businessHours: { ...editCompanySettings.businessHours, saturday: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-semibold"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Sunday</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.businessHours?.sunday || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    businessHours: { ...editCompanySettings.businessHours, sunday: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-semibold"
                                />
                              </div>
                            </div>
                          </div>

                          {/* 7. Homepage Announcement Bar */}
                          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                            <h3 className="font-extrabold text-base text-gray-900 border-b border-gray-150 pb-2 flex items-center gap-2">
                              <span className="w-1.5 h-5 bg-[#0f4c81] rounded-full" />
                              Homepage Announcement Bar
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-600 mb-1">Announcement Text</label>
                                <input
                                  type="text"
                                  value={editCompanySettings.announcementBar?.text || ""}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    announcementBar: { ...editCompanySettings.announcementBar, text: e.target.value }
                                  })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Announcement Color (HEX)</label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={editCompanySettings.announcementBar?.color || "#0f4c81"}
                                    onChange={(e) => setEditCompanySettings({
                                      ...editCompanySettings,
                                      announcementBar: { ...editCompanySettings.announcementBar, color: e.target.value }
                                    })}
                                    className="w-8 h-8 rounded cursor-pointer border border-gray-200 p-0"
                                  />
                                  <input
                                    type="text"
                                    value={editCompanySettings.announcementBar?.color || ""}
                                    onChange={(e) => setEditCompanySettings({
                                      ...editCompanySettings,
                                      announcementBar: { ...editCompanySettings.announcementBar, color: e.target.value }
                                    })}
                                    placeholder="#0f4c81"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-1.5 text-xs font-mono"
                                  />
                                </div>
                              </div>
                              <div className="md:col-span-3 flex items-center gap-2.5 pt-2">
                                <input
                                  type="checkbox"
                                  id="announcement-enabled-toggle"
                                  checked={!!editCompanySettings.announcementBar?.enabled}
                                  onChange={(e) => setEditCompanySettings({
                                    ...editCompanySettings,
                                    announcementBar: { ...editCompanySettings.announcementBar, enabled: e.target.checked }
                                  })}
                                  className="w-4 h-4 text-[#0f4c81] focus:ring-[#0f4c81] border-gray-300 rounded cursor-pointer"
                                />
                                <label htmlFor="announcement-enabled-toggle" className="text-xs font-bold text-gray-700 cursor-pointer">
                                  Enable Announcement Bar on Homepage
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* 8. Save Settings Button */}
                          <div className="bg-slate-50 border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                              <h4 className="font-extrabold text-sm text-gray-900">Commit Company Profile Updates</h4>
                              <p className="text-xs text-gray-500">Save all form values securely. Changes are applied in real-time instantly without re-deploying code.</p>
                            </div>
                            <button
                              onClick={() => handleSaveSection("companySettings", editCompanySettings)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <CheckCircle size={14} /> Save Company Settings
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ================= ADMIN TAB: BACKUP ================= */}
                    {adminTab === "backup" && (
                      <div className="space-y-6" id="admin-backup-panel">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          
                          {/* Export */}
                          <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-3">
                            <h4 className="font-bold text-base text-gray-900">1. Export Full Database</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              Download a single `.json` backup file of all homepage slides, about copy, news items, and customer enquiries.
                            </p>
                            <a
                              href={`/api/backup/download?token=${adminToken}`}
                              download
                              className="bg-[#0f4c81] hover:bg-blue-800 text-white text-xs font-extrabold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 self-start"
                            >
                              <Download size={14} /> Download JSON Backup
                            </a>
                          </div>

                          {/* Restore */}
                          <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-3">
                            <h4 className="font-bold text-base text-gray-900">2. Restore Database</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              Upload a previously exported `.json` file to restore settings immediately.
                            </p>
                            <label className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer">
                              <Upload size={14} /> Upload Backup File
                              <input
                                type="file"
                                accept=".json"
                                onChange={handleTriggerRestore}
                                className="hidden"
                              />
                            </label>
                          </div>

                        </div>

                        {/* Dangerous block reset */}
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
                          <h4 className="font-bold text-red-900 flex items-center gap-1.5">
                            <AlertTriangle size={18} className="text-red-600" />
                            Dangerous Operations Section
                          </h4>
                          <p className="text-xs text-red-800 leading-relaxed">
                            Resets all slides, statistics, about records, and news articles back to original system factory seed data. Any customer inquiries on the record will be erased!
                          </p>
                          <button
                            onClick={handleResetToDefault}
                            className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-5 py-2 rounded-lg cursor-pointer transition-colors"
                          >
                            Execute Factory Seed Reset
                          </button>
                        </div>
                      </div>
                    )}

                  </section>
                </div>
              )}

            </div>
          </div>
          </ProtectedRoute>
        )}
      </main>

      {/* ==================== WHATSAPP COMMUNICATION MODAL ==================== */}
      {whatsAppModalOpen && activeInquiryForWhatsApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print" id="whatsapp-modal">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <span className="text-xl">💬</span>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight">WhatsApp Communication Portal</h3>
                  <p className="text-[10px] text-emerald-400 font-extrabold tracking-widest uppercase">Admin Desk Link</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setWhatsAppModalOpen(false);
                  setActiveInquiryForWhatsApp(null);
                }}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1 text-sm font-black"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-grow">
              {/* Customer Details Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-[10px] text-[#0f4c81] font-black uppercase tracking-wider">Customer Details</span>
                  <span className="bg-blue-100 text-[#0f4c81] text-[9px] font-black px-2 py-0.5 rounded-md">
                    {activeInquiryForWhatsApp.serviceNeeded}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700">
                  <div>
                    <p className="text-gray-400 font-bold text-[10px] uppercase">Customer Name</p>
                    <p className="font-extrabold text-slate-900">{activeInquiryForWhatsApp.fullName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-bold text-[10px] uppercase">Phone Number</p>
                    <p className="font-extrabold text-slate-900">{activeInquiryForWhatsApp.phone || "Not provided"}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-gray-400 font-bold text-[10px] uppercase mb-1">Original Enquiry Message</p>
                  <p className="text-xs text-gray-600 bg-white p-2.5 rounded-lg border border-slate-100 italic">
                    "{activeInquiryForWhatsApp.message}"
                  </p>
                </div>
              </div>

              {/* Template Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600">Select Communication Template</label>
                <select
                  value={selectedWhatsAppTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0f4c81] transition-all"
                >
                  {WHATSAPP_TEMPLATES.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Large Editable Message Box */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-gray-600">Editable Message Content</label>
                  <span className="text-[10px] text-gray-400 font-bold">You can fully customize this before sending</span>
                </div>
                <textarea
                  value={whatsAppMessageText}
                  onChange={(e) => setWhatsAppMessageText(e.target.value)}
                  rows={8}
                  placeholder="Type your custom WhatsApp message here..."
                  className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#0f4c81] transition-all font-sans leading-relaxed"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row justify-end items-center gap-3">
              <button
                onClick={() => {
                  setWhatsAppModalOpen(false);
                  setActiveInquiryForWhatsApp(null);
                }}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                onClick={handleSendWhatsApp}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer uppercase tracking-wider"
              >
                <span>💬 Open WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 8. INVOICE & RECEIPT GENERATOR MODAL ==================== */}
      {activeInquiryForInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 no-print" id="invoice-generator-modal">
          {/* Dynamic CSS for beautiful high-fidelity print layouts */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body {
                background-color: white !important;
                color: black !important;
              }
              .no-print {
                display: none !important;
                height: 0 !important;
                width: 0 !important;
                overflow: hidden !important;
              }
              #print-invoice-sheet {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 1.5in !important;
                box-shadow: none !important;
                border: none !important;
              }
            }
          `}} />

          <div className="bg-slate-50 w-full max-w-6xl rounded-3xl shadow-2xl border border-gray-150 overflow-hidden flex flex-col lg:flex-row max-h-[90vh]">
            {/* Left Panel: Inputs & Configuration */}
            <div className="lg:w-5/12 bg-white p-6 border-b lg:border-b-0 lg:border-r border-gray-150 overflow-y-auto flex flex-col justify-between max-h-[45vh] lg:max-h-none">
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">Invoice &amp; Receipt Builder</h3>
                    <p className="text-[10px] text-gray-500 font-bold">Configure client rate sheets and direct email templates</p>
                  </div>
                  <button 
                    onClick={() => setActiveInquiryForInvoice(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Client Info Context */}
                <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 space-y-2">
                  <span className="text-[9px] font-black text-[#0f4c81] uppercase tracking-wider block">Client Context</span>
                  <div className="text-xs space-y-1">
                    <p className="font-extrabold text-slate-800">{activeInquiryForInvoice.fullName}</p>
                    <p className="text-gray-500 font-medium">Company: {activeInquiryForInvoice.companyName || "N/A"}</p>
                    <p className="text-gray-500 font-medium">Service Requested: {activeInquiryForInvoice.serviceNeeded}</p>
                  </div>
                </div>

                {/* General Config parameters */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Invoice ID / Reference</label>
                    <input 
                      type="text" 
                      value={invoiceId}
                      onChange={(e) => setInvoiceId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#0f4c81]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Currency</label>
                    <select 
                      value={invoiceCurrency}
                      onChange={(e) => setInvoiceCurrency(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#0f4c81]"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="NGN">NGN (₦)</option>
                      <option value="CNY">CNY (¥)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Invoice Date</label>
                    <input 
                      type="date" 
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#0f4c81]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Due Date</label>
                    <input 
                      type="date" 
                      value={invoiceDueDate}
                      onChange={(e) => setInvoiceDueDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#0f4c81]"
                    />
                  </div>
                </div>

                {/* Line Items Builder */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Rate Sheet Line Items</span>
                    <button 
                      onClick={() => setInvoiceItems([...invoiceItems, { description: "Custom Cargo Handling", quantity: 1, unitPrice: 100 }])}
                      className="text-[10px] text-[#0f4c81] font-black hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} /> Add Item
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                    {invoiceItems.map((item, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-150 space-y-2 relative group">
                        <button 
                          onClick={() => {
                            const updated = [...invoiceItems];
                            updated.splice(idx, 1);
                            setInvoiceItems(updated);
                          }}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                        <div className="pr-6">
                          <input 
                            type="text"
                            value={item.description}
                            onChange={(e) => {
                              const updated = [...invoiceItems];
                              updated[idx].description = e.target.value;
                              setInvoiceItems(updated);
                            }}
                            placeholder="Item Description"
                            className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-semibold mb-2 focus:outline-none focus:border-[#0f4c81]"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[8px] text-gray-400 font-bold uppercase mb-0.5">Quantity</label>
                              <input 
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                  const updated = [...invoiceItems];
                                  updated[idx].quantity = parseInt(e.target.value) || 1;
                                  setInvoiceItems(updated);
                                }}
                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-[#0f4c81]"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] text-gray-400 font-bold uppercase mb-0.5">Unit Price</label>
                              <input 
                                type="number"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) => {
                                  const updated = [...invoiceItems];
                                  updated[idx].unitPrice = parseFloat(e.target.value) || 0;
                                  setInvoiceItems(updated);
                                }}
                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-[#0f4c81]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Left Panel Footer Options */}
              <div className="pt-6 border-t border-gray-150 space-y-2 mt-4 p-6 bg-slate-50/50">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowInvoiceEmailView(false)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer text-center ${
                      !showInvoiceEmailView 
                        ? "bg-slate-900 text-white" 
                        : "bg-white hover:bg-gray-50 text-slate-800 border border-gray-200"
                    }`}
                  >
                    📄 PDF Invoice Template
                  </button>
                  <button
                    onClick={() => setShowInvoiceEmailView(true)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer text-center ${
                      showInvoiceEmailView 
                        ? "bg-slate-900 text-white" 
                        : "bg-white hover:bg-gray-50 text-slate-800 border border-gray-200"
                    }`}
                  >
                    ✉️ Email Template
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-2">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="bg-[#0f4c81] hover:bg-blue-800 text-white font-extrabold text-xs py-3.5 rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-sm w-full"
                  >
                    <Printer size={14} /> Print / Save PDF Document
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel: Live Document Preview Sheet */}
            <div className="lg:w-7/12 bg-slate-100 p-6 sm:p-8 overflow-y-auto flex justify-center items-start max-h-[45vh] lg:max-h-none flex-1">
              {!showInvoiceEmailView ? (
                /* Formal Print/PDF Invoice Sheet Layout */
                <div 
                  id="print-invoice-sheet"
                  className="bg-white w-full max-w-[21cm] p-8 sm:p-12 rounded-2xl shadow-xl border border-gray-200 flex flex-col justify-between font-sans leading-relaxed text-gray-800"
                >
                  <div className="space-y-8">
                    {/* Brand Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-200">
                      <div>
                        <span className="text-xl sm:text-2xl font-black tracking-tight leading-none block mb-1">
                          <span className="text-[#0f172a]">Binna's</span>{" "}
                          <span className="text-[#0f4c81]">Logistics</span>{" "}
                          <span className="text-[#dc2626]">Global</span>
                        </span>
                        <p className="text-[10px] text-[#0f4c81] font-extrabold tracking-widest uppercase">
                          Cargo Transit &amp; Freight Clearances
                        </p>
                      </div>
                      <div className="text-left sm:text-right text-xs">
                        <h2 className="text-base font-black text-slate-900 tracking-wider uppercase mb-1">Formal Invoice</h2>
                        <p className="text-gray-500 font-mono font-bold">Ref: {invoiceId}</p>
                      </div>
                    </div>

                    {/* Addresses */}
                    <div className="grid grid-cols-2 gap-8 text-xs">
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-[#0f4c81] uppercase tracking-wider block">Logistics Provider:</span>
                        <div className="space-y-1 font-medium text-gray-600">
                          <p className="font-extrabold text-slate-900">Binna's Logistics Global</p>
                          <p>Lagos: Limousine Park, Int'l Airport Rd</p>
                          <p>Abuja: International Airport Office</p>
                          <p>China: Baiyun District, Guangzhou</p>
                          <p>Email: {emailBusiness}</p>
                          <p>Tel: +{whatsAppNumber}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-[#dc2626] uppercase tracking-wider block">Billed To (Consignee):</span>
                        <div className="space-y-1 font-medium text-gray-600">
                          <p className="font-extrabold text-slate-900">{activeInquiryForInvoice.fullName}</p>
                          {activeInquiryForInvoice.companyName && <p>{activeInquiryForInvoice.companyName}</p>}
                          <p className="break-all">Email: {activeInquiryForInvoice.email}</p>
                          {activeInquiryForInvoice.phone && <p>Tel: {activeInquiryForInvoice.phone}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Date details bar */}
                    <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-150 text-xs text-gray-600 font-bold">
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Date Issued</span>
                        <span className="text-slate-800 font-mono font-black">{new Date(invoiceDate).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Due Date</span>
                        <span className="text-slate-800 font-mono font-black">{new Date(invoiceDueDate).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Method</span>
                        <span className="text-[#0f4c81] uppercase tracking-widest block font-black">Direct Wire</span>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-500 font-bold">
                            <th className="py-2.5 uppercase tracking-wider">Transit Details / Service Description</th>
                            <th className="py-2.5 text-right uppercase tracking-wider w-16">Qty</th>
                            <th className="py-2.5 text-right uppercase tracking-wider w-24">Unit Rate</th>
                            <th className="py-2.5 text-right uppercase tracking-wider w-24">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="font-semibold text-slate-700">
                          {invoiceItems.map((item, i) => (
                            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                              <td className="py-3 font-bold text-slate-800">{item.description}</td>
                              <td className="py-3 text-right font-mono">{item.quantity}</td>
                              <td className="py-3 text-right font-mono">{invoiceCurrency === "USD" ? "$" : invoiceCurrency === "NGN" ? "₦" : "¥"}{item.unitPrice.toLocaleString()}</td>
                              <td className="py-3 text-right font-mono text-slate-900 font-bold">
                                {invoiceCurrency === "USD" ? "$" : invoiceCurrency === "NGN" ? "₦" : "¥"}{(item.quantity * item.unitPrice).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Calculations */}
                    <div className="flex justify-end pt-4">
                      <div className="w-64 space-y-2 text-xs">
                        <div className="flex justify-between font-bold text-gray-500">
                          <span>Subtotal:</span>
                          <span className="font-mono text-slate-800">{invoiceCurrency === "USD" ? "$" : invoiceCurrency === "NGN" ? "₦" : "¥"}{invoiceItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-500">
                          <span>VAT / Clearing Levy (7.5%):</span>
                          <span className="font-mono text-slate-800">{invoiceCurrency === "USD" ? "$" : invoiceCurrency === "NGN" ? "₦" : "¥"}{(invoiceItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0) * 0.075).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-black text-slate-900">
                          <span>Total Due:</span>
                          <span className="font-mono text-[#0f4c81] text-base">
                            {invoiceCurrency === "USD" ? "$" : invoiceCurrency === "NGN" ? "₦" : "¥"}{(invoiceItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0) * 1.075).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Terms & Stamp */}
                  <div className="pt-8 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end mt-8 text-[10px] text-gray-500">
                    <div className="space-y-1.5">
                      <span className="font-bold text-gray-700 uppercase tracking-widest block">Terms &amp; Instructions</span>
                      <p>All air/sea cargo clearances subject to customs evaluations.</p>
                      <p>Wire transfers must declare reference: <span className="font-mono font-bold text-[#0f4c81]">{invoiceId}</span></p>
                    </div>

                    <div className="flex flex-col items-end space-y-3">
                      {/* Dynamic Receipt Stamp */}
                      <div className="border-4 border-emerald-500 text-emerald-500 font-black tracking-widest uppercase rounded-lg px-3 py-1 text-xs rotate-[-3deg] inline-block opacity-85 select-none bg-emerald-50/20">
                        Verified Paid Receipt
                      </div>
                      <div className="text-right w-full border-t border-gray-200 pt-2 text-[9px] font-bold text-gray-400">
                        Binna's Logistics Accounts Authorized
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Formal Email Notification Template format */
                <div className="bg-white w-full max-w-[600px] rounded-2xl shadow-xl border border-gray-200 overflow-hidden text-sm text-gray-800 flex flex-col justify-between">
                  <div>
                    {/* Email Header Banner */}
                    <div className="bg-[#0f4c81] p-6 text-center text-white space-y-3">
                      <div className="bg-white px-4 py-2 rounded-xl inline-block shadow-sm">
                        <span className="text-xl sm:text-2xl font-black tracking-tight leading-none block select-none">
                          <span className="text-[#0f172a]">Binna's</span>{" "}
                          <span className="text-[#0f4c81]">Logistics</span>{" "}
                          <span className="text-[#dc2626]">Global</span>
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-200 font-extrabold tracking-widest uppercase">Cargo Shipping Pipeline Dispatch</p>
                    </div>

                    {/* Email Body */}
                    <div className="p-6 sm:p-8 space-y-6">
                      <div className="space-y-2">
                        <h3 className="font-black text-slate-900 text-base">Hello {activeInquiryForInvoice.fullName},</h3>
                        <p className="text-gray-600 leading-relaxed text-xs">
                          Your shipping quote enquiry regarding <span className="font-bold text-[#0f4c81]">{activeInquiryForInvoice.serviceNeeded}</span> has been processed by our logistics management team. Below is the official cost structure and transit confirmation invoice:
                        </p>
                      </div>

                      {/* Summary Block */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-gray-150 space-y-3 text-xs">
                        <div className="flex justify-between font-bold border-b border-gray-200 pb-1.5 text-gray-400 uppercase tracking-widest text-[8px]">
                          <span>Cargo Item Description</span>
                          <span>Total Rate</span>
                        </div>
                        {invoiceItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between font-medium text-gray-700">
                            <span>{item.description} (x{item.quantity})</span>
                            <span className="font-mono text-gray-900 font-bold">{invoiceCurrency === "USD" ? "$" : invoiceCurrency === "NGN" ? "₦" : "¥"}{(item.quantity * item.unitPrice).toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-black text-slate-900 pt-2 border-t border-gray-200">
                          <span>TOTAL AMOUNT (incl. VAT):</span>
                          <span className="font-mono text-[#0f4c81] text-sm">
                            {invoiceCurrency === "USD" ? "$" : invoiceCurrency === "NGN" ? "₦" : "¥"}{(invoiceItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0) * 1.075).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* CTA button inside Email */}
                      <div className="text-center pt-2">
                        <a 
                          href={`https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(`Hello Binna's Logistics, I would like to make payment for my invoice ${invoiceId} totaling ${invoiceCurrency === "USD" ? "$" : invoiceCurrency === "NGN" ? "₦" : "¥"}${(invoiceItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0) * 1.075).toLocaleString()}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-lg inline-block uppercase tracking-wider text-decoration-none shadow-sm transition-all cursor-pointer"
                        >
                          💬 Confirm Payment Via WhatsApp
                        </a>
                      </div>

                      <div className="text-xs text-gray-500 leading-relaxed border-t border-gray-150 pt-4 space-y-1">
                        <p className="font-extrabold text-slate-800">Support Desk Context:</p>
                        <p>Need custom adjustments on tax calculations? Directly reach us at <span className="font-bold text-[#0f4c81]">{emailSupport}</span>.</p>
                        <p>Thank you for choosing Binna's Logistics Global.</p>
                      </div>
                    </div>
                  </div>

                  {/* Email Footer */}
                  <div className="bg-slate-50 p-4 border-t border-gray-100 text-center text-[10px] text-gray-400 font-medium">
                    <p>© {new Date().getFullYear()} Binna's Logistics Global. All Rights Reserved.</p>
                    <p className="mt-1 font-sans">Limousine Park, International Airport Road, Lagos, Nigeria / Baiyun District, Guangzhou, China</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer setCurrentTab={setCurrentTab} companySettings={db?.companySettings} />
    </div>
  );
}
