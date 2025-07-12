import { Link } from "@remix-run/react";

export default function SecretaryIndex() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
          Secretary Portal
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Welcome to the Church Registration System Secretary Portal
        </p>
        <div className="space-y-4">
          <Link
            to="/secretary/dashboard"
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition block text-center"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/"
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition block text-center"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
