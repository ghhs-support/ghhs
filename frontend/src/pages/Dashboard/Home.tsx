import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Property Management Dashboard | GHHS"
        description="Property management system dashboard"
      />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-4">
              Welcome to GHHS Property Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Manage your properties, maintenance requests, and tenant information from this central dashboard.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Maintenance</h3>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  View and manage beeping alarms and maintenance requests
                </p>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">Properties</h3>
                <p className="text-sm text-green-600 dark:text-green-300">
                  Manage property information and tenant details
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h3 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Reports</h3>
                <p className="text-sm text-purple-600 dark:text-purple-300">
                  Generate reports and view analytics
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
