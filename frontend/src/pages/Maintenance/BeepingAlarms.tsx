import { useState, useCallback } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import BeepingAlarmsTable from "../../components/maintenance/BeepingAlarmsTable";
import BeepingAlarmsFiltersCard from "../../components/maintenance/BeepingAlarmsFiltersCard";

export default function BeepingAlarms() {
  const [allocationFilter, setAllocationFilter] = useState<string | null>(null);

  // Add console.log to debug
  console.log('Allocation Filter in Parent:', allocationFilter);

  const handleAllocationChange = useCallback((allocationId: string | null) => {
    console.log('Setting allocation to:', allocationId); // Debug log
    setAllocationFilter(allocationId);
  }, []);

  return (
    <div>
      <PageMeta
        title="Beeping Alarms Dashboard"
        description="View and manage beeping alarms"
      />
      <PageBreadcrumb pageTitle="Beeping Alarms" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <h3 className="mb-6 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
          Beeping Alarms List
        </h3>
        
        {/* Filters Card */}
        <div className="mb-6">
          <BeepingAlarmsFiltersCard 
            onAllocationChange={handleAllocationChange}
            currentAllocation={allocationFilter}
          />
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto custom-scrollbar">
          <BeepingAlarmsTable allocationFilter={allocationFilter} />
        </div>
      </div>
    </div>
  );
}
