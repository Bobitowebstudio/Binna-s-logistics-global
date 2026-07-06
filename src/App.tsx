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
  Bell
} from "lucide-react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import SubpageHeroSlider from "./components/SubpageHeroSlider";
import { WebsiteDatabase, Submission, NewsItem, Announcement, ServiceCard } from "./types";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [db, setDb] = useState<WebsiteDatabase | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Home Hero Slider State
  const [activeSlide, setActiveSlide] = useState<number>(0);

  // Admin Authentication & Session
  const [adminToken, setAdminToken] = useState<string | null>(
    localStorage.getItem("binnas_admin_token")
  );
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [adminLoggingIn, setAdminLoggingIn] = useState<boolean>(false);

  // Admin Dashboard Tabs: 'overview', 'content', 'services', 'news', 'announcements', 'enquiries', 'media', 'seo', 'backup'
  const [adminTab, setAdminTab] = useState<string>("overview");

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

  // --- Admin Editing Forms State ---
  const [editHomepage, setEditHomepage] = useState<any>(null);
  const [editAbout, setEditAbout] = useState<any>(null);
  const [editVision, setEditVision] = useState<any>(null);
  const [editMission, setEditMission] = useState<any>(null);
  const [editContact, setEditContact] = useState<any>(null);
  const [editSeo, setEditSeo] = useState<any>(null);

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

  // Load state from Hash or defaults
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && ["home", "about", "services", "vision", "mission", "contact", "admin"].includes(hash)) {
      setCurrentTab(hash);
    } else {
      setCurrentTab("home");
    }
  }, []);

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

  const fetchAdminData = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch("/api/db", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (res.status === 403) {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("binnas_admin_token", data.token);
        setAdminToken(data.token);
        setAdminPassword("");
        addToast("Welcome back! Admin Portal successfully authorized.", "success");
      } else {
        setAdminLoginError(data.error || "Login Failed");
      }
    } catch (err) {
      setAdminLoginError("Network error. Please make sure the backend server is active.");
    } finally {
      setAdminLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("binnas_admin_token");
    setAdminToken(null);
    addToast("Logged out of Admin Portal", "info");
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <Loader2 className="w-16 h-16 text-[#0f4c81] animate-spin mb-4" />
        <h3 className="text-lg font-bold text-gray-900">Connecting to Binna's Logistics Database...</h3>
        <p className="text-sm text-gray-500 mt-1">Establishing cargo pipelines and news updates</p>
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

      <Header currentTab={currentTab} setCurrentTab={setCurrentTab} announcements={announcements} />

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
                            Guangzhou To Lagos Direct Network
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
                        href="https://wa.me/2348160850963"
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
                        <h4 className="font-extrabold text-gray-900 text-sm">Lagos Office (Nigeria)</h4>
                      </div>
                      <div className="space-y-3 text-xs text-gray-600">
                        <div className="flex items-start gap-2.5">
                          <MapPin size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                          <span>limousine Park, International Airport, Lagos, Nigeria</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Phone size={15} className="text-red-500 flex-shrink-0" />
                          <span>Phone: 08160850963</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-emerald-500 font-bold flex-shrink-0">WhatsApp:</span>
                          <span>+2348160850963</span>
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
                        <h4 className="font-extrabold text-gray-900 text-sm">Abuja Office (Nigeria)</h4>
                      </div>
                      <div className="space-y-3 text-xs text-gray-600">
                        <div className="flex items-start gap-2.5">
                          <MapPin size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                          <span>International Airport, Abuja, Nigeria</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Phone size={15} className="text-red-500 flex-shrink-0" />
                          <span>Phone: 08160850963</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-emerald-500 font-bold flex-shrink-0">WhatsApp:</span>
                          <span>+2348160850963</span>
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
                        <h4 className="font-extrabold text-gray-900 text-sm">Guangzhou (China)</h4>
                      </div>
                      <div className="space-y-3 text-xs text-gray-600">
                        <div className="flex items-start gap-2.5">
                          <MapPin size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                          <span>Room 408, Jincheng Building, Sanyuanli, Baiyun District, Guangzhou, China</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Phone size={15} className="text-red-500 flex-shrink-0" />
                          <span>China Line: +86 138 1234 5678</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-gray-500">
                          <span className="font-bold text-red-500">Email:</span>
                          <span>binnaschina@gmail.com</span>
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
                      <h4 className="font-extrabold text-gray-900">Lagos Head Office (Nigeria)</h4>
                    </div>
                    <div className="space-y-3 text-xs text-gray-600">
                      <div className="flex items-start gap-2.5">
                        <MapPin size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <span>limousine Park, International Airport, Lagos, Nigeria</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Phone size={15} className="text-red-500 flex-shrink-0" />
                        <span>Phone: 08160850963</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-emerald-500 font-bold flex-shrink-0">WhatsApp:</span>
                        <span>+2348160850963</span>
                      </div>
                    </div>
                  </div>

                  {/* Nigeria - Abuja Office */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                      <span className="text-xl">🇳🇬</span>
                      <h4 className="font-extrabold text-gray-900">Abuja Office (Nigeria)</h4>
                    </div>
                    <div className="space-y-3 text-xs text-gray-600">
                      <div className="flex items-start gap-2.5">
                        <MapPin size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <span>International Airport, Abuja, Nigeria</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Phone size={15} className="text-red-500 flex-shrink-0" />
                        <span>Phone: 08160850963</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-emerald-500 font-bold flex-shrink-0">WhatsApp:</span>
                        <span>+2348160850963</span>
                      </div>
                    </div>
                  </div>

                  {/* China Office */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                      <span className="text-xl">🇨🇳</span>
                      <h4 className="font-extrabold text-gray-900">Guangzhou Receiving Warehouse (China)</h4>
                    </div>
                    <div className="space-y-3 text-xs text-gray-600">
                      <div className="flex items-start gap-2.5">
                        <MapPin size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <span>Room 408, Jincheng Building, Sanyuanli, Baiyun District, Guangzhou, China</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Phone size={15} className="text-red-500 flex-shrink-0" />
                        <span>China Line: +86 138 1234 5678</span>
                      </div>
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
                          src="https://maps.google.com/maps?q=limousine%20Park,%20International%20Airport,%20Lagos,%20Nigeria&t=&z=14&ie=UTF8&iwloc=&output=embed"
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
                          src="https://maps.google.com/maps?q=International%20Airport,%20Abuja,%20Nigeria&t=&z=14&ie=UTF8&iwloc=&output=embed"
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

        {/* ==================== 7. ADMIN DASHBOARD ==================== */}
        {currentTab === "admin" && (
          <div className="py-12 bg-gray-100 min-h-[700px]" id="admin-page-view">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              
              {!adminToken ? (
                /* Login screen */
                <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-gray-100 shadow-md space-y-6" id="admin-login-card">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#dc2626] flex items-center justify-center mx-auto shadow-xs">
                      <Lock size={28} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900">Admin Portal Gate</h2>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto">
                      Please enter your credentials to authorize content edits, manage slider images, view logs, and backup database.
                    </p>
                  </div>

                  {adminLoginError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
                      <span>{adminLoginError}</span>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Enter Admin Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••••"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 tracking-widest font-black"
                      />
                    </div>

                    <div className="bg-amber-50 text-amber-900 p-3.5 rounded-lg text-xs leading-relaxed border border-amber-200/50">
                      <strong>Access Hint:</strong> The system credentials is: <code className="bg-amber-100 px-1 py-0.5 rounded font-bold">ibuchipeter2</code>.
                    </div>

                    <button
                      type="submit"
                      disabled={adminLoggingIn}
                      className="w-full bg-[#0f4c81] hover:bg-blue-800 text-white font-extrabold text-sm py-3 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {adminLoggingIn ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Verifying...
                        </>
                      ) : (
                        "Authorize Admin Portal"
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                /* Authenticated Dashboard */
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12" id="admin-authenticated-dashboard">
                  
                  {/* Left Sidebar Menu */}
                  <aside className="lg:col-span-3 bg-slate-900 text-gray-300 border-r border-gray-200 flex flex-col justify-between">
                    <div>
                      {/* Admin Identity header */}
                      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#0f4c81] flex items-center justify-center">
                          <span className="text-white font-black text-sm">A</span>
                        </div>
                        <div>
                          <span className="text-sm font-black text-white block">System Director</span>
                          <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase block">● ONLINE CONTEXT</span>
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
                                          : "bg-emerald-50 text-emerald-600 border-emerald-200"
                                      }`}
                                    >
                                      <option value="Unread">🔴 Unread</option>
                                      <option value="Read">🟡 Read</option>
                                      <option value="Contacted">🔵 Contacted</option>
                                      <option value="Resolved">🟢 Resolved</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-gray-100 text-xs text-gray-700 font-medium leading-relaxed italic">
                                  "{sub.message}"
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
                                  <div className="flex items-center gap-1.5">
                                    <Mail size={13} className="text-[#0f4c81]" /> Email: <span className="text-gray-900 font-bold">{sub.email}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Phone size={13} className="text-[#0f4c81]" /> Phone: <span className="text-gray-900 font-bold">{sub.phone}</span>
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
        )}
      </main>

      <Footer setCurrentTab={setCurrentTab} />
    </div>
  );
}
