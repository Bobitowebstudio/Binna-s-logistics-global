export interface Slide {
  id: string;
  headline: string;
  subheadline: string;
  cta1Text: string;
  cta1Link: string;
  cta2Text: string;
  cta2Link: string;
  image: string;
}

export interface WhyChooseUsItem {
  id: string;
  title: string;
  description: string;
}

export interface WhyChooseUs {
  title: string;
  subtitle: string;
  items: WhyChooseUsItem[];
}

export interface Stats {
  yearsOfExperience: string;
  successfulShipments: string;
  satisfiedClients: string;
  countriesConnected: string;
}

export interface CtaSection {
  headline: string;
  subheadline: string;
  buttonText: string;
}

export interface HomepageContent {
  welcomeTitle: string;
  welcomeText: string;
  slides: Slide[];
  whyChooseUs: WhyChooseUs;
  stats: Stats;
  cta: CtaSection;
}

export interface ValueItem {
  id: string;
  title: string;
  description: string;
}

export interface AboutContent {
  title: string;
  content: string;
  companyOverview: string;
  ourStory: string;
  ourValues: ValueItem[];
  whyClientsTrustUs: string;
}

export interface ServiceCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  details: string;
}

export interface VisionContent {
  title: string;
  content: string;
  statement: string;
  longTermGoals: string;
  growthStrategy: string;
  commitmentToExcellence: string;
}

export interface MissionContent {
  title: string;
  content: string;
  customerCommitment: string;
  serviceExcellence: string;
  innovation: string;
  reliability: string;
  transparency: string;
}

export interface ContactContent {
  title: string;
  officeAddressNigeria: string;
  officeAddressChina: string;
  phoneNigeria: string;
  phoneChina: string;
  whatsApp: string;
  email: string;
  businessHours: string;
}

export interface SeoContent {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
}

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  content: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  active: boolean;
}

export interface Submission {
  id: string;
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  serviceNeeded: string;
  message: string;
  date: string;
  status: "Unread" | "Read" | "Contacted" | "Resolved" | "Replied";
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  user: string;
}

export interface CustomerConversation {
  id: string;
  customer_name: string;
  phone: string;
  service: string;
  message: string;
  direction: "Outgoing";
  created_at: string;
}

export interface CompanySettings {
  companyInfo: {
    name: string;
    tagline: string;
    description: string;
    logo: string;
    favicon: string;
  };
  contactInfo: {
    phoneNigeria: string;
    phoneChina: string;
    whatsApp: string;
    emailBusiness: string;
    emailSupport: string;
  };
  officeLocations: {
    nigeria: {
      name: string;
      address: string;
      mapsLink: string;
    };
    china: {
      name: string;
      address: string;
      mapsLink: string;
    };
  };
  socialMedia: {
    facebook: string;
    instagram: string;
    tiktok: string;
  };
  whatsAppSettings: {
    whatsAppNumber: string;
    defaultMessage: string;
    quoteMessage: string;
    importMessage: string;
    exportMessage: string;
    airFreightMessage: string;
    seaFreightMessage: string;
    trackingMessage: string;
  };
  businessHours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  announcementBar: {
    text: string;
    enabled: boolean;
    color: string;
  };
}

export interface WebsiteDatabase {
  homepage: HomepageContent;
  about: AboutContent;
  services: ServiceCard[];
  vision: VisionContent;
  mission: MissionContent;
  contact: ContactContent;
  seo: SeoContent;
  news: NewsItem[];
  announcements: Announcement[];
  submissions: Submission[];
  logs: AuditLog[];
  companySettings?: CompanySettings;
  customer_conversations?: CustomerConversation[];
}
