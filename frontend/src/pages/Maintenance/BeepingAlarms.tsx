import { useState, useCallback } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import BeepingAlarmsTable from "../../components/maintenance/BeepingAlarmsTable";
import BeepingAlarmsFiltersCard from "../../components/maintenance/BeepingAlarmsFiltersCard";

export default function BeepingAlarms() {
  const [allocationFilter, setAllocationFilter] = useState<string | null>(null);
  const [tenantFilter, setTenantFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [customerContactedFilter, setCustomerContactedFilter] = useState<string | null>(null);
  const [propertyFilter, setPropertyFilter] = useState<string | null>(null);
  const [agencyPrivateFilter, setAgencyPrivateFilter] = useState<string | null>(null);
  
  // Created At filter state
  const [createdAtSingleFilter, setCreatedAtSingleFilter] = useState<string | null>(null);
  const [createdAtFromFilter, setCreatedAtFromFilter] = useState<string | null>(null);
  const [createdAtToFilter, setCreatedAtToFilter] = useState<string | null>(null);
  const [createdAtMode, setCreatedAtMode] = useState<'single' | 'range'>('single');

  const handleAllocationChange = useCallback((allocationId: string | null) => {
    setAllocationFilter(allocationId);
  }, []);

  const handleTenantChange = useCallback((tenantId: string | null) => {
    setTenantFilter(tenantId);
  }, []);

  const handleStatusChange = useCallback((status: string | null) => {
    setStatusFilter(status);
  }, []);

  const handleCustomerContactedChange = useCallback((customerContacted: string | null) => {
    setCustomerContactedFilter(customerContacted);
  }, []);

  const handlePropertyChange = useCallback((propertyId: string | null) => {
    setPropertyFilter(propertyId);
  }, []);

  const handleAgencyPrivateChange = useCallback((agencyPrivate: string | null) => {
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
      </div>
    </div>
  );
}
