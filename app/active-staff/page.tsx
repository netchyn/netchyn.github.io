"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronDown,
  Users,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

// --- CONSTANTS & CONFIG ---
const ROLES = ["frontdesk", "spa", "admin", "engineering"];

const ROLE_COLORS: Record<string, string> = {
  frontdesk: "#ef4444", // Red
  spa: "#22c55e", // Green
  admin: "#3b82f6", // Blue
  engineering: "#f59e0b", // Orange
};

const REPORT_TYPES = [
  "Message Handling",
  "Message Peak Hours",
  "Service Request Summary",
  "Active Staff Report",
];

const DATE_RANGES = ["Today", "Last 7 Days", "This Month"];

// --- MOCK DATA GENERATOR ---
// จำลองข้อมูลประจำเดือน (เช่น ตุลาคม 2026)
const generateDailyStats = () => {
  const data = [];
  for (let i = 1; i <= 30; i++) {
    data.push({
      date: `Oct ${i}, 2026`,
      dayNum: i,
      "Number of Staff": Math.floor(Math.random() * 8) + 1, // สุ่ม 1-8 คนต่อวัน
    });
  }
  return data;
};

const generateStaffLogs = () => {
  const names = [
    "Somchai K.",
    "Somsri J.",
    "Mana P.",
    "Wichai T.",
    "Napa W.",
    "Piti R.",
    "Chujai M.",
    "Manee N.",
  ];
  const data = [];

  for (let i = 1; i <= 50; i++) {
    const role = ROLES[Math.floor(Math.random() * ROLES.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    // สุ่มวันที่ในเดือนตุลาคม 2026
    const day = Math.floor(Math.random() * 30) + 1;
    const hour = Math.floor(Math.random() * 24);
    const min = Math.floor(Math.random() * 60);

    // สร้าง String วันที่ให้อ่านง่าย
    const dateStr = `Oct ${day.toString().padStart(2, "0")}, 2026, ${hour
      .toString()
      .padStart(2, "0")}:${min.toString().padStart(2, "0")}`;

    data.push({
      id: `staff-${i}`,
      name: name,
      email: `${name.split(" ")[0].toLowerCase()}@hotel.com`,
      role: role,
      lastActiveStr: dateStr,
      // ค่าตัวเลขสำหรับใช้เรียงลำดับ (Sort)
      timestamp: new Date(`2026-10-${day}T${hour}:${min}:00`).getTime(),
      dayNum: day,
    });
  }
  return data.sort((a, b) => b.timestamp - a.timestamp);
};

const rawDailyStats = generateDailyStats();
const rawStaffLogs = generateStaffLogs();

// --- CUSTOM CHECKBOX DROPDOWN COMPONENT ---
const CheckboxDropdown = ({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOptionClick = (option: string) => {
    if (selected.length === 0) {
      onChange([option]);
    } else if (selected.includes(option)) {
      const newSelected = selected.filter((item) => item !== option);
      onChange(newSelected);
    } else {
      onChange([...selected, option]);
    }
  };

  const handleAllClick = () => onChange([]);

  const displayText =
    selected.length === 0
      ? `All ${label}s`
      : selected.length === 1
      ? selected[0].length > 15
        ? `${selected[0].substring(0, 15)}...`
        : selected[0]
      : `${selected.length} Selected`;

  return (
    <div className="w-48 relative" ref={dropdownRef}>
      <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white border border-slate-200 text-sm text-slate-700 py-2 pl-3 pr-3 rounded cursor-pointer hover:border-slate-300 transition"
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 top-[100%] left-0 mt-1 w-[240px] bg-white border border-slate-200 rounded shadow-lg max-h-60 overflow-y-auto">
          <div
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100"
            onClick={handleAllClick}
          >
            <input
              type="checkbox"
              checked={selected.length === 0}
              readOnly
              className="cursor-pointer w-4 h-4 accent-[#1e293b]"
            />
            <span className="text-sm font-medium text-slate-700">
              All {label}s
            </span>
          </div>
          {options.map((opt) => (
            <div
              key={opt}
              className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer"
              onClick={() => handleOptionClick(opt)}
            >
              <input
                type="checkbox"
                checked={selected.length > 0 && selected.includes(opt)}
                readOnly
                className="cursor-pointer w-4 h-4 accent-[#1e293b]"
              />
              <span className="text-sm text-slate-700 capitalize">{opt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function ActiveStaffReportPage() {
  const [currentDate, setCurrentDate] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [reportType, setReportType] = useState("Active Staff Report");
  const [dateRange, setDateRange] = useState("This Month");
  const [filters, setFilters] = useState<{ roles: string[] }>({ roles: [] });

  // ระบบ SORT สำหรับตาราง
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc" | null;
  }>({
    key: "",
    direction: null,
  });

  useEffect(() => {
    setIsMounted(true);
    setCurrentDate(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  // กรองกราฟแท่ง (Bar Chart) ตามมุมมองสัปดาห์/เดือน
  const filteredDailyStats = useMemo(() => {
    // จำลองวันปัจจุบันคือวันที่ 30 ของเดือน
    const currentDay = 30;
    let startDay = 1;

    if (dateRange === "Today") startDay = currentDay;
    else if (dateRange === "Last 7 Days") startDay = currentDay - 6;

    return rawDailyStats.filter(
      (d) => d.dayNum >= startDay && d.dayNum <= currentDay
    );
  }, [dateRange]);

  // กรองข้อมูลสตาฟ (Table & Pie Chart)
  const filteredStaffLogs = useMemo(() => {
    const currentDay = 30;
    let startDay = 1;

    if (dateRange === "Today") startDay = currentDay;
    else if (dateRange === "Last 7 Days") startDay = currentDay - 6;

    return rawStaffLogs.filter((row) => {
      const matchDate = row.dayNum >= startDay && row.dayNum <= currentDay;
      const matchRole =
        filters.roles.length === 0 || filters.roles.includes(row.role);
      return matchDate && matchRole;
    });
  }, [dateRange, filters]);

  // เตรียมข้อมูลสำหรับ Pie Chart
  const pieData = useMemo(() => {
    const roleCounts: Record<string, number> = {};
    filteredStaffLogs.forEach((log) => {
      roleCounts[log.role] = (roleCounts[log.role] || 0) + 1;
    });

    return Object.entries(roleCounts).map(([role, count]) => ({
      name: role,
      value: count,
    }));
  }, [filteredStaffLogs]);

  // ประมวลผลและเรียงลำดับตาราง
  const tableData = useMemo(() => {
    let sortedArray = [...filteredStaffLogs];

    if (sortConfig.direction) {
      sortedArray.sort((a: any, b: any) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (typeof valA === "string" && typeof valB === "string") {
          return sortConfig.direction === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return sortedArray.map((row, index) => ({
      order: index + 1,
      ...row,
    }));
  }, [filteredStaffLogs, sortConfig]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    else if (sortConfig.key === key && sortConfig.direction === "desc")
      direction = null;
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key || !sortConfig.direction) {
      return <ArrowUpDown size={14} className="inline ml-1 text-slate-300" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp size={14} className="inline ml-1 text-slate-700" />
    ) : (
      <ArrowDown size={14} className="inline ml-1 text-slate-700" />
    );
  };

  const resetFilters = () => {
    setDateRange("This Month");
    setFilters({ roles: [] });
  };

  // --- EXPORT FUNCTIONS ---
  const exportCSV = () => {
    const headers = ["Order", "Name", "Email", "Role", "Last Active Time"];
    const rows = tableData.map((row) => [
      row.order,
      row.name,
      row.email,
      row.role,
      row.lastActiveStr,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((item) => `"${item}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Active_Staff_Report_${currentDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = async () => {
    setIsExporting(true);
    const element = document.getElementById("pdf-export-area");

    if (element) {
      try {
        const originalOverflow = element.style.overflow;
        const originalHeight = element.style.height;

        element.style.overflow = "visible";
        element.style.height = "auto";

        const canvasWidth = element.scrollWidth;
        const canvasHeight = element.scrollHeight;

        const imgData = await toPng(element, {
          quality: 1,
          pixelRatio: 2,
          backgroundColor: "#f8fafc",
          width: canvasWidth,
          height: canvasHeight,
          filter: (node) => {
            if (node instanceof HTMLElement) {
              return node.dataset.html2canvasIgnore !== "true";
            }
            return true;
          },
        });

        element.style.overflow = originalOverflow;
        element.style.height = originalHeight;

        const pdfWidth = 210;
        const pdfHeight = (canvasHeight * pdfWidth) / canvasWidth;

        const pdf = new jsPDF({
          orientation: "p",
          unit: "mm",
          format: [pdfWidth, pdfHeight],
        });
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Active_Staff_Report_${currentDate}.pdf`);
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    }
    setIsExporting(false);
  };

  if (!isMounted) return null;

  // หาข้อมูลสรุป (Unique Staff count)
  const uniqueStaffCount = new Set(filteredStaffLogs.map((log) => log.name))
    .size;

  return (
    <div
      id="pdf-export-area"
      className="flex flex-col h-full overflow-y-auto bg-[#f8fafc]"
    >
      {/* PAGE HEADER */}
      <div className="px-8 pt-8 pb-4">
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase mb-1 min-h-[16px]">
              STAFF ANALYTICS {currentDate ? `· ${currentDate}` : ""}
            </p>
            <h1 className="text-3xl font-bold text-[#0f172a] uppercase tracking-tight">
              Active Staff Report
            </h1>
          </div>

          {/* EXPORT DROPDOWN */}
          <div className="relative" data-html2canvas-ignore="true">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="px-6 py-2.5 bg-[#1e293b] text-white text-sm font-medium rounded shadow-sm hover:bg-slate-800 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isExporting ? "GENERATING..." : "EXPORT DATA"}
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${
                  showExportMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded shadow-lg z-50 overflow-hidden">
                <button
                  onClick={() => {
                    exportPDF();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  Export as PDF
                </button>
                <button
                  onClick={() => {
                    exportCSV();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition border-t border-slate-100"
                >
                  Export as CSV
                </button>
              </div>
            )}
          </div>
        </div>

        {/* FILTERS SECTION */}
        <div
          className="flex flex-wrap gap-4 items-end mb-4 pb-4 border-b border-slate-200"
          data-html2canvas-ignore="true"
        >
          {/* Report Type Dropdown */}
          <div className="w-56">
            <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Report Type
            </label>
            <div className="relative">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 text-sm text-slate-700 py-2 pl-3 pr-8 rounded focus:outline-none focus:border-slate-400"
              >
                {REPORT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Date Range Dropdown (Week/Month View Control) */}
          <div className="w-40">
            <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Date Range
            </label>
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 text-sm text-slate-700 py-2 pl-3 pr-8 rounded focus:outline-none focus:border-slate-400"
              >
                {DATE_RANGES.map((dr) => (
                  <option key={dr} value={dr}>
                    {dr}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Role Filter */}
          <CheckboxDropdown
            label="Role"
            options={ROLES}
            selected={filters.roles}
            onChange={(val) => setFilters({ roles: val })}
          />

          <button
            onClick={resetFilters}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition py-2 px-2"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="px-8 pb-12 space-y-6">
        {/* TOP SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
            <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 tracking-widest uppercase mb-4">
              <Users size={14} /> Total Active Staff
            </p>
            <div>
              <p className="text-5xl font-bold text-[#0f172a] mb-2">
                {uniqueStaffCount}
              </p>
              <p className="text-sm text-slate-500 font-medium print:hidden">
                Unique staff members logged in
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
            <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 tracking-widest uppercase mb-4">
              <FileText size={14} /> Total Log Records
            </p>
            <div>
              <p className="text-5xl font-bold text-[#0f172a] mb-2">
                {filteredStaffLogs.length}
              </p>
              <p className="text-sm text-slate-500 font-medium print:hidden">
                Selected period
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
            <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 tracking-widest uppercase mb-4">
              <Clock size={14} /> Selected View
            </p>
            <div>
              <p className="text-4xl font-bold text-[#22c55e] mb-2">
                {dateRange}
              </p>
              <p className="text-sm text-slate-500 font-medium print:hidden">
                Affects charts & table below
              </p>
            </div>
          </div>
        </div>

        {/* CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* BAR CHART: DAILY ACTIVE STAFF */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col page-break-inside-avoid">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-[11px] font-semibold text-slate-800 tracking-widest uppercase">
                Daily Active Staff - {dateRange}
              </h3>
            </div>
            <div className="p-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredDailyStats}
                  margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: "12px",
                      color: "#64748b",
                      paddingTop: "20px",
                    }}
                  />
                  <Bar
                    dataKey="Number of Staff"
                    fill="#4ade80"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PIE CHART: ACTIVE STAFF BY ROLES */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col page-break-inside-avoid">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-[11px] font-semibold text-slate-800 tracking-widest uppercase">
                Active Staff By Roles - {dateRange}
              </h3>
            </div>
            <div className="p-6 h-80 flex flex-col items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ percent = 0 }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={ROLE_COLORS[entry.name] || "#cbd5e1"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "4px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 text-sm">
                  No role data for selected filters.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* DATA TABLE: STAFF LAST ACTIVE TIME */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden page-break-inside-avoid">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-[11px] font-semibold text-slate-800 tracking-widest uppercase">
              Staff Last Active Time
            </h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
              Showing logs for: {dateRange}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-slate-500 bg-white">
                <tr>
                  <th className="px-6 py-3 font-normal text-xs uppercase tracking-wider w-16">
                    No.
                  </th>
                  <th
                    className="px-6 py-3 font-normal text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-50 select-none"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Name {getSortIcon("name")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 font-normal text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-50 select-none"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center gap-1">
                      Email {getSortIcon("email")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 font-normal text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-50 select-none"
                    onClick={() => handleSort("role")}
                  >
                    <div className="flex items-center gap-1">
                      Role {getSortIcon("role")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 font-normal text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-50 select-none"
                    onClick={() => handleSort("timestamp")}
                  >
                    <div className="flex items-center gap-1">
                      Last Active Time {getSortIcon("timestamp")}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#0f172a]">
                {tableData.length > 0 ? (
                  tableData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-slate-500">{row.order}</td>
                      <td className="px-6 py-4 font-medium">{row.name}</td>
                      <td className="px-6 py-4 text-slate-500">{row.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border"
                          style={{
                            backgroundColor: `${ROLE_COLORS[row.role]}15`, // ใส่ opacity ให้พื้นหลัง
                            color: ROLE_COLORS[row.role],
                            borderColor: `${ROLE_COLORS[row.role]}30`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: ROLE_COLORS[row.role] }}
                          ></span>
                          <span className="capitalize">{row.role}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                        {row.lastActiveStr}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      No staff activity found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
