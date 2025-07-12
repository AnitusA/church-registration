import { useState, useEffect } from "react";
import { supabase } from "~/utils/supabase.client";

interface Participant {
  id: string;
  name: string;
  participant_id: string;
  role: string;
  section?: string;
  competitions?: string[];
  secretary_id: string;
}

export default function OrganizerDashboard() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    section: "",
    secretaryId: "",
    role: ""
  });

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      
      console.log("=== DEBUGGING ORGANIZER DASHBOARD ===");
      console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
      console.log("Supabase Key exists:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);
      
      // Test connection first
      const { data: testConnection, error: connectionError } = await supabase
        .from("participants")
        .select("count", { count: "exact", head: true });
      
      console.log("Connection test:", { testConnection, connectionError });
      
      // Fetch all participants
      const { data, error } = await supabase
        .from("participants")
        .select("id, name, participant_id, role, section, competitions, secretary_id")
        .order("name", { ascending: true });
      
      console.log("Query result:", { data, error });
      console.log("Data length:", data?.length || 0);
      console.log("Raw data:", data);
      
      if (error) {
        console.error("Supabase error:", error);
        setError(`Database error: ${error.message}`);
      } else {
        console.log("Setting participants:", data?.length || 0);
        setParticipants(data || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Failed to load participants: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter participants based on search and filters
  const filteredParticipants = participants.filter(p => {
    const searchMatch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.participant_id.toLowerCase().includes(search.toLowerCase()) ||
      p.role.toLowerCase().includes(search.toLowerCase());
    
    const sectionMatch = !filters.section || p.section === filters.section;
    const secretaryMatch = !filters.secretaryId || p.secretary_id === filters.secretaryId;
    const roleMatch = !filters.role || p.role === filters.role;
    
    return searchMatch && sectionMatch && secretaryMatch && roleMatch;
  });

  // Get unique values for filter options
  const uniqueSections = [...new Set(participants.map(p => p.section).filter(Boolean))];
  const uniqueSecretaryIds = [...new Set(participants.map(p => p.secretary_id))];
  const uniqueRoles = [...new Set(participants.map(p => p.role))];

  const stats = {
    totalParticipants: participants.length,
    totalChurches: new Set(participants.map(p => p.secretary_id)).size,
    recentRegistrations: participants.length, // Since we don't have created_at, show total
  };

  const exportCSV = () => {
    const csv = [
      ["ID", "Name", "Role", "Section", "Competitions", "Secretary ID"],
      ...filteredParticipants.map(p => [
        p.participant_id,
        p.name,
        p.role,
        p.section || "",
        (p.competitions || []).join("; "),
        p.secretary_id
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `participants-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organizer dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Organizer Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Church Registration System
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Total Participants
            </div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {stats.totalParticipants}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Churches Registered
            </div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {stats.totalChurches}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Total Registrations
            </div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {stats.recentRegistrations}
            </div>
            <div className="text-sm text-gray-500 mt-1">All participants</div>
          </div>
        </div>

        {/* Search and Export */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Participants
              </label>
              <input
                id="search"
                type="text"
                placeholder="Search by name, ID, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
              >
                Export CSV
              </button>
              <button
                onClick={fetchParticipants}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Refresh
              </button>
            </div>
          </div>
          {search && (
            <div className="mt-2 text-sm text-gray-600">
              Showing {filteredParticipants.length} of {participants.length} participants
            </div>
          )}
          {(filters.section || filters.secretaryId || filters.role) && (
            <div className="mt-2 text-sm text-blue-600">
              Active filters: {[filters.section, filters.secretaryId, filters.role].filter(Boolean).length} applied
            </div>
          )}
        </div>

        {/* Modern Filter Controls */}
        {participants.length > 0 && (
          <div className="mb-6 bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-xl">
            {/* Section Filters */}
            <div className="mb-6">
              <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Sections
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, section: "" }))}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${
                    !filters.section
                      ? "bg-white text-gray-800 shadow-lg"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                  }`}
                >
                  All Sections
                </button>
                {uniqueSections.map((section) => (
                  <button
                    key={section}
                    onClick={() => setFilters(prev => ({ ...prev, section: section || "" }))}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${
                      filters.section === section
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                    }`}
                  >
                    {section}
                  </button>
                ))}
              </div>
            </div>

            {/* Role Filters */}
            <div className="mb-6">
              <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Roles
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, role: "" }))}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${
                    !filters.role
                      ? "bg-white text-gray-800 shadow-lg"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                  }`}
                >
                  All Roles
                </button>
                {uniqueRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => setFilters(prev => ({ ...prev, role }))}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${
                      filters.role === role
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Secretary ID Filters */}
            <div className="mb-4">
              <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Secretary
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, secretaryId: "" }))}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${
                    !filters.secretaryId
                      ? "bg-white text-gray-800 shadow-lg"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                  }`}
                >
                  All Secretaries
                </button>
                {uniqueSecretaryIds.map((secretaryId) => (
                  <button
                    key={secretaryId}
                    onClick={() => setFilters(prev => ({ ...prev, secretaryId }))}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${
                      filters.secretaryId === secretaryId
                        ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                    }`}
                  >
                    {secretaryId}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Summary */}
            {(filters.section || filters.secretaryId || filters.role) && (
              <div className="flex justify-between items-center pt-4 border-t border-gray-600">
                <span className="text-gray-300 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Showing {filteredParticipants.length} of {participants.length} participants
                </span>
                <button
                  onClick={() => setFilters({ section: "", secretaryId: "", role: "" })}
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Participants Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">All Participants</h2>
            
            {filteredParticipants.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {participants.length === 0 ? "No participants found." : "No participants match your search or filters."}
                </p>
                {participants.length === 0 && (
                  <p className="text-sm text-gray-400 mt-2">
                    Participants will appear here once secretaries start registering them.
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800">
                      <th className="px-6 py-4 text-left font-semibold">ID</th>
                      <th className="px-6 py-4 text-left font-semibold">Name</th>
                      <th className="px-6 py-4 text-left font-semibold">Role</th>
                      <th className="px-6 py-4 text-left font-semibold">Section</th>
                      <th className="px-6 py-4 text-left font-semibold">Competitions</th>
                      <th className="px-6 py-4 text-left font-semibold">Secretary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParticipants.map((participant) => (
                      <tr key={participant.id} className="text-gray-800 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-blue-600">
                          {participant.participant_id}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {participant.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {participant.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {participant.section ? (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                              {participant.section}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {participant.competitions?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {participant.competitions.map((comp, idx) => (
                                <span
                                  key={idx}
                                  className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded"
                                >
                                  {comp}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">No competitions</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {participant.secretary_id}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
