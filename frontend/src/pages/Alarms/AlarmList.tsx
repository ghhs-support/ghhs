import { useEffect, useState } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAlarms = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await api.get<PaginatedResponse>('/api/alarms/', {
        params: {
          page,
          pageSize
        }
      });
      console.log('API Response:', response.data);
      setAlarms(response.data.results);
      setTotalCount(response.data.count);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching alarms:', err);
      setError('Failed to fetch alarms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlarms(currentPage);
  }, []);

  const handleAddClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleAlarmCreated = () => {
    fetchAlarms(currentPage);
  };

  const handlePageChange = (page: number, pageSize: number) => {
    fetchAlarms(page, pageSize);
  };

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
          {loading && alarms.length === 0 ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center min-h-[400px] text-red-500">{error}</div>
          ) : (
            <AlarmBasicTable 
              alarms={alarms} 
              loading={loading}
              totalCount={totalCount}
              onPageChange={handlePageChange}
              currentPage={currentPage}
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
