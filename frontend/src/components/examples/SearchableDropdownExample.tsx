import React, { useState } from 'react';
import SearchableDropdown from '../common/SearchableDropdown';
import { useSearchService } from '../../services/search';
import Label from '../form/Label';

/**
 * Example component demonstrating how to use the global search service
 * for different types of searchable dropdowns.
 */
const SearchableDropdownExample: React.FC = () => {
  const searchService = useSearchService();
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-semibold">Searchable Dropdown Examples</h2>
      
      {/* Property Search Example */}
      <div>
        <Label>Property Search</Label>
        <SearchableDropdown
          value={selectedProperty}
          onChange={setSelectedProperty}
          onSearch={searchService.searchProperties}
          placeholder="Search by property address..."
          showApplyButton={false}
          showClearButton={true}
        />
      </div>

      {/* Tenant Search Example */}
      <div>
        <Label>Tenant Search</Label>
        <SearchableDropdown
          value={selectedTenant}
          onChange={setSelectedTenant}
          onSearch={searchService.searchTenants}
          placeholder="Search by tenant name or mobile..."
          showApplyButton={false}
          showClearButton={true}
        />
      </div>

      {/* User Search Example */}
      <div>
        <Label>User Search</Label>
        <SearchableDropdown
          value={selectedUser}
          onChange={setSelectedUser}
          onSearch={searchService.searchUsers}
          placeholder="Search by user name..."
          showApplyButton={false}
          showClearButton={true}
        />
      </div>

      {/* Display selected values */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-medium mb-2">Selected Values:</h3>
        <div className="space-y-1 text-sm">
          <div>Property: {selectedProperty?.label || 'None'}</div>
          <div>Tenant: {selectedTenant?.label || 'None'}</div>
          <div>User: {selectedUser?.label || 'None'}</div>
        </div>
      </div>
    </div>
  );
};

export default SearchableDropdownExample; 