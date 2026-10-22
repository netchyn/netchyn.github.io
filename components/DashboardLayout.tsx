"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  MessageSquare,
  LayoutDashboard,
  Briefcase,
  Map,
  Layers,
  Building2,
  Users,
  Link2,
  Settings,
  History,
  ChevronsLeft,
  Search,
  Command,
} from "lucide-react";

const SIDEBAR_TOP_ITEMS = [
  //   { icon: LayoutDashboard, label: "Home", route: "/" },
  { icon: MessageSquare, label: "Chat dashboard", route: "/chat-1" },
  { icon: MessageSquare, label: "Chat 2", route: "/chat-2" }, // เปลี่ยนเป็น /chat-2 ตามที่คุยกัน
  //   { icon: Map, label: "Request mapping", route: "/mapping" },
];

const SIDEBAR_ADMIN_ITEMS = [
  { icon: Layers, label: "Overview", route: "/overview" },
  { icon: Building2, label: "Organizations", route: "/orgs" },
  { icon: Users, label: "Staff", route: "/staff" },
  { icon: Link2, label: "Integrations", route: "/integrations" },
  { icon: Settings, label: "Settings", route: "/settings" },
  { icon: History, label: "Audit", route: "/audit" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname(); // ใช้เช็คว่าอยู่หน้าไหนใน Next.js

  const NavItem = ({ icon: Icon, label, route }: any) => {
    const isActive = pathname === route; // เช็คจาก URL จริง
    return (
      <Link
        href={route}
        onClick={() => setIsSidebarOpen(false)}
        className={`w-full flex items-center gap-3 px-4 py-2 mb-0.5 transition-colors text-sm ${
          isActive
            ? "bg-[#1e293b] text-white border-l-2 border-white"
            : "text-slate-400 hover:text-white hover:bg-slate-800/50 border-l-2 border-transparent"
        }`}
      >
        <Icon
          size={18}
          className={isActive ? "text-white" : "text-slate-500"}
        />
        {label}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed md:static inset-y-0 left-0 z-30 w-64 bg-[#0f172a] text-slate-300 flex flex-col transition-transform duration-300
        ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }
      `}
      >
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mb-0.5">
                Minor Hotels
              </p>
              <h2 className="text-xl font-bold text-white tracking-tight leading-none mb-1">
                RoomsChat
              </h2>
              <p className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
                Staff Portal
              </p>
            </div>
            <button
              className="md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <ChevronsLeft size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="mb-6">
            {SIDEBAR_TOP_ITEMS.map((item, idx) => (
              <NavItem key={idx} {...item} />
            ))}
          </div>
          {/* <div>
            <p className="px-6 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3 mt-6">
              Admin
            </p>
            {SIDEBAR_ADMIN_ITEMS.map((item, idx) => (
              <NavItem key={idx} {...item} />
            ))}
          </div> */}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-md hover:bg-slate-100"
            >
              <Menu size={20} className="text-slate-600" />
            </button>
            <div className="hidden md:flex items-center text-sm">
              <span className="text-slate-800 font-medium">
                Minor Hotels Group
              </span>
              <span className="text-slate-400 mx-2">/</span>
              <span className="text-slate-500">All brands · global scope</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center bg-slate-100 rounded-md px-3 py-1.5 text-sm w-72 border border-slate-200">
              <Search size={16} className="text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Search hotels, staff, actions"
                className="bg-transparent border-none outline-none flex-1 placeholder:text-slate-400 text-slate-700"
              />
              <div className="flex items-center text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-medium shadow-sm">
                <Command size={10} className="mr-0.5" /> K
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium text-slate-800 leading-none mb-1">
                  Global Admin
                </span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider leading-none">
                  Group Admin
                </span>
              </div>
              <div className="h-9 w-9 bg-[#1e293b] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                G
              </div>
            </div>
          </div>
        </header>

        {/* View Renderer (เปลี่ยนจาก State มาเป็น Render Children แทน) */}
        <main className="flex-1 overflow-hidden relative">{children}</main>
      </div>
    </div>
  );
}
