import { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import { supabase } from "~/utils/supabase.client";
import { generateUniqueParticipantId, shouldUpdateParticipantId } from "~/utils/participantId";
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
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editingPreviewId, setEditingPreviewId] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
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
    fetchParticipants();
  }, [secretary.id, secretary.name]); // Re-fetch when secretary data changes

  const fetchParticipants = async () => {
    if (!secretary.id || secretary.id === "secretary-123") {
      console.log("Waiting for valid secretary ID...");
      return; // Wait for real secretary data to load
    }
    
    console.log("=== FETCHING PARTICIPANTS ===");
    console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
    console.log("Supabase Key exists:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);
    console.log("Fetching participants for secretary:", secretary.id);
    console.log("Secretary info:", { id: secretary.id, name: secretary.name, church: secretary.church });
    
    const { data, error } = await supabase
      .from("participants")
      .select("*")
      .eq("secretary_id", secretary.id);

    console.log("Fetch participants response:", { data, error });

    if (error) {
      console.error("Error fetching participants:", error);
    } else {
      setParticipants(data || []);
      console.log(`✅ Participants loaded for ${secretary.name}:`, data?.length || 0);
      console.log("Participants data:", data);
    }
  };

  // Update editing preview ID when editing participant changes
  useEffect(() => {
    const updateEditingPreviewId = async () => {
      if (!editingParticipant) {
        setEditingPreviewId("");
        return;
      }
      
      try {
        // Check if participant ID would change based on current role/section
        const needsNewId = shouldUpdateParticipantId(
          editingParticipant.participant_id, 
          editingParticipant.role, 
          editingParticipant.section || undefined
        );
        
        if (needsNewId) {
          const newId = await generateUniqueParticipantId(
            editingParticipant.role, 
            editingParticipant.section || undefined
          );
          setEditingPreviewId(newId);
        } else {
          setEditingPreviewId(editingParticipant.participant_id);
        }
      } catch (error) {
        console.error("Error generating preview ID:", error);
        setEditingPreviewId(editingParticipant?.participant_id || "");
      }
    };
    
    updateEditingPreviewId();
  }, [editingParticipant?.role, editingParticipant?.section, editingParticipant?.participant_id]);

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

  const handleEditParticipant = async (updatedParticipant: Participant) => {
    console.log("=== EDIT PARTICIPANT STARTED ===");
    console.log("Original participant:", updatedParticipant);
    
    // Ensure teachers don't have a section
    const participantToUpdate: Participant = {
      ...updatedParticipant,
      section: updatedParticipant.role === "teacher" ? undefined : updatedParticipant.section
    };
    
    console.log("Participant to update:", participantToUpdate);
    console.log("Secretary ID:", secretary.id);
    console.log("Participant ID:", updatedParticipant.participant_id);
    
    // Check if we need to generate a new participant ID due to role/section change
    const needsNewId = shouldUpdateParticipantId(
      updatedParticipant.participant_id, 
      participantToUpdate.role, 
      participantToUpdate.section || undefined
    );
    
    let newParticipantId = updatedParticipant.participant_id;
    if (needsNewId) {
      console.log("🔄 Generating new participant ID due to role/section change");
      newParticipantId = await generateUniqueParticipantId(
        participantToUpdate.role, 
        participantToUpdate.section || undefined
      );
      console.log("New participant ID generated:", newParticipantId);
    }
    
    const updateData = {
      participant_id: newParticipantId,
      name: participantToUpdate.name,
      role: participantToUpdate.role,
      section: participantToUpdate.section || null,
      competitions: participantToUpdate.competitions || []
    };
    
    console.log("Update data being sent to database:", updateData);
    console.log("WHERE conditions:", {
      participant_id: updatedParticipant.participant_id,
      secretary_id: secretary.id
    });
    
    try {
      // First, let's check if the participant exists
      const { data: existingParticipant, error: findError } = await supabase
        .from("participants")
        .select("*")
        .eq("participant_id", updatedParticipant.participant_id)
        .eq("secretary_id", secretary.id)
        .single();
      
      console.log("Existing participant check:", { existingParticipant, findError });
      
      if (findError) {
        console.error("❌ Could not find participant to update:", findError);
        alert("Could not find participant to update. Error: " + findError.message);
        return;
      }
      
      if (!existingParticipant) {
        console.error("❌ No participant found with the given ID and secretary ID");
        alert("No participant found to update. Check participant ID and permissions.");
        return;
      }
      
      // Now perform the update
      const { error, data } = await supabase
        .from("participants")
        .update(updateData)
        .eq("participant_id", updatedParticipant.participant_id)
        .eq("secretary_id", secretary.id)
        .select();

      console.log("Supabase update response:", { error, data });

      if (error) {
        console.error("❌ Error updating participant:", error);
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        alert("Failed to update participant: " + error.message);
      } else if (!data || data.length === 0) {
        console.error("❌ No rows were updated. This might be a permissions issue.");
        alert("No rows were updated. Check RLS policies or participant permissions.");
      } else {
        console.log("✅ Participant updated successfully in database:", data);
        
        // Update the participant in the local state
        setParticipants(prev => {
          const updated = prev.map(p => 
            p.participant_id === updatedParticipant.participant_id 
              ? participantToUpdate 
              : p
          );
          console.log("Updated participants list:", updated);
          return updated;
        });
        
        setEditingParticipant(null);
        console.log("✅ Edit modal closed and local state updated");
        
        // Force refresh to verify database update
        setTimeout(() => {
          console.log("🔄 Auto-refreshing to verify database update...");
          fetchParticipants();
        }, 500);
      }
    } catch (err) {
      console.error("❌ Unexpected error during update:", err);
      alert("Unexpected error occurred: " + (err as Error).message);
    }
  };

  const handleDeleteParticipant = async (participantId: string) => {
    console.log("Deleting participant:", participantId);
    
    const { error } = await supabase
      .from("participants")
      .delete()
      .eq("participant_id", participantId)
      .eq("secretary_id", secretary.id);

    if (error) {
      console.error("Error deleting participant:", error);
      alert("Failed to delete participant: " + error.message);
    } else {
      console.log("Participant deleted successfully");
      // Remove the participant from the list
      setParticipants(prev => 
        prev.filter(p => p.participant_id !== participantId)
      );
      setDeleteConfirm(null);
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
      <header className="flex justify-between items-center p-3 md:p-4 bg-white shadow-md">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-xl font-bold text-gray-700 truncate">Secretary Dashboard</h1>
          <p className="text-xs md:text-sm text-gray-500 truncate">{secretary.church}</p>
          <p className="text-xs text-gray-400 truncate">Welcome, {secretary.name}</p>
        </div>
        <button
          className="bg-blue-600 text-white rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-lg flex-shrink-0 ml-3"
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
      <main className="flex flex-col items-center justify-center min-h-[80vh] w-full p-3 md:p-4">
        {/* Enhanced Add Participant Section */}
        {!showForm && (
          <div className="text-center space-y-6 md:space-y-8">
            {/* Welcome Section */}
            <div className="space-y-3 md:space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
                <div className="relative bg-white rounded-full p-4 md:p-6 shadow-xl border border-gray-100">
                  <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 4.197a4 4 0 11-6 0 4 4 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Participant Management</h2>
                <p className="text-gray-600 max-w-sm md:max-w-md mx-auto text-sm md:text-base px-4">Add new participants to your church community. Build your team and manage competitions with ease.</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-xs sm:max-w-2xl mx-auto px-4">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl md:rounded-2xl p-4 md:p-6 border border-blue-100">
                <div className="text-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                    <span className="text-lg md:text-2xl font-bold text-white">{participants.length}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm md:text-base">Total Participants</h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">Active members</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl md:rounded-2xl p-4 md:p-6 border border-green-100">
                <div className="text-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                    <span className="text-lg md:text-2xl font-bold text-white">{participants.filter(p => p.role === 'student').length}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm md:text-base">Students</h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">Learning together</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl md:rounded-2xl p-4 md:p-6 border border-purple-100">
                <div className="text-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                    <span className="text-lg md:text-2xl font-bold text-white">{participants.filter(p => p.role === 'teacher').length}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm md:text-base">Teachers</h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">Guiding leaders</p>
                </div>
              </div>
            </div>

            {/* Enhanced Add Button */}
            <div className="relative group px-4">
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white font-bold py-3 px-6 md:py-4 md:px-8 rounded-xl md:rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-300 w-full sm:w-auto"
              >
                <div className="flex items-center justify-center space-x-2 md:space-x-3">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className="text-base md:text-lg">Add New Participant</span>
                </div>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-4 mt-6 md:mt-8 px-4">
              <div className="bg-white rounded-lg md:rounded-xl px-3 py-2 md:px-4 md:py-2 shadow-md border border-gray-100 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs md:text-sm text-gray-600">Ready to add participants</span>
              </div>
              <div className="bg-white rounded-lg md:rounded-xl px-3 py-2 md:px-4 md:py-2 shadow-md border border-gray-100 flex items-center justify-center space-x-2">
                <svg className="w-3 h-3 md:w-4 md:h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs md:text-sm text-gray-600">Fast & Secure</span>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Form Section */}
        {showForm && (
          <div className="w-full max-w-4xl mx-auto px-4">
            {/* Form Header */}
            <div className="text-center mb-6 md:mb-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full blur-lg opacity-30"></div>
                <div className="relative bg-white rounded-full p-3 md:p-4 shadow-xl border border-gray-100">
                  <svg className="w-10 h-10 md:w-12 md:h-12 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mt-4 mb-2">Add New Participant</h2>
              <p className="text-gray-600 text-sm md:text-base px-4">Fill in the details below to add a new member to your community</p>
              
              {/* Progress indicator */}
              <div className="flex justify-center mt-4 md:mt-6">
                <div className="flex items-center space-x-1 md:space-x-2">
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full"></div>
                  <div className="w-6 h-1 md:w-8 md:h-1 bg-blue-200 rounded"></div>
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-200 rounded-full"></div>
                  <div className="w-6 h-1 md:w-8 md:h-1 bg-blue-200 rounded"></div>
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-200 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Enhanced Form Container */}
            <div className="relative">
              {/* Glassmorphism background with enhanced effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/60 to-white/40 backdrop-blur-lg rounded-2xl md:rounded-3xl border-2 border-white/30 shadow-2xl"></div>
              
              {/* Animated gradient border */}
              <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-gradient-shift"></div>
              
              {/* Form Header Bar */}
              <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-4 md:p-6 rounded-t-2xl md:rounded-t-3xl shadow-glow animate-gradient-shift">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 md:space-x-4 min-w-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-float flex-shrink-0">
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="animate-slide-in-left min-w-0">
                      <h3 className="text-white font-bold text-lg md:text-xl truncate">Participant Registration</h3>
                      <p className="text-white/90 text-xs md:text-sm truncate">Create a new participant profile</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowForm(false)}
                    aria-label="Close form"
                    className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors duration-200 flex-shrink-0"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="relative p-4 md:p-8 bg-white/5 backdrop-blur-sm rounded-b-2xl md:rounded-b-3xl">
                <AddParticipantForm
                  onSave={handleAddParticipant}
                  currentCount={participants.length}
                />
              </div>
            </div>

            {/* Enhanced Form Footer */}
            <div className="text-center mt-6 md:mt-8 animate-fade-in-up animation-delay-500">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 md:space-x-8 text-sm text-gray-600">
                <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 bg-white/50 backdrop-blur-sm rounded-lg md:rounded-xl border border-white/20 hover:bg-white/70 transition-colors duration-200">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-medium text-xs md:text-sm">256-bit Encryption</span>
                </div>
                
                <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 bg-white/50 backdrop-blur-sm rounded-lg md:rounded-xl border border-white/20 hover:bg-white/70 transition-colors duration-200">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="font-medium text-xs md:text-sm">Real-time Sync</span>
                </div>
                
                <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 bg-white/50 backdrop-blur-sm rounded-lg md:rounded-xl border border-white/20 hover:bg-white/70 transition-colors duration-200">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <span className="font-medium text-xs md:text-sm">Built with Love</span>
                </div>
              </div>
              
              {/* Animated tagline */}
              <div className="mt-4 md:mt-6 text-center animate-fade-in-up animation-delay-1000">
                <p className="text-base md:text-lg font-medium gradient-text">
                  Creating connections, building community
                </p>
                <div className="w-16 h-1 md:w-20 md:h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mt-2 md:mt-3 animate-gradient-shift"></div>
              </div>
            </div>
          </div>
        )}

        {/* Participants List */}
        {participants.length > 0 && (
          <div className="mt-8 md:mt-10 w-full max-w-7xl px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-3 sm:space-y-0">
              <h2 className="text-lg md:text-xl font-bold text-gray-800">My Participants</h2>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                <button
                  onClick={fetchParticipants}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200 flex items-center space-x-1 w-full sm:w-auto justify-center"
                  title="Refresh participants list"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
                <span className="text-xs md:text-sm text-gray-500 bg-blue-100 px-2 md:px-3 py-1 rounded-full text-center">
                  {participants.length} participant{participants.length !== 1 ? 's' : ''} registered by {secretary.name}
                </span>
              </div>
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full table-auto border-collapse bg-white shadow rounded-lg">
                <thead>
                  <tr className="bg-gray-100 text-gray-800">
                    <th className="border px-3 py-2 text-left">ID</th>
                    <th className="border px-3 py-2 text-left">Name</th>
                    <th className="border px-3 py-2 text-left">Role</th>
                    <th className="border px-3 py-2 text-left">Section</th>
                    <th className="border px-3 py-2 text-left">Competitions</th>
                    <th className="border px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p, idx) => (
                    <tr key={idx} className="text-gray-800 hover:bg-gray-50">
                      <td className="border px-3 py-2 font-mono text-sm">{p.participant_id}</td>
                      <td className="border px-3 py-2 font-medium">{p.name}</td>
                      <td className="border px-3 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          p.role === 'teacher' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {p.role}
                        </span>
                      </td>
                      <td className="border px-3 py-2">{p.section || "—"}</td>
                      <td className="border px-3 py-2 text-sm">{(p.competitions || []).join(", ") || "—"}</td>
                      <td className="border px-3 py-2">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => setEditingParticipant(p)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200"
                            title="Edit participant"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(p.participant_id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200"
                            title="Delete participant"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {participants.map((p, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 text-lg truncate">{p.name}</h3>
                      <p className="font-mono text-xs text-gray-500 mt-1">ID: {p.participant_id}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                      p.role === 'teacher' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {p.role}
                    </span>
                  </div>
                  
                  {p.section && (
                    <div className="mb-2">
                      <span className="text-sm text-gray-600">Section: </span>
                      <span className="text-sm font-medium text-gray-800">{p.section}</span>
                    </div>
                  )}
                  
                  {p.competitions && p.competitions.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm text-gray-600 block mb-1">Competitions:</span>
                      <div className="flex flex-wrap gap-1">
                        {p.competitions.map((comp, compIdx) => (
                          <span key={compIdx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => setEditingParticipant(p)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(p.participant_id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Participant Modal */}
        {editingParticipant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 md:p-6 rounded-t-xl">
                <h3 className="text-white font-bold text-lg md:text-xl">Edit Participant</h3>
                <p className="text-white/90 text-xs md:text-sm">Update participant information</p>
              </div>
              
              {/* Participant ID Preview */}
              {editingPreviewId !== editingParticipant.participant_id && (
                <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        ID will be updated
                      </p>
                      <p className="text-xs text-amber-600">
                        {editingParticipant.participant_id} → {editingPreviewId}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 12l2 2 4-4" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 md:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={editingParticipant.name}
                    onChange={(e) => setEditingParticipant({...editingParticipant, name: e.target.value})}
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                  <select
                    value={editingParticipant.role}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setEditingParticipant({
                        ...editingParticipant, 
                        role: newRole,
                        // Clear section if changing to teacher
                        section: newRole === "teacher" ? undefined : editingParticipant.section
                      });
                    }}
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </div>
                {/* Only show section for non-teacher roles */}
                {editingParticipant.role !== "teacher" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
                    <select
                      value={editingParticipant.section || ""}
                      onChange={(e) => setEditingParticipant({...editingParticipant, section: e.target.value || undefined})}
                      className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                    >
                      <option value="">Select Section</option>
                      <option value="nursery">Nursery</option>
                      <option value="beginner">Beginner</option>
                      <option value="primary">Primary</option>
                      <option value="junior">Junior</option>
                      <option value="senior">Senior</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Competitions</label>
                  <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {["memory verse", "speech competition", "singing competition", "quiz", "musical instrumental", "drama", "art competition"].map((comp) => (
                      <label key={comp} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded text-sm">
                        <input
                          type="checkbox"
                          checked={(editingParticipant.competitions || []).includes(comp)}
                          onChange={(e) => {
                            const currentComps = editingParticipant.competitions || [];
                            const newComps = e.target.checked
                              ? [...currentComps, comp]
                              : currentComps.filter(c => c !== comp);
                            setEditingParticipant({...editingParticipant, competitions: newComps});
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 capitalize">{comp}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    onClick={() => handleEditParticipant(editingParticipant)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200 text-sm md:text-base"
                  >
                    Update Participant
                  </button>
                  <button
                    onClick={() => setEditingParticipant(null)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200 text-sm md:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 md:p-6 rounded-t-xl">
                <h3 className="text-white font-bold text-lg md:text-xl">Delete Participant</h3>
                <p className="text-white/90 text-xs md:text-sm">This action cannot be undone</p>
              </div>
              <div className="p-4 md:p-6">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-800 font-semibold text-sm md:text-base">Are you sure you want to delete this participant?</p>
                    <p className="text-gray-600 text-xs md:text-sm mt-1 break-all">Participant ID: {deleteConfirm}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => handleDeleteParticipant(deleteConfirm)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200 text-sm md:text-base"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200 text-sm md:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
