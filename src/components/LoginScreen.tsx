import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { ShieldCheck, User, Eye, EyeOff, Key, Database, RefreshCw, Compass } from "lucide-react";
import { motion } from "motion/react";

export const LoginScreen: React.FC = () => {
  const { drivers, login, prefs, setPrefs, isLoading, error, loadData } = useApp();
  
  const [activeTab, setActiveTab] = useState<"driver" | "dispatcher">("driver");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [password, setPassword] = useState("");
  const [dispatcherPasscode, setDispatcherPasscode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [setupUrl, setSetupUrl] = useState(prefs.supabaseUrl || "");
  const [setupKey, setSetupKey] = useState(prefs.supabaseAnonKey || "");
  const [setupSuccess, setSetupSuccess] = useState(false);

  const handleSaveCredentials = () => {
    if (!setupKey.trim()) {
      alert("Please enter a valid Supabase Anon Key");
      return;
    }
    setPrefs((prev) => ({
      ...prev,
      supabaseUrl: setupUrl.trim(),
      supabaseAnonKey: setupKey.trim(),
    }));
    setSetupSuccess(true);
    setTimeout(() => setSetupSuccess(false), 2000);
  };

  const handleDriverLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!selectedDriverId) {
      setLoginError("Please select your driver name.");
      return;
    }

    const driver = drivers.find((d) => d.id === selectedDriverId);
    if (!driver) {
      setLoginError("Selected driver not found.");
      return;
    }

    // Authenticate
    if (driver.password === password) {
      login("driver", driver.id, driver.name);
    } else {
      setLoginError("Invalid driver password. Please try again.");
    }
  };

  const handleDispatcherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    // Dispatcher passcode check
    if (dispatcherPasscode === "admin" || dispatcherPasscode === "admin123") {
      login("dispatcher");
    } else {
      setLoginError("Invalid dispatcher passcode. Default is 'admin'.");
    }
  };

  // If no Supabase key is configured, show a configuration wizard
  const isSupabaseMissing = !prefs.supabaseAnonKey && !import.meta.env.VITE_SUPABASE_ANON_KEY;

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-300 font-sans
      ${prefs.theme === "dark" 
        ? "bg-neutral-950 text-white" 
        : "bg-amber-50/20 text-neutral-900"
      }`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-[30%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute -bottom-[30%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`relative w-full max-w-md rounded-[2.5rem] border p-8 shadow-2xl backdrop-blur-md
          ${prefs.theme === "dark"
            ? "border-neutral-850 bg-neutral-900/80"
            : "border-amber-200/70 bg-white/90"
          }`}
      >
        {/* App Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-14 w-14 rounded-3xl bg-gradient-to-tr from-violet-600 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-violet-900/20 mb-4">
            <Compass size={28} className="animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-black tracking-tight font-display mb-1">Apex Dispatcher</h2>
          <p className={`text-xs font-semibold tracking-wide uppercase opacity-60`}>Premier Drive Coordinator</p>
        </div>

        {isSupabaseMissing ? (
          /* API Connection Configuration wizard */
          <div className="space-y-6">
            <div className="rounded-2xl border border-dashed p-4 flex flex-col gap-2 border-violet-500/30 bg-violet-950/5">
              <div className="flex items-center gap-2 text-violet-400">
                <Database size={16} />
                <h4 className="text-xs font-bold uppercase tracking-wider">Database Link Needed</h4>
              </div>
              <p className={`text-xs leading-relaxed opacity-85`}>
                To activate the real-time coordinator, link your clean Supabase database API anon key.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider opacity-60">Supabase API URL</label>
                <input
                  type="text"
                  placeholder="https://glsjmryzxsunpritarpy.supabase.co/rest/v1"
                  value={setupUrl}
                  onChange={(e) => setSetupUrl(e.target.value)}
                  className={`w-full text-xs rounded-xl px-4 py-3 border font-semibold outline-none transition-colors
                    ${prefs.theme === "dark"
                      ? "bg-neutral-950/50 border-neutral-800/80 focus:border-violet-600 text-white"
                      : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                    }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider opacity-60">Supabase Anon Key</label>
                <textarea
                  rows={3}
                  placeholder="Paste your anon public key here..."
                  value={setupKey}
                  onChange={(e) => setSetupKey(e.target.value)}
                  className={`w-full text-xs rounded-xl px-4 py-3 border font-semibold outline-none transition-colors font-mono resize-none
                    ${prefs.theme === "dark"
                      ? "bg-neutral-950/50 border-neutral-800/80 focus:border-violet-600 text-white"
                      : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                    }`}
                />
              </div>

              <button
                onClick={handleSaveCredentials}
                className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black rounded-2xl tracking-wide uppercase transition-all shadow-lg shadow-violet-900/10 cursor-pointer"
              >
                {setupSuccess ? "Saved successfully!" : "Connect Database"}
              </button>
            </div>
          </div>
        ) : (
          /* Normal Auth Forms */
          <div className="space-y-6">
            {/* Custom Tab selector */}
            <div className={`flex p-1 rounded-2xl border
              ${prefs.theme === "dark" ? "border-neutral-800 bg-neutral-950/40" : "border-amber-200/50 bg-amber-100/10"}`}
            >
              <button
                onClick={() => {
                  setActiveTab("driver");
                  setLoginError("");
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-black py-2.5 rounded-xl transition-all cursor-pointer
                  ${activeTab === "driver"
                    ? prefs.theme === "dark"
                      ? "bg-neutral-800 text-white"
                      : "bg-amber-100 text-amber-950 border border-amber-200/60 shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                  }`}
              >
                <User size={12} /> Driver Portal
              </button>
              <button
                onClick={() => {
                  setActiveTab("dispatcher");
                  setLoginError("");
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-black py-2.5 rounded-xl transition-all cursor-pointer
                  ${activeTab === "dispatcher"
                    ? prefs.theme === "dark"
                      ? "bg-neutral-800 text-white"
                      : "bg-amber-100 text-amber-950 border border-amber-200/60 shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                  }`}
              >
                <ShieldCheck size={12} /> Dispatcher Admin
              </button>
            </div>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3.5 text-xs font-semibold leading-relaxed">
                {loginError}
              </div>
            )}

            {activeTab === "driver" ? (
              /* Driver Login Form */
              <form onSubmit={handleDriverLogin} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider opacity-60">Driver Account</label>
                  {isLoading ? (
                    <div className="animate-pulse h-11 bg-neutral-800/40 rounded-xl" />
                  ) : drivers.length === 0 ? (
                    <div className="text-xs text-amber-500 font-semibold p-3.5 border rounded-xl border-amber-500/20 bg-amber-500/5">
                      No active driver accounts found. Setup drivers in the Dispatcher admin panel first.
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("dispatcher");
                          setLoginError("");
                        }}
                        className="text-violet-400 font-bold block mt-1 hover:underline"
                      >
                        Login to Dispatcher to add drivers
                      </button>
                    </div>
                  ) : (
                    <select
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className={`w-full text-xs rounded-xl px-4 py-3 border font-semibold outline-none transition-colors cursor-pointer
                        ${prefs.theme === "dark"
                          ? "bg-neutral-950 border-neutral-800 focus:border-violet-600 text-white"
                          : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                        }`}
                    >
                      <option value="">-- Choose your name --</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.username})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider opacity-60">Passcode / Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter driver passcode..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full text-xs rounded-xl pl-4 pr-10 py-3 border font-semibold outline-none transition-colors
                        ${prefs.theme === "dark"
                          ? "bg-neutral-950 border-neutral-800 focus:border-violet-600 text-white"
                          : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || drivers.length === 0}
                  className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 disabled:bg-neutral-800 disabled:opacity-50 text-white text-xs font-black rounded-2xl tracking-wide uppercase transition-all shadow-lg shadow-violet-900/10 cursor-pointer"
                >
                  {isLoading ? "Signing in..." : "Enter Portal"}
                </button>
              </form>
            ) : (
              /* Dispatcher Login Form */
              <form onSubmit={handleDispatcherLogin} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider opacity-60">Dispatcher Admin Passcode</label>
                  <div className="relative">
                    <Key size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="password"
                      placeholder="Enter dispatcher passcode..."
                      value={dispatcherPasscode}
                      onChange={(e) => setDispatcherPasscode(e.target.value)}
                      className={`w-full text-xs rounded-xl pl-10 pr-4 py-3 border font-semibold outline-none transition-colors
                        ${prefs.theme === "dark"
                          ? "bg-neutral-950 border-neutral-800 focus:border-violet-600 text-white"
                          : "bg-white border-amber-200 focus:border-amber-500 text-amber-950"
                        }`}
                    />
                  </div>
                  <span className="text-[9px] font-semibold text-neutral-500">Hint: passcode is admin</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black rounded-2xl tracking-wide uppercase transition-all shadow-lg shadow-violet-900/10 cursor-pointer"
                >
                  Enter Dashboard
                </button>
              </form>
            )}

            {error && (
              <div className="flex flex-col gap-2 bg-red-500/5 border border-red-500/10 text-red-400 rounded-xl p-3.5 text-xs font-medium">
                <span>Database error: {error}</span>
                <button
                  onClick={loadData}
                  className="flex items-center justify-center gap-1.5 py-2 border border-red-500/20 hover:bg-red-500/10 text-white rounded-lg text-[10px] font-bold"
                >
                  <RefreshCw size={10} /> Retry Connection
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
