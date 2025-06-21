import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import api from "../../services/api";
import { format } from "date-fns";
import { Modal } from "../../components/ui/modal";
import AlarmForm from "../../components/alarms/AlarmForm";

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

export default function AlarmDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchAlarmDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/alarms/${id}/`);
      setAlarm(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch alarm details');
      console.error('Error fetching alarm details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAlarmDetails();
    }
  }, [id]);

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleEditClose = () => {
    setIsEditModalOpen(false);
  };

  const handleEditSuccess = () => {
    fetchAlarmDetails();
  };

  const getStatusColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'quote_sent':
        return 'warning';
      case 'to_be_called':
        return 'info';
      case 'to_be_booked':
        return 'primary';
      default:
        return 'primary';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy');
  };

  const formatAddress = (alarm: Alarm) => {
    const parts = [
      alarm.street_number && alarm.street_name ? `${alarm.street_number} ${alarm.street_name}` : null,
      alarm.suburb,
      alarm.state,
      alarm.postal_code,
      alarm.country === 'Australia' ? null : alarm.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (error || !alarm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Alarm not found'}</p>
        <Button variant="outline" onClick={() => navigate('/alarms')}>
          Back to Alarms
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`Alarm Details - ${formatAddress(alarm)} | GHHS - Alarm Management System`}
        description="View detailed alarm information"
      />
      <PageBreadcrumb pageTitle="Alarm Details" />

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold mb-2">Alarm Details</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {formatAddress(alarm)}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/alarms')}
            >
              Back to List
            </Button>
            <Button
              variant="primary"
              onClick={handleEditClick}
            >
              Edit Alarm
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Card */}
          <ComponentCard title="Status Information">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Current Stage</span>
                <Badge
                  variant="light"
                  color={getStatusColor(alarm.stage)}
                >
                  {alarm.stage.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Completed</span>
                <Badge
                  variant="light"
                  color={alarm.completed ? 'success' : 'warning'}
                >
                  {alarm.completed ? 'YES' : 'NO'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Sound Type</span>
                <span className="text-gray-900 dark:text-white capitalize">
                  {alarm.sound_type.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Brand</span>
                <span className="text-gray-900 dark:text-white capitalize">
                  {alarm.brand}
                </span>
              </div>
            </div>
          </ComponentCard>

          {/* Property Information */}
          <ComponentCard title="Property Information">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Property Type</span>
                <span className="text-gray-900 dark:text-white">
                  {alarm.is_rental ? 'Rental Property' : 'Private Property'}
                </span>
              </div>
              {alarm.is_rental && alarm.realestate_name && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Real Estate Agency</span>
                  <span className="text-gray-900 dark:text-white">{alarm.realestate_name}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Privacy Setting</span>
                <Badge
                  variant="light"
                  color={alarm.is_private ? 'warning' : 'success'}
                >
                  {alarm.is_private ? 'PRIVATE' : 'PUBLIC'}
                </Badge>
              </div>
            </div>
          </ComponentCard>

          {/* Contact Information */}
          <ComponentCard title="Contact Information">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Contact Person</span>
                <span className="text-gray-900 dark:text-white">{alarm.who_contacted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Contact Method</span>
                <span className="text-gray-900 dark:text-white capitalize">{alarm.contact_method}</span>
              </div>
              {alarm.work_order_number && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Work Order Number</span>
                  <span className="text-gray-900 dark:text-white">{alarm.work_order_number}</span>
                </div>
              )}
            </div>
          </ComponentCard>

          {/* Dates Information */}
          <ComponentCard title="Important Dates">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Report Date</span>
                <span className="text-gray-900 dark:text-white">{formatDate(alarm.date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Installation Date</span>
                <span className="text-gray-900 dark:text-white">{formatDate(alarm.install_date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Created At</span>
                <span className="text-gray-900 dark:text-white">{format(new Date(alarm.created_at), 'dd/MM/yyyy HH:mm')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                <span className="text-gray-900 dark:text-white">{format(new Date(alarm.updated_at), 'dd/MM/yyyy HH:mm')}</span>
              </div>
            </div>
          </ComponentCard>

          {/* Alarm Details */}
          <ComponentCard title="Alarm System Details">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Hardwire Alarms</span>
                <span className="text-gray-900 dark:text-white">{alarm.hardwire_alarm || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Wireless Alarms</span>
                <span className="text-gray-900 dark:text-white">{alarm.wireless_alarm || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Wall Control</span>
                <Badge
                  variant="light"
                  color={alarm.is_wall_control ? 'success' : 'warning'}
                >
                  {alarm.is_wall_control ? 'YES' : 'NO'}
                </Badge>
              </div>
            </div>
          </ComponentCard>

          {/* Tenant Information */}
          <ComponentCard title="Tenant Information">
            {alarm.tenants.length > 0 ? (
              <div className="space-y-4">
                {alarm.tenants.map((tenant) => (
                  <div key={tenant.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-900 dark:text-white font-medium">{tenant.name}</span>
                      <span className="text-gray-600 dark:text-gray-400">{tenant.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No tenant information available
              </p>
            )}
          </ComponentCard>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleEditClose}
        className="w-full mx-4"
      >
        <AlarmForm
          onClose={handleEditClose}
          onSuccess={handleEditSuccess}
          initialData={alarm || undefined}
        />
      </Modal>
    </>
  );
} 