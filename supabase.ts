import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

let rawUrl = (process.env.SUPABASE_URL || "https://albmkxloaqhkkhszvrrd.supabase.co").trim();

// Remove any trailing slashes
rawUrl = rawUrl.replace(/\/+$/, "");

// Strip accidental rest/v1 suffix if present
if (rawUrl.endsWith("/rest/v1")) {
  rawUrl = rawUrl.substring(0, rawUrl.length - "/rest/v1".length);
}
// Remove trailing slashes again just in case
rawUrl = rawUrl.replace(/\/+$/, "");

const supabaseUrl = rawUrl;
// Prefer service role key for backend operations to bypass RLS, fallback to anon key if provided
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

if (!supabase) {
  console.warn("⚠️ Supabase Credentials missing. System running with local JSON file-based database fallback.");
} else {
  console.log("✅ Supabase Client initialized successfully for:", supabaseUrl);
}

// Map frontend Submission type to database snake_case orders table
export interface DbOrder {
  id: string;
  full_name: string;
  company_name: string;
  email: string;
  phone: string;
  service_needed: string;
  message: string;
  status: string;
  created_at: string;
}

export function mapToDbOrder(sub: any): DbOrder {
  return {
    id: sub.id,
    full_name: sub.fullName,
    company_name: sub.companyName || "Individual",
    email: sub.email,
    phone: sub.phone || "Not Provided",
    service_needed: sub.serviceNeeded || "General Enquiry",
    message: sub.message,
    status: sub.status || "Unread",
    created_at: sub.date || new Date().toISOString(),
  };
}

export function mapToSubmission(row: DbOrder): any {
  return {
    id: row.id,
    fullName: row.full_name,
    companyName: row.company_name,
    email: row.email,
    phone: row.phone,
    serviceNeeded: row.service_needed,
    message: row.message,
    date: row.created_at,
    status: row.status,
  };
}
