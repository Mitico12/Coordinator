import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { X, User, Plus, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getDriverColor, INITIAL_DRIVERS } from "../data";

interface DriverPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DriverPickerModal: React.FC<DriverPickerModalProps> = ({ isOpen, onClose }) => {
  const { prefs, setPrefs, bookings } = useApp();
  const [customName, setCustomName] = useState("");

  if (!isOpen) return null;

  // Extract all unique drivers available in system
  const uniqueDrivers = Array.from(
    new Set([
      ...INITIAL_DRIVERS,
      ...bookings.flatMap((b) => b.drivers),
    ])
  ).filter(Boolean);

  const handleSelectDriver = (name: string) => {
    setPrefs((prev) => ({
      ...prev,
      driver: name,
    }));
    onClose();
  };

  const handleCreateAndSelectDriver = () => {
    const trimmed = customName.trim();
    if (trimmed) {
      handleSelectDriver(trimmed);
      setCustomName("");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
        {/* Scrim */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-neutral-950/70 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal content */}
        <motion.div
          initial={{ y: "100%", opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0.8 }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className={`relative w-full max-w-md rounded-t-[2.2rem] sm:rounded-[2.2rem] border p-6 shadow-2xl overflow-hidden
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
            onClick={onClose}
            className={`absolute right-4 top-4 sm:top-6 sm:right-6 p-2 rounded-full transition-colors duration-200 cursor-pointer
              ${prefs.theme === "dark" ? "hover:bg-neutral-800 text-neutral-400" : "hover:bg-amber-100 text-amber-800"}`}
          >
            <X size={20} />
          </button>

          <h3 className="text-xl font-black font-display tracking-tight leading-tight mb-1">
            Who is driving?
          </h3>
          <p className={`text-xs font-semibold mb-6
            ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
          >
            Select your profile name below to retrieve your individual routes.
          </p>

          <div className="space-y-4">
            {/* Drivers list */}
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {uniqueDrivers.map((name) => {
                const color = getDriverColor(name);
                const isSelected = prefs.driver === name;

                return (
                  <button
                    key={name}
                    onClick={() => handleSelectDriver(name)}
                    className={`flex items-center gap-2 p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]
                      ${isSelected
                        ? "border-violet-600 bg-violet-600/15 text-white"
                        : prefs.theme === "dark"
                          ? "border-neutral-800 bg-neutral-950/40 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900"
                          : "border-amber-200 bg-white text-amber-900 hover:bg-amber-100"
                      }`}
                  >
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="truncate flex-1">{name}</span>
                    {isSelected && <Check size={12} className="text-violet-500 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Name creator */}
            <div className="flex flex-col gap-1.5 border-t border-dashed border-neutral-800/40 pt-4">
              <label className={`text-[10px] uppercase font-bold tracking-wider
                ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
              >
                Register Custom Driver
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your first and last name..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateAndSelectDriver()}
                  className={`flex-1 text-xs rounded-xl px-4 py-3 border font-semibold outline-none transition-colors
                    ${prefs.theme === "dark"
                      ? "bg-neutral-950/50 border-neutral-800/80 focus:border-violet-600 text-white"
                      : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                    }`}
                />
                <button
                  onClick={handleCreateAndSelectDriver}
                  className="px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs rounded-xl shrink-0 cursor-pointer"
                >
                  Register
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={onClose}
              className={`w-full py-3 rounded-2xl font-bold text-xs border cursor-pointer
                ${prefs.theme === "dark"
                  ? "border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400"
                  : "border-amber-200 bg-amber-100 hover:bg-amber-200 text-amber-900"
                }`}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
