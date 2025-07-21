interface Participant {
  id: string;
  name: string;
  participant_id: string;
  role: string;
  section?: string;
  competitions?: string[];
  secretary?: {
    name: string;
    church: string;
  };
}

interface FilterBarProps {
  filters: {
    search: string;
    church: string;
    role: string;
    section: string;
    competition: string;
  };
  onFilterChange: (filters: FilterBarProps['filters']) => void;
  participants: Participant[];
}

export default function FilterBar({ filters, onFilterChange, participants }: FilterBarProps) {
  // Extract unique values for filter options
  const uniqueChurches = [...new Set(participants.map(p => p.secretary?.church).filter(Boolean))];
  const uniqueRoles = [...new Set(participants.map(p => p.role).filter(Boolean))];
  const uniqueSections = [...new Set(participants.map(p => p.section).filter(Boolean))];
  const uniqueCompetitions = [...new Set(
    participants.flatMap(p => p.competitions || [])
  )];

  const handleFilterChange = (key: keyof FilterBarProps['filters'], value: string) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFilterChange({
      search: "",
      church: "",
      role: "",
      section: "",
      competition: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  return (
    <div className="p-6 border-b border-gray-200">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="flex-1 min-w-64">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search by name or ID..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Church Filter */}
        <div className="min-w-48">
          <label htmlFor="church" className="block text-sm font-medium text-gray-700 mb-1">
            Church
          </label>
          <select
            id="church"
            value={filters.church}
            onChange={(e) => handleFilterChange("church", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Churches</option>
            {uniqueChurches.map(church => (
              <option key={church} value={church}>{church}</option>
            ))}
          </select>
        </div>

        {/* Role Filter */}
        <div className="min-w-32">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            id="role"
            value={filters.role}
            onChange={(e) => handleFilterChange("role", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Roles</option>
            {uniqueRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        {/* Section Filter */}
        <div className="min-w-32">
          <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">
            Section
          </label>
          <select
            id="section"
            value={filters.section}
            onChange={(e) => handleFilterChange("section", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Sections</option>
            {uniqueSections.map(section => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        </div>

        {/* Competition Filter */}
        <div className="min-w-48">
          <label htmlFor="competition" className="block text-sm font-medium text-gray-700 mb-1">
            Competition
          </label>
          <select
            id="competition"
            value={filters.competition}
            onChange={(e) => handleFilterChange("competition", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Competitions</option>
            {uniqueCompetitions.map(competition => (
              <option key={competition} value={competition}>{competition}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.search && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Search: "{filters.search}"
              <button
                onClick={() => handleFilterChange("search", "")}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.church && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Church: {filters.church}
              <button
                onClick={() => handleFilterChange("church", "")}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.role && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Role: {filters.role}
              <button
                onClick={() => handleFilterChange("role", "")}
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.section && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Section: {filters.section}
              <button
                onClick={() => handleFilterChange("section", "")}
                className="ml-1 text-yellow-600 hover:text-yellow-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.competition && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              Competition: {filters.competition}
              <button
                onClick={() => handleFilterChange("competition", "")}
                className="ml-1 text-indigo-600 hover:text-indigo-800"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
