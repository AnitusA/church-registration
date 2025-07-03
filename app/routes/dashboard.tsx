import { useState, useEffect } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showForm, setShowForm] = useState(false);

  const secretary = {
    id: "secretary-123", // 🔁 Replace with Supabase auth ID in future
    name: "Samuel",
    church: "Grace Church",
  };

  // 🔁 Fetch participants on mount
  useEffect(() => {
    const fetchParticipants = async () => {
      const { data, error } = await supabase
        .from("participants")
        .select("*")
        .eq("secretary_id", secretary.id);

      if (error) {
        console.error("Error fetching participants:", error.message);
      } else {
        setParticipants(data || []);
      }
    };

    fetchParticipants();
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleAddParticipant = async (newParticipant: NewParticipant) => {
    const participantData = {
      name: newParticipant.name,
      role: newParticipant.role,
      section: newParticipant.section || null,
      competitions: newParticipant.competition || [],
      participant_id: newParticipant.participantId,
      secretary_id: secretary.id,
    };

    const { error, data } = await supabase.from("participants").insert([participantData]).select();

    if (error) {
      console.error("Supabase insert error:", error);
      alert("Failed to save participant.");
    } else {
      // Add the newly created participant to the state
      if (data && data[0]) {
        setParticipants((prev) => [...prev, data[0] as Participant]);
      }
      setShowForm(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-white shadow-md">
        <div>
          <h1 className="text-xl font-bold text-gray-700">Secretary Dashboard</h1>
          <p className="text-sm text-gray-500">{secretary.church}</p>
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
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-full text-xl shadow-lg hover:bg-green-700 transition"
          >
            + Add Participant
          </button>
        )}

        {showForm && (
          <div className="mt-6 w-full flex justify-center">
            <AddParticipantForm
              onSave={handleAddParticipant}
              currentCount={participants.length}
            />
          </div>
        )}

        {participants.length > 0 && (
          <div className="mt-10 w-full max-w-4xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Participants List</h2>
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
