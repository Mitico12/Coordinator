import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { WeekNav } from "./components/WeekNav";
import { WorkloadSummary } from "./components/WorkloadSummary";
import { DriverView } from "./components/DriverView";
import { DispatchView } from "./components/DispatchView";
import { BookingDetailModal } from "./components/BookingDetailModal";
import { BookingFormModal } from "./components/BookingFormModal";
import { SettingsModal } from "./components/SettingsModal";
import { LoginScreen } from "./components/LoginScreen";
import { motion, AnimatePresence } from "motion/react";

interface Toast {
  id: string;
  title: string;
  msg: string;
}

function MainAppContent() {
  const { prefs } = useApp();
  
  // Custom dialog flags
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Trigger custom toast popups
  const handleTriggerToast = (title: string, msg: string) => {
    const id = `toast_${Date.now()}`;
    setToasts((prev) => [...prev, { id, title, msg }]);
    
    // Auto clear after 5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  // Gate: If not authenticated, show login screen
  if (!prefs.authenticatedDriverId) {
    return <LoginScreen />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 flex flex-col font-sans
      ${prefs.theme === "dark" 
        ? "bg-neutral-950 text-white selection:bg-violet-600/30" 
        : "bg-slate-50 text-slate-900 selection:bg-blue-600/20"
      }`}
    >
      {/* Header Panel */}
      <Header 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        onOpenDriverPicker={() => {}} 
      />

      {/* Primary Layout wrapper */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 md:py-6 space-y-6">
        
        {prefs.role === "driver" || prefs.viewMode === "driver" ? (
          /* Driver Portal Schedule */
          <div className="space-y-4 max-w-2xl mx-auto">
            <WeekNav />
            <DriverView />
          </div>
        ) : (
          /* Dispatch Dashboard View */
          <div className="space-y-6">
            <WorkloadSummary />
            <WeekNav />
            <DispatchView />
          </div>
        )}
      </main>

      {/* Modular Modal Panels */}
      <BookingDetailModal />
      <BookingFormModal />
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onTriggerToast={handleTriggerToast}
      />

      {/* Floating Interactive Toast alerts */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 w-[90vw] max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -10, opacity: 0, scale: 0.95 }}
              className={`rounded-2xl border p-4 shadow-xl flex flex-col gap-1 backdrop-blur-md border-violet-500/20
                ${prefs.theme === "dark"
                  ? "bg-neutral-900/90 text-white"
                  : "bg-white/95 text-slate-950"
                }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-violet-500">
                  {toast.title}
                </h5>
              </div>
              <p className="text-xs font-semibold leading-relaxed">
                {toast.msg}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modern, elegant small footer */}
      <footer className={`py-6 border-t text-center text-[10px] font-bold tracking-widest uppercase opacity-45
        ${prefs.theme === "dark" ? "border-neutral-900 text-neutral-500" : "border-slate-200 text-slate-500"}`}
      >
        Apex Dispatch System &bull; Active Version 7.2.0
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
