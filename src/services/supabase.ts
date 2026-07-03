// Supabase REST Client using standard fetch

const DEFAULT_SUPABASE_URL = "https://glsjmryzxsunpritarpy.supabase.co/rest/v1";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsc2ptcnl6eHN1bnByaXRhcnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxMDI3NjQsImV4cCI6MjA5ODY3ODc2NH0.huLwcIl1nd0u3RilKuWvA6X3HHpzr6BumImzze3q0XE";

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Dynamically retrieve the latest configuration from localStorage or import.meta.env
export function getSupabaseConfig(): SupabaseConfig {
  let url = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  let anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  // Check localStorage preferences fallback
  try {
    const prefsStr = localStorage.getItem("hfdriver_prefs");
    if (prefsStr) {
      const prefs = JSON.parse(prefsStr);
      if (prefs.supabaseUrl) url = prefs.supabaseUrl;
      if (prefs.supabaseAnonKey) anonKey = prefs.supabaseAnonKey;
    }
  } catch (e) {
    console.error("Failed to read Supabase credentials from local storage preferences", e);
  }

  return { url, anonKey };
}

function getHeaders(anonKey: string) {
  return {
    "apikey": anonKey,
    "Authorization": `Bearer ${anonKey}`,
    "Content-Type": "application/json",
  };
}

export async function supabaseFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { url, anonKey } = getSupabaseConfig();
  if (!anonKey) {
    throw new Error("Supabase Anon API Key is not configured. Please add it in Settings.");
  }

  const endpoint = `${url}${path}`;
  const headers = {
    ...getHeaders(anonKey),
    ...options.headers,
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedError;
    try {
      parsedError = JSON.parse(errorText);
    } catch {
      parsedError = { message: errorText };
    }
    throw new Error(parsedError.message || `Supabase API error (${response.status})`);
  }

  // Some operations (like DELETE without prefer headers) return no content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// DRIVERS SERVICES
export interface DbDriver {
  id: string;
  name: string;
  username: string;
  password?: string;
  email?: string;
  phone?: string;
  color: string;
  active: boolean;
}

export async function getDrivers(): Promise<DbDriver[]> {
  return supabaseFetch<DbDriver[]>("/drivers?select=*&order=name.asc");
}

export async function createDriver(driver: Omit<DbDriver, "id">): Promise<DbDriver> {
  const results = await supabaseFetch<DbDriver[]>("/drivers", {
    method: "POST",
    body: JSON.stringify(driver),
    headers: {
      "Prefer": "return=representation",
    },
  });
  return results[0];
}

export async function updateDriver(id: string, fields: Partial<DbDriver>): Promise<DbDriver> {
  const results = await supabaseFetch<DbDriver[]>(`/drivers?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
    headers: {
      "Prefer": "return=representation",
    },
  });
  return results[0];
}

export async function deleteDriver(id: string): Promise<void> {
  await supabaseFetch(`/drivers?id=eq.${id}`, {
    method: "DELETE",
  });
}

// DRIVES SERVICES
export interface DbDrive {
  id: string;
  vehicle_type: "bus" | "caravelle" | "minibus" | "van" | "car";
  plate?: string;
  destination_1?: string;
  destination_2?: string;
  destination_3?: string;
  destination_4?: string;
  destination_5?: string;
  mark?: string;
  pax_count: number;
  pax_names: string[];
  ship_name?: string;
  price: number;
  comment?: string;
  client?: string;
  driver_id?: string | null;
  start_time?: string | null; // ISO Date String
  end_time?: string | null; // ISO Date String
  stamps: Array<{ label: string; time: string }>;
  created_at?: string;
}

export async function getDrives(): Promise<DbDrive[]> {
  return supabaseFetch<DbDrive[]>("/drives?select=*&order=start_time.asc,created_at.asc");
}

export async function createDrive(drive: Omit<DbDrive, "id" | "created_at">): Promise<DbDrive> {
  const results = await supabaseFetch<DbDrive[]>("/drives", {
    method: "POST",
    body: JSON.stringify(drive),
    headers: {
      "Prefer": "return=representation",
    },
  });
  return results[0];
}

export async function updateDrive(id: string, fields: Partial<DbDrive>): Promise<DbDrive> {
  const results = await supabaseFetch<DbDrive[]>(`/drives?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
    headers: {
      "Prefer": "return=representation",
    },
  });
  return results[0];
}

export async function deleteDrive(id: string): Promise<void> {
  await supabaseFetch(`/drives?id=eq.${id}`, {
    method: "DELETE",
  });
}
