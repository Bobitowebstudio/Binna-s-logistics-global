import React, { useState } from "react";
import { Menu, X, Shield, Phone, Mail, Clock, MapPin, Bell } from "lucide-react";
import { Announcement } from "../types";

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  announcements: Announcement[];
}

export default function Header({ currentTab, setCurrentTab, announcements }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "home", label: "Home" },
    { id: "about", label: "About Us" },
    { id: "services", label: "Services" },
    { id: "vision", label: "Vision" },
    { id: "mission", label: "Mission" },
    { id: "contact", label: "Contact Us" },
  ];

  const activeAnnouncements = announcements.filter((a) => a.active);

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    window.location.hash = tabId;
    setMobileMenuOpen(false);
  };

  return (
    <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 shadow-xs">
      {/* Main Header Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo with flex-shrink-0 to guarantee its structural space */}
          <div 
            onClick={() => handleNavClick("home")}
            className="flex items-center cursor-pointer group flex-shrink-0 mr-12"
          >
            <div>
              <span className="text-2xl font-extrabold tracking-tight text-gray-900 block leading-tight">
                Binna's <span className="text-[#0f4c81]">Logistics</span> <span className="text-[#dc2626]">Global</span>
              </span>
            </div>
          </div>

          {/* Desktop Navigation - pushed to the right with ml-auto to maximize horizontal spacing from the logo */}
          <nav className="hidden md:flex ml-auto space-x-2 lg:space-x-4 items-center">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-4 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#0f4c81] text-white shadow-sm"
                      : "text-gray-600 hover:text-[#0f4c81] hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Mobile Menu Button - simple and clean, without any Admin or CTA buttons */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer - simple and clean list */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-3 px-4 shadow-inner space-y-1 animate-in slide-in-from-top duration-200">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-4 py-3 rounded-md text-base font-semibold transition-colors ${
                  isActive
                    ? "bg-[#0f4c81] text-white"
                    : "text-gray-600 hover:text-[#0f4c81] hover:bg-gray-50"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
