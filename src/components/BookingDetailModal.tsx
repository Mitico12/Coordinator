import React from "react";
import { useApp } from "../context/AppContext";
import { X, Clock, Calendar as CalendarIcon, Anchor, Users, MapPin, Tag, DollarSign, CheckCircle2, Circle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const BookingDetailModal: React.FC = () => {
  const { 
    selectedBooking, 
    isDetailModalOpen, 
    setIsDetailModalOpen, 
    prefs,
    drivers,
  } = useApp();

  if (!isDetailModalOpen || !selectedBooking) return null;

  const b = selectedBooking;
  
  // Get vehicle info
  const vehicleEmoji = 
    b.vehicle_type === "bus" || b.vehicle_type === "minibus" ? "🚌" :
    b.vehicle_type === "caravelle" || b.vehicle_type === "van" ? "🚐" : "🚗";
  
  const vehicleLabel = b.vehicle_type.charAt(0).toUpperCase() + b.vehicle_type.slice(1);

  // Get stops
  const stops = [b.destination_1, b.destination_2, b.destination_3, b.destination_4, b.destination_5]
    .filter((s): s is string => typeof s === "string" && s.trim() !== "");

  // Assigned driver
  const assignedDriver = drivers.find((d) => d.id === b.driver_id);

  // Days of week
  const dateObj = new Date(b.start_time);
  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
  const formattedDate = dateObj.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
        {/* Scrim */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsDetailModalOpen(false)}
          className="absolute inset-0 bg-neutral-950/70 backdrop-blur-sm cursor-pointer"
        />

        {/* Bottom Sheet on Mobile, Centered Modal on Desktop */}
        <motion.div
          initial={{ y: "100%", opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0.8 }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className={`relative w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] border p-6 shadow-2xl overflow-y-auto max-h-[90vh]
            ${prefs.theme === "dark"
              ? "border-neutral-800 bg-neutral-900 text-white"
              : "border-amber-200 bg-amber-50 text-amber-950"
            }`}
        >
          {/* Top Notch on Mobile */}
          <div className={`mx-auto mb-4 h-1.5 w-12 rounded-full sm:hidden
            ${prefs.theme === "dark" ? "bg-neutral-800" : "bg-amber-200"}`} 
          />

          {/* Close button */}
          <button
            onClick={() => setIsDetailModalOpen(false)}
            className={`absolute right-4 top-4 sm:top-6 sm:right-6 p-2 rounded-full transition-colors duration-200 cursor-pointer
              ${prefs.theme === "dark" ? "hover:bg-neutral-800 text-neutral-400" : "hover:bg-amber-100 text-amber-800"}`}
          >
            <X size={20} />
          </button>

          {/* Type Badge */}
          <div className="mb-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border
              ${b.vehicle_type === "bus" || b.vehicle_type === "minibus"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-amber-500/30 bg-amber-500/10 text-amber-500"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${b.vehicle_type === "bus" || b.vehicle_type === "minibus" ? "bg-emerald-400" : "bg-amber-400"}`} />
              {vehicleEmoji} {vehicleLabel}
              {b.plate && <span className="font-mono ml-1">• {b.plate.toUpperCase()}</span>}
            </span>
          </div>

          <h3 className="text-xl font-black font-display tracking-tight leading-tight pr-8 mb-1">
            {stops.join(" ➔ ") || "No destinations set"}
          </h3>
          <p className={`text-xs font-semibold mb-6
            ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
          >
            {dayName}, {formattedDate}
          </p>

          <div className="space-y-4">
            {/* Grid details */}
            <div className={`grid grid-cols-2 gap-4 rounded-2xl p-4 border
              ${prefs.theme === "dark" ? "bg-neutral-950/50 border-neutral-800/60" : "bg-white/60 border-amber-200/50"}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl
                  ${prefs.theme === "dark" ? "bg-neutral-900" : "bg-amber-100"}`}>
                  <Clock size={16} className={prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Departure</span>
                  <span className="text-sm font-black font-mono">{b.time}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl
                  ${prefs.theme === "dark" ? "bg-neutral-900" : "bg-amber-100"}`}>
                  <Users size={16} className={prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Passengers</span>
                  <span className="text-sm font-black font-mono">{b.pax_count || 0} Pax</span>
                </div>
              </div>

              {b.price > 0 && (
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl
                    ${prefs.theme === "dark" ? "bg-neutral-900" : "bg-amber-100"}`}>
                    <DollarSign size={16} className="text-emerald-500" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Price</span>
                    <span className="text-sm font-black font-mono text-emerald-400">{b.price}€</span>
                  </div>
                </div>
              )}

              {b.mark && (
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl
                    ${prefs.theme === "dark" ? "bg-neutral-900" : "bg-amber-100"}`}>
                    <Tag size={16} className="text-violet-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Invoice Mark</span>
                    <span className="text-sm font-bold">{b.mark}</span>
                  </div>
                </div>
              )}

              {b.ship_name && (
                <div className="col-span-2 flex items-center gap-3 border-t pt-3 border-dashed border-neutral-800">
                  <div className={`p-2 rounded-xl
                    ${prefs.theme === "dark" ? "bg-neutral-900" : "bg-amber-100"}`}>
                    <Anchor size={16} className={prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Vessel / Ship / Flight</span>
                    <span className="text-sm font-bold">{b.ship_name}</span>
                  </div>
                </div>
              )}

              {b.client && (
                <div className="col-span-2 flex items-center gap-3 border-t pt-3 border-dashed border-neutral-800">
                  <div className={`p-2 rounded-xl
                    ${prefs.theme === "dark" ? "bg-neutral-900" : "bg-amber-100"}`}>
                    <span className="text-sm">🏢</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Client</span>
                    <span className="text-sm font-bold">{b.client}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Passenger Names */}
            {b.pax_names && b.pax_names.length > 0 && (
              <div className="space-y-2">
                <span className={`text-[10px] uppercase tracking-wider font-extrabold block
                  ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
                >
                  Passenger Roster
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {b.pax_names.map((name, idx) => (
                    <span
                      key={idx}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border
                        ${prefs.theme === "dark"
                          ? "bg-neutral-950/40 border-neutral-800 text-neutral-300"
                          : "bg-white border-amber-200 text-amber-900"
                        }`}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Driver Assignment */}
            <div className="space-y-2">
              <span className={`text-[10px] uppercase tracking-wider font-extrabold block
                ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
              >
                Assigned Driver
              </span>
              {assignedDriver ? (
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-neutral-950"
                    style={{ backgroundColor: assignedDriver.color }}
                  >
                    {assignedDriver.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </span>
                  <span className="text-xs font-bold">{assignedDriver.name}</span>
                </div>
              ) : (
                <span className="text-xs italic text-red-500">Unassigned — Dispatch Warning</span>
              )}
            </div>

            {/* Stops & Stamps Progress */}
            {stops.length > 0 && (
              <div className="space-y-2">
                <span className={`text-[10px] uppercase tracking-wider font-extrabold block
                  ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
                >
                  Route Checkpoint Stamps
                </span>
                <div className="space-y-1.5">
                  {stops.map((stop, idx) => {
                    const stamp = b.stamps?.find((s) => s.label === stop);
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl border
                          ${stamp
                            ? "border-emerald-500/20 bg-emerald-500/5"
                            : prefs.theme === "dark"
                              ? "border-neutral-800 bg-neutral-950/30"
                              : "border-amber-200 bg-amber-50"
                          }`}
                      >
                        {stamp ? (
                          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                        ) : (
                          <Circle size={14} className="text-neutral-600 shrink-0" />
                        )}
                        <span className={`text-xs font-bold flex-1 ${stamp ? "text-emerald-400" : ""}`}>
                          #{idx + 1} {stop}
                        </span>
                        {stamp && (
                          <span className="text-[10px] font-mono text-emerald-400/70">
                            {new Date(stamp.time).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Comment Section */}
            {b.comment && (
              <div className="space-y-2">
                <span className={`text-[10px] uppercase tracking-wider font-extrabold block
                  ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
                >
                  Dispatch Comments
                </span>
                <div className={`p-4 rounded-2xl border text-sm leading-relaxed font-medium italic
                  ${prefs.theme === "dark"
                    ? "bg-neutral-950/30 border-neutral-800/50 text-neutral-300"
                    : "bg-amber-100/20 border-amber-200/50 text-amber-900"
                  }`}
                >
                  &ldquo;{b.comment}&rdquo;
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions at bottom */}
          <div className="mt-8">
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="w-full py-3.5 rounded-2xl font-bold text-sm bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/10 cursor-pointer active:scale-98 transition-all"
            >
              Acknowledge Run
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
