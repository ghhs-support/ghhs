import React from 'react';
import { ExclamationTriangleIcon, UserIcon } from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import Label from '../form/Label';
import Badge from '../ui/badge/Badge';
import { BeepingAlarm } from '../../types/maintenance';

interface BeepingAlarmDetailsCardProps {
  alarm: BeepingAlarm;
  loading?: boolean;
}

export default function BeepingAlarmDetailsCard({
  alarm,
  loading = false,
}: BeepingAlarmDetailsCardProps) {
  if (loading) {
    return (
      <div className="border border-red-200 dark:border-red-700 rounded-lg p-4 bg-red-50 dark:bg-gray-800">
        <div className="text-red-600 dark:text-red-400 text-sm py-4 text-center">
          Loading alarm information...
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'PPpp');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return <Badge size="md" color="info">New</Badge>;
      case 'requires_call_back':
        return <Badge size="md" color="warning">Requires Call Back</Badge>;
      case 'awaiting_response':
        return <Badge size="md" color="warning">Awaiting Response</Badge>;
      case 'to_be_scheduled':
        return <Badge size="md" color="warning">To Be Scheduled</Badge>;
      case 'to_be_quoted':
        return <Badge size="md" color="warning">To Be Quoted</Badge>;
      case 'completed':
        return <Badge size="md" color="success">Completed</Badge>;
      case 'cancelled':
        return <Badge size="md" color="error">Cancelled</Badge>;
      default:
        return <Badge size="md" color="error">{status || 'Unknown'}</Badge>;
    }
  };

  const getBooleanBadge = (value: boolean, trueLabel: string, falseLabel: string) => {
    return value ? 
      <Badge size="md" color="success">{trueLabel}</Badge> : 
      <Badge size="md" color="error">{falseLabel}</Badge>;
  };

  return (
    <div className="border border-red-200 dark:border-red-700 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
      <div className="flex items-center justify-between mb-4">
        <Label className="text-base font-medium text-red-900 dark:text-red-200">
          <ExclamationTriangleIcon className="w-5 h-5 inline mr-2" />
          Beeping Alarm #{alarm.id}
        </Label>
        <div className="flex items-center gap-2">
          {getStatusBadge(alarm.status)}
          {getBooleanBadge(alarm.is_customer_contacted, "Customer Contacted", "Not Contacted")}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">
              Issue Type
            </Label>
            <div className="text-sm text-gray-900 dark:text-gray-100">
              {alarm.issue_type?.name || 'N/A'}
            </div>
            {alarm.issue_type?.description && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {alarm.issue_type.description}
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">
              Created At
            </Label>
            <div className="text-sm text-gray-900 dark:text-gray-100">
              {formatDate(alarm.created_at)}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">
              Allocated To
            </Label>
            {alarm.allocation && alarm.allocation.length > 0 ? (
              <div className="space-y-1">
                {alarm.allocation.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {(user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}` 
                        : user.username}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Badge size="sm" color="warning">Unassigned</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Label className="text-sm font-medium text-red-900 dark:text-red-200 mb-2">
          Notes
        </Label>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-red-200 dark:border-red-700">
          <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
            {alarm.notes || 'No notes provided'}
          </p>
        </div>
      </div>
    </div>
  );
} 