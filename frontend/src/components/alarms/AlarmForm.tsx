import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import Button from '../ui/button/Button';
import InputField from '../form/input/InputField';
import Select from '../form/Select';
import TenantModal from './TenantModal';
import api from '../../services/api';
import DatePicker from './date-picker/DatePicker';

interface Tenant {
  name: string;
  phone: string;
}

interface AlarmFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
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
  };
}

export default function AlarmForm({ onClose, onSuccess, initialData }: AlarmFormProps) {
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    is_rental: initialData?.is_rental ?? true,
    is_private: initialData?.is_private ?? false,
    realestate_name: initialData?.realestate_name || '',
    street_number: initialData?.street_number || '',
    street_name: initialData?.street_name || '',
    suburb: initialData?.suburb || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    postal_code: initialData?.postal_code || '',
    country: initialData?.country || '',
    latitude: initialData?.latitude || '',
    longitude: initialData?.longitude || '',
    who_contacted: initialData?.who_contacted || '',
    contact_method: initialData?.contact_method || 'phone',
    work_order_number: initialData?.work_order_number || '',
    sound_type: initialData?.sound_type || 'full_alarm',
    install_date: initialData?.install_date || '',
    brand: initialData?.brand || 'red',
    hardwire_alarm: initialData?.hardwire_alarm || '',
    wireless_alarm: initialData?.wireless_alarm || '',
    is_wall_control: initialData?.is_wall_control ?? false,
    completed: initialData?.completed ?? false,
    stage: initialData?.stage || 'to_be_booked',
  });

  const [tenants, setTenants] = useState<Tenant[]>([{ name: '', phone: '' }]);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialNotes, setInitialNotes] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date,
        is_rental: initialData.is_rental,
        is_private: initialData.is_private,
        realestate_name: initialData.realestate_name || '',
        street_number: initialData.street_number || '',
        street_name: initialData.street_name || '',
        suburb: initialData.suburb || '',
        city: initialData.city || '',
        state: initialData.state || '',
        postal_code: initialData.postal_code || '',
        country: initialData.country || '',
        latitude: initialData.latitude?.toString() || '',
        longitude: initialData.longitude?.toString() || '',
        who_contacted: initialData.who_contacted,
        contact_method: initialData.contact_method,
        work_order_number: initialData.work_order_number,
        sound_type: initialData.sound_type,
        install_date: initialData.install_date || '',
        brand: initialData.brand,
        hardwire_alarm: initialData.hardwire_alarm?.toString() || '',
        wireless_alarm: initialData.wireless_alarm?.toString() || '',
        is_wall_control: initialData.is_wall_control,
        completed: initialData.completed,
        stage: initialData.stage
      });
      setTenants(initialData.tenants);
    }
  }, [initialData]);

  const inputClasses = "dark:bg-gray-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 transition-colors duration-200";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'radio' && name === 'property_type') {
      setFormData(prev => ({
        ...prev,
        is_rental: value === 'rental',
        is_private: value === 'private',
        realestate_name: value === 'private' ? '' : prev.realestate_name
      }));
    } else {
      setFormData(prev => {
        const updates = { [name]: value };
        
        // Clear work order number if contact method changes from work_order
        if (name === 'contact_method' && value !== 'work_order') {
          updates.work_order_number = '';
        }
        
        return { ...prev, ...updates };
      });
    }
  };

  const handleTenantsSave = (newTenants: Tenant[]) => {
    setTenants(newTenants);
    // Update the form data with concatenated tenant information
    setFormData(prev => ({
      ...prev,
      tenant_names: newTenants.map(t => t.name).join(', '),
      phone: newTenants.map(t => t.phone).join(', ')
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedImages(prev => [...prev, ...filesArray]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDateChange = (selectedDates: Date[], dateStr: string, instance: any) => {
    // Only handle install_date changes now
    if (instance.element.id === 'install-date' && dateStr !== formData.install_date) {
      setFormData(prev => ({
        ...prev,
        install_date: dateStr
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        tenants: tenants.map(tenant => ({
          name: tenant.name,
          phone: tenant.phone
        }))
      };

      let response;
      if (initialData) {
        // Update existing alarm
        response = await api.put(`/api/alarms/${initialData.id}/`, submitData);
      } else {
        // Create new alarm
        response = await api.post('/api/alarms/', submitData);
        
        // If there are notes or images, create an initial update
        if (initialNotes || selectedImages.length > 0) {
          // First create the update
          const updateResponse = await api.post('/api/alarm-updates/', {
            alarm: response.data.id,
            update_type: 'general_note',
            note: initialNotes || 'Initial alarm creation'
          });

          // If there are images, upload them
          if (selectedImages.length > 0) {
            const formData = new FormData();
            formData.append('alarm', response.data.id.toString());
            formData.append('update_time', updateResponse.data.created_at);
            selectedImages.forEach(image => {
              formData.append('images', image);
            });

            await api.post('/api/alarm-images/', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
          }
        }
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(`Failed to ${initialData ? 'update' : 'create'} alarm. Please try again.`);
      console.error(`Error ${initialData ? 'updating' : 'creating'} alarm:`, err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h4 className="mb-2 text-lg font-medium text-gray-800 dark:text-white/90">
            {initialData ? 'Edit Alarm' : 'Create New Alarm'}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {initialData ? 'Update the alarm details below' : 'Fill in the alarm details below'}
          </p>
        </div>

        <div className="space-y-4">
          {/* Date and Property Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Date
              </label>
              <div className="h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs bg-gray-50 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-white/90 dark:border-gray-700">
                {format(new Date(formData.date), 'dd-MM-yyyy')}
              </div>
            </div>
            <div className="space-y-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Property Type
              </label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="rental"
                    name="property_type"
                    value="rental"
                    checked={formData.is_rental}
                    onChange={handleChange}
                    className="h-4 w-4 border-gray-300 text-brand-500 focus:ring-brand-500/10"
                  />
                  <label htmlFor="rental" className="text-sm text-gray-600 dark:text-gray-400">
                    Rental Property
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="private"
                    name="property_type"
                    value="private"
                    checked={formData.is_private}
                    onChange={handleChange}
                    className="h-4 w-4 border-gray-300 text-brand-500 focus:ring-brand-500/10"
                  />
                  <label htmlFor="private" className="text-sm text-gray-600 dark:text-gray-400">
                    Private Property
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Real Estate Agency and Who Contacted */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Real Estate Agency
              </label>
              <input
                type="text"
                name="realestate_name"
                value={formData.realestate_name}
                onChange={handleChange}
                disabled={!formData.is_rental || formData.is_private}
                placeholder="Enter agency name"
                className={inputClasses}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Required for rental properties managed by an agency</p>
            </div>
            <div className="space-y-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Who Contacted
              </label>
              <input
                type="text"
                name="who_contacted"
                value={formData.who_contacted}
                onChange={handleChange}
                required
                placeholder="Enter contact name"
                className={inputClasses}
              />
            </div>
          </div>

          {/* Address Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Street Number
              </label>
              <input
                type="text"
                name="street_number"
                value={formData.street_number}
                onChange={handleChange}
                placeholder="Enter street number"
                className={inputClasses}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Street Name
              </label>
              <input
                type="text"
                name="street_name"
                value={formData.street_name}
                onChange={handleChange}
                placeholder="Enter street name"
                className={inputClasses}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Suburb
              </label>
              <input
                type="text"
                name="suburb"
                value={formData.suburb}
                onChange={handleChange}
                placeholder="Enter suburb"
                className={inputClasses}
              />
            </div>
            <div className="space-y-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Enter city"
                className={inputClasses}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Enter state"
                className={inputClasses}
              />
            </div>
            <div className="space-y-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Postal Code
              </label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                placeholder="Enter postal code"
                className={inputClasses}
              />
            </div>

            {/* Country Field */}
            <div className="space-y-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Enter country"
                className={inputClasses}
              />
            </div>
          </div>

          {/* Contact Method and Work Order */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Contact Method
              </label>
              <select
                name="contact_method"
                value={formData.contact_method}
                onChange={handleChange}
                required
                className={inputClasses}
              >
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="work_order">Work Order</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Work Order Number
              </label>
              <input
                type="text"
                name="work_order_number"
                value={formData.work_order_number}
                onChange={handleChange}
                disabled={formData.contact_method !== 'work_order'}
                required={formData.contact_method === 'work_order'}
                placeholder="Enter work order number"
                className={inputClasses}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.contact_method === 'work_order' ? 'Required for work order contact method' : 'Only available with work order contact method'}
              </p>
            </div>
          </div>

          {/* Alarm Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Sound Type
              </label>
              <select
                name="sound_type"
                value={formData.sound_type}
                onChange={handleChange}
                required
                className={inputClasses}
              >
                <option value="full_alarm">Full Alarm</option>
                <option value="chirping_alarm">Chirping Alarm</option>
              </select>
            </div>
            <div className="space-y-2">
              <DatePicker
                id="install-date"
                label="Install Date"
                value={formData.install_date}
                defaultDate={formData.install_date || undefined}
                onChange={handleDateChange}
                placeholder="Select install date"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Brand
              </label>
              <select
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                className={inputClasses}
              >
                <option value="red">Red</option>
                <option value="firepro">FirePro</option>
                <option value="emerald">Emerald</option>
                <option value="cavius">Cavius</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Hardwire Alarm
              </label>
              <input
                type="number"
                name="hardwire_alarm"
                value={formData.hardwire_alarm}
                onChange={handleChange}
                placeholder="Enter number"
                className={inputClasses}
              />
            </div>
            <div className="space-y-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Wireless Alarm
              </label>
              <input
                type="number"
                name="wireless_alarm"
                value={formData.wireless_alarm}
                onChange={handleChange}
                placeholder="Enter number"
                className={inputClasses}
              />
            </div>
          </div>

          {/* Wall Control Checkbox */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_wall_control"
                name="is_wall_control"
                checked={formData.is_wall_control}
                onChange={(e) => setFormData(prev => ({ ...prev, is_wall_control: e.target.checked }))}
                className="h-4 w-4 border-gray-300 text-brand-500 focus:ring-brand-500/10"
              />
              <label htmlFor="is_wall_control" className="text-sm text-gray-600 dark:text-gray-400">
                Has Wall Control
              </label>
            </div>
          </div>

          {/* Tenants Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Tenants
              </label>
              <button
                type="button"
                onClick={() => setIsTenantModalOpen(true)}
                className="flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                Manage Tenants
              </button>
            </div>
            {tenants.length > 0 ? (
              <div className="space-y-2 mt-2">
                {tenants.map((tenant, index) => (
                  <div key={index} className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <span>{tenant.name}</span>
                    <span>({tenant.phone})</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No tenants added yet</p>
            )}
          </div>

          {/* Stage Selection */}
          <div className="space-y-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Stage
            </label>
            <select
              name="stage"
              value={formData.stage}
              onChange={handleChange}
              required
              className={inputClasses}
            >
              <option value="to_be_booked">To Be Booked</option>
              <option value="quote_sent">Quote Sent</option>
              <option value="completed">Completed</option>
              <option value="to_be_called">To Be Called</option>
            </select>
          </div>

          {/* Initial Notes and Images Section (only show for new alarms) */}
          {!initialData && (
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Initial Notes
                </label>
                <textarea
                  value={initialNotes}
                  onChange={(e) => setInitialNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter initial notes..."
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Images
                </label>
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG or JPEG</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        multiple 
                        accept="image/*"
                        onChange={handleImageSelect}
                        disabled={loading}
                      />
                    </label>
                  </div>
                  {selectedImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {selectedImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Selected ${index + 1}`}
                            className="h-24 w-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            disabled={loading}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            startIcon={loading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            ) : undefined}
          >
            {loading ? (initialData ? 'Updating...' : 'Creating...') : (initialData ? 'Update Alarm' : 'Create Alarm')}
          </Button>
        </div>
      </form>

      <TenantModal
        isOpen={isTenantModalOpen}
        onClose={() => setIsTenantModalOpen(false)}
        onSave={handleTenantsSave}
        initialTenants={tenants}
      />
    </>
  );
} 