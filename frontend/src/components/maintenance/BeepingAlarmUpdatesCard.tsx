import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ChatBubbleLeftEllipsisIcon, PaperAirplaneIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { BeepingAlarmUpdatesCardProps, BeepingAlarmUpdateFormData, BEEPING_ALARM_STATUS_OPTIONS, BeepingAlarmStatus } from '../../types/maintenance';
import Label from '../form/Label';
import Button from '../ui/button/Button';
import Badge from '../ui/badge/Badge';
import Select from '../form/Select';
import TextArea from '../form/input/TextArea';
import toast from 'react-hot-toast';

export default function BeepingAlarmUpdatesCard({
  alarmId,
  updates,
  onUpdateSubmitted,
  loading = false
}: BeepingAlarmUpdatesCardProps) {
  const { authenticatedPost } = useAuthenticatedApi();
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<BeepingAlarmUpdateFormData>({
    status: 'new',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'PPpp');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status: BeepingAlarmStatus) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return <Badge size="sm" color="info">New</Badge>;
      case 'requires_call_back':
        return <Badge size="sm" color="warning">Requires Call Back</Badge>;
      case 'awaiting_response':
        return <Badge size="sm" color="warning">Awaiting Response</Badge>;
      case 'to_be_scheduled':
        return <Badge size="sm" color="warning">To Be Scheduled</Badge>;
      case 'to_be_quoted':
        return <Badge size="sm" color="warning">To Be Quoted</Badge>;
      case 'completed':
        return <Badge size="sm" color="success">Completed</Badge>;
      case 'cancelled':
        return <Badge size="sm" color="error">Cancelled</Badge>;
      default:
        return <Badge size="sm" color="error">{status || 'Unknown'}</Badge>;
    }
  };

  const getUserInitials = (user: any) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.username?.[0]?.toUpperCase() || '?';
  };

  const getUserDisplayName = (user: any) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || 'Unknown User';
  };

  const handleInputChange = (field: keyof BeepingAlarmUpdateFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.notes?.trim()) {
      newErrors.notes = 'Notes are required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        beeping_alarm: alarmId,
        status: formData.status,
        notes: formData.notes
      };
      
      await authenticatedPost('/beeping_alarm_updates/', { data: payload });
      
      setFormData({ status: 'new', notes: '' });
      setShowAddForm(false);
      onUpdateSubmitted();
      toast.success('Update added successfully!');
    } catch (error: any) {
      console.error('Error creating update:', error);
      if (error.data) {
        setErrors(error.data);
      }
      toast.error('Failed to add update.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ status: 'new', notes: '' });
    setErrors({});
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-gray-600 dark:text-gray-400 text-center py-8">
          Loading updates...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <Label className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Updates ({updates.length})
          </Label>
        </div>
        
        {!showAddForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
            Add Update
          </Button>
        )}
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <Label className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">
            Add New Update
          </Label>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Select
                id="status"
                label="Status"
                value={formData.status}
                options={BEEPING_ALARM_STATUS_OPTIONS}
                onChange={(value) => handleInputChange('status', value as BeepingAlarmStatus)}
                placeholder="Select status..."
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Notes *
              </Label>
              <TextArea
                value={formData.notes}
                onChange={(value) => handleInputChange('notes', value)}
                rows={3}
                placeholder="Enter update notes..."
                className="mt-1"
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.notes}</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                loading={submitting}
              >
                {submitting ? 'Adding...' : 'Add Update'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {updates.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <ChatBubbleLeftEllipsisIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No updates yet</p>
            <p className="text-sm">Be the first to add an update!</p>
          </div>
        ) : (
          updates.map((update) => (
            <div
              key={update.id}
              className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {getUserInitials(update.update_by)}
                </div>
              </div>
              
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {getUserDisplayName(update.update_by)}
                  </p>
                  {getStatusBadge(update.status)}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(update.created_at)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {update.notes}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 