import { useState, useCallback } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import BeepingAlarmsTable from "../../components/maintenance/BeepingAlarmsTable";
import BeepingAlarmsFiltersCard from "../../components/maintenance/BeepingAlarmsFiltersCard";
import CreateBeepingAlarmForm from "../../components/maintenance/CreateBeepingAlarmForm";
import { BeepingAlarmStatus, BeepingAlarmFilterMode } from "../../types/maintenance";

export default function BeepingAlarms() {
  const [allocationFilter, setAllocationFilter] = useState<string | null>(null);
  const [tenantFilter, setTenantFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BeepingAlarmStatus | null>(null);
  const [customerContactedFilter, setCustomerContactedFilter] = useState<string | null>(null);
  const [propertyFilter, setPropertyFilter] = useState<string | null>(null);
  const [agencyPrivateFilter, setAgencyPrivateFilter] = useState<'agency' | 'private' | null>(null);
  
  // Created At filter state
  const [createdAtSingleFilter, setCreatedAtSingleFilter] = useState<string | null>(null);
  const [createdAtFromFilter, setCreatedAtFromFilter] = useState<string | null>(null);
  const [createdAtToFilter, setCreatedAtToFilter] = useState<string | null>(null);
  const [createdAtMode, setCreatedAtMode] = useState<BeepingAlarmFilterMode>('single');

  // Form modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleAllocationChange = useCallback((allocationId: string | null) => {
    setAllocationFilter(allocationId);
  }, []);

  const handleTenantChange = useCallback((tenantId: string | null) => {
    setTenantFilter(tenantId);
  }, []);

  const handleStatusChange = useCallback((status: BeepingAlarmStatus | null) => {
    setStatusFilter(status);
  }, []);

  const handleCustomerContactedChange = useCallback((customerContacted: string | null) => {
    setCustomerContactedFilter(customerContacted);
  }, []);

  const handlePropertyChange = useCallback((propertyId: string | null) => {
    setPropertyFilter(propertyId);
  }, []);

  const handleAgencyPrivateChange = useCallback((agencyPrivate: 'agency' | 'private' | null) => {
    setAgencyPrivateFilter(agencyPrivate);
  }, []);

  const handleCreatedAtChange = useCallback((
    createdAtSingle: string | null, 
    createdAtFrom: string | null, 
    createdAtTo: string | null, 
    mode: 'single' | 'range'
  ) => {
    setCreatedAtSingleFilter(createdAtSingle);
    setCreatedAtFromFilter(createdAtFrom);
    setCreatedAtToFilter(createdAtTo);
    setCreatedAtMode(mode);
  }, []);

  const handleCreateSuccess = useCallback(() => {
    // Refresh the table data
    // This could trigger a refetch of the table data
    console.log('Beeping alarm created successfully');
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
        <div className="mb-6 flex justify-between items-center">
          <div></div>
          <button
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:pointer-events-none transition-colors duration-200"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Create Beeping Alarm
          </button>
        </div>
        
        {/* Filters Card */}
        <div className="mb-6">
          <BeepingAlarmsFiltersCard 
            onAllocationChange={handleAllocationChange}
            onTenantChange={handleTenantChange}
            onStatusChange={handleStatusChange}
            onCustomerContactedChange={handleCustomerContactedChange}
            onPropertyChange={handlePropertyChange}
            onAgencyPrivateChange={handleAgencyPrivateChange}
            onCreatedAtChange={handleCreatedAtChange}
            currentAllocation={allocationFilter}
            currentTenant={tenantFilter}
            currentStatus={statusFilter}
            currentCustomerContacted={customerContactedFilter}
            currentProperty={propertyFilter}
            currentAgencyPrivate={agencyPrivateFilter}
            currentCreatedAtSingle={createdAtSingleFilter}
            currentCreatedAtFrom={createdAtFromFilter}
            currentCreatedAtTo={createdAtToFilter}
            currentCreatedAtMode={createdAtMode}
          />
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto custom-scrollbar">
          <BeepingAlarmsTable 
            allocationFilter={allocationFilter}
            tenantFilter={tenantFilter}
            statusFilter={statusFilter}
            customerContactedFilter={customerContactedFilter}
            propertyFilter={propertyFilter}
            agencyPrivateFilter={agencyPrivateFilter}
            createdAtSingleFilter={createdAtSingleFilter}
            createdAtFromFilter={createdAtFromFilter}
            createdAtToFilter={createdAtToFilter}
            createdAtMode={createdAtMode}
          />
        </div>

        {/* Create Beeping Alarm Modal */}
        <CreateBeepingAlarmForm
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      </div>
    </div>
  );
}
