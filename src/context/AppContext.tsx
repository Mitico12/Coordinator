import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Booking, Prefs, Driver } from "../types";
import * as db from "../services/supabase";

interface AppContextType {
  bookings: Booking[];
  drivers: Driver[];
  prefs: Prefs;
  activeFilter: string;
  searchQuery: string;
  currentWeekStart: Date;
  currentWeekEnd: Date;
  selectedBooking: Booking | null;
  isEditModalOpen: boolean;
  isDetailModalOpen: boolean;
  isLoading: boolean;
  error: string | null;
  selectedDriverFilterId: string | null;
  
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  setPrefs: React.Dispatch<React.SetStateAction<Prefs>>;
  setActiveFilter: (filter: string) => void;
  setSearchQuery: (query: string) => void;
  setCurrentWeekStart: (date: Date) => void;
  setCurrentWeekEnd: (date: Date) => void;
  setSelectedBooking: (booking: Booking | null) => void;
  setIsEditModalOpen: (isOpen: boolean) => void;
  setIsDetailModalOpen: (isOpen: boolean) => void;
  setSelectedDriverFilterId: (id: string | null) => void;
  
  // Drives actions
  addBooking: (booking: Omit<Booking, "id" | "date" | "time" | "stamps">) => Promise<void>;
  updateBooking: (id: string, updatedFields: Partial<Booking>) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  
  // Drivers actions
  addDriver: (driver: Omit<Driver, "id">) => Promise<void>;
  updateDriver: (id: string, updatedFields: Partial<Driver>) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;
  
  // Data actions
  loadData: () => Promise<void>;
  login: (role: "driver" | "dispatcher", driverId?: string | null, driverName?: string | null) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const getStartOfWeek = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const result = new Date(date.setDate(diff));
  result.setHours(0, 0, 0, 0);
  return result;
};

function mapDbDriveToBooking(dbDrive: db.DbDrive): Booking {
  const d = new Date(dbDrive.start_time || new Date());
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  
  return {
    id: dbDrive.id,
    vehicle_type: dbDrive.vehicle_type,
    plate: dbDrive.plate || "",
    destination_1: dbDrive.destination_1 || "",
    destination_2: dbDrive.destination_2 || "",
    destination_3: dbDrive.destination_3 || "",
    destination_4: dbDrive.destination_4 || "",
    destination_5: dbDrive.destination_5 || "",
    mark: dbDrive.mark || "",
    pax_count: dbDrive.pax_count || 0,
    pax_names: dbDrive.pax_names || [],
    ship_name: dbDrive.ship_name || "",
    price: Number(dbDrive.price || 0),
    comment: dbDrive.comment || "",
    client: dbDrive.client || "",
    driver_id: dbDrive.driver_id || null,
    start_time: dbDrive.start_time || new Date().toISOString(),
    end_time: dbDrive.end_time || null,
    stamps: dbDrive.stamps || [],
    date,
    time,
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load preferences from local storage or default
  const [prefs, setPrefs] = useState<Prefs>(() => {
    const saved = localStorage.getItem("hfdriver_prefs");
    if (saved) {
      try {
        return {
          enabled: true,
          leadMinutes: 60,
          nightBefore: true,
          nightBeforeHour: 20,
          earlyThreshold: "09:00",
          theme: "dark",
          driver: null,
          role: "driver",
          offDutyDrivers: [],
          supabaseUrl: "https://glsjmryzxsunpritarpy.supabase.co/rest/v1",
          supabaseAnonKey: "",
          authenticatedDriverId: null,
          viewMode: "dispatch",
          viewingDriverId: null,
          ...JSON.parse(saved),
        };
      } catch (e) {
        console.error("Failed to parse preferences from localStorage", e);
      }
    }
    return {
      enabled: true,
      leadMinutes: 60,
      nightBefore: true,
      nightBeforeHour: 20,
      earlyThreshold: "09:00",
      theme: "dark",
      driver: null,
      role: "driver",
      offDutyDrivers: [],
      supabaseUrl: "https://glsjmryzxsunpritarpy.supabase.co/rest/v1",
      supabaseAnonKey: "",
      authenticatedDriverId: null,
      viewMode: "dispatch",
      viewingDriverId: null,
    };
  });

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getStartOfWeek(new Date()));
  const [currentWeekEnd, setCurrentWeekEnd] = useState<Date>(() => {
    const start = getStartOfWeek(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  });
  
  // Modal states
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDriverFilterId, setSelectedDriverFilterId] = useState<string | null>(null);

  // Sync prefs to local storage
  useEffect(() => {
    localStorage.setItem("hfdriver_prefs", JSON.stringify(prefs));
  }, [prefs]);

  // Load data from Supabase
  const loadData = useCallback(async () => {
    const config = db.getSupabaseConfig();
    if (!config.anonKey) {
      setError("Supabase Anon API Key is not configured. Please add it in Settings.");
      setBookings([]);
      setDrivers([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [dbDrives, dbDrivers] = await Promise.all([
        db.getDrives(),
        db.getDrivers(),
      ]);

      const mappedBookings = dbDrives.map(mapDbDriveToBooking);
      setBookings(mappedBookings);

      const mappedDrivers: Driver[] = dbDrivers.map((d) => ({
        id: d.id,
        name: d.name,
        username: d.username,
        password: d.password,
        email: d.email || "",
        phone: d.phone || "",
        color: d.color,
        active: d.active,
      }));
      setDrivers(mappedDrivers);
    } catch (e: any) {
      console.error("Failed to load data from Supabase", e);
      setError(e.message || "Failed to fetch data from Supabase.");
    } finally {
      setIsLoading(false);
    }
  }, [prefs.supabaseAnonKey, prefs.supabaseUrl]);

  // Trigger load data on initialization and when Supabase key changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Actions
  const addBooking = async (newBooking: Omit<Booking, "id" | "date" | "time" | "stamps">) => {
    try {
      const payload: Omit<db.DbDrive, "id" | "created_at"> = {
        vehicle_type: newBooking.vehicle_type,
        plate: newBooking.plate,
        destination_1: newBooking.destination_1,
        destination_2: newBooking.destination_2,
        destination_3: newBooking.destination_3,
        destination_4: newBooking.destination_4,
        destination_5: newBooking.destination_5,
        mark: newBooking.mark,
        pax_count: newBooking.pax_count,
        pax_names: newBooking.pax_names,
        ship_name: newBooking.ship_name,
        price: newBooking.price,
        comment: newBooking.comment,
        client: newBooking.client,
        driver_id: newBooking.driver_id,
        start_time: newBooking.start_time,
        end_time: newBooking.end_time || null,
        stamps: [],
      };
      const created = await db.createDrive(payload);
      setBookings((prev) => [...prev, mapDbDriveToBooking(created)]);
    } catch (e: any) {
      alert(`Error saving drive: ${e.message}`);
      throw e;
    }
  };

  const updateBooking = async (id: string, updatedFields: Partial<Booking>) => {
    try {
      // Map frontend updates back to database properties
      const payload: Partial<db.DbDrive> = {};
      if (updatedFields.vehicle_type !== undefined) payload.vehicle_type = updatedFields.vehicle_type;
      if (updatedFields.plate !== undefined) payload.plate = updatedFields.plate;
      if (updatedFields.destination_1 !== undefined) payload.destination_1 = updatedFields.destination_1;
      if (updatedFields.destination_2 !== undefined) payload.destination_2 = updatedFields.destination_2;
      if (updatedFields.destination_3 !== undefined) payload.destination_3 = updatedFields.destination_3;
      if (updatedFields.destination_4 !== undefined) payload.destination_4 = updatedFields.destination_4;
      if (updatedFields.destination_5 !== undefined) payload.destination_5 = updatedFields.destination_5;
      if (updatedFields.mark !== undefined) payload.mark = updatedFields.mark;
      if (updatedFields.pax_count !== undefined) payload.pax_count = updatedFields.pax_count;
      if (updatedFields.pax_names !== undefined) payload.pax_names = updatedFields.pax_names;
      if (updatedFields.ship_name !== undefined) payload.ship_name = updatedFields.ship_name;
      if (updatedFields.price !== undefined) payload.price = updatedFields.price;
      if (updatedFields.comment !== undefined) payload.comment = updatedFields.comment;
      if (updatedFields.client !== undefined) payload.client = updatedFields.client;
      if (updatedFields.driver_id !== undefined) payload.driver_id = updatedFields.driver_id;
      if (updatedFields.start_time !== undefined) payload.start_time = updatedFields.start_time;
      if (updatedFields.end_time !== undefined) payload.end_time = updatedFields.end_time;
      if (updatedFields.stamps !== undefined) payload.stamps = updatedFields.stamps;

      const updated = await db.updateDrive(id, payload);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? mapDbDriveToBooking(updated) : b))
      );
    } catch (e: any) {
      alert(`Error updating drive: ${e.message}`);
      throw e;
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      await db.deleteDrive(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (e: any) {
      alert(`Error deleting drive: ${e.message}`);
      throw e;
    }
  };

  // Drivers Actions
  const addDriver = async (newDriver: Omit<Driver, "id">) => {
    try {
      const payload: Omit<db.DbDriver, "id"> = {
        name: newDriver.name,
        username: newDriver.username,
        password: newDriver.password,
        email: newDriver.email,
        phone: newDriver.phone,
        color: newDriver.color,
        active: newDriver.active,
      };
      const created = await db.createDriver(payload);
      setDrivers((prev) => [...prev, created]);
    } catch (e: any) {
      alert(`Error saving driver: ${e.message}`);
      throw e;
    }
  };

  const updateDriver = async (id: string, updatedFields: Partial<Driver>) => {
    try {
      const payload: Partial<db.DbDriver> = {};
      if (updatedFields.name !== undefined) payload.name = updatedFields.name;
      if (updatedFields.username !== undefined) payload.username = updatedFields.username;
      if (updatedFields.password !== undefined) payload.password = updatedFields.password;
      if (updatedFields.email !== undefined) payload.email = updatedFields.email;
      if (updatedFields.phone !== undefined) payload.phone = updatedFields.phone;
      if (updatedFields.color !== undefined) payload.color = updatedFields.color;
      if (updatedFields.active !== undefined) payload.active = updatedFields.active;

      const updated = await db.updateDriver(id, payload);
      setDrivers((prev) =>
        prev.map((d) => (d.id === id ? updated : d))
      );
      
      // If we updated the currently authenticated driver's name, sync it
      if (prefs.authenticatedDriverId === id) {
        setPrefs((prev) => ({
          ...prev,
          driver: updated.name,
        }));
      }
    } catch (e: any) {
      alert(`Error updating driver: ${e.message}`);
      throw e;
    }
  };

  const deleteDriver = async (id: string) => {
    try {
      await db.deleteDriver(id);
      setDrivers((prev) => prev.filter((d) => d.id !== id));
    } catch (e: any) {
      alert(`Error deleting driver: ${e.message}`);
      throw e;
    }
  };

  // Auth Operations
  const login = (role: "driver" | "dispatcher", driverId?: string | null, driverName?: string | null) => {
    setPrefs((prev) => ({
      ...prev,
      role,
      authenticatedDriverId: role === "dispatcher" ? "dispatcher" : (driverId || null),
      driver: role === "dispatcher" ? "Dispatcher" : (driverName || null),
      viewMode: role === "dispatcher" ? "dispatch" : "driver",
      viewingDriverId: role === "dispatcher" ? null : (driverId || null),
    }));
  };

  const logout = () => {
    setPrefs((prev) => ({
      ...prev,
      authenticatedDriverId: null,
      driver: null,
      viewMode: "dispatch",
      viewingDriverId: null,
    }));
    setSelectedDriverFilterId(null);
  };

  return (
    <AppContext.Provider
      value={{
        bookings,
        drivers,
        prefs,
        activeFilter,
        searchQuery,
        currentWeekStart,
        currentWeekEnd,
        selectedBooking,
        isEditModalOpen,
        isDetailModalOpen,
        isLoading,
        error,
        selectedDriverFilterId,
        setBookings,
        setDrivers,
        setPrefs,
        setActiveFilter,
        setSearchQuery,
        setCurrentWeekStart,
        setCurrentWeekEnd,
        setSelectedBooking,
        setIsEditModalOpen,
        setIsDetailModalOpen,
        setSelectedDriverFilterId,
        addBooking,
        updateBooking,
        deleteBooking,
        addDriver,
        updateDriver,
        deleteDriver,
        loadData,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
