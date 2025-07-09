import React from 'react';
import { Modal } from '../ui/modal';
import Button from '../ui/button/Button';
import { Property } from '../../types/property';
import { AlertIcon } from '../../icons';
import TenantDisplayCard from '../properties/TenantDisplayCard';
import PrivateOwnerDisplayCard from '../properties/PrivateOwnerDisplayCard';
import AgencyDisplayCard from '../properties/AgencyDisplayCard';

interface DuplicateAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingProperty: Property;
  newAddress: {
    unit_number?: string;
    street_number: string;
    street_name: string;
    suburb: string;
    state: string;
    postcode: string;
  };
}

const DuplicateAddressModal: React.FC<DuplicateAddressModalProps> = ({
  isOpen,
  onClose,
  existingProperty,
  newAddress
}) => {
  const formatAddress = (property: any) => {
    const parts = [
      property.unit_number,
      property.street_number,
      property.street_name,
      property.suburb,
      property.state,
      property.postcode
    ].filter(Boolean);
    
    return parts.join(' ');
  };

  const handleViewPropertyDetails = () => {
    window.open(`/properties/${existingProperty.id}`, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <Modal.Header onClose={onClose}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <AlertIcon className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Duplicate Address Detected
            </h3>
          </div>
        </div>
      </Modal.Header>
      
      <Modal.Body>
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Cannot create property:</strong> A property with this address already exists in the system. Please check the address and try again.
            </p>
          </div>

          <div 
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            onClick={handleViewPropertyDetails}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Tip:</strong> If you need to update this property, you can edit the existing one instead of creating a duplicate.
              </p>
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline ml-4 whitespace-nowrap">
                View Property Details →
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Address you're trying to create:
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 dark:bg-gray-800 dark:border-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                  {formatAddress(newAddress)}
                </p>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Existing property address:
              </h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 dark:bg-blue-900/20 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-mono font-medium">
                  {formatAddress(existingProperty)}
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Existing Property Details
            </h4>
            
            <div className="space-y-4">
              {existingProperty.agency ? (
                <AgencyDisplayCard 
                  agency={existingProperty.agency}
                  loading={false}
                />
              ) : (
                <PrivateOwnerDisplayCard 
                  privateOwners={existingProperty.private_owners || []}
                  loading={false}
                />
              )}
              
              <TenantDisplayCard
                tenants={existingProperty.tenants || []}
                onTenantsChange={() => {}}
                disabled={true}
                loading={false}
                allowAdd={false}
                allowRemove={false}
              />
            </div>
          </div>
        </div>
      </Modal.Body>
      
      <Modal.Footer>
        <div className="flex justify-center w-full">
          <Button 
            variant="primary" 
            onClick={onClose}
            className="px-6 py-2"
          >
            Back to Form
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default DuplicateAddressModal; 