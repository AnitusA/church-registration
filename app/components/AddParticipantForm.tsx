import { useState, useEffect } from "react";

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
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const sections = ["nursery", "beginner", "primary", "junior", "senior"];
  const competitions = [
    "memory verse",
    "speech competition", 
    "singing competition",
    "quiz",
    "musical instrumental",
  ];

  // Calculate form completion percentage
  const getFormCompletion = () => {
    let completed = 0;
    const totalFields = 4;
    
    if (name.trim()) completed++;
    if (role) completed++;
    if (role === "teacher" || section) completed++;
    if (competition.length > 0) completed++;
    
    return Math.round((completed / totalFields) * 100);
  };

  // Auto-advance steps based on completion
  useEffect(() => {
    const completion = getFormCompletion();
    if (completion >= 25 && currentStep < 2) setCurrentStep(2);
    if (completion >= 50 && currentStep < 3) setCurrentStep(3);
    if (completion >= 75 && currentStep < 4) setCurrentStep(4);
  }, [name, role, section, competition, currentStep]);

  const generateId = () => {
    const prefix = role === "teacher" ? "T" : section[0].toUpperCase();
    const count = currentCount + 1;
    return `${prefix}${String(count).padStart(3, "0")}`;
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!name.trim()) errors.name = "Name is required";
    if (name.trim().length < 2) errors.name = "Name must be at least 2 characters";
    if (!role) errors.role = "Role is required";
    if (role === "student" && !section) errors.section = "Section is required for students";
    if (competition.length === 0) errors.competition = "Please select at least one competition";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
    setCurrentStep(1);
    setIsSubmitting(false);
    setFormErrors({});
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Animated Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-20"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-400 rounded-full animate-pulse opacity-30"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce opacity-25"></div>
        <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-pink-400 rounded-full animate-ping opacity-20"></div>
      </div>

      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Participant Registration
              </h2>
              <p className="text-gray-600 text-sm">Complete all fields to add participant</p>
            </div>
          </div>
          
          {/* Dynamic completion indicator */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-800">{getFormCompletion()}%</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="4"/>
                <circle 
                  cx="32" 
                  cy="32" 
                  r="28" 
                  fill="none" 
                  stroke="url(#gradient)" 
                  strokeWidth="4"
                  strokeDasharray={`${getFormCompletion() * 1.75} 175`}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-500 ${
                currentStep >= step
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-transparent text-white shadow-lg scale-110'
                  : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
              }`}>
                {currentStep > step ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm font-semibold">{step}</span>
                )}
                
                {currentStep === step && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-ping opacity-20"></div>
                )}
              </div>
              
              {step < 4 && (
                <div className={`flex-1 h-1 mx-3 rounded-full transition-all duration-500 ${
                  currentStep > step ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-200'
                }`}>
                  {currentStep === step + 1 && (
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="flex justify-between text-xs text-gray-500 px-2">
          <span className={currentStep >= 1 ? 'text-blue-600 font-semibold' : ''}>Basic Info</span>
          <span className={currentStep >= 2 ? 'text-purple-600 font-semibold' : ''}>Role & Section</span>
          <span className={currentStep >= 3 ? 'text-green-600 font-semibold' : ''}>Competitions</span>
          <span className={currentStep >= 4 ? 'text-orange-600 font-semibold' : ''}>Review</span>
        </div>
      </div>

      {/* Main Form - Glassmorphism Card */}
      <div className="relative">
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/50 to-white/30 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl"></div>
        
        {/* Form Content */}
        <div className="relative p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Form Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Name Field - Enhanced */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-lg">Participant Name</span>
                      {name && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      )}
                    </label>
                    
                    <div className="relative group/input">
                      <input
                        type="text"
                        className={`w-full px-6 py-4 bg-white/80 backdrop-blur-sm border-2 rounded-2xl focus:outline-none transition-all duration-300 text-gray-900 placeholder-gray-500 shadow-lg hover:shadow-xl ${
                          formErrors.name
                            ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
                            : name
                            ? 'border-green-400 focus:border-green-500 focus:ring-4 focus:ring-green-500/20'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                        }`}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Enter participant's full name"
                      />
                      
                      {/* Floating validation indicator */}
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        {formErrors.name ? (
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        ) : name ? (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center opacity-50">
                            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {formErrors.name && (
                      <p className="mt-2 text-sm text-red-600 flex items-center space-x-2 animate-fade-in-up">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span>{formErrors.name}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Role Field - Enhanced */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                        </svg>
                      </div>
                      <span className="text-lg">Role</span>
                      {role && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      )}
                    </label>
                    
                    <div className="relative">
                      <select
                        aria-label="Select participant role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-6 py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 text-gray-900 shadow-lg hover:shadow-xl cursor-pointer"
                      >
                        <option value="student">🎓 Student</option>
                        <option value="teacher">👨‍🏫 Teacher</option>
                      </select>
                      
                      {/* Role indicator */}
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section Field - Enhanced with conditional animation */}
                {role === "student" && (
                  <div className="group relative animate-fade-in-up">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <span className="text-lg">Section</span>
                        {section && (
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        )}
                      </label>
                      
                      <div className="relative">
                        <select
                          aria-label="Select student section"
                          value={section}
                          onChange={(e) => setSection(e.target.value)}
                          className="w-full px-6 py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all duration-300 text-gray-900 shadow-lg hover:shadow-xl cursor-pointer"
                        >
                          {sections.map((sec) => (
                            <option key={sec} value={sec}>
                              {sec.charAt(0).toUpperCase() + sec.slice(1)}
                            </option>
                          ))}
                        </select>
                        
                        {/* Section indicator */}
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Competitions */}
              <div className="space-y-6">
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-lg">Competitions</span>
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {competition.length} selected
                      </span>
                    </label>
                    
                    {/* Competition Grid */}
                    <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto custom-scrollbar">
                      {competitions.map((comp, index) => (
                        <label
                          key={comp}
                          className={`group/item relative flex items-center p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
                            competition.includes(comp)
                              ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-300 shadow-lg'
                              : 'bg-white/80 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                          }`}
                        >
                          {/* Checkbox */}
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
                            className="w-6 h-6 text-orange-500 border-2 border-gray-300 rounded-lg focus:ring-orange-500 focus:ring-2 transition-all"
                          />
                          
                          {/* Competition Name */}
                          <span className="ml-4 text-gray-700 group-hover/item:text-orange-700 transition-colors capitalize font-medium flex-1">
                            {comp}
                          </span>
                          
                          {/* Status Indicator */}
                          <div className="ml-auto">
                            {competition.includes(comp) ? (
                              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center group-hover/item:bg-orange-100 transition-colors">
                                <svg className="w-4 h-4 text-gray-400 group-hover/item:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                    
                    {/* Competition Summary */}
                    {competition.length > 0 && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl shadow-lg animate-fade-in-up">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className="text-lg font-bold text-orange-700">
                            Selected Competitions ({competition.length})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {competition.map((comp) => (
                            <span
                              key={comp}
                              className="px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 text-sm rounded-full border-2 border-orange-200 font-medium animate-fade-in-up"
                            >
                              {comp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {formErrors.competition && (
                      <p className="mt-2 text-sm text-red-600 flex items-center space-x-2 animate-fade-in-up">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span>{formErrors.competition}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Participant ID Preview - Enhanced */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-3xl p-6 border-2 border-blue-200 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1">Generated Participant ID</h3>
                      <p className="text-gray-600">This unique ID will be automatically assigned</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="relative">
                      <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent bg-white px-6 py-3 rounded-xl shadow-lg border-2 border-white">
                        {generateId()}
                      </div>
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Auto-generated • Unique</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Enhanced */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8">
              <button
                type="button"
                onClick={() => {
                  setName("");
                  setRole("student");
                  setSection("nursery");
                  setCompetition([]);
                  setFormErrors({});
                  setCurrentStep(1);
                }}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-2xl hover:from-gray-200 hover:to-gray-300 transition-colors duration-200 font-bold border-2 border-gray-300 hover:border-gray-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <span className="text-lg">Reset Form</span>
                </div>
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 px-8 py-4 rounded-2xl font-bold shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white hover:shadow-xl focus:ring-purple-400'
                }`}
              >
                <div className="flex items-center justify-center space-x-3">
                  {isSubmitting ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-lg">Saving...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <span className="text-lg">Add Participant</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
