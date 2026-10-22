import { Search } from "lucide-react";

export default function TopNav() {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center text-sm text-gray-500">
        <span className="font-semibold text-gray-900 mr-2">
          Minor Hotels Group
        </span>
        / All brands • global scope
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search hotels, staff, actions..."
            className="pl-9 pr-4 py-2 bg-gray-100 border-none rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
        <div className="flex items-center gap-3 border-l pl-4 ml-2 border-gray-200">
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">
              Global Admin
            </div>
            <div className="text-xs text-gray-500 uppercase">Group Admin</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#1c2434] text-white flex items-center justify-center font-bold">
            G
          </div>
        </div>
      </div>
    </header>
  );
}
