import { useEffect } from "react";
import { useNavigate } from "@remix-run/react";

export default function OrganizerIndex() {
  const navigate = useNavigate();

  useEffect(() => {
    const secretaryLogin = localStorage.getItem("secretary_login");
    
    // Clear secretary login when accessing organizer routes (role switch)
    if (secretaryLogin) {
      console.log("Clearing secretary login to allow organizer access");
      localStorage.removeItem("secretary_login");
    }
    
    // Always redirect to organizer login (force login flow)
    console.log("Redirecting to organizer login page");
    navigate("/organizer-login");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Checking access permissions...</p>
      </div>
    </div>
  );
}
