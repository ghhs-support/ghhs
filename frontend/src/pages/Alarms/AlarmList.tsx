import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import AlarmBasicTable from "../../components/alarms/AlarmBasictable";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import AlarmForm from "../../components/alarms/AlarmForm";
import api from "../../services/api";

interface Alarm {
  id: number;
  date: string;
  street_number: string;
  street_name: string;
  suburb: string;
  city: string;
  state: string;
  postal_code: string;
  who_contacted: string;
  contact_method: string;
  work_order_number: string;
  sound_type: string;
  install_date: string;
  brand: string;
  hardware: number;
  wireless: number;
  tenant_names: string;
  phone: string;
  completed: boolean;
  stage: string;
}

export default function AlarmListPage() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAlarms = async () => {
    try {
      const response = await api.get('/api/alarms/');
      console.log('API Response:', response.data);
      setAlarms(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching alarms:', err);
      setError('Failed to fetch alarms');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlarms();
  }, []);

  const handleAddClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleAlarmCreated = () => {
    fetchAlarms();
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
          {loading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center min-h-[400px] text-red-500">{error}</div>
          ) : (
            <AlarmBasicTable alarms={alarms} />
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
