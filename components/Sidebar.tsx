"use client"; // จำเป็นถ้ามีการใช้ useState หรือรับ props ที่เกี่ยวกับ interaction
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Menu, X, LayoutDashboard } from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname(); // เอาไว้เช็คว่าอยู่หน้าไหน จะได้ทำไฮไลต์

  const menuItems = [
    { name: "Home", path: "/", icon: <Home size={20} /> },
    {
      name: "Chat Dashboard",
      path: "/chat-1",
      icon: <LayoutDashboard size={20} />,
    },
    { name: "Chat 2", path: "/chat-2", icon: <MessageSquare size={20} /> },
  ];

  return (
    <div
      className={`bg-[#1c2434] text-[#8a99af] h-screen transition-all duration-300 flex flex-col ${
        isOpen ? "w-64" : "w-16"
      }`}
    >
      <div className="flex items-center justify-between p-4 mb-4">
        {isOpen && (
          <div className="text-white font-bold text-xl leading-tight">
            RoomsChat
            <br />
            <span className="text-xs font-normal text-gray-400">
              STAFF PORTAL
            </span>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white hover:text-gray-300"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? "bg-[#333a48] text-white"
                  : "hover:bg-[#333a48] hover:text-white"
              }`}
            >
              <div className={isActive ? "text-white" : ""}>{item.icon}</div>
              {isOpen && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
