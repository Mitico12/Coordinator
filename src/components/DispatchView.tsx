import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Clock, Search, Plus, Anchor, Users, AlertTriangle, Edit3, Trash2, Tag, DollarSign, Mail, Phone, Lock, UserCheck, Shield } from "lucide-react";
import { motion } from "motion/react";
import { Driver } from "../types";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const DispatchView: React.FC = () => {
  const {
    bookings,
    drivers,
    prefs,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    currentWeekStart,
    currentWeekEnd,
    setSelectedBooking,
    setIsEditModalOpen,
    addDriver,
    updateDriver,
    deleteDriver,
    selectedDriverFilterId,
    setSelectedDriverFilterId,
  } = useApp();

  // Tab state: "drives" | "drivers"
  const [activeTab, setActiveTab] = useState<"drives" | "drivers">("drives");

  // Driver creation/edit form state
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [driverName, setDriverName] = useState("");
  const [driverUsername, setDriverUsername] = useState("");
  const [driverPassword, setDriverPassword] = useState("");
  const [driverEmail, setDriverEmail] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverColor, setDriverColor] = useState("#3ea0ff");

  // Helper to compile destinations list into an arrow string
  const getRouteString = (b: any) => {
    return [b.destination_1, b.destination_2, b.destination_3, b.destination_4, b.destination_5]
      .filter(Boolean)
      .join(" ➔ ") || "No destinations specified";
  };

  // Capacity Warning limits
  const capacityLimits = {
    car: 4,
    van: 7,
    caravelle: 9,
    minibus: 19,
    bus: 54,
  };

  const checkCapacityWarning = (b: any) => {
    const limit = capacityLimits[b.vehicle_type as keyof typeof capacityLimits] || 4;
    if (b.pax_count > limit) {
      return `Over capacity (max ${limit} pax for ${b.vehicle_type.toUpperCase()}).`;
    }
    return null;
  };

  // Get Double Booking conflicts for a day
  const findConflicts = (dateStr: string) => {
    const dayBookings = bookings.filter((b) => b.date === dateStr);
    const driverRuns: Record<string, Array<{ id: string; time: string; route: string }>> = {};

    dayBookings.forEach((b) => {
      if (b.driver_id) {
        if (!driverRuns[b.driver_id]) driverRuns[b.driver_id] = [];
        driverRuns[b.driver_id].push({ id: b.id, time: b.time, route: getRouteString(b) });
      }
    });

    const conflicts: Record<string, string[]> = {};

    const minutesOf = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    Object.entries(driverRuns).forEach(([drvId, runs]) => {
      const driverObj = drivers.find((d) => d.id === drvId);
      const name = driverObj ? driverObj.name : "Driver";

      runs.sort((a, b) => minutesOf(a.time) - minutesOf(b.time));
      for (let i = 0; i < runs.length; i++) {
        for (let j = i + 1; j < runs.length; j++) {
          const tA = minutesOf(runs[i].time);
          const tB = minutesOf(runs[j].time);
          if (Math.abs(tA - tB) < 90) {
            const msg = `${name} has overlapping schedules (${runs[i].time} & ${runs[j].time})`;
            if (!conflicts[runs[i].id]) conflicts[runs[i].id] = [];
            if (!conflicts[runs[j].id]) conflicts[runs[j].id] = [];
            
            if (!conflicts[runs[i].id].includes(msg)) conflicts[runs[i].id].push(msg);
            if (!conflicts[runs[j].id].includes(msg)) conflicts[runs[j].id].push(msg);
          }
        }
      }
    });

    return conflicts;
  };

  const handleOpenEdit = (booking: any) => {
    setSelectedBooking(booking);
    setIsEditModalOpen(true);
  };

  const handleOpenNew = () => {
    setSelectedBooking(null);
    setIsEditModalOpen(true);
  };

  const handleCreateOrUpdateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim() || !driverUsername.trim() || !driverPassword.trim()) {
      alert("Name, Username and Password are required fields.");
      return;
    }

    const payload = {
      name: driverName.trim(),
      username: driverUsername.trim(),
      password: driverPassword.trim(),
      email: driverEmail.trim() || undefined,
      phone: driverPhone.trim() || undefined,
      color: driverColor,
      active: true,
    };

    try {
      if (editingDriverId) {
        await updateDriver(editingDriverId, payload);
      } else {
        await addDriver(payload);
      }
      // Reset form
      setEditingDriverId(null);
      setDriverName("");
      setDriverUsername("");
      setDriverPassword("");
      setDriverEmail("");
      setDriverPhone("");
      setDriverColor("#3ea0ff");
    } catch (err) {
      // Handled
    }
  };

  const handleEditDriver = (d: Driver) => {
    setEditingDriverId(d.id);
    setDriverName(d.name);
    setDriverUsername(d.username);
    setDriverPassword(d.password || "");
    setDriverEmail(d.email || "");
    setDriverPhone(d.phone || "");
    setDriverColor(d.color);
  };

  const handleDeleteDriver = async (id: string) => {
    if (confirm("Are you sure you want to delete this driver? All assigned runs will be unassigned.")) {
      await deleteDriver(id);
    }
  };

  // Process days based on custom date range
  const weekStart = new Date(currentWeekStart);
  const weekEnd = new Date(currentWeekEnd);
  const diffTime = Math.abs(weekEnd.getTime() - weekStart.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const days = Array.from({ length: Math.min(diffDays, 100) }).map((_, idx) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + idx);
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    // Get system today check
    const systemToday = new Date();
    const isToday = d.getFullYear() === systemToday.getFullYear() &&
                    d.getMonth() === systemToday.getMonth() &&
                    d.getDate() === systemToday.getDate();

    // Find and filter bookings
    let filtered = bookings.filter((b) => b.date === dateStr);

    // Apply active filters
    if (activeFilter === "unassigned") {
      filtered = filtered.filter((b) => !b.driver_id);
    } else if (activeFilter !== "all") {
      // filter by vehicle type
      filtered = filtered.filter((b) => b.vehicle_type === activeFilter);
    }

    // Apply driver filter
    if (selectedDriverFilterId) {
      filtered = filtered.filter((b) => b.driver_id === selectedDriverFilterId);
    }

    // Apply search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          getRouteString(b).toLowerCase().includes(q) ||
          b.ship_name?.toLowerCase().includes(q) ||
          b.plate?.toLowerCase().includes(q) ||
          b.mark?.toLowerCase().includes(q) ||
          drivers.find(d => d.id === b.driver_id)?.name.toLowerCase().includes(q) ||
          b.comment?.toLowerCase().includes(q)
      );
    }

    // Sort by departure time
    filtered.sort((a, b) => a.time.localeCompare(b.time));

    return {
      dayName: DAYS_OF_WEEK[(d.getDay() + 6) % 7],
      dateFormatted: d.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
      dateStr,
      isToday,
      runs: filtered,
    };
  });

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex gap-4 border-b border-neutral-800/40 pb-2">
        <button
          onClick={() => setActiveTab("drives")}
          className={`text-sm font-black tracking-tight cursor-pointer pb-2 border-b-2 transition-all
            ${activeTab === "drives"
              ? "border-violet-600 text-violet-500"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
        >
          Drives Coordinator
        </button>
        <button
          onClick={() => setActiveTab("drivers")}
          className={`text-sm font-black tracking-tight cursor-pointer pb-2 border-b-2 transition-all
            ${activeTab === "drivers"
              ? "border-violet-600 text-violet-500"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
        >
          Crew Drivers Manager
        </button>
      </div>

      {activeTab === "drives" ? (
        /* DRIVES LIST VIEW */
        <div className="space-y-6">
          {/* Control bar: Search, filters, add drive button */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search destinations, driver account, markings, vessel, plates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-xs rounded-xl pl-10 pr-4 py-3 border font-semibold outline-none transition-colors
                  ${prefs.theme === "dark"
                    ? "bg-neutral-900/40 border-neutral-800 text-white focus:border-violet-600"
                    : "bg-white border-amber-200 text-amber-950 focus:border-amber-500"
                  }`}
              />
            </div>

            {/* Buttons / Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleOpenNew}
                className="flex items-center gap-1.5 px-4 py-3 text-xs font-extrabold bg-violet-600 text-white hover:bg-violet-500 rounded-xl shadow-lg shadow-violet-900/15 cursor-pointer transition-all active:scale-97"
                id="add-drive-btn"
              >
                <Plus size={14} /> Schedule Ride
              </button>
            </div>
          </div>

          {/* Filter Chips row */}
          <div className={`flex flex-wrap items-center gap-1.5 p-1 rounded-2xl border
            ${prefs.theme === "dark" ? "border-neutral-800 bg-neutral-950/40" : "border-amber-200/50 bg-amber-100/10"}`}
          >
            {[
              { id: "all", label: "All Vehicles" },
              { id: "car", label: "🚗 Cars" },
              { id: "van", label: "🚐 Vans" },
              { id: "caravelle", label: "🚐 Caravelles" },
              { id: "minibus", label: "🚌 Minibusses" },
              { id: "bus", label: "🚌 Busses" },
              { id: "unassigned", label: "⚠️ Unassigned Runs" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex-1 text-[10px] font-black py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap px-3
                  ${activeFilter === tab.id
                    ? prefs.theme === "dark"
                      ? "bg-neutral-855 text-white"
                      : "bg-amber-100 text-amber-955 border border-amber-205 shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Driver Filter Badge */}
          {selectedDriverFilterId && (
            <div className="flex justify-start">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
                ${prefs.theme === "dark" 
                  ? "bg-neutral-900 border-neutral-800 text-neutral-300" 
                  : "bg-blue-50 border-blue-200 text-blue-800"
                }`}
              >
                <span>👤 Filtered by driver: <b>{drivers.find(d => d.id === selectedDriverFilterId)?.name}</b></span>
                <button 
                  onClick={() => setSelectedDriverFilterId(null)}
                  className="font-bold hover:text-red-500 cursor-pointer ml-1 text-sm leading-none"
                  title="Clear Filter"
                >
                  &times;
                </button>
              </span>
            </div>
          )}

          {/* Grid containing days */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {days.map((day, dIdx) => {
              const dayConflicts = findConflicts(day.dateStr);
              const hasRuns = day.runs.length > 0;

              return (
                <motion.div
                  key={day.dayName}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: dIdx * 0.04 }}
                  className={`rounded-3xl border overflow-hidden transition-all duration-200
                    ${day.isToday
                      ? prefs.theme === "dark"
                        ? "border-violet-500 bg-neutral-900/50 shadow-lg shadow-violet-950/5"
                        : "border-blue-300 bg-blue-50/40 text-slate-900 shadow-md shadow-blue-900/5"
                      : prefs.theme === "dark"
                        ? "border-neutral-800/80 bg-neutral-900/10"
                        : "border-slate-200 bg-white text-slate-900 shadow-sm"
                    }`}
                >
                  {/* Header */}
                  <div className={`px-4 py-3 flex items-center justify-between border-b border-dashed
                    ${day.isToday
                      ? prefs.theme === "dark" ? "border-violet-500/30 bg-violet-950/10" : "border-blue-200/60 bg-blue-100/30"
                      : prefs.theme === "dark" ? "border-neutral-800/60 bg-neutral-950/25" : "border-slate-100 bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-widest font-extrabold text-neutral-400">
                        {day.dayName.slice(0, 3)}
                      </span>
                      <span className="text-sm font-black tracking-tight">{day.dayName}</span>
                      <span className={`text-[10px] font-bold
                        ${prefs.theme === "dark" ? "text-neutral-500" : day.isToday ? "text-blue-700" : "text-slate-500"}`}
                      >
                        {day.dateFormatted}
                      </span>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border
                      ${prefs.theme === "dark" 
                        ? "border-neutral-800 bg-neutral-950/60 text-neutral-400" 
                        : day.isToday ? "border-blue-200 bg-white text-blue-800" : "border-slate-200 bg-white text-slate-800"}`}
                    >
                      {day.runs.length} Runs
                    </span>
                  </div>

                  {/* Rides within Day */}
                  <div className="divide-y divide-neutral-850/10">
                    {hasRuns ? (
                      day.runs.map((b) => {
                        const hasDriver = !!b.driver_id;
                        const assignedDriverObj = drivers.find((d) => d.id === b.driver_id);
                        const driverName = assignedDriverObj ? assignedDriverObj.name : "Unassigned";
                        const driverColor = assignedDriverObj ? assignedDriverObj.color : "#6b7280";
                        
                        const conflicts = dayConflicts[b.id] || [];
                        const capacityWarning = checkCapacityWarning(b);

                        return (
                          <div
                            key={b.id}
                            className={`group relative flex flex-col gap-2.5 p-4 transition-all border-l-4
                              ${b.vehicle_type === "bus" || b.vehicle_type === "minibus"
                                ? "border-emerald-500" 
                                : prefs.theme === "dark" ? "border-violet-500" : day.isToday ? "border-blue-400" : "border-blue-600"
                              }
                              ${day.isToday 
                                ? prefs.theme === "dark" ? "hover:bg-neutral-800/20" : "hover:bg-blue-100/30" 
                                : prefs.theme === "dark" ? "hover:bg-neutral-800/5" : "hover:bg-slate-50/50"
                              }
                              ${!hasDriver ? "bg-red-500/[0.02] border-r border-dashed border-red-500/10" : ""}`}
                          >
                            <div className="flex items-start gap-4">
                              {/* Departure time */}
                              <div className="flex flex-col items-center flex-shrink-0">
                                <span className="text-sm font-black font-mono leading-none">{b.time}</span>
                                <span className={`text-[8px] uppercase tracking-wider mt-0.5 font-bold
                                  ${prefs.theme === "dark" ? "text-neutral-500" : day.isToday ? "text-blue-600" : "text-slate-400"}`}
                                >
                                  DEP
                                </span>
                              </div>

                              {/* Destinations Timeline */}
                              <div className="flex-1 min-w-0">
                                <b className={`text-sm font-black tracking-tight block leading-tight text-wrap
                                  ${prefs.theme === "dark" ? "text-white" : "text-slate-900"}`}
                                >
                                  {getRouteString(b)}
                                </b>
                                
                                <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-[10px] font-semibold
                                  ${prefs.theme === "dark" ? "text-neutral-400" : day.isToday ? "text-blue-900/70" : "text-slate-500"}`}
                                >
                                  {b.ship_name && (
                                    <span className="inline-flex items-center gap-0.5">
                                      <Anchor size={10} /> {b.ship_name}
                                    </span>
                                  )}
                                  {b.client && (
                                    <span className="inline-flex items-center gap-0.5">
                                      🏢 {b.client}
                                    </span>
                                  )}
                                  {b.plate && (
                                    <span className="font-mono uppercase">
                                      Plate: {b.plate}
                                    </span>
                                  )}
                                  {b.mark && (
                                    <span className="inline-flex items-center gap-0.5 text-violet-400">
                                      <Tag size={9} /> Mark: {b.mark}
                                    </span>
                                  )}
                                  {b.price > 0 && (
                                    <span className="inline-flex items-center gap-0.5 text-emerald-500">
                                      <DollarSign size={10} /> {b.price}
                                    </span>
                                  )}
                                </div>

                                {b.comment && (
                                  <p className={`text-[10px] italic mt-1 block truncate max-w-sm
                                    ${prefs.theme === "dark" ? "text-neutral-550" : day.isToday ? "text-blue-800/80" : "text-slate-500"}`}
                                  >
                                    &ldquo;{b.comment}&rdquo;
                                  </p>
                                )}
                              </div>

                              {/* Action details & Driver assignment tag */}
                              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                  {b.pax_count > 0 && (
                                    <span className={`text-[9px] font-black font-mono px-2 py-0.5 rounded-full border
                                      ${prefs.theme === "dark" 
                                        ? "border-neutral-800 bg-neutral-950 text-neutral-300" 
                                        : day.isToday ? "border-blue-200 bg-white text-blue-800" : "border-slate-200 bg-slate-50 text-slate-700"}`}
                                    >
                                      {b.pax_count} pax
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleOpenEdit(b)}
                                    className={`p-1 rounded cursor-pointer transition-colors
                                      ${prefs.theme === "dark" 
                                        ? "bg-neutral-800 text-neutral-455 hover:text-white" 
                                        : day.isToday ? "bg-blue-200/50 text-blue-900 hover:bg-blue-200" : "bg-slate-100 text-slate-500 hover:text-slate-900"}`}
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                </div>

                                {/* Assigned driver badge */}
                                <div className="flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: driverColor }} />
                                  <span className={`text-[9px] font-bold uppercase tracking-wider
                                    ${prefs.theme === "dark" ? "text-neutral-400" : day.isToday ? "text-blue-900" : "text-slate-500"}`}
                                  >
                                    {driverName}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Stamps / Stop Checkpoints Progress bar */}
                            {[b.destination_1, b.destination_2, b.destination_3, b.destination_4, b.destination_5].filter(Boolean).length > 0 && (
                              <div className={`mt-2 pt-2 border-t border-dashed border-neutral-800/40 flex flex-wrap gap-2 items-center text-[9px] font-semibold text-neutral-500`}>
                                <span className="opacity-60">Stamps:</span>
                                {(() => {
                                  const stops = [b.destination_1, b.destination_2, b.destination_3, b.destination_4, b.destination_5].filter(Boolean);
                                  return stops.map((stop, idx) => {
                                    const stamp = b.stamps?.find((s: any) => s.label === stop);
                                    return (
                                      <div
                                        key={idx}
                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded border
                                          ${stamp
                                            ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                                            : "border-neutral-800 bg-neutral-950/20 text-neutral-500"
                                          }`}
                                      >
                                        <span className="h-1 w-1 rounded-full bg-current" />
                                        <span>{stop}</span>
                                        {stamp && (
                                          <span className="font-mono opacity-80">
                                            ({new Date(stamp.time).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: false })})
                                          </span>
                                        )}
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            )}

                            {/* Warnings row */}
                            {(conflicts.length > 0 || capacityWarning) && (
                              <div className="flex flex-col gap-1 mt-1">
                                {capacityWarning && (
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500">
                                    <AlertTriangle size={12} className="shrink-0" />
                                    <span>{capacityWarning}</span>
                                  </div>
                                )}
                                {conflicts.map((msg, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5 text-[10px] font-bold text-red-400">
                                    <AlertTriangle size={12} className="shrink-0" />
                                    <span>{msg}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-xs italic text-neutral-500">
                        No drives scheduled for this day.
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        /* CREW DRIVERS MANAGEMENT DASHBOARD */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Driver Creation Form */}
          <div className="lg:col-span-1">
            <div className={`rounded-3xl border p-6 space-y-4 backdrop-blur-md
              ${prefs.theme === "dark" ? "border-neutral-800 bg-neutral-900/40" : "border-amber-200 bg-white"}`}
            >
              <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                <Shield size={16} className="text-violet-500" />
                {editingDriverId ? "Edit Driver Profile" : "Register Crew Driver"}
              </h3>
              <p className="text-xs text-neutral-400 font-semibold">
                Setup authentication parameters for drivers to log in and stamp their routes.
              </p>

              <form onSubmit={handleCreateOrUpdateDriver} className="space-y-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider opacity-60">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Elena Rostova"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className={`w-full text-xs rounded-xl px-3.5 py-2.5 border font-semibold outline-none transition-colors
                      ${prefs.theme === "dark"
                        ? "bg-neutral-950 border-neutral-800 focus:border-violet-600 text-white"
                        : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                      }`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider opacity-60">Username (Login User)</label>
                  <input
                    type="text"
                    placeholder="e.g. elena_r"
                    value={driverUsername}
                    onChange={(e) => setDriverUsername(e.target.value)}
                    className={`w-full text-xs rounded-xl px-3.5 py-2.5 border font-semibold outline-none transition-colors font-mono
                      ${prefs.theme === "dark"
                        ? "bg-neutral-950 border-neutral-800 focus:border-violet-600 text-white"
                        : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                      }`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider opacity-60">Passcode / Password</label>
                  <div className="relative">
                    <Lock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="Login passcode"
                      value={driverPassword}
                      onChange={(e) => setDriverPassword(e.target.value)}
                      className={`w-full text-xs rounded-xl pl-8 pr-3.5 py-2.5 border font-semibold outline-none transition-colors font-mono
                        ${prefs.theme === "dark"
                          ? "bg-neutral-950 border-neutral-800 focus:border-violet-600 text-white"
                          : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                        }`}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider opacity-60">Email Address</label>
                  <div className="relative">
                    <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="email"
                      placeholder="e.g. elena@dispatcher.com"
                      value={driverEmail}
                      onChange={(e) => setDriverEmail(e.target.value)}
                      className={`w-full text-xs rounded-xl pl-8 pr-3.5 py-2.5 border font-semibold outline-none transition-colors
                        ${prefs.theme === "dark"
                          ? "bg-neutral-950 border-neutral-800 focus:border-violet-600 text-white"
                          : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                        }`}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider opacity-60">Phone Number</label>
                  <div className="relative">
                    <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="e.g. +30 690..."
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      className={`w-full text-xs rounded-xl pl-8 pr-3.5 py-2.5 border font-semibold outline-none transition-colors font-mono
                        ${prefs.theme === "dark"
                          ? "bg-neutral-950 border-neutral-800 focus:border-violet-600 text-white"
                          : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                        }`}
                    />
                  </div>
                </div>

                {/* Accent Color picker */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold tracking-wider opacity-60">UI Accent Color</label>
                  <div className="flex gap-2">
                    {[
                      "#3ea0ff", // Neon Blue
                      "#b58cff", // Soft Purple
                      "#ff7fac", // Rose Gold
                      "#4ade80", // Emerald Green
                      "#f59e0b", // Warm Amber
                      "#2dd4bf", // Fresh Teal
                      "#f87171", // Coral Red
                    ].map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setDriverColor(col)}
                        style={{ backgroundColor: col }}
                        className={`h-6 w-6 rounded-full border transition-all cursor-pointer hover:scale-110 active:scale-90
                          ${driverColor === col ? "border-white ring-2 ring-violet-500" : "border-transparent"}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {editingDriverId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDriverId(null);
                        setDriverName("");
                        setDriverUsername("");
                        setDriverPassword("");
                        setDriverEmail("");
                        setDriverPhone("");
                        setDriverColor("#3ea0ff");
                      }}
                      className="flex-1 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-400 font-bold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs rounded-xl cursor-pointer"
                  >
                    {editingDriverId ? "Save Profile" : "Register Driver"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Drivers List grid */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-black tracking-tight">Active Coordinator Drivers ({drivers.length})</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {drivers.length === 0 ? (
                <div className="col-span-2 text-center text-xs italic text-neutral-500 py-10">
                  No driver accounts configured yet. Setup the first driver.
                </div>
              ) : (
                drivers.map((d) => (
                  <div
                    key={d.id}
                    className={`rounded-2xl border p-4 flex flex-col gap-3 relative transition-all duration-200 hover:scale-[1.01]
                      ${prefs.theme === "dark" ? "border-neutral-850 bg-neutral-900/60" : "border-amber-200 bg-white"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        style={{ backgroundColor: d.color }}
                        className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-neutral-950 shadow-sm"
                      >
                        {d.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black tracking-tight truncate leading-tight">{d.name}</h4>
                        <span className="text-[10px] font-semibold font-mono text-neutral-500">
                          Username: {d.username}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditDriver(d)}
                          className="p-1.5 rounded-lg bg-neutral-800/10 hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                        >
                          <Edit3 size={11} />
                        </button>
                        <button
                          onClick={() => handleDeleteDriver(d.id)}
                          className="p-1.5 rounded-lg bg-neutral-800/10 hover:bg-red-950/20 text-neutral-400 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-neutral-400 border-t border-dashed border-neutral-800/40 pt-2.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail size={10} className="shrink-0" />
                        <span className="truncate">{d.email || "No email"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono">
                        <Phone size={10} className="shrink-0" />
                        <span>{d.phone || "No phone"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono col-span-2 text-violet-400 mt-1">
                        <UserCheck size={10} className="shrink-0" />
                        <span>Passcode: {d.password}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
