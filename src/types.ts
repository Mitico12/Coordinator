export interface Booking {
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
  start_time: string; // ISO timestamp
  end_time?: string | null; // ISO timestamp
  stamps: Array<{ label: string; time: string }>;
  
  // Derived helper fields (added for frontend compatibility)
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
}

export interface Prefs {
  enabled: boolean;
  leadMinutes: number;
  nightBefore: boolean;
  nightBeforeHour: number;
  earlyThreshold: string;
  theme: "dark" | "light";
  driver: string | null; // Selected driver name
  role: "driver" | "dispatcher";
  offDutyDrivers: string[];
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  authenticatedDriverId: string | null;
  viewMode?: "dispatch" | "driver";
  viewingDriverId?: string | null;
}

export interface Driver {
  id: string;
  name: string;
  username: string;
  password?: string;
  email?: string;
  phone?: string;
  color: string;
  active: boolean;
}
