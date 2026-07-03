import React from "react";
import { useApp } from "../context/AppContext";
import { X, Bell, Moon, Sun, AlertCircle, RefreshCw, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerToast: (title: string, msg: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onTriggerToast }) => {
  const { prefs, setPrefs, loadData } = useApp();

  if (!isOpen) return null;

  const handleToggle = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleNumberChange = (key: keyof typeof prefs, val: number) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleResetData = async () => {
    await loadData();
    onTriggerToast("Data Reloaded", "Drives and drivers refreshed from Supabase.");
  };

  const handleTestNotification = () => {
    onTriggerToast("Dispatch Reminder System", `Alert: Quick test reminder is working!`);
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

        {/* Modal body */}
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
            System Preferences
          </h3>
          <p className={`text-xs font-semibold mb-6
            ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
          >
            Manage scheduling automated warnings and simulator settings.
          </p>

          <div className="space-y-4">
            {/* Lead Time */}
            <div className="flex items-center justify-between py-3 border-b border-neutral-800/40">
              <div className="flex flex-col">
                <span className="text-sm font-bold">Departure Reminders</span>
                <span className="text-[10px] text-neutral-400 font-medium">Minutes before each run to notify.</span>
              </div>
              <input
                type="number"
                min="0"
                max="180"
                value={prefs.leadMinutes}
                onChange={(e) => handleNumberChange("leadMinutes", Number(e.target.value))}
                className={`w-16 rounded-xl p-2 border font-bold text-center outline-none transition-colors font-mono text-xs
                  ${prefs.theme === "dark"
                    ? "bg-neutral-950 border-neutral-800 focus:border-violet-600 text-white"
                    : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                  }`}
              />
            </div>

            {/* Supabase Database Connection */}
            <div className="space-y-2 py-3 border-b border-neutral-800/40">
              <span className={`text-[10px] uppercase tracking-wider font-extrabold block
                ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
              >
                Supabase Connection Link
              </span>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-neutral-500 font-semibold">REST API Endpoint URL</span>
                  <input
                    type="text"
                    placeholder="https://glsjmryzxsunpritarpy.supabase.co/rest/v1"
                    value={prefs.supabaseUrl || ""}
                    onChange={(e) => setPrefs(prev => ({ ...prev, supabaseUrl: e.target.value.trim() }))}
                    className={`w-full text-xs rounded-xl p-2.5 border font-semibold outline-none transition-colors
                      ${prefs.theme === "dark"
                        ? "bg-neutral-950 border-neutral-850 focus:border-violet-600 text-white"
                        : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                      }`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-neutral-500 font-semibold">Public Anon/Public API Key</span>
                  <input
                    type="password"
                    placeholder="Paste anon key..."
                    value={prefs.supabaseAnonKey || ""}
                    onChange={(e) => setPrefs(prev => ({ ...prev, supabaseAnonKey: e.target.value.trim() }))}
                    className={`w-full text-xs rounded-xl p-2.5 border font-semibold outline-none transition-colors font-mono
                      ${prefs.theme === "dark"
                        ? "bg-neutral-950 border-neutral-850 focus:border-violet-600 text-white"
                        : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                      }`}
                  />
                </div>
              </div>
            </div>

            {/* Night Before Switch */}
            <div className="flex items-center justify-between py-3 border-b border-neutral-800/40">
              <div className="flex flex-col">
                <span className="text-sm font-bold">Night-Before Warnings</span>
                <span className="text-[10px] text-neutral-400 font-medium">Notify early runs evening before.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.nightBefore}
                  onChange={() => handleToggle("nightBefore")}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600
                  ${prefs.theme === "dark" ? "bg-neutral-850" : "bg-amber-200"}`}
                />
              </label>
            </div>

            {/* Night Before Hour */}
            {prefs.nightBefore && (
              <div className="flex items-center justify-between py-3 border-b border-neutral-800/40">
                <div className="flex flex-col pl-4 border-l border-dashed border-neutral-700">
                  <span className="text-xs font-bold">Evening Warning Hour</span>
                  <span className="text-[9px] text-neutral-400 font-medium">Hour (0-23) to trigger evening alert.</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={prefs.nightBeforeHour}
                  onChange={(e) => handleNumberChange("nightBeforeHour", Number(e.target.value))}
                  className={`w-16 rounded-xl p-2 border font-bold text-center outline-none transition-colors font-mono text-xs
                    ${prefs.theme === "dark"
                      ? "bg-neutral-950 border-neutral-800 focus:border-violet-600 text-white"
                      : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                    }`}
                />
              </div>
            )}

            {/* Simulator Tools */}
            <div className="space-y-2 pt-2">
              <span className={`text-[10px] uppercase tracking-wider font-extrabold block
                ${prefs.theme === "dark" ? "text-neutral-400" : "text-amber-800"}`}
              >
                Simulator & Diagnostic Utilities
              </span>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleTestNotification}
                  className={`flex items-center justify-center gap-1.5 py-3 rounded-xl border text-xs font-bold cursor-pointer transition-colors
                    ${prefs.theme === "dark"
                      ? "border-neutral-800 bg-neutral-950/60 text-neutral-300 hover:bg-neutral-900"
                      : "border-amber-200 bg-white text-amber-850 hover:bg-amber-100"
                    }`}
                >
                  <Bell size={12} />
                  <span>Test Toast Alert</span>
                </button>

                <button
                  onClick={handleResetData}
                  className={`flex items-center justify-center gap-1.5 py-3 rounded-xl border text-xs font-bold cursor-pointer transition-colors
                    ${prefs.theme === "dark"
                      ? "border-neutral-800 bg-neutral-950/60 text-neutral-300 hover:bg-neutral-900"
                      : "border-amber-200 bg-white text-amber-850 hover:bg-amber-100"
                    }`}
                >
                  <RefreshCw size={12} />
                  <span>Reset Database</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl font-bold text-sm bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/10 cursor-pointer active:scale-98 transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
