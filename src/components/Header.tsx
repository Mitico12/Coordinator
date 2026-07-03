import React from "react";
import { useApp } from "../context/AppContext";
import { Moon, Sun, Settings, User, LogOut, Compass } from "lucide-react";

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenDriverPicker: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const { prefs, setPrefs, logout, drivers } = useApp();

  const toggleTheme = () => {
    setPrefs((prev) => ({
      ...prev,
      theme: prev.theme === "dark" ? "light" : "dark",
    }));
  };

  const activeDriverObj = drivers.find((d) => d.id === prefs.authenticatedDriverId);
  const activeDriverColor = activeDriverObj?.color || "#a855f7";

  return (
    <header className={`sticky top-0 z-30 flex flex-col gap-4 border-b px-4 py-4 backdrop-blur-md transition-colors duration-200
      ${prefs.theme === "dark" 
        ? "border-neutral-800/60 bg-neutral-950/80 text-white" 
        : "border-slate-200 bg-white/90 text-slate-900"
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Left Profile display */}
        {prefs.role === "driver" ? (
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              {prefs.driver ? (
                <div 
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-neutral-950 shadow-md"
                  style={{ backgroundColor: activeDriverColor }}
                >
                  {prefs.driver.split(" ").map((n) => n[0]).join("").toUpperCase()}
                </div>
              ) : (
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border border-dashed shadow-sm
                  ${prefs.theme === "dark" ? "border-neutral-600 bg-neutral-950" : "border-blue-300 bg-blue-50"}`}
                >
                  <User size={14} className={prefs.theme === "dark" ? "text-neutral-400" : "text-blue-700"} />
                </div>
              )}
              <span className={`absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 shadow-sm bg-emerald-500
                ${prefs.theme === "dark" ? "border-neutral-950" : "border-white"}`} 
              />
            </div>
            
            <div className="flex flex-col">
              <span className={`text-[10px] uppercase tracking-wider font-bold leading-none mb-0.5
                ${prefs.theme === "dark" ? "text-neutral-400" : "text-slate-500"}`}>
                Driver Portal
              </span>
              <span className="text-sm font-semibold leading-tight">
                {prefs.driver || "Driver Account"}
              </span>
            </div>
          </div>
        ) : (
          /* Dispatcher Control */
          <div className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs bg-violet-600 text-white shadow-md shadow-violet-900/10`}>
              DS
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-bold leading-none mb-0.5 opacity-80">
                Control Hub
              </span>
              <span className="text-sm font-bold leading-tight">
                Central Dispatch
              </span>
            </div>
          </div>
        )}

        {/* Right tools and Logout */}
        <div className="flex items-center gap-2">
          {/* Dispatcher View Switcher */}
          {prefs.role === "dispatcher" && prefs.viewMode === "driver" && (
            <select
              value={prefs.viewingDriverId || drivers[0]?.id || ""}
              onChange={(e) => {
                setPrefs(prev => ({ ...prev, viewingDriverId: e.target.value }));
              }}
              className={`text-xs font-bold px-2.5 py-2 rounded-xl border outline-none cursor-pointer max-w-[120px] sm:max-w-none transition-all
                ${prefs.theme === "dark" 
                  ? "bg-neutral-900 border-neutral-800 text-white focus:border-violet-600" 
                  : "bg-slate-100 border-slate-200 text-slate-800 focus:border-blue-500"
                }`}
            >
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}

          {prefs.role === "dispatcher" && (
            <button
              onClick={() => {
                setPrefs(prev => ({ 
                  ...prev, 
                  viewMode: prev.viewMode === "driver" ? "dispatch" : "driver" 
                }));
              }}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-black transition-all duration-200 cursor-pointer hover:scale-102 active:scale-98
                ${prefs.viewMode === "driver"
                  ? "bg-violet-600 text-white border-violet-700 hover:bg-violet-500"
                  : prefs.theme === "dark"
                    ? "border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white"
                    : "border-slate-200 bg-slate-100 text-slate-850 hover:bg-slate-200"
                }`}
            >
              <span>{prefs.viewMode === "driver" ? "📋 Dispatch View" : "👤 View as Driver"}</span>
            </button>
          )}
          {/* Online Sync indicator */}
          <div className={`hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border
            ${prefs.theme === "dark"
              ? "bg-neutral-900/80 border-neutral-800 text-neutral-350"
              : "bg-blue-50/80 border-blue-200 text-blue-800"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Online</span>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95
              ${prefs.theme === "dark"
                ? "border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800"
                : "border-slate-200 bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200"
              }`}
            aria-label="Toggle theme"
          >
            {prefs.theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95
              ${prefs.theme === "dark"
                ? "border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800"
                : "border-slate-200 bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200"
              }`}
            aria-label="Open settings"
            id="settings-btn"
          >
            <Settings size={18} />
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95
              ${prefs.theme === "dark"
                ? "border-red-900/40 bg-red-950/20 text-red-400 hover:bg-red-950/30"
                : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
              }`}
            title="Log out"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
