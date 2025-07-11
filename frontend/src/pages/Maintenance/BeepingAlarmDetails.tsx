import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import PropertyInformationCard from '../../components/properties/PropertyInformationCard';
import TenantDisplayCard from '../../components/properties/TenantDisplayCard';
import AgencyDisplayCard from '../../components/properties/AgencyDisplayCard';
import PrivateOwnerDisplayCard from '../../components/properties/PrivateOwnerDisplayCard';
import BeepingAlarmDetailsCard from '../../components/maintenance/BeepingAlarmDetailsCard';
import BeepingAlarmUpdatesCard from '../../components/maintenance/BeepingAlarmUpdatesCard';
import { BeepingAlarm, BeepingAlarmUpdate } from '../../types/maintenance';
import { Tenant } from '../../types/property';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import useGoBack from '../../hooks/useGoBack';

export default function BeepingAlarmDetails() {
  const { alarmId } = useParams<{ alarmId: string }>();
  const goBack = useGoBack();
  const api = useAuthenticatedApi();
  const [alarm, setAlarm] = useState<BeepingAlarm | null>(null);
  const [updates, setUpdates] = useState<BeepingAlarmUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatesLoading, setUpdatesLoading] = useState(true);
  const [alarmDetailsLoading, setAlarmDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!alarmId) {
      setError('Invalid alarm ID');
      setLoading(false);
      return;
    }

    fetchInitialData();
  }, [alarmId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [alarmResponse, updatesResponse] = await Promise.all([
        api.authenticatedGet(`/beeping_alarms/${alarmId}/`),
        api.authenticatedGet(`/beeping_alarms/${alarmId}/updates/`)
      ]);
      setAlarm(alarmResponse);
      setUpdates(updatesResponse);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load alarm details');
    } finally {
      setLoading(false);
      setUpdatesLoading(false);
    }
  };

  const fetchAlarmDetailsOnly = async () => {
    try {
      setAlarmDetailsLoading(true);
      const response = await api.authenticatedGet(`/beeping_alarms/${alarmId}/`);
      setAlarm(response);
    } catch (err) {
      console.error('Error fetching alarm details:', err);
    } finally {
      setAlarmDetailsLoading(false);
    }
  };

  const fetchUpdatesOnly = async () => {
    try {
      setUpdatesLoading(true);
      const response = await api.authenticatedGet(`/beeping_alarms/${alarmId}/updates/`);
      setUpdates(response);
    } catch (err) {
      console.error('Error fetching updates:', err);
    } finally {
      setUpdatesLoading(false);
    }
  };

  const handleUpdateSubmitted = async () => {
    // Fetch both updates and alarm details, but only show loading on the specific cards
    await Promise.all([
      fetchUpdatesOnly(),
      fetchAlarmDetailsOnly()
    ]);
  };

  const handleTenantsChange = (updatedTenants: Tenant[]) => {
    console.log('Tenants changed:', updatedTenants);
  };

  if (loading) {
    return (
      <>
        <PageMeta
          title="Beeping Alarm Details"
          description="View beeping alarm details"
        />
        <PageBreadcrumb pageTitle="Beeping Alarm Details" />
        
        <div className="mb-6">
          <button
            onClick={goBack}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Beeping Alarms
          </button>
        </div>

        <div className="space-y-6">
          <PropertyInformationCard property={{} as any} loading={true} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BeepingAlarmDetailsCard alarm={{} as any} loading={true} />
            <BeepingAlarmUpdatesCard
              alarmId={0}
              updates={[]}
              onUpdateSubmitted={() => {}}
              loading={true}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AgencyDisplayCard agency={null} loading={true} />
            <TenantDisplayCard 
              tenants={[]} 
              onTenantsChange={handleTenantsChange}
              allowAdd={false}
              allowRemove={false}
              loading={true}
            />
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  if (!alarm) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-300">Alarm not found</div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`Beeping Alarm #${alarm.id}`}
        description="View beeping alarm details"
      />
      <PageBreadcrumb pageTitle={`Beeping Alarm #${alarm.id}`} />
      
      <div className="mb-6">
        <button
          onClick={goBack}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Beeping Alarms
        </button>
      </div>

      <div className="space-y-6">
        <PropertyInformationCard
          property={alarm.property}
          loading={false}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BeepingAlarmDetailsCard 
            alarm={alarm} 
            loading={alarmDetailsLoading}
          />
          <BeepingAlarmUpdatesCard
            alarmId={alarm.id}
            updates={updates}
            onUpdateSubmitted={handleUpdateSubmitted}
            loading={updatesLoading}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            {alarm.property.agency ? (
              <AgencyDisplayCard
                agency={alarm.property.agency}
                loading={false}
              />
            ) : (
              <PrivateOwnerDisplayCard
                privateOwners={alarm.property.private_owners || []}
                loading={false}
              />
            )}
          </div>
          
          <div>
            <TenantDisplayCard
              tenants={alarm.property.tenants || []}
              onTenantsChange={handleTenantsChange}
              allowAdd={false}
              allowRemove={false}
              disabled={false}
              loading={false}
            />
          </div>
        </div>
      </div>
    </>
  );
} 