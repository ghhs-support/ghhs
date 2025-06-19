import { useState } from 'react';
import { format } from 'date-fns';
import Button from '../ui/button/Button';
import InputField from '../form/input/InputField';
import Select from '../form/Select';
import TenantModal from './TenantModal';
import api from '../../services/api';

interface Tenant {
  name: string;
  phone: string;
}

interface AlarmFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AlarmForm({ onClose, onSuccess }: AlarmFormProps) {
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    is_rental: true,
    is_private: false,
    realestate_name: '',
    street_number: '',
    street_name: '',
    suburb: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    latitude: '',
    longitude: '',
    who_contacted: '',
    contact_method: 'phone',
    work_order_number: '',
    sound_type: 'full_alarm',
    install_date: '',
    brand: 'red',
    hardwire_alarm: '',
    wireless_alarm: '',
    is_wall_control: false,
    completed: false,
    stage: 'to_be_booked'
  });

  const [tenants, setTenants] = useState<Tenant[]>([{ name: '', phone: '' }]);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClasses = "dark:bg-gray-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 transition-colors duration-200";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Include tenants data in the submission
      const submitData = {
        ...formData,
        tenants: tenants.map(tenant => ({
          name: tenant.name,
          phone: tenant.phone
        }))
      };
      await api.post('/api/alarms/', submitData);
      onSuccess();
      onClose();
    } catch (err) {
      setError('Failed to create alarm. Please try again.');
      console.error('Error creating alarm:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h4 className="mb-2 text-lg font-medium text-gray-800 dark:text-white/90">
            Create New Alarm
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Fill in the alarm details below
          </p>
        </div>

        <div className="space-y-4">
          {/* Date and Property Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className={inputClasses}
              />
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
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Install Date
              </label>
              <input
                type="date"
                name="install_date"
                value={formData.install_date}
                onChange={handleChange}
                className={inputClasses}
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
                    <span>{tenant.phone}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                No tenants added yet. Click 'Manage Tenants' to add tenants.
              </p>
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
          <button
            type="submit"
            disabled={loading}
            className="flex justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></span>
                Creating...
              </>
            ) : (
              'Create Alarm'
            )}
          </button>
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