import React from "react";
import { useApp, getStartOfWeek } from "../context/AppContext";
import { Bus, Car } from "lucide-react";
import { motion } from "motion/react";

export const WorkloadSummary: React.FC = () => {
  const { bookings, drivers, prefs, currentWeekStart, currentWeekEnd, selectedDriverFilterId, setSelectedDriverFilterId } = useApp();

  // Get active range's start and end dates
  const weekStart = new Date(currentWeekStart);
  const weekEnd = new Date(currentWeekEnd);

  // Filter bookings to this week
  const weekBookings = bookings.filter((b) => {
    const bDate = new Date(b.date);
    return bDate >= weekStart && bDate <= weekEnd;
  });

  // Calculate workloads for each driver
  const workloads: Record<string, { big: number; small: number; total: number; color: string; name: string }> = {};
  
  // Initialize workloads for all known drivers
  drivers.forEach((d) => {
    workloads[d.id] = { big: 0, small: 0, total: 0, color: d.color, name: d.name };
  });

  // Tally bookings
  weekBookings.forEach((b) => {
    if (b.driver_id && workloads[b.driver_id]) {
      workloads[b.driver_id].total += 1;
      if (b.vehicle_type === "bus" || b.vehicle_type === "minibus") {
        workloads[b.driver_id].big += 1;
      } else {
        workloads[b.driver_id].small += 1;
      }
    }
  });

  const sortedWorkloads = Object.entries(workloads).sort((a, b) => b[1].total - a[1].total);

  if (drivers.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-3xl border p-4 shadow-sm backdrop-blur-md transition-all duration-200
      ${prefs.theme === "dark"
        ? "border-neutral-800/60 bg-neutral-900/40 text-white"
        : "border-blue-100 bg-blue-50/40 text-blue-950"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className={`text-xs uppercase tracking-wider font-extrabold
          ${prefs.theme === "dark" ? "text-neutral-400" : "text-blue-900"}`}
        >
          Active Driver Workloads
        </h4>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border
          ${prefs.theme === "dark" 
            ? "border-neutral-800 bg-neutral-950/60 text-neutral-400" 
            : "border-blue-200 bg-white text-blue-800"}`}
        >
          {weekBookings.length} Active Runs
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x scroll-smooth select-none">
        {sortedWorkloads.map(([driverId, counts]) => {
          const isSelected = selectedDriverFilterId === driverId;
          return (
            <motion.div
              key={driverId}
              whileHover={{ y: -2 }}
              onClick={() => {
                if (isSelected) {
                  setSelectedDriverFilterId(null);
                } else {
                  setSelectedDriverFilterId(driverId);
                }
              }}
              className={`flex-none w-36 snap-start rounded-2xl p-3 border flex flex-col items-center justify-between transition-all duration-200 cursor-pointer
                ${isSelected 
                  ? "ring-2 ring-violet-500/50" 
                  : ""
                }
                ${prefs.theme === "dark"
                  ? isSelected
                    ? "border-violet-500 bg-neutral-850"
                    : "border-neutral-850 bg-neutral-950/20 hover:border-neutral-700"
                  : isSelected
                    ? "border-blue-500 bg-blue-50/80 shadow-md shadow-blue-500/5"
                    : "border-slate-200 bg-white hover:border-blue-300 shadow-sm"
                }`}
            >
              <div className="text-center w-full">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span 
                    className="h-2 w-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: counts.color }} 
                  />
                  <span className={`text-xs font-bold tracking-tight truncate max-w-[100px]
                    ${prefs.theme === "dark" ? "text-white" : "text-slate-800"}`}
                    title={counts.name}
                  >
                    {counts.name.split(" ")[0]}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2 mt-1">
                  <div className={`flex items-center text-[10px] ${prefs.theme === "dark" ? "text-neutral-450" : "text-slate-500"}`}>
                    <Bus size={10} className="mr-0.5" />
                    <span>{counts.big}</span>
                  </div>
                  <div className={`flex items-center text-[10px] ${prefs.theme === "dark" ? "text-neutral-450" : "text-slate-500"}`}>
                    <Car size={10} className="mr-0.5" />
                    <span>{counts.small}</span>
                  </div>
                </div>
              </div>

              {/* Weekly Drive Tally */}
              <div className="my-2.5 flex flex-col items-center">
                <span className={`text-2xl font-black font-mono leading-none
                  ${prefs.theme === "dark" ? "text-white" : "text-blue-950"}`}
                >
                  {counts.total}
                </span>
                <span className={`text-[9px] uppercase tracking-widest font-bold opacity-75
                  ${prefs.theme === "dark" ? "text-neutral-500" : "text-slate-400"}`}
                >
                  Runs
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
