import { useState } from "react";

type AddParticipantFormProps = {
  onSave: (participant: {
    name: string;
    role: string;
    section: string | null;
    competition: string[];
    participantId: string;
  }) => void;
  currentCount: number;
};

export default function AddParticipantForm({ onSave, currentCount }: AddParticipantFormProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("student");
  const [section, setSection] = useState("nursery");
  const [competition, setCompetition] = useState<string[]>([]);

  const sections = ["nursery", "beginner", "primary", "junior", "senior"];
  const competitions = [
    "memory verse",
    "speech competition",
    "singing competition",
    "quiz",
    "musical instrumental",
  ];

  const generateId = () => {
    const prefix = role === "teacher" ? "T" : section[0].toUpperCase();
    const count = currentCount + 1;
    return `${prefix}${String(count).padStart(3, "0")}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const participantId = generateId();
    onSave({
      name,
      role,
      section: role === "student" ? section : null,
      competition,
      participantId,
    });

    // Reset form
    setName("");
    setRole("student");
    setSection("nursery");
    setCompetition([]);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl bg-orange-50 border border-orange-200 shadow-xl rounded-xl p-8 space-y-6"
    >
      <h2 className="text-2xl font-bold text-orange-700 mb-2">
        Add Participant
      </h2>

      {/* Name */}
      <div>
        <label className="block mb-2 text-lg font-semibold text-gray-800">
          Participant Name
        </label>
        <input
          type="text"
          className="w-full px-4 py-3 text-lg text-black bg-white border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Enter participant's name"
        />
      </div>

      {/* Role */}
      <div>
        <label htmlFor="role-select" className="block mb-2 text-lg font-semibold text-gray-800">
          Role
        </label>
        <select
          id="role-select"
          className="w-full px-4 py-3 text-lg text-black bg-white border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
      </div>

      {/* Section (only for students) */}
      {role === "student" && (
        <div>
          <label htmlFor="section-select" className="block mb-2 text-lg font-semibold text-gray-800">
            Section
          </label>
          <select
            id="section-select"
            className="w-full px-4 py-3 text-lg text-black bg-white border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={section}
            onChange={(e) => setSection(e.target.value)}
          >
            {sections.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Competitions */}
      <div>
        <label className="block mb-2 text-lg font-semibold text-gray-800">
          Competitions
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {competitions.map((comp) => (
            <label
              key={comp}
              className="flex items-center text-lg text-gray-800"
            >
              <input
                type="checkbox"
                value={comp}
                checked={competition.includes(comp)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setCompetition([...competition, comp]);
                  } else {
                    setCompetition(competition.filter((c) => c !== comp));
                  }
                }}
                className="mr-3 w-6 h-6 accent-orange-600"
              />
              {comp}
            </label>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        type="submit"
        className="w-full bg-orange-600 text-white text-lg font-semibold py-3 rounded hover:bg-orange-700 transition"
      >
        Save Participant
      </button>
    </form>
  );
}
