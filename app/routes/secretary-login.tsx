import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import { supabase } from "~/utils/supabase.client";

export async function loader({ request }: LoaderFunctionArgs) {
  // Simple loader that returns empty data - required by Remix for GET requests
  return json({});
}

interface Church {
  id: string;
  church_name: string;
  church_place: string;
  created_at: string;
}

interface LoginForm {
  name: string;
  phone: string;
  church_id: string;
}

export default function SecretaryLogin() {
  const navigate = useNavigate();
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(false);
  const [churchesLoading, setChurchesLoading] = useState(true);
  const [formData, setFormData] = useState<LoginForm>({
    name: "",
    phone: "",
    church_id: ""
  });
  const [errors, setErrors] = useState<Partial<LoginForm>>({});
  const [returningSec, setReturningSec] = useState<{name: string, church: string} | null>(null);

  // Check if this phone number corresponds to an existing secretary
  const checkExistingSecretary = async (phone: string) => {
    if (phone.length === 10) {
      try {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id, name, phone, church_id")
          .eq("phone", phone)
          .single();

        if (existingProfile) {
          // Get church details
          const church = churches.find(c => c.id === existingProfile.church_id);
          if (church) {
            setReturningSec({
              name: existingProfile.name,
              church: `${church.church_name} - ${church.church_place}`
            });
            // Auto-fill the form
            setFormData(prev => ({
              ...prev,
              name: existingProfile.name,
              church_id: existingProfile.church_id
            }));
          }
        } else {
          setReturningSec(null);
        }
      } catch (error) {
        // Ignore errors, just don't show returning secretary info
        setReturningSec(null);
      }
    } else {
      setReturningSec(null);
    }
  };

  // Fetch churches on component mount
  useEffect(() => {
    fetchChurches();
    
    // Clear any existing authentication to ensure fresh login
    localStorage.removeItem("secretary_login");
    localStorage.removeItem("organizer_login");
    console.log("🧹 Cleared existing authentication for fresh login");
  }, []);

  const fetchChurches = async () => {
    try {
      setChurchesLoading(true);
      console.log("=== FETCHING CHURCHES ===");
      console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
      console.log("Supabase Key exists:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);
      
      const { data, error } = await supabase
        .from("Church")
        .select("id, church_name, church_place, created_at")
        .order("church_name", { ascending: true });

      console.log("Churches fetch result:", { data, error });

      if (error) {
        console.error("Error fetching churches:", error);
        alert(`Failed to load churches: ${error.message}`);
      } else {
        setChurches(data || []);
        console.log("Churches loaded successfully:", data?.length || 0);
      }
    } catch (err) {
      console.error("Fetch churches error:", err);
      alert("Failed to load churches. Please refresh the page.");
    } finally {
      setChurchesLoading(false);
    }
  };

  const testSupabaseConnection = async () => {
    console.log("=== TESTING SUPABASE CONNECTION ===");
    try {
      const { data, error } = await supabase
        .from("Church")
        .select("count", { count: "exact", head: true });
      
      console.log("Connection test result:", { data, error });
      if (error) {
        alert(`Connection failed: ${error.message}`);
      } else {
        alert("Supabase connection successful!");
      }
    } catch (err) {
      console.error("Connection test error:", err);
      alert("Connection test failed!");
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginForm> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit mobile number";
    }

    if (!formData.church_id) {
      newErrors.church_id = "Please select a church";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LoginForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Check for existing secretary when phone number is entered
    if (field === "phone" && churches.length > 0) {
      checkExistingSecretary(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("=== FORM SUBMISSION STARTED ===");
    console.log("Form data:", formData);
    
    if (!validateForm()) {
      console.log("Validation failed");
      return;
    }

    setLoading(true);
    console.log("Loading state set to true");

    try {
      console.log("Submitting login form:", formData);
      console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
      console.log("Supabase Key exists:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);
      
      // Get selected church details
      console.log("Looking for church with ID:", formData.church_id);
      console.log("Available churches:", churches.map(c => ({ id: c.id, name: c.church_name })));
      
      const selectedChurch = churches.find(c => String(c.id) === String(formData.church_id));
      
      if (!selectedChurch) {
        console.error("Selected church not found");
        alert("Selected church not found. Please try again.");
        setLoading(false);
        return;
      }

      console.log("Selected church:", selectedChurch);

      // FIRST: Check if profile already exists for this phone number
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id, name, phone, church_id")
        .eq("phone", formData.phone)
        .single();

      console.log("Existing profile check:", { existingProfile, checkError });

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is "not found" error, which is expected for new users
        console.error("Error checking existing profile:", checkError);
        alert(`Error checking profile: ${checkError.message}`);
        setLoading(false);
        return;
      }

      let existingChurchSecretary = null;

      // SECOND: Check if there's already a different secretary for this church (only for new users or church switchers)
      if (!existingProfile || existingProfile.church_id !== formData.church_id) {
        console.log("Checking church secretary availability for new/switching user");
        
        const { data: churchSecretary, error: churchCheckError } = await supabase
          .from("profiles")
          .select("id, name, phone, church_id")
          .eq("church_id", formData.church_id)
          .single();

        console.log("Church secretary check:", { churchSecretary, churchCheckError });

        // Handle church secretary check errors
        if (churchCheckError && churchCheckError.code !== "PGRST116") {
          console.error("Error checking church secretary:", churchCheckError);
          alert(`Error checking church secretary: ${churchCheckError.message}`);
          setLoading(false);
          return;
        }

        existingChurchSecretary = churchSecretary;

        // Check if there's already a different secretary for this church
        if (existingChurchSecretary && existingChurchSecretary.phone !== formData.phone) {
          console.log("❌ Church already has a different secretary:", existingChurchSecretary);
          alert(`❌ Church Policy Violation\n\nThis church already has a registered secretary:\n• Name: ${existingChurchSecretary.name}\n• Phone: ${existingChurchSecretary.phone}\n\n🔒 Only ONE secretary per church is allowed.\n\nIf you are the authorized secretary for this church, please contact the administrator.`);
          setLoading(false);
          return;
        }
      } else {
        console.log("✅ Returning secretary for the same church - allowing direct login");
      }

      let profileData;

      if (existingProfile) {
        console.log("✅ Existing secretary found - processing login...");
        
        // Check if user is trying to switch to a different church
        if (existingProfile.church_id !== formData.church_id) {
          console.log("⚠️ Secretary trying to switch churches");
          
          // Check if the new church already has a secretary
          if (existingChurchSecretary && existingChurchSecretary.phone !== formData.phone) {
            console.log("❌ Cannot switch - target church already has a secretary");
            alert(`❌ Cannot Switch Churches\n\nYou cannot switch to ${selectedChurch.church_name} because it already has a registered secretary:\n• Name: ${existingChurchSecretary.name}\n• Phone: ${existingChurchSecretary.phone}\n\n🔒 Only ONE secretary per church is allowed.`);
            setLoading(false);
            return;
          }
          
          console.log("✅ Switching churches - updating profile");
        } else {
          console.log("✅ Same church - welcome back!");
        }
        
        // Update existing profile (handles both name updates and church switches)
        const { data, error: updateError } = await supabase
          .from("profiles")
          .update({
            name: formData.name,
            church_id: formData.church_id
          })
          .eq("id", existingProfile.id)
          .select()
          .single();

        if (updateError) {
          console.error("❌ Error updating profile:", updateError);
          alert("Failed to update profile. Please try again.");
          setLoading(false);
          return;
        }
        
        profileData = data;
        console.log("✅ Profile updated successfully:", profileData);
      } else {
        console.log("🆕 New secretary registration...");
        
        // Ensure the church doesn't already have a secretary (should already be checked above)
        if (existingChurchSecretary) {
          console.log("❌ Blocking new registration - church already has secretary");
          alert(`❌ Registration Blocked\n\nThis church already has a registered secretary:\n• Name: ${existingChurchSecretary.name}\n• Phone: ${existingChurchSecretary.phone}\n\n🔒 Only ONE secretary per church is allowed.`);
          setLoading(false);
          return;
        }
        
        // Create new profile
        const { data, error: insertError } = await supabase
          .from("profiles")
          .insert([{
            name: formData.name,
            phone: formData.phone,
            church_id: formData.church_id
          }])
          .select()
          .single();

        if (insertError) {
          console.error("❌ Error creating profile:", insertError);
          alert("Failed to create profile. Please try again.");
          setLoading(false);
          return;
        }
        
        profileData = data;
        console.log("✅ Profile created successfully:", profileData);
      }

      // Store login info in localStorage for now (in production, use proper auth)
      const loginData = {
        id: profileData.id,
        name: formData.name,
        phone: formData.phone,
        church: selectedChurch.church_name,
        church_place: selectedChurch.church_place,
        church_id: formData.church_id,
        loginTime: new Date().toISOString(),
        isReturningSecretary: !!existingProfile // Track if this is a returning secretary
      };

      localStorage.setItem("secretary_login", JSON.stringify(loginData));
      console.log("✅ Login successful:", loginData);
      
      // Show appropriate welcome message
      if (existingProfile) {
        console.log("🎉 Welcome back, returning secretary!");
      } else {
        console.log("🎉 Welcome, new secretary!");
      }
      
      // Redirect to secretary dashboard
      navigate("/secretary/dashboard");
      
    } catch (err) {
      console.error("Login error:", err);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedChurch = churches.find(c => c.id === formData.church_id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{animationDelay: "2s"}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{animationDelay: "4s"}}></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 p-8 text-center">
            <div className="relative">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Secretary Login</h1>
              <p className="text-white/90 text-sm">Access your church management dashboard</p>
              <p className="text-white/70 text-xs mt-2">⚠️ One secretary per church only</p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Input */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter your full name"
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                      errors.name 
                        ? "border-red-300 focus:ring-red-500 bg-red-50" 
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Phone Input */}
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                      errors.phone 
                        ? "border-red-300 focus:ring-red-500 bg-red-50" 
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.phone}
                  </p>
                )}
                
                {/* Returning Secretary Detection */}
                {returningSec && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">Welcome Back!</h3>
                        <div className="mt-1 text-sm text-green-700">
                          <p>Found existing account for <strong>{returningSec.name}</strong></p>
                          <p>Church: <strong>{returningSec.church}</strong></p>
                          <p className="text-xs mt-1">✅ Form auto-filled - Click login to continue</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Church Selection */}
              <div className="space-y-2">
                <label htmlFor="church" className="block text-sm font-semibold text-gray-700">
                  Select Church
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <select
                    id="church"
                    value={formData.church_id}
                    onChange={(e) => handleInputChange("church_id", e.target.value)}
                    disabled={churchesLoading}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 appearance-none ${
                      errors.church_id 
                        ? "border-red-300 focus:ring-red-500 bg-red-50" 
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    } ${churchesLoading ? "bg-gray-100" : ""}`}
                  >
                    <option value="">
                      {churchesLoading ? "Loading churches..." : "Choose your church"}
                    </option>
                    {churches.map((church) => (
                      <option key={church.id} value={church.id}>
                        {church.church_name} - {church.church_place}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.church_id && (
                  <p className="text-red-500 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.church_id}
                  </p>
                )}
                
                {selectedChurch && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Selected:</span> {selectedChurch.church_name}
                      <br />
                      <span className="font-medium">Location:</span> {selectedChurch.church_place}
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || churchesLoading}
                className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Logging in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Login to Dashboard</span>
                  </div>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Secure Login</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Trusted Platform</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Church Registration Management System
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl font-bold text-blue-600">{churches.length}</div>
            <div className="text-xs text-gray-600">Churches</div>
          </div>
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl font-bold text-green-600">99.9%</div>
            <div className="text-xs text-gray-600">Uptime</div>
          </div>
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl font-bold text-purple-600">24/7</div>
            <div className="text-xs text-gray-600">Support</div>
          </div>
        </div>
      </div>
    </div>
  );
}
