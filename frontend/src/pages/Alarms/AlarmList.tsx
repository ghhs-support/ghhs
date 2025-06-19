import { useEffect, useState, useCallback } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import AlarmBasicTable from "../../components/alarms/AlarmBasictable";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import AlarmForm from "../../components/alarms/AlarmForm";

import api from "../../services/api";

interface Tenant {
  id: number;
  name: string;
  phone: string;
}

interface Alarm {
  id: number;
  date: string;
  is_rental: boolean;
  is_private: boolean;
  realestate_name: string | null;
  street_number: string | null;
  street_name: string | null;
  suburb: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  who_contacted: string;
  contact_method: 'email' | 'phone' | 'work_order';
  work_order_number: string;
  sound_type: 'full_alarm' | 'chirping_alarm';
  install_date: string | null;
  brand: 'red' | 'firepro' | 'emerald' | 'cavius' | 'other';
  hardwire_alarm: number | null;
  wireless_alarm: number | null;
  is_wall_control: boolean;
  completed: boolean;
  stage: 'to_be_booked' | 'quote_sent' | 'completed' | 'to_be_called';
  tenants: Tenant[];
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Alarm[];
}

export default function AlarmListPage() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(10);
  const [currentSearch, setCurrentSearch] = useState("");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAlarms = useCallback(async (page: number, pageSize: number, search?: string) => {
    try {
      setLoading(true);
      setError("");
      
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      
      if (search?.trim()) {
        params.append('search', search.trim());
      }

      const response = await api.get(`/api/alarms/?${params.toString()}`);
      setAlarms(response.data.results);
      setTotalCount(response.data.count);
      setCurrentPage(page);
      setCurrentPageSize(pageSize);
      setCurrentSearch(search || "");
    } catch (error) {
      console.error('Error fetching alarms:', error);
      setError('Failed to fetch alarms. Please try again.');
      // Keep the previous data on error
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleAlarmCreated = () => {
    fetchAlarms(currentPage, currentPageSize, currentSearch);
  };

  const handlePageChange = useCallback((page: number, pageSize: number) => {
    fetchAlarms(page, pageSize, currentSearch);
  }, [fetchAlarms, currentSearch]);

  const handleSearchChange = useCallback((search: string) => {
    fetchAlarms(1, currentPageSize, search);
  }, [fetchAlarms, currentPageSize]);

  // Initial load
  useEffect(() => {
    fetchAlarms(1, 10, "");
  }, [fetchAlarms]);

  // Reset when component unmounts
  useEffect(() => {
    return () => {
      setAlarms([]);
      setLoading(true);
      setTotalCount(0);
      setCurrentPage(1);
      setCurrentPageSize(10);
      setCurrentSearch("");
      setError("");
    };
  }, []);

  return (
    <>
      <PageMeta
        title="Alarm Management Dashboard | GHHS - Alarm Management System"
        description="Manage and track alarm installations and service requests"
      />
      <PageBreadcrumb pageTitle="Alarm Management" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Alarm List</h2>
          <Button
            variant="primary"
            onClick={handleAddClick}
          >
            Add New Alarm
          </Button>
        </div>
        <ComponentCard title="Alarm List">
          {error ? (
            <div className="flex justify-center items-center min-h-[400px] text-red-500">{error}</div>
          ) : (
            <AlarmBasicTable 
              alarms={alarms} 
              loading={loading}
              totalCount={totalCount}
              onPageChange={handlePageChange}
              currentPage={currentPage}
              onSearchChange={handleSearchChange}
            />
          )}
        </ComponentCard>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        className="w-full mx-4"
      >
        <div className="flex flex-col">
          <div className="mb-6">
            <h5 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
              Add New Alarm
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Fill in the details to create a new alarm entry
            </p>
          </div>
          <AlarmForm
            onClose={handleModalClose}
            onSuccess={handleAlarmCreated}
          />
        </div>
      </Modal>
    </>
  );
}
