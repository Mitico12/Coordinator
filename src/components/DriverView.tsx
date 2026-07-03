import React from "react";
import { useApp } from "../context/AppContext";
import { Clock, Users, ArrowUpRight, Anchor, MapPin, CheckCircle2, Circle, Tag, DollarSign } from "lucide-react";
import { motion } from "motion/react";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const DriverView: React.FC = () => {
  const { 
    bookings, 
    drivers,
    prefs, 
    currentWeekStart, 
    currentWeekEnd,
    setSelectedBooking, 
    setIsDetailModalOpen,
    updateBooking,
  } = useApp();

  const activeDriverId = prefs.role === "dispatcher"
    ? (prefs.viewingDriverId || drivers[0]?.id || null)
    : prefs.authenticatedDriverId;
  const activeDriverObj = drivers.find((d) => d.id === activeDriverId);

  if (!activeDriverId || !activeDriverObj) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className={`h-16 w-16 rounded-full flex items-center justify-center border-2 border-dashed mb-4
          ${prefs.theme === "dark" ? "border-neutral-800 text-neutral-500" : "border-amber-300 text-amber-500"}`}
        >
          👤
        </div>
        <h3 className="text-lg font-black tracking-tight mb-1">Session not active</h3>
        <p className={`text-xs max-w-xs leading-relaxed mb-6
          ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
        >
          Your driver session isn't active. Please log out and re-authenticate using the login portal.
        </p>
      </div>
    );
  }

  // Helper to compile destinations list
  const getStops = (b: any): string[] => {
    return [b.destination_1, b.destination_2, b.destination_3, b.destination_4, b.destination_5]
      .filter((s): s is string => typeof s === "string" && s.trim() !== "");
  };

  const getRouteString = (b: any) => {
    return getStops(b).join(" ➔ ") || "No destinations";
  };

  // Get start and end of active range
  const weekStart = new Date(currentWeekStart);
  const weekEnd = new Date(currentWeekEnd);
  const diffTime = Math.abs(weekEnd.getTime() - weekStart.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // Generate dynamic days
  const days = Array.from({ length: Math.min(diffDays, 100) }).map((_, idx) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + idx);
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    
    // Check if it's system today
    const systemToday = new Date();
    const isToday = d.getFullYear() === systemToday.getFullYear() &&
                    d.getMonth() === systemToday.getMonth() &&
                    d.getDate() === systemToday.getDate();

    // Filter runs assigned to this active driver on this date
    const runs = bookings
      .filter((b) => b.date === dateStr && b.driver_id === activeDriverId)
      .sort((a, b) => a.time.localeCompare(b.time));

    return {
      dayName: DAYS_OF_WEEK[(d.getDay() + 6) % 7],
      dateFormatted: d.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
      isToday,
      runs,
    };
  });

  const totalRunsThisWeek = days.reduce((sum, d) => sum + d.runs.length, 0);

  const handleOpenDetail = (booking: any) => {
    setSelectedBooking(booking);
    setIsDetailModalOpen(true);
  };

  // Stamp a stop checkpoint for a drive
  const handleStampStop = async (bookingId: string, stopLabel: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const existingStamps = booking.stamps || [];
    // Check if this stop is already stamped
    if (existingStamps.find((s) => s.label === stopLabel)) return;

    const newStamp = {
      label: stopLabel,
      time: new Date().toISOString(),
    };

    try {
      await updateBooking(bookingId, {
        stamps: [...existingStamps, newStamp],
      });
    } catch (e) {
      // Handled
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro info card */}
      <div className={`rounded-3xl p-4 border flex items-center justify-between transition-colors duration-200
        ${prefs.theme === "dark"
          ? "border-neutral-800/60 bg-neutral-900/20"
          : "border-amber-200 bg-amber-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-neutral-950 shadow-md"
            style={{ backgroundColor: activeDriverObj.color }}
          >
            {activeDriverObj.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider opacity-60">Personal Summary</h4>
            <span className="text-base font-black font-display tracking-tight">
              {totalRunsThisWeek} assigned drive{totalRunsThisWeek !== 1 ? "s" : ""} this week
            </span>
          </div>
        </div>
        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs
          ${prefs.theme === "dark" ? "bg-violet-900/50 text-violet-300" : "bg-amber-200 text-amber-950"}`}
        >
          {totalRunsThisWeek}
        </div>
      </div>

      {/* 7-day Timeline list */}
      <div className="space-y-4">
        {days.map((day, dIdx) => {
          const hasRuns = day.runs.length > 0;

          return (
            <motion.div
              key={day.dayName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dIdx * 0.05 }}
              className={`rounded-3xl border overflow-hidden transition-all duration-200
                ${day.isToday
                  ? prefs.theme === "dark"
                    ? "border-violet-500 bg-neutral-900/60 shadow-lg shadow-violet-950/5"
                    : "border-amber-500 bg-amber-100/50 shadow-md shadow-amber-900/5"
                  : !hasRuns
                    ? "border-dashed opacity-50 border-neutral-800"
                    : prefs.theme === "dark"
                      ? "border-neutral-800 bg-neutral-900/20"
                      : "border-amber-200/60 bg-amber-100/10"
                }`}
            >
              {/* Day Header */}
              <div className={`px-4 py-3 flex items-center justify-between border-b border-dashed
                ${day.isToday
                  ? prefs.theme === "dark" ? "border-violet-500/30 bg-violet-950/10" : "border-amber-500/30 bg-amber-200/40"
                  : prefs.theme === "dark" ? "border-neutral-800/60 bg-neutral-950/20" : "border-amber-200/30 bg-amber-100/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tracking-tight">{day.dayName}</span>
                  <span className={`text-[11px] font-bold
                    ${prefs.theme === "dark" ? "text-neutral-500" : "text-amber-700"}`}
                  >
                    {day.dateFormatted}
                  </span>
                </div>
                {day.isToday && (
                  <span className="text-[9px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded-full bg-emerald-500 text-neutral-950">
                    Today
                  </span>
                )}
              </div>

              {/* Day Runs list */}
              <div className="divide-y divide-neutral-800/40">
                {hasRuns ? (
                  day.runs.map((b) => {
                    const stops = getStops(b);
                    const vehicleEmoji = 
                      b.vehicle_type === "bus" || b.vehicle_type === "minibus" ? "🚌" :
                      b.vehicle_type === "caravelle" ? "🚐" :
                      b.vehicle_type === "van" ? "🚐" :
                      "🚗";

                    return (
                      <div
                        key={b.id}
                        className={`flex flex-col gap-3 px-4 py-4 transition-all duration-150 border-l-4
                          ${b.vehicle_type === "bus" || b.vehicle_type === "minibus" 
                            ? "border-emerald-500" 
                            : "border-amber-500"
                          }`}
                      >
                        {/* Top row: Time, Route, Details */}
                        <button
                          onClick={() => handleOpenDetail(b)}
                          className="w-full flex items-center gap-4 text-left cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          {/* Time Column */}
                          <div className="flex flex-col flex-shrink-0 items-center justify-center">
                            <span className="text-base font-black font-mono leading-none tracking-tight">
                              {b.time}
                            </span>
                            <span className={`text-[9px] uppercase tracking-wider font-extrabold mt-0.5
                              ${prefs.theme === "dark" ? "text-neutral-500" : "text-amber-700"}`}
                            >
                              DEP
                            </span>
                          </div>

                          {/* Details Column */}
                          <div className="flex-1 min-w-0">
                            <b className="text-sm font-bold tracking-tight block truncate">
                              {getRouteString(b)}
                            </b>
                            
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-neutral-400 font-semibold">
                              <span>{vehicleEmoji} {b.vehicle_type.toUpperCase()}</span>
                              {b.ship_name && (
                                <span className="inline-flex items-center gap-0.5">
                                  <Anchor size={10} />
                                  <span className="truncate max-w-[90px]">{b.ship_name}</span>
                                </span>
                              )}
                              {b.client && (
                                <span className="inline-flex items-center gap-0.5">
                                  🏢 <span className="truncate max-w-[90px]">{b.client}</span>
                                </span>
                              )}
                              {b.plate && (
                                <span className="font-mono uppercase">Plate: {b.plate}</span>
                              )}
                              {b.price > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-emerald-500">
                                  <DollarSign size={10} /> {b.price}€
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Pax & Details arrow */}
                          <div className="flex items-center gap-2.5 flex-shrink-0">
                            {b.pax_count > 0 && (
                              <span className={`text-[10px] font-extrabold font-mono px-2 py-0.5 rounded-full border
                                ${prefs.theme === "dark" 
                                  ? "border-neutral-800 bg-neutral-950 text-neutral-300" 
                                  : "border-amber-200 bg-amber-100 text-amber-900"
                                }`}
                              >
                                {b.pax_count} pax
                              </span>
                            )}
                            <ArrowUpRight size={14} className="text-neutral-500 shrink-0" />
                          </div>
                        </button>

                        {/* Stop Stamps Checkpoint Section */}
                        {stops.length > 0 && (
                          <div className={`flex flex-col gap-1.5 border-t border-dashed pt-3
                            ${prefs.theme === "dark" ? "border-neutral-800/40" : "border-amber-200/40"}`}
                          >
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-500 flex items-center gap-1.5">
                              <MapPin size={10} /> Route Stamp Checkpoints
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {stops.map((stop, idx) => {
                                const stamp = b.stamps?.find((s: any) => s.label === stop);
                                const isStamped = !!stamp;

                                return (
                                  <button
                                    key={idx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!isStamped) handleStampStop(b.id, stop);
                                    }}
                                    disabled={isStamped}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all
                                      ${isStamped
                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 cursor-default"
                                        : prefs.theme === "dark"
                                          ? "border-neutral-800 bg-neutral-950/40 text-neutral-300 hover:border-violet-600 hover:bg-violet-600/10 cursor-pointer active:scale-95"
                                          : "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-500 cursor-pointer active:scale-95"
                                      }`}
                                    title={isStamped
                                      ? `Stamped at ${new Date(stamp.time).toLocaleTimeString()}`
                                      : `Click to stamp arrival at: ${stop}`
                                    }
                                  >
                                    {isStamped ? (
                                      <CheckCircle2 size={12} className="text-emerald-400" />
                                    ) : (
                                      <Circle size={12} className="text-neutral-500" />
                                    )}
                                    <span>{stop}</span>
                                    {isStamped && (
                                      <span className="font-mono text-[9px] opacity-70">
                                        {new Date(stamp.time).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: false })}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Comment preview */}
                        {b.comment && (
                          <p className="text-[10px] italic text-neutral-500 mt-0.5 truncate">
                            &ldquo;{b.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className={`px-4 py-4 text-xs italic
                    ${prefs.theme === "dark" ? "text-neutral-500" : "text-amber-800/60"}`}
                  >
                    No assigned runs today.
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
