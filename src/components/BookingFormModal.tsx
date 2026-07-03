import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Booking } from "../types";
import { X, Calendar, Clock, MapPin, Users, FileText, Check, Plus, AlertTriangle, Trash2, DollarSign, Tag, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const BookingFormModal: React.FC = () => {
  const {
    selectedBooking,
    isEditModalOpen,
    setIsEditModalOpen,
    prefs,
    addBooking,
    updateBooking,
    deleteBooking,
    bookings,
    drivers,
  } = useApp();

  const isEdit = !!selectedBooking;

  // Form Fields
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [vehicleType, setVehicleType] = useState<"bus" | "caravelle" | "minibus" | "van" | "car">("car");
  const [plate, setPlate] = useState("");
  
  // Destination Stops (up to 5)
  const [destinations, setDestinations] = useState<string[]>([""]);
  
  const [mark, setMark] = useState("");
  const [paxCount, setPaxCount] = useState<number>(0);
  const [paxNamesInput, setPaxNamesInput] = useState("");
  const [shipName, setShipName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [driverId, setDriverId] = useState<string>("");
  const [client, setClient] = useState("");

  // Populate form when editing or adding
  useEffect(() => {
    if (isEdit && selectedBooking) {
      const b = selectedBooking;
      
      // Extract date and time from start_time ISO string
      try {
        const d = new Date(b.start_time);
        const pad = (n: number) => String(n).padStart(2, "0");
        setDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
        setTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
      } catch {
        setDate(b.date);
        setTime(b.time);
      }

      setVehicleType(b.vehicle_type);
      setPlate(b.plate || "");
      
      // Rebuild destinations array
      const stops = [
        b.destination_1,
        b.destination_2,
        b.destination_3,
        b.destination_4,
        b.destination_5
      ].filter((s): s is string => typeof s === "string" && s.trim() !== "");
      setDestinations(stops.length > 0 ? stops : [""]);

      setMark(b.mark || "");
      setPaxCount(b.pax_count || 0);
      setPaxNamesInput((b.pax_names || []).join(", "));
      setShipName(b.ship_name || "");
      setPrice(b.price || 0);
      setComment(b.comment || "");
      setDriverId(b.driver_id || "");
      setClient(b.client || "");
    } else {
      // Set defaults for new drive
      const today = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setDate(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`);
      setTime("12:00");
      setVehicleType("car");
      setPlate("");
      setDestinations([""]);
      setMark("");
      setPaxCount(1);
      setPaxNamesInput("");
      setShipName("");
      setPrice(0);
      setComment("");
      setDriverId("");
      setClient("");
    }
  }, [isEdit, selectedBooking, isEditModalOpen]);

  if (!isEditModalOpen) return null;

  // Capacity Warning limits
  const capacityLimits = {
    car: 4,
    van: 7,
    caravelle: 9,
    minibus: 19,
    bus: 54,
  };

  const getCapacityWarning = () => {
    const limit = capacityLimits[vehicleType];
    if (paxCount > limit) {
      return `Passenger count (${paxCount}) exceeds maximum capacity for a ${vehicleType.toUpperCase()} (max ${limit} passengers).`;
    }
    return null;
  };

  // Double booking checks
  const getDoubleBookingAlerts = () => {
    if (!date || !time || !driverId) return [];
    
    const alerts: string[] = [];
    const targetDriver = drivers.find(d => d.id === driverId);
    if (!targetDriver) return [];

    const thisTime = new Date(`${date}T${time}`).getTime();

    bookings.forEach((b) => {
      if (b.id === selectedBooking?.id || b.driver_id !== driverId) return;

      const runTime = new Date(b.start_time).getTime();
      const diffMinutes = Math.abs(thisTime - runTime) / (1000 * 60);

      if (diffMinutes < 90) {
        alerts.push(`${targetDriver.name} is scheduled for another run at ${b.time} on this day (overlap window of ${Math.round(diffMinutes)} mins).`);
      }
    });

    return alerts;
  };

  const handleAddStop = () => {
    if (destinations.length < 5) {
      setDestinations([...destinations, ""]);
    }
  };

  const handleRemoveStop = (index: number) => {
    const newStops = [...destinations];
    newStops.splice(index, 1);
    setDestinations(newStops.length > 0 ? newStops : [""]);
  };

  const handleStopChange = (index: number, val: string) => {
    const newStops = [...destinations];
    newStops[index] = val;
    setDestinations(newStops);
  };

  const handleSave = async () => {
    if (!date || !time || destinations.filter(s => s.trim() !== "").length === 0) {
      alert("Please enter a valid Date, Time, and at least one Destination stop.");
      return;
    }

    // Combine date & time into ISO string
    const start_time = new Date(`${date}T${time}`).toISOString();
    
    // Parse passenger names
    const pax_names = paxNamesInput
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    const payload = {
      vehicle_type: vehicleType,
      plate: plate.trim() || undefined,
      destination_1: destinations[0]?.trim() || undefined,
      destination_2: destinations[1]?.trim() || undefined,
      destination_3: destinations[2]?.trim() || undefined,
      destination_4: destinations[3]?.trim() || undefined,
      destination_5: destinations[4]?.trim() || undefined,
      mark: mark.trim() || undefined,
      pax_count: paxCount,
      pax_names,
      ship_name: shipName.trim() || undefined,
      price: Number(price),
      comment: comment.trim() || undefined,
      client: client.trim() || undefined,
      driver_id: driverId || null,
      start_time,
      end_time: null,
    };

    try {
      if (isEdit && selectedBooking) {
        await updateBooking(selectedBooking.id, payload);
      } else {
        await addBooking(payload);
      }
      setIsEditModalOpen(false);
    } catch (e) {
      // Alert triggered in AppContext
    }
  };

  const handleDelete = async () => {
    if (selectedBooking && confirm("Are you sure you want to delete this drive from Supabase?")) {
      try {
        await deleteBooking(selectedBooking.id);
        setIsEditModalOpen(false);
      } catch (e) {
        // Handled
      }
    }
  };

  const capWarning = getCapacityWarning();
  const doubleBookAlerts = getDoubleBookingAlerts();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 overflow-y-auto">
        {/* Scrim */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsEditModalOpen(false)}
          className="absolute inset-0 bg-neutral-950/70 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ y: "100%", opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0.8 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={`relative w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] border p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[92vh] sm:max-h-[85vh]
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
            onClick={() => setIsEditModalOpen(false)}
            className={`absolute right-5 top-5 sm:top-8 sm:right-8 p-2 rounded-full transition-colors duration-200 cursor-pointer
              ${prefs.theme === "dark" ? "hover:bg-neutral-800 text-neutral-400" : "hover:bg-amber-100 text-amber-800"}`}
          >
            <X size={20} />
          </button>

          <h3 className="text-2xl font-black font-display tracking-tight leading-tight pr-8 mb-1">
            {isEdit ? "Edit Scheduled Drive" : "Schedule New Drive"}
          </h3>
          <p className={`text-xs font-semibold mb-6
            ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-700"}`}
          >
            Manage route coordinates, assign driver accounts, and save updates to Supabase.
          </p>

          <div className="space-y-4">
            {/* Grid for Date, Time, Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={`text-[10px] uppercase font-bold tracking-wider
                  ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
                >
                  Departure Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full text-xs rounded-xl px-4 py-3 border font-semibold outline-none transition-colors
                    ${prefs.theme === "dark"
                      ? "bg-neutral-950/50 border-neutral-800/80 focus:border-violet-600 text-white"
                      : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                    }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={`text-[10px] uppercase font-bold tracking-wider
                  ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
                >
                  Departure Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={`w-full text-xs rounded-xl px-4 py-3 border font-semibold outline-none transition-colors font-mono
                    ${prefs.theme === "dark"
                      ? "bg-neutral-950/50 border-neutral-800/80 focus:border-violet-600 text-white"
                      : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                    }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={`text-[10px] uppercase font-bold tracking-wider
                  ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
                >
                  Price (€)
                </label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={price || ""}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className={`w-full text-xs rounded-xl pl-9 pr-4 py-3 border font-semibold outline-none transition-colors font-mono
                      ${prefs.theme === "dark"
                        ? "bg-neutral-950/50 border-neutral-800/80 focus:border-violet-600 text-white"
                        : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                      }`}
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Selection & Plate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={`text-[10px] uppercase font-bold tracking-wider
                  ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
                >
                  Vehicle Type
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as any)}
                  className={`w-full text-xs rounded-xl px-4 py-3 border font-semibold outline-none transition-colors cursor-pointer
                    ${prefs.theme === "dark"
                      ? "bg-neutral-950 border-neutral-800 focus:border-violet-600 text-white"
                      : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                    }`}
                >
                  <option value="car">🚗 Car (Max 4 pax)</option>
                  <option value="van">🚐 Van (Max 7 pax)</option>
                  <option value="caravelle">🚐 Caravelle (Max 9 pax)</option>
                  <option value="minibus">🚌 Minibus (Max 19 pax)</option>
                  <option value="bus">🚌 Bus (Max 54 pax)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={`text-[10px] uppercase font-bold tracking-wider
                  ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
                >
                  License Plate
                </label>
                <input
                  type="text"
                  placeholder="e.g. AA-123-BB"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  className={`w-full text-xs rounded-xl px-4 py-3 border font-semibold outline-none transition-colors uppercase font-mono
                    ${prefs.theme === "dark"
                      ? "bg-neutral-950/50 border-neutral-800/80 focus:border-violet-600 text-white"
                      : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                    }`}
                />
              </div>
            </div>

            {/* Destinations list (Up to 5) */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className={`text-[10px] uppercase font-bold tracking-wider
                  ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
                >
                  Destination Stops (Stamps Stop Line)
                </label>
                {destinations.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddStop}
                    className="text-[10px] font-black text-violet-500 hover:text-violet-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> Add Stop ({destinations.length}/5)
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                {destinations.map((stop, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <span className="text-xs font-mono text-neutral-500 shrink-0 w-4">#{index+1}</span>
                    <input
                      type="text"
                      placeholder={`Enter stop destination ${index+1}...`}
                      value={stop}
                      onChange={(e) => handleStopChange(index, e.target.value)}
                      className={`flex-1 text-xs rounded-xl px-4 py-2.5 border font-semibold outline-none transition-colors
                        ${prefs.theme === "dark"
                          ? "bg-neutral-950/50 border-neutral-800/80 focus:border-violet-600 text-white"
                          : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                        }`}
                    />
                    {destinations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(index)}
                        className="text-red-500 hover:text-red-400 p-2 cursor-pointer transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pax Details (Count and Names) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={`text-[10px] uppercase font-bold tracking-wider
                  ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
                >
                  Number of Pax
                </label>
                <input
                  type="number"
                  min="0"
                  value={paxCount}
                  onChange={(e) => setPaxCount(Number(e.target.value))}
                  className={`w-full text-xs rounded-xl px-4 py-3 border font-semibold outline-none transition-colors font-mono
                    ${prefs.theme === "dark"
                      ? "bg-neutral-950/50 border-neutral-800/80 focus:border-violet-600 text-white"
                      : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                    }`}
                />
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <label className={`text-[10px] uppercase font-bold tracking-wider
                  ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
                >
                  Passenger Names (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe, Sarah Connor"
                  value={paxNamesInput}
                  onChange={(e) => setPaxNamesInput(e.target.value)}
                  className={`w-full text-xs rounded-xl px-4 py-3 border font-semibold outline-none transition-colors
                    ${prefs.theme === "dark"
                      ? "bg-neutral-950/50 border-neutral-800/80 focus:border-violet-600 text-white"
                      : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                    }`}
                />
              </div>
            </div>

            {/* Invoicing Mark, Ship Name & Client */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={`text-[10px] uppercase font-bold tracking-wider
                  ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
                >
                  Invoice Mark
                </label>
                <div className="relative">
                  <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Invoice tag"
                    value={mark}
                    onChange={(e) => setMark(e.target.value)}
                    className={`w-full text-xs rounded-xl pl-9 pr-4 py-3 border font-semibold outline-none transition-colors
                      ${prefs.theme === "dark"
                        ? "bg-neutral-950/50 border-neutral-800/80 focus:border-violet-600 text-white"
                        : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                      }`}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={`text-[10px] uppercase font-bold tracking-wider
                  ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
                >
                  Vessel / Ship
                </label>
                <input
                  type="text"
                  placeholder="⚓ Vessel name"
                  value={shipName}
                  onChange={(e) => setShipName(e.target.value)}
                  className={`w-full text-xs rounded-xl px-4 py-3 border font-semibold outline-none transition-colors
                    ${prefs.theme === "dark"
                      ? "bg-neutral-950/50 border-neutral-800/80 focus:border-violet-600 text-white"
                      : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                    }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={`text-[10px] uppercase font-bold tracking-wider
                  ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
                >
                  Client Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Equinor"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className={`w-full text-xs rounded-xl px-4 py-3 border font-semibold outline-none transition-colors
                    ${prefs.theme === "dark"
                      ? "bg-neutral-950/50 border-neutral-800/80 focus:border-violet-600 text-white"
                      : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                    }`}
                />
              </div>
            </div>

            {/* Capacity Alerts */}
            {capWarning && (
              <div className="flex items-start gap-2.5 rounded-xl p-3 border text-xs font-semibold border-amber-500/30 bg-amber-500/10 text-amber-500">
                <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                <p>{capWarning}</p>
              </div>
            )}

            {/* Overlap / Double booking Alerts */}
            {doubleBookAlerts.length > 0 && (
              <div className="flex flex-col gap-1.5 rounded-xl p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-semibold">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <AlertTriangle size={15} className="flex-shrink-0" />
                  <span className="font-bold">Overlapping Schedule Conflict:</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5">
                  {doubleBookAlerts.map((alertText, idx) => (
                    <li key={idx}>{alertText}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Driver Allocation Dropdown */}
            <div className="flex flex-col gap-1.5 pt-1">
              <label className={`text-[10px] uppercase font-bold tracking-wider
                ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
              >
                Assign Coordinator Driver
              </label>
              {drivers.length === 0 ? (
                <div className="text-xs italic text-amber-500">
                  No driver accounts registered. Please save drivers in the Dispatcher view.
                </div>
              ) : (
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className={`w-full text-xs rounded-xl px-4 py-3 border font-semibold outline-none transition-colors cursor-pointer
                    ${prefs.theme === "dark"
                      ? "bg-neutral-950 border-neutral-800 focus:border-violet-600 text-white"
                      : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                    }`}
                >
                  <option value="">-- Click to assign driver (Optional) --</option>
                  {drivers.map((drv) => (
                    <option key={drv.id} value={drv.id}>
                      {drv.name} ({drv.username})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Trip Comments */}
            <div className="flex flex-col gap-1.5">
              <label className={`text-[10px] uppercase font-bold tracking-wider
                ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
              >
                Comments / Trip Notes
              </label>
              <textarea
                placeholder="Include custom luggage details, itinerary comments, flight details..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className={`w-full text-xs rounded-xl px-4 py-3 border font-semibold outline-none transition-colors resize-none
                  ${prefs.theme === "dark"
                    ? "bg-neutral-950/50 border-neutral-800/80 focus:border-violet-600 text-white"
                    : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                  }`}
              />
            </div>
          </div>

          {/* Action buttons at bottom */}
          <div className="flex flex-col sm:flex-row gap-2 mt-8">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className={`flex-1 py-3.5 rounded-2xl text-xs font-bold border transition-colors cursor-pointer
                ${prefs.theme === "dark"
                  ? "border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"
                  : "border-amber-200 bg-white text-amber-800 hover:bg-amber-100"
                }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3.5 rounded-2xl text-xs font-extrabold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/10 cursor-pointer transition-colors"
            >
              {isEdit ? "Update Schedule" : "Add to Dispatch"}
            </button>
          </div>

          {isEdit && (
            <div className="mt-4 border-t border-dashed border-neutral-800/40 pt-4 flex justify-end">
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-400 py-1.5 px-3 rounded-lg hover:bg-red-500/5 transition-all cursor-pointer"
              >
                <Trash2 size={13} /> Delete Run
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
