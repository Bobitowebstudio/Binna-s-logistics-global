import React, { useState } from "react";
import { Ship, Mail, Phone, MapPin, Facebook, Instagram, CheckCircle, Send } from "lucide-react";

interface FooterProps {
  setCurrentTab: (tab: string) => void;
  companySettings?: any;
}

export default function Footer({ setCurrentTab, companySettings }: FooterProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const companyName = companySettings?.companyInfo?.name || "Binna's Logistics Global";
  const description = companySettings?.companyInfo?.description || "Binna's Logistics Global is your trusted shipping and sourcing partner connecting China and Nigeria through reliable, affordable, and transparent logistics solutions.";
  const addressNigeria = companySettings?.officeLocations?.nigeria?.address || "Limousine Park, International Airport, Lagos, Nigeria / International Airport, Abuja, Nigeria";
  const phoneNigeria = companySettings?.contactInfo?.phoneNigeria || "08160850963";
  const facebookUrl = companySettings?.socialMedia?.facebook || "https://www.facebook.com/binnas.globa";
  const instagramUrl = companySettings?.socialMedia?.instagram || "https://www.instagram.com/binnasgloba?igsh=MXJzbmg2b202OHdmYw==";
  const tiktokUrl = companySettings?.socialMedia?.tiktok || "";
  const whatsAppNumber = companySettings?.whatsAppSettings?.whatsAppNumber || "2348160850963";
  const defaultWhatsAppMsg = companySettings?.whatsAppSettings?.defaultMessage || "Hello Binna's Logistics, I would like to make an enquiry about your services.";

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => {
        setSubscribed(false);
      }, 5000);
    }
  };

  const handleNavClick = (tabId: string) => {
    if (window.location.pathname !== "/") {
      window.history.pushState({}, "", "/");
    }
    setCurrentTab(tabId);
    window.location.hash = tabId;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8 border-t-4 border-[#0f4c81]" id="footer-comp">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Column 1: Brand & Desc */}
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-xl font-black tracking-tight leading-tight select-none flex flex-col">
                <span className="flex items-center gap-1.5">
                  <span className="text-white">Binna's</span>
                  <span className="text-[#0f4c81]">Logistics</span>
                </span>
                <span className="text-[#dc2626]">Global</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {description}
            </p>
            
            {/* Contacts quick highlights */}
            <div className="space-y-2 pt-2 text-sm text-gray-400">
              <div className="flex items-start gap-2.5">
                <MapPin size={16} className="text-[#dc2626] mt-0.5 flex-shrink-0" />
                <span>{addressNigeria}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="text-[#dc2626] flex-shrink-0" />
                <span>{phoneNigeria}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5 pb-2 border-b border-gray-800">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { id: "home", label: "Home" },
                { id: "about", label: "About Us" },
                { id: "services", label: "Our Services" },
                { id: "vision", label: "Our Vision" },
                { id: "mission", label: "Our Mission" },
                { id: "contact", label: "Contact Us" },
              ].map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => handleNavClick(link.id)}
                    className="hover:text-white transition-colors text-gray-400 text-left cursor-pointer"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Our Services */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5 pb-2 border-b border-gray-800">
              Services
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-400">
              {[
                "Product Sourcing",
                "Air Freight",
                "Sea Freight",
                "Cargo Consolidation",
                "Customs Assistance",
                "Procurement Support"
              ].map((service, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0f4c81]" />
                  <button 
                    onClick={() => handleNavClick("services")}
                    className="hover:text-white transition-colors text-left cursor-pointer"
                  >
                    {service}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5 pb-2 border-b border-gray-800">
              Newsletter
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Stay updated on weekly flight shipping rates, container departures, and China-Nigeria clearance procedures.
            </p>
            {subscribed ? (
              <div className="bg-emerald-950/40 text-emerald-400 border border-emerald-800 p-3 rounded-md flex items-center gap-2 text-xs">
                <CheckCircle size={14} className="flex-shrink-0" />
                <span>Thank you! You are now subscribed.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Your Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-white rounded-md px-3.5 py-2 text-sm focus:outline-none focus:border-[#0f4c81] w-full"
                />
                <button
                  type="submit"
                  className="bg-[#0f4c81] hover:bg-blue-700 text-white p-2 rounded-md transition-all duration-200 flex items-center justify-center flex-shrink-0 cursor-pointer"
                >
                  <Send size={16} />
                </button>
              </form>
            )}

            {/* Social Icons */}
            <div className="pt-3">
              <span className="text-xs uppercase font-semibold tracking-wider text-gray-500 block mb-2.5">
                Connect with us
              </span>
              <div className="flex gap-3">
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-[#0f4c81] hover:text-white flex items-center justify-center transition-all text-gray-400"
                >
                  <Facebook size={15} />
                </a>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-[#dc2626] hover:text-white flex items-center justify-center transition-all text-gray-400"
                >
                  <Instagram size={15} />
                </a>
                {tiktokUrl && (
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-gray-800 hover:bg-black hover:text-white flex items-center justify-center transition-all text-gray-400 font-bold text-xs"
                    title="TikTok"
                  >
                    T
                  </a>
                )}
                <a
                  href={`https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(defaultWhatsAppMsg)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-emerald-950 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all text-emerald-400 font-bold text-xs"
                >
                  W
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright band */}
        <div className="border-t border-gray-800 pt-8 mt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500">
          <span>
            © {new Date().getFullYear()} Binna's Logistics Global. All Rights Reserved.
          </span>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <span className="hover:text-gray-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-400 cursor-pointer">Terms of Service</span>
            <span 
              onClick={() => handleNavClick("admin")}
              className="hover:text-gray-400 cursor-pointer text-[#0f4c81]"
            >
              Admin Portal
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
