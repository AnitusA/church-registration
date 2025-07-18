import { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import { supabase } from "~/utils/supabase.client";
import Sidebar from "~/components/Sidebar";
import AddParticipantForm from "~/components/AddParticipantForm";

interface Participant {
  participant_id: string;
  name: string;
  role: string;
  section?: string;
  competitions?: string[];
  secretary_id: string;
}

interface NewParticipant {
  name: string;
  role: string;
  section?: string | null;
  competition?: string[];
  participantId: string;
}

export default function SecretaryDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [secretary, setSecretary] = useState({
    id: "secretary-123", // Default fallback
    name: "Secretary",
    church: "Grace Church",
    phone: "",
    church_id: ""
  });

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Authentication check - only runs on client side
  useEffect(() => {
    if (!isClient) return; // Wait for client-side hydration
    
    const checkAuthentication = () => {
      const secretaryLogin = localStorage.getItem("secretary_login");
      
      console.log("=== SECRETARY DASHBOARD ACCESS CHECK ===");
      console.log("Secretary login data:", secretaryLogin);
      
      // If no secretary login, immediately redirect
      if (!secretaryLogin) {
        console.log("❌ No secretary login found - redirecting to secretary login");
        navigate("/secretary-login", { replace: true });
        return;
      }
      
      // Validate secretary login data
      try {
        const secretaryData = JSON.parse(secretaryLogin);
        console.log("Parsed secretary data:", secretaryData);
        
        if (!secretaryData.id || !secretaryData.name) {
          console.log("❌ Invalid secretary credentials - redirecting to login");
          console.log("ID:", secretaryData.id, "Name:", secretaryData.name);
          localStorage.removeItem("secretary_login");
          navigate("/secretary-login", { replace: true });
          return;
        }
        
        console.log("✅ Secretary access verified - dashboard access granted");
        setAuthChecking(false); // Allow dashboard to render
      } catch (error) {
        console.error("❌ Error parsing secretary login data:", error);
        localStorage.removeItem("secretary_login");
        navigate("/secretary-login", { replace: true });
        return;
      }
    };

    // Run authentication check
    checkAuthentication();
  }, [navigate, isClient]);

  // Load secretary info from localStorage on component mount
  useEffect(() => {
    const loginData = localStorage.getItem("secretary_login");
    if (loginData) {
      try {
        const parsedData = JSON.parse(loginData);
        setSecretary({
          id: parsedData.id || "secretary-123",
          name: parsedData.name || "Secretary",
          church: parsedData.church || "Grace Church",
          phone: parsedData.phone || "",
          church_id: parsedData.church_id || ""
        });
        console.log("Secretary data loaded from localStorage:", parsedData);
      } catch (error) {
        console.error("Error parsing login data:", error);
      }
    }
  }, []);

  //  Fetch participants on mount
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!secretary.id || secretary.id === "secretary-123") {
        console.log("Waiting for valid secretary ID...");
        return; // Wait for real secretary data to load
      }
      
      console.log("Fetching participants for secretary:", secretary.id);
      console.log("Secretary info:", { id: secretary.id, name: secretary.name, church: secretary.church });
      
      const { data, error } = await supabase
        .from("participants")
        .select("*")
        .eq("secretary_id", secretary.id);

      if (error) {
        console.error("Error fetching participants:", error);
      } else {
        setParticipants(data || []);
        console.log(`Participants loaded for ${secretary.name}:`, data?.length || 0);
        console.log("Participants data:", data);
      }
    };

    fetchParticipants();
  }, [secretary.id, secretary.name]); // Re-fetch when secretary data changes

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleAddParticipant = async (newParticipant: NewParticipant) => {
    console.log("Adding participant:", newParticipant);
    
    const participantData = {
      name: newParticipant.name,
      role: newParticipant.role,
      section: newParticipant.section || null,
      competitions: newParticipant.competition || [],
      participant_id: newParticipant.participantId,
      secretary_id: secretary.id,
    };

    const { error, data } = await supabase
      .from("participants")
      .insert([participantData])
      .select();

    if (error) {
      console.error("Error saving participant:", error);
      alert("Failed to save participant: " + error.message);
    } else {
      console.log("Participant saved successfully:", data);
      // Add the new participant to the list
      if (data && data[0]) {
        setParticipants((prev) => [...prev, data[0] as Participant]);
      }
      setShowForm(false);
      // Participant saved successfully - no popup needed
    }
  };

  // Show loading screen while checking authentication OR if not client-side yet
  if (authChecking || !isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying secretary access...</p>
          <p className="text-xs text-gray-400 mt-2">Checking login credentials</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-white shadow-md">
        <div>
          <h1 className="text-xl font-bold text-gray-700">Secretary Dashboard</h1>
          <p className="text-sm text-gray-500">{secretary.church}</p>
          <p className="text-xs text-gray-400">Welcome, {secretary.name}</p>
        </div>
        <button
          className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg"
          onClick={toggleSidebar}
        >
          {secretary.name[0].toUpperCase()}
        </button>
      </header>

      {/* Sidebar */}
      {sidebarOpen && (
        <Sidebar secretary={secretary} close={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center min-h-[80vh] w-full p-4">
        {/* Enhanced Add Participant Section */}
        {!showForm && (
          <div className="text-center space-y-8">
            {/* Welcome Section */}
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
                <div className="relative bg-white rounded-full p-6 shadow-xl border border-gray-100">
                  <svg className="w-16 h-16 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 4.197a4 4 0 11-6 0 4 4 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Participant Management</h2>
                <p className="text-gray-600 max-w-md mx-auto">Add new participants to your church community. Build your team and manage competitions with ease.</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-white">{participants.length}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800">Total Participants</h3>
                  <p className="text-sm text-gray-600 mt-1">Active members</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-white">{participants.filter(p => p.role === 'student').length}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800">Students</h3>
                  <p className="text-sm text-gray-600 mt-1">Learning together</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-white">{participants.filter(p => p.role === 'teacher').length}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800">Teachers</h3>
                  <p className="text-sm text-gray-600 mt-1">Guiding leaders</p>
                </div>
              </div>
            </div>

            {/* Enhanced Add Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className="text-lg">Add New Participant</span>
                </div>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <div className="bg-white rounded-xl px-4 py-2 shadow-md border border-gray-100 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Ready to add participants</span>
              </div>
              <div className="bg-white rounded-xl px-4 py-2 shadow-md border border-gray-100 flex items-center space-x-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm text-gray-600">Fast & Secure</span>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Form Section */}
        {showForm && (
          <div className="w-full max-w-4xl mx-auto">
            {/* Form Header */}
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full blur-lg opacity-30"></div>
                <div className="relative bg-white rounded-full p-4 shadow-xl border border-gray-100">
                  <svg className="w-12 h-12 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mt-4 mb-2">Add New Participant</h2>
              <p className="text-gray-600">Fill in the details below to add a new member to your community</p>
              
              {/* Progress indicator */}
              <div className="flex justify-center mt-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="w-8 h-1 bg-blue-200 rounded"></div>
                  <div className="w-3 h-3 bg-blue-200 rounded-full"></div>
                  <div className="w-8 h-1 bg-blue-200 rounded"></div>
                  <div className="w-3 h-3 bg-blue-200 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Enhanced Form Container */}
            <div className="relative">
              {/* Glassmorphism background with enhanced effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/60 to-white/40 backdrop-blur-lg rounded-3xl border-2 border-white/30 shadow-2xl"></div>
              
              {/* Animated gradient border */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-gradient-shift"></div>
              
              {/* Form Header Bar */}
              <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 rounded-t-3xl shadow-glow animate-gradient-shift">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-float">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="animate-slide-in-left">
                      <h3 className="text-white font-bold text-xl">Participant Registration</h3>
                      <p className="text-white/90 text-sm">Create a new participant profile</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowForm(false)}
                    aria-label="Close form"
                    className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="relative p-8 bg-white/5 backdrop-blur-sm rounded-b-3xl">
                <AddParticipantForm
                  onSave={handleAddParticipant}
                  currentCount={participants.length}
                />
              </div>
            </div>

            {/* Enhanced Form Footer */}
            <div className="text-center mt-8 animate-fade-in-up animation-delay-500">
              <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
                <div className="flex items-center space-x-3 p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/70 transition-colors duration-200">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-medium">256-bit Encryption</span>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/70 transition-colors duration-200">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="font-medium">Real-time Sync</span>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/70 transition-colors duration-200">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <span className="font-medium">Built with Love</span>
                </div>
              </div>
              
              {/* Animated tagline */}
              <div className="mt-6 text-center animate-fade-in-up animation-delay-1000">
                <p className="text-lg font-medium gradient-text">
                  Creating connections, building community
                </p>
                <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mt-3 animate-gradient-shift"></div>
              </div>
            </div>
          </div>
        )}

        {/* Participants List */}
        {participants.length > 0 && (
          <div className="mt-10 w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">My Participants</h2>
              <span className="text-sm text-gray-500 bg-blue-100 px-3 py-1 rounded-full">
                {participants.length} participant{participants.length !== 1 ? 's' : ''} registered by {secretary.name}
              </span>
            </div>
            <table className="w-full table-auto border-collapse bg-white shadow rounded">
              <thead>
                <tr className="bg-gray-100 text-gray-800">
                  <th className="border px-4 py-2">ID</th>
                  <th className="border px-4 py-2">Name</th>
                  <th className="border px-4 py-2">Role</th>
                  <th className="border px-4 py-2">Section</th>
                  <th className="border px-4 py-2">Competitions</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p, idx) => (
                  <tr key={idx} className="text-gray-800">
                    <td className="border px-4 py-2">{p.participant_id}</td>
                    <td className="border px-4 py-2">{p.name}</td>
                    <td className="border px-4 py-2">{p.role}</td>
                    <td className="border px-4 py-2">{p.section || "—"}</td>
                    <td className="border px-4 py-2">{(p.competitions || []).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
