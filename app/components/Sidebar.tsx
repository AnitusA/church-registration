interface Secretary {
  name: string;
  email?: string;
  church?: string;
}

interface SidebarProps {
  secretary: Secretary;
  close: () => void;
}

export default function Sidebar({ secretary, close }: SidebarProps) {
  return (
    <div className="fixed top-0 right-0 w-72 h-full bg-white shadow-lg z-50 p-6 flex flex-col">
      <div className="flex justify-end">
        <button
          onClick={close}
          className="text-gray-600 hover:text-red-600 text-2xl"
          aria-label="Close Sidebar"
        >
          ×
        </button>
      </div>

      {/* Profile */}
      <div className="flex flex-col items-center mt-10 space-y-2">
        <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold">
          {secretary.name[0].toUpperCase()}
        </div>
        <h2 className="text-lg font-semibold text-gray-800">{secretary.name}</h2>
        <p className="text-sm text-gray-600 text-center px-2 break-words">
          {secretary.church}
        </p>
      </div>
    </div>
  );
}
