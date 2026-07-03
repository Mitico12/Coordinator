import React, { useState } from "react";
import { useApp, getStartOfWeek } from "../context/AppContext";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { DateRangeModal } from "./DateRangeModal";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

export const WeekNav: React.FC = () => {
  const { currentWeekStart, currentWeekEnd, setCurrentWeekStart, setCurrentWeekEnd, prefs } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePrevWeek = () => {
    // Shift backward by the duration of the current range
    const duration = currentWeekEnd.getTime() - currentWeekStart.getTime() + 1;
    setCurrentWeekStart(new Date(currentWeekStart.getTime() - duration));
    
    const end = new Date(currentWeekEnd.getTime() - duration);
    setCurrentWeekEnd(end);
  };

  const handleNextWeek = () => {
    // Shift forward by the duration of the current range
    const duration = currentWeekEnd.getTime() - currentWeekStart.getTime() + 1;
    setCurrentWeekStart(new Date(currentWeekStart.getTime() + duration));
    
    const end = new Date(currentWeekEnd.getTime() + duration);
    setCurrentWeekEnd(end);
  };

  const handleJumpToCurrent = () => {
    const start = getStartOfWeek(new Date());
    setCurrentWeekStart(start);
    
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    setCurrentWeekEnd(end);
  };

  const handleSelectRange = (start: Date, end: Date) => {
    setCurrentWeekStart(start);
    setCurrentWeekEnd(end);
  };

  const weekStart = new Date(currentWeekStart);
  const weekEnd = new Date(currentWeekEnd);

  const displayRange = `${weekStart.getDate()} ${MONTH_NAMES[weekStart.getMonth()]} – ${weekEnd.getDate()} ${MONTH_NAMES[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;
  
  const startWeek = getWeekNumber(weekStart);
  const endWeek = getWeekNumber(weekEnd);
  const weekLabel = startWeek === endWeek ? `Week ${startWeek}` : `Weeks ${startWeek} – ${endWeek}`;

  // Check if current view is the actual current week
  const systemWeekStart = getStartOfWeek(new Date());
  const isCurrentlyInCurrentWeek = currentWeekStart.getTime() === systemWeekStart.getTime();

  return (
    <div className="flex flex-col gap-2 py-2">
      <div className={`flex items-center justify-between rounded-2xl border p-2.5 transition-colors duration-200
        ${prefs.theme === "dark" 
          ? "border-neutral-800 bg-neutral-900/40 text-white" 
          : "border-blue-100 bg-blue-50/40 text-blue-950"
        }`}
      >
        {/* Prev Week Button */}
        <button
          onClick={handlePrevWeek}
          className={`h-10 w-10 flex items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95
            ${prefs.theme === "dark"
              ? "border-neutral-800 bg-neutral-950 text-neutral-350 hover:bg-neutral-800 hover:text-white"
              : "border-blue-200 bg-white text-blue-950 hover:bg-blue-50/50"
            }`}
          aria-label="Previous Period"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Week Info */}
        <div 
          onClick={() => setIsModalOpen(true)}
          title="Click to select a custom date range..."
          className="text-center cursor-pointer hover:opacity-80 transition-opacity px-4 select-none"
        >
          <span className={`text-[10px] uppercase tracking-widest font-extrabold block mb-0.5
            ${prefs.theme === "dark" ? "text-neutral-500" : "text-blue-700"}`}>
            Active Schedule View
          </span>
          <b className={`text-sm font-black tracking-tight font-display sm:text-base leading-none block
            ${prefs.theme === "dark" ? "text-white" : "text-slate-900"}`}
          >
            {displayRange}
          </b>
          <span className={`text-[10px] font-bold block mt-0.5
            ${prefs.theme === "dark" ? "text-neutral-400" : "text-slate-500"}`}>
            {weekLabel}
          </span>
        </div>

        {/* Next Week Button */}
        <button
          onClick={handleNextWeek}
          className={`h-10 w-10 flex items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95
            ${prefs.theme === "dark"
              ? "border-neutral-800 bg-neutral-950 text-neutral-350 hover:bg-neutral-800 hover:text-white"
              : "border-blue-200 bg-white text-blue-950 hover:bg-blue-50/50"
            }`}
          aria-label="Next Period"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Jump to Current Week Trigger */}
      {!isCurrentlyInCurrentWeek && (
        <div className="flex justify-center">
          <button
            onClick={handleJumpToCurrent}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border cursor-pointer hover:scale-102 active:scale-98 transition-all duration-200
              ${prefs.theme === "dark"
                ? "border-violet-800/60 bg-violet-950/10 text-violet-400 hover:bg-violet-950/30"
                : "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100"
              }`}
          >
            <Calendar size={12} />
            <span>Jump to Current Week</span>
          </button>
        </div>
      )}

      {/* Date Range Modal */}
      <DateRangeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectRange={handleSelectRange}
        initialStart={currentWeekStart}
        initialEnd={currentWeekEnd}
      />
    </div>
  );
};
