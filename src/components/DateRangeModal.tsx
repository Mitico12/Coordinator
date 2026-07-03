import React, { useState } from "react";
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "../context/AppContext";

interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRange: (start: Date, end: Date) => void;
  initialStart: Date;
  initialEnd: Date;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_NAMES = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export const DateRangeModal: React.FC<DateRangeModalProps> = ({
  isOpen,
  onClose,
  onSelectRange,
  initialStart,
  initialEnd,
}) => {
  const { prefs } = useApp();
  const [startDate, setStartDate] = useState<Date>(new Date(initialStart));
  const [endDate, setEndDate] = useState<Date>(new Date(initialEnd));
  
  // Track which month we are viewing in the calendar grid
  const [viewDate, setViewDate] = useState<Date>(() => {
    const d = new Date(initialStart);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  if (!isOpen) return null;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Calendar math
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() || 7) - 1; // 0-indexed Monday

  const daysArray: (Date | null)[] = [];
  // Pad previous month days
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(new Date(year, month, i));
  }

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const isBetween = (d: Date, start: Date, end: Date) => {
    const time = d.getTime();
    const tStart = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const tEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    return time >= tStart && time <= tEnd;
  };

  const handleDayClick = (day: Date) => {
    const clickedTime = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
    const startTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
    
    // If no end date yet and clicked day is after start date
    if (clickedTime >= startTime && isSameDay(startDate, endDate)) {
      setEndDate(day);
    } else {
      // Start a new selection range
      setStartDate(day);
      setEndDate(day);
    }
  };

  // Presets
  const applyPreset = (presetType: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let start = new Date(today);
    let end = new Date(today);

    switch (presetType) {
      case "today":
        break;
      case "this-week": {
        const day = today.getDay() || 7;
        start.setDate(today.getDate() - (day - 1));
        end.setDate(start.getDate() + 6);
        break;
      }
      case "next-week": {
        const day = today.getDay() || 7;
        start.setDate(today.getDate() - (day - 1) + 7);
        end.setDate(start.getDate() + 6);
        break;
      }
      case "this-month": {
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      }
      case "next-month": {
        start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        break;
      }
      case "next-30": {
        end.setDate(today.getDate() + 29);
        break;
      }
      default:
        return;
    }

    setStartDate(start);
    setEndDate(end);
    setViewDate(new Date(start.getFullYear(), start.getMonth(), 1));
  };

  const handleApply = () => {
    // Ensure start is before end
    let start = new Date(startDate);
    let end = new Date(endDate);
    if (start.getTime() > end.getTime()) {
      const temp = start;
      start = end;
      end = temp;
    }
    
    // Set boundaries
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    onSelectRange(start, end);
    onClose();
  };

  const formatDateStr = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
      />

      {/* Modal Container */}
      <div className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl flex flex-col md:flex-row overflow-hidden transition-all duration-200
        ${prefs.theme === "dark"
          ? "bg-neutral-900 border-neutral-800 text-white"
          : "bg-white border-slate-200 text-slate-800"
        }`}
      >
        {/* Presets Sidebar */}
        <div className={`w-full md:w-48 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible border-b md:border-b-0 md:border-r shrink-0
          ${prefs.theme === "dark" ? "border-neutral-800 bg-neutral-950/20" : "border-slate-100 bg-slate-50/50"}`}
        >
          <span className={`hidden md:block text-[10px] uppercase tracking-widest font-black mb-2
            ${prefs.theme === "dark" ? "text-neutral-500" : "text-slate-400"}`}>
            Presets
          </span>
          {[
            { id: "today", label: "Today" },
            { id: "this-week", label: "This Week" },
            { id: "next-week", label: "Next Week" },
            { id: "this-month", label: "This Month" },
            { id: "next-month", label: "Next Month" },
            { id: "next-30", label: "Next 30 Days" }
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`text-left text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap md:w-full
                ${prefs.theme === "dark"
                  ? "text-neutral-400 hover:text-white hover:bg-neutral-850/50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon size={16} className={prefs.theme === "dark" ? "text-violet-400" : "text-blue-500"} />
              <h3 className="text-sm font-black uppercase tracking-wider">Select Date Range</h3>
            </div>
            <button 
              onClick={onClose}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer
                ${prefs.theme === "dark" ? "hover:bg-neutral-855 text-neutral-400 hover:text-white" : "hover:bg-slate-100 text-slate-450 hover:text-slate-800"}`}
            >
              <X size={16} />
            </button>
          </div>

          {/* Month Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm font-black tracking-tight">
              {MONTH_NAMES[month]} {year}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className={`p-1.5 rounded-xl border transition-colors cursor-pointer
                  ${prefs.theme === "dark"
                    ? "border-neutral-800 hover:bg-neutral-855 text-neutral-350"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNextMonth}
                className={`p-1.5 rounded-xl border transition-colors cursor-pointer
                  ${prefs.theme === "dark"
                    ? "border-neutral-800 hover:bg-neutral-855 text-neutral-350"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAY_NAMES.map((name) => (
              <span 
                key={name} 
                className={`text-[10px] font-extrabold uppercase py-1
                  ${prefs.theme === "dark" ? "text-neutral-600" : "text-slate-400"}`}
              >
                {name}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center mb-5">
            {daysArray.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="h-8" />;
              }

              const isSelectedStart = isSameDay(day, startDate);
              const isSelectedEnd = isSameDay(day, endDate);
              const isInSelectedRange = isBetween(day, startDate, endDate);
              
              let dayStyles = "";
              if (isSelectedStart && isSelectedEnd) {
                dayStyles = prefs.theme === "dark" 
                  ? "bg-violet-600 text-white rounded-full font-black" 
                  : "bg-blue-600 text-white rounded-full font-black shadow-md shadow-blue-500/10";
              } else if (isSelectedStart) {
                dayStyles = prefs.theme === "dark"
                  ? "bg-violet-600 text-white rounded-l-full font-black"
                  : "bg-blue-600 text-white rounded-l-full font-black shadow-md shadow-blue-500/10";
              } else if (isSelectedEnd) {
                dayStyles = prefs.theme === "dark"
                  ? "bg-violet-600 text-white rounded-r-full font-black"
                  : "bg-blue-600 text-white rounded-r-full font-black shadow-md shadow-blue-500/10";
              } else if (isInSelectedRange) {
                dayStyles = prefs.theme === "dark"
                  ? "bg-violet-950/40 text-violet-300 font-bold animate-fade-in"
                  : "bg-blue-50 text-blue-800 font-bold animate-fade-in";
              } else {
                dayStyles = prefs.theme === "dark"
                  ? "text-neutral-300 hover:bg-neutral-850 hover:text-white rounded-full"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-full";
              }

              return (
                <button
                  key={`day-${day.getTime()}`}
                  onClick={() => handleDayClick(day)}
                  className={`h-8 w-full flex items-center justify-center text-xs transition-all cursor-pointer font-medium ${dayStyles}`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Form and Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-dashed border-neutral-800"
          >
            {/* Input display */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none">
                <span className={`text-[9px] uppercase tracking-wider font-extrabold block mb-0.5
                  ${prefs.theme === "dark" ? "text-neutral-500" : "text-slate-400"}`}>Start Date</span>
                <input
                  type="text"
                  readOnly
                  value={formatDateStr(startDate)}
                  className={`w-full sm:w-28 text-xs font-bold px-2 py-1.5 rounded-xl border outline-none text-center
                    ${prefs.theme === "dark" ? "bg-neutral-950 border-neutral-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                />
              </div>
              <span className={`text-xs font-bold pt-4 ${prefs.theme === "dark" ? "text-neutral-600" : "text-slate-450"}`}>➔</span>
              <div className="flex-1 sm:flex-none">
                <span className={`text-[9px] uppercase tracking-wider font-extrabold block mb-0.5
                  ${prefs.theme === "dark" ? "text-neutral-500" : "text-slate-400"}`}>End Date</span>
                <input
                  type="text"
                  readOnly
                  value={formatDateStr(endDate)}
                  className={`w-full sm:w-28 text-xs font-bold px-2 py-1.5 rounded-xl border outline-none text-center
                    ${prefs.theme === "dark" ? "bg-neutral-950 border-neutral-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={onClose}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer
                  ${prefs.theme === "dark"
                    ? "border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-855"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-extrabold bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-900/10 cursor-pointer transition-all active:scale-97"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
