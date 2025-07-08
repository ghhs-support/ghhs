import Button from '../../components/ui/button/Button';
import { PlusIcon } from '@heroicons/react/24/outline';
import PropertiesTable from '../../components/properties/PropertiesTable';

export default function Properties() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Properties</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage all properties in the system</p>
      </div>

      <div className="mb-4">
        <Button
          onClick={() => {}}
          startIcon={<PlusIcon className="w-5 h-5" />}
        >
          Add Property
        </Button>
      </div>

      <PropertiesTable />
    </div>
  );
} 