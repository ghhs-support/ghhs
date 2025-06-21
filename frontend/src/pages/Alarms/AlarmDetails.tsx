import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import Avatar from "../../components/ui/avatar/Avatar";
import api from "../../services/api";
import { format } from "date-fns";
import { Modal } from "../../components/ui/modal";
import AlarmForm from "../../components/alarms/AlarmForm";
import SmallMap from "../../components/alarms/maps/SmallMap";
import MapViewerModal from "../../components/alarms/maps/MapViewerModal";

interface Tenant {
  id: number;
  name: string;
  phone: string;
}

interface AlarmUpdate {
  id: number;
  update_type: 'call_attempt' | 'customer_contact' | 'status_change' | 'general_note';
  note: string;
  created_by: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  created_at: string;
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
  const [isMapViewerOpen, setIsMapViewerOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updates, setUpdates] = useState<AlarmUpdate[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState(true);
  const [updateType, setUpdateType] = useState<AlarmUpdate['update_type']>('general_note');
  const [updateNote, setUpdateNote] = useState('');
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

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

  const fetchUpdates = async () => {
    try {
      setUpdatesLoading(true);
      const response = await api.get(`/api/alarm-updates/?alarm=${id}`);
      setUpdates(response.data.results);
    } catch (err) {
      console.error('Error fetching updates:', err);
    } finally {
      setUpdatesLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAlarmDetails();
      fetchUpdates();
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

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case 'call_attempt':
        return 'warning';
      case 'customer_contact':
        return 'success';
      case 'status_change':
        return 'info';
      default:
        return 'primary';
    }
  };

  const formatUpdateType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getDisplayName = (user: AlarmUpdate['created_by']) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user.first_name) {
      return user.first_name;
    } else if (user.last_name) {
      return user.last_name;
    }
    return 'User';
  };

  const handleUpdateSubmit = async () => {
    if (!updateNote.trim()) {
      return; // Don't submit empty notes
    }

    try {
      setIsSubmittingUpdate(true);
      await api.post('/api/alarm-updates/', {
        alarm: id,
        update_type: updateType,
        note: updateNote.trim()
      });

      // Refresh updates list
      await fetchUpdates();

      // Reset form and close modal
      setUpdateType('general_note');
      setUpdateNote('');
      setIsUpdateModalOpen(false);
    } catch (err) {
      console.error('Error submitting update:', err);
      // You might want to show an error message to the user here
    } finally {
      setIsSubmittingUpdate(false);
    }
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

        {/* Updates Section */}
        <ComponentCard title="Updates & Communication History">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Updates</h3>
            <Button
              variant="primary"
              onClick={() => setIsUpdateModalOpen(true)}
            >
              Add Update
            </Button>
          </div>

          {updatesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : updates.length > 0 ? (
            <div className="space-y-4">
              {updates.map((update) => (
                <div 
                  key={update.id} 
                  className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        src={`/images/user/user-0${Math.floor(Math.random() * 9) + 1}.jpg`}
                        alt={getDisplayName(update.created_by)}
                        size="small"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {getDisplayName(update.created_by)}
                          </span>
                          <Badge
                            variant="light"
                            color={getUpdateTypeColor(update.update_type)}
                          >
                            {formatUpdateType(update.update_type)}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(update.created_at), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pl-11">
                    <p className="text-gray-800 dark:text-white/90 whitespace-pre-wrap">
                      {update.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500 dark:text-gray-400">
              No updates yet. Click "Add Update" to create the first update.
            </p>
          )}
        </ComponentCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Address Information */}
          <ComponentCard title="Address Information">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Street Address</span>
                <span className="text-gray-900 dark:text-white">
                  {alarm.street_number} {alarm.street_name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Suburb</span>
                <span className="text-gray-900 dark:text-white">{alarm.suburb || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">State</span>
                <span className="text-gray-900 dark:text-white">{alarm.state || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Postal Code</span>
                <span className="text-gray-900 dark:text-white">{alarm.postal_code || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Country</span>
                <span className="text-gray-900 dark:text-white">{alarm.country || 'Australia'}</span>
              </div>
              
              {/* Map Section */}
              {alarm.latitude && alarm.longitude ? (
                <div className="mt-6 flex flex-col items-center">
                  <div 
                    onClick={() => setIsMapViewerOpen(true)}
                    className="cursor-pointer"
                  >
                    <SmallMap 
                      latitude={alarm.latitude} 
                      longitude={alarm.longitude} 
                      className="w-32 h-32"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Click map to view larger
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
                  No map available (missing coordinates)
                </p>
              )}
            </div>
          </ComponentCard>

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

      {/* Map Viewer Modal */}
      {alarm && alarm.latitude && alarm.longitude && (
        <MapViewerModal
          isOpen={isMapViewerOpen}
          onClose={() => setIsMapViewerOpen(false)}
          latitude={alarm.latitude}
          longitude={alarm.longitude}
          title={`Map View - ${formatAddress(alarm)}`}
        />
      )}

      {/* Update Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        className="max-w-2xl"
      >
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Add Update
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Update Type
              </label>
              <select
                value={updateType}
                onChange={(e) => setUpdateType(e.target.value as AlarmUpdate['update_type'])}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="call_attempt">Call Attempt</option>
                <option value="customer_contact">Customer Contact</option>
                <option value="status_change">Status Change</option>
                <option value="general_note">General Note</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Note
              </label>
              <textarea
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="Enter update details..."
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsUpdateModalOpen(false)}
                disabled={isSubmittingUpdate}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateSubmit}
              >
                Save Update
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
} 