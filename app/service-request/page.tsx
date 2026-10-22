"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { ChevronDown, Inbox, TrendingDown, TrendingUp } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

// --- CONSTANTS & CONFIG ---
const MONTHS = ["Jan 2026", "Feb 2026", "Mar 2026"];
const SERVICES = [
  "Laundry Pickup",
  "Request",
  "Turndown",
  "House Keeping",
  "Wake Up Call",
  "Tray Pickup",
  "Grab My Bag",
];

const SERVICE_COLORS: Record<string, string> = {
  "Laundry Pickup": "#a855f7", // Purple
  Request: "#ef4444", // Red
  Turndown: "#f59e0b", // Amber/Yellow
  "House Keeping": "#84cc16", // Lime Green
  "Wake Up Call": "#3b82f6", // Blue
  "Tray Pickup": "#06b6d4", // Cyan
  "Grab My Bag": "#8b5cf6", // Violet
};

// --- HELPER FUNCTIONS ---
const formatHHMMSS = (totalSeconds: number | null | undefined) => {
  if (
    totalSeconds === null ||
    totalSeconds === undefined ||
    isNaN(totalSeconds)
  )
    return "";
  if (totalSeconds === 0) return "00:00:00";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
};

// ทำให้ข้อมูลคงที่เสมอเมื่อ Refresh (Pseudo-random generator)
let seed = 42;
const pseudoRandom = () => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

// --- MOCK DATA GENERATOR ---
const generateMockData = () => {
    const data: any[] = [];
  for (let m of MONTHS) {
    SERVICES.forEach((service) => {
      const isLaundry = service === "Laundry Pickup";
      const totalReq = isLaundry
        ? Math.floor(pseudoRandom() * 5) + 2
        : Math.floor(pseudoRandom() * 3) + 1;

      data.push({
        id: `srv-${m}-${service}`,
        month: m,
        service: service,
        totalReq: totalReq,
        esc1: isLaundry ? 2 : pseudoRandom() > 0.5 ? 1 : 0,
        esc2: isLaundry ? 2 : pseudoRandom() > 0.7 ? 1 : 0,
        esc3: isLaundry ? 1 : 0,
        recToDoneSec: isLaundry
          ? 131173
          : Math.floor(pseudoRandom() * 3600) + 60,
        inPToDoneSec:
          pseudoRandom() > 0.8 ? Math.floor(pseudoRandom() * 1800) : null,
        schToDoneSec: service === "Request" ? 30 : null,
      });
    });
  }
  return data;
};

const rawData = generateMockData();

// --- CUSTOM CHECKBOX DROPDOWN COMPONENT ---
const CheckboxDropdown = ({ label, options, selected, onChange }: any) => {
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
    if (selected.length === 0) onChange([option]);
    else if (selected.includes(option))
      onChange(selected.filter((item: string) => item !== option));
    else onChange([...selected, option]);
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
          {options.map((opt: string) => (
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
              <span className="text-sm text-slate-700">{opt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- KPI COMPONENT ---
const KpiTrend = ({
  value,
  isPositive,
}: {
  value: string;
  isPositive?: boolean;
}) => {
  const color =
    isPositive === true
      ? "text-emerald-500"
      : isPositive === false
      ? "text-rose-500"
      : "text-slate-400";
  const Icon =
    isPositive === true
      ? TrendingUp
      : isPositive === false
      ? TrendingDown
      : null;

  if (value === "N/A")
    return <span className="text-xs font-semibold text-slate-400">N/A</span>;

  return (
    <span
      className={`flex items-center gap-1 text-[11px] font-semibold ${color}`}
    >
      {Icon && <Icon size={12} />} {value}
    </span>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function ServiceRequestSummaryPage() {
  const [currentDate, setCurrentDate] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [filters, setFilters] = useState<{
    months: string[];
    services: string[];
  }>({
    months: [],
    services: [],
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

  // Filter Data
  const filteredData = useMemo(() => {
    return rawData.filter((row) => {
      const matchMonth =
        filters.months.length === 0 || filters.months.includes(row.month);
      const matchService =
        filters.services.length === 0 || filters.services.includes(row.service);
      return matchMonth && matchService;
    });
  }, [filters]);

  // Aggregate Data for Table and Charts
  const aggregatedData = useMemo(() => {
    const groups: any = {};
    let grandTotal = {
      req: 0,
      esc1: 0,
      esc2: 0,
      esc3: 0,
      timeRec: 0,
      countRec: 0,
    };

    filteredData.forEach((row) => {
      if (!groups[row.service]) {
        groups[row.service] = {
          service: row.service,
          totalReq: 0,
          esc1: 0,
          esc2: 0,
          esc3: 0,
          recSecTotal: 0,
          inPSecTotal: 0,
          schSecTotal: 0,
          recCount: 0,
        };
      }
      groups[row.service].totalReq += row.totalReq;
      groups[row.service].esc1 += row.esc1;
      groups[row.service].esc2 += row.esc2;
      groups[row.service].esc3 += row.esc3;

      if (row.recToDoneSec !== null) {
        groups[row.service].recSecTotal += row.recToDoneSec;
        groups[row.service].recCount += 1;
        grandTotal.timeRec += row.recToDoneSec;
        grandTotal.countRec += 1;
      }
      if (row.inPToDoneSec !== null)
        groups[row.service].inPSecTotal += row.inPToDoneSec;
      if (row.schToDoneSec !== null)
        groups[row.service].schSecTotal += row.schToDoneSec;

      grandTotal.req += row.totalReq;
      grandTotal.esc1 += row.esc1;
      grandTotal.esc2 += row.esc2;
      grandTotal.esc3 += row.esc3;
    });

    const resultList = Object.values(groups).map((g: any) => ({
      ...g,
      avgRecSec: g.recCount > 0 ? Math.floor(g.recSecTotal / g.recCount) : null,
      avgInPSec: g.inPSecTotal > 0 ? g.inPSecTotal : null,
      avgSchSec: g.schSecTotal > 0 ? g.schSecTotal : null,
      totalEscalations: g.esc1 + g.esc2 + g.esc3,
    }));

    return { list: resultList, grandTotal };
  }, [filteredData]);

  // Chart Data
  const piePercentageData = aggregatedData.list
    .filter((d) => d.totalReq > 0)
    .map((d) => ({ name: d.service, value: d.totalReq }));
  const pieTimeData = aggregatedData.list
    .filter((d) => d.avgRecSec && d.avgRecSec > 0)
    .map((d) => ({ name: d.service, value: d.avgRecSec }));
  const pieEscalationData = aggregatedData.list
    .filter((d) => d.totalEscalations > 0)
    .map((d) => ({ name: d.service, value: d.totalEscalations }));

  // Table Data (Default Sort by Total Req Descending)
  const tableData = useMemo(() => {
    let sortedArray = [...aggregatedData.list];
    sortedArray.sort((a: any, b: any) => b.totalReq - a.totalReq);
    return sortedArray.map((row, index) => ({ order: index + 1, ...row }));
  }, [aggregatedData]);

  // --- EXPORT FUNCTIONS ---
  const exportCSV = () => {
    const headers = [
      "Order",
      "Services",
      "Total Req",
      "1st Esc",
      "2nd Esc",
      "3rd Esc",
      "Rec to Done (hr)",
      "In-P to Done (hr)",
      "Sch to Done (hr)",
    ];
    const rows = tableData.map((row: any) => [
      row.order,
      row.service,
      row.totalReq,
      row.esc1,
      row.esc2,
      row.esc3,
      formatHHMMSS(row.avgRecSec),
      formatHHMMSS(row.avgInPSec),
      formatHHMMSS(row.avgSchSec),
    ]);

    rows.push([
      "",
      "Grand Total",
      aggregatedData.grandTotal.req,
      aggregatedData.grandTotal.esc1,
      aggregatedData.grandTotal.esc2,
      aggregatedData.grandTotal.esc3,
      "",
      "",
      "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((item) => `"${item}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Service_Request_Summary_${currentDate}.csv`);
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
          filter: (node) =>
            node instanceof HTMLElement
              ? node.dataset.html2canvasIgnore !== "true"
              : true,
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
        pdf.save(`Service_Request_Summary_${currentDate}.pdf`);
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    }
    setIsExporting(false);
  };

  const CustomTimeTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white border border-slate-200 p-2 rounded shadow-sm text-xs">
          <p className="font-semibold text-slate-700 mb-1">{data.name}</p>
          <p style={{ color: data.payload.fill }}>
            Avg Time: {formatHHMMSS(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!isMounted) return null;

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
              SERVICE REQUESTS {currentDate ? `· ${currentDate}` : ""}
            </p>
            <h1 className="text-3xl font-bold text-[#0f172a] uppercase tracking-tight">
              Service Request Summary
            </h1>
          </div>

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

        {/* FILTERS */}
        <div
          className="flex flex-wrap gap-4 items-end mb-4 pb-4 border-b border-slate-200"
          data-html2canvas-ignore="true"
        >
          <CheckboxDropdown
            label="Month"
            options={MONTHS}
            selected={filters.months}
            onChange={(val: string[]) =>
              setFilters((prev) => ({ ...prev, months: val }))
            }
          />
          <CheckboxDropdown
            label="Service Type"
            options={SERVICES}
            selected={filters.services}
            onChange={(val: string[]) =>
              setFilters((prev) => ({ ...prev, services: val }))
            }
          />
          <button
            onClick={() => setFilters({ months: [], services: [] })}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition py-2 px-2"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="px-8 pb-12 space-y-6">
        {/* KPI DASHBOARD */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Main Large Card (กว้าง 1 ส่วนใน 5, สูง 2 แถว) */}
          <div className="col-span-2 md:col-span-1 row-span-2 bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
            <h3 className="text-[13px] font-semibold text-slate-500 mb-2">
              Total Requests
            </h3>
            <div className="flex flex-col">
              <span className="text-[3.5rem] leading-none font-bold text-[#0f172a] mb-4">
                {aggregatedData.grandTotal.req.toFixed(1)}
              </span>
              <div className="flex justify-start">
                <KpiTrend value="-66.7%" isPositive={false} />
              </div>
            </div>
          </div>

          {/* Small KPI Cards */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col justify-between">
            <p className="text-[11px] text-slate-500 font-semibold mb-1">
              Completed
            </p>
            <div className="flex justify-between items-end mt-2">
              <span className="text-2xl font-bold text-[#0f172a]">
                {(aggregatedData.grandTotal.req * 0.9).toFixed(1)}
              </span>
              <KpiTrend value="-66.7%" isPositive={false} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col justify-between">
            <p className="text-[11px] text-slate-500 font-semibold mb-1">
              Unresolved
            </p>
            <div className="flex justify-between items-end mt-2">
              <span className="text-2xl font-bold text-[#0f172a]">0.0</span>
              <KpiTrend value="N/A" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col justify-between">
            <p className="text-[11px] text-slate-500 font-semibold mb-1">
              Escalation
            </p>
            <div className="flex justify-between items-end mt-2">
              <span className="text-2xl font-bold text-[#0f172a]">
                {(
                  aggregatedData.grandTotal.esc1 +
                  aggregatedData.grandTotal.esc2
                ).toFixed(1)}
              </span>
              <KpiTrend value="-53.3%" isPositive={false} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col justify-between">
            <p className="text-[11px] text-slate-500 font-semibold mb-1">
              User Request
            </p>
            <div className="flex justify-between items-end mt-2">
              <span className="text-2xl font-bold text-[#0f172a]">
                {(aggregatedData.grandTotal.req * 0.6).toFixed(1)}
              </span>
              <KpiTrend value="-50.0%" isPositive={false} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col justify-between">
            <p className="text-[11px] text-slate-500 font-semibold mb-1">
              Cancelled
            </p>
            <div className="flex justify-between items-end mt-2">
              <span className="text-2xl font-bold text-[#0f172a]">0.0</span>
              <KpiTrend value="N/A" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col justify-between">
            <p className="text-[11px] text-slate-500 font-semibold mb-1">
              Occupancy
            </p>
            <div className="flex justify-between items-end mt-2">
              <span className="text-2xl font-bold text-[#0f172a]">74.3%</span>
              <KpiTrend value="-3.9%" isPositive={false} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col justify-between">
            <p className="text-[11px] text-slate-500 font-semibold mb-1">
              Paired Guest
            </p>
            <div className="flex justify-between items-end mt-2">
              <span className="text-2xl font-bold text-[#0f172a]">64</span>
              <KpiTrend value="-23.8%" isPositive={false} />
            </div>
          </div>
        </div>

        {/* 3 DONUT CHARTS ROW */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 page-break-inside-avoid">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Chart 1 */}
            <div className="flex flex-col items-center">
              <h3 className="text-[11px] font-semibold text-slate-500 tracking-widest uppercase mb-4 text-center">
                Request by Percentage
              </h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={piePercentageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      stroke="none"
                    >
                      {piePercentageData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={SERVICE_COLORS[entry.name]}
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
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2 */}
            <div className="flex flex-col items-center">
              <h3 className="text-[11px] font-semibold text-slate-500 tracking-widest uppercase mb-4 text-center">
                Avg Completion Time (hr)
              </h3>
              <div className="w-full h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieTimeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieTimeData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={SERVICE_COLORS[entry.name]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTimeTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3 */}
            <div className="flex flex-col items-center">
              <h3 className="text-[11px] font-semibold text-slate-500 tracking-widest uppercase mb-4 text-center">
                Request with Escalations
              </h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieEscalationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      stroke="white"
                      strokeWidth={2}
                      label={({ value }) => value}
                      labelLine={false}
                    >
                      {pieEscalationData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={SERVICE_COLORS[entry.name]}
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
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Shared Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-slate-100">
            {SERVICES.map((service) => (
              <div
                key={service}
                className="flex items-center gap-1.5 text-xs text-slate-600 font-medium"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: SERVICE_COLORS[service] }}
                ></span>
                {service}
              </div>
            ))}
          </div>
        </div>

        {/* DATA TABLE - (No Sorting) */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden page-break-inside-avoid">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-[11px] font-semibold text-slate-500 tracking-widest uppercase">
              Average Service Request Handling Time
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-slate-500 bg-white">
                <tr>
                  <th className="px-6 py-3 font-normal text-xs uppercase tracking-wider w-12">
                    No.
                  </th>
                  <th className="px-6 py-3 font-normal text-xs uppercase tracking-wider">
                    Services
                  </th>
                  <th className="px-6 py-3 font-normal text-xs uppercase tracking-wider text-right">
                    Total Req.
                  </th>
                  <th className="px-4 py-3 font-normal text-xs uppercase tracking-wider text-right">
                    1st Esc
                  </th>
                  <th className="px-4 py-3 font-normal text-xs uppercase tracking-wider text-right">
                    2nd Esc
                  </th>
                  <th className="px-4 py-3 font-normal text-xs uppercase tracking-wider text-right">
                    3rd Esc
                  </th>
                  <th className="px-6 py-3 font-normal text-xs uppercase tracking-wider text-right">
                    Rec to Done (hr)
                  </th>
                  <th className="px-6 py-3 font-normal text-xs uppercase tracking-wider text-right">
                    In-P to Done (hr)
                  </th>
                  <th className="px-6 py-3 font-normal text-xs uppercase tracking-wider text-right">
                    Sch to Done (hr)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#0f172a]">
                {tableData.length > 0 ? (
                  tableData.map((row) => (
                    <tr
                      key={row.service}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {row.order}.
                      </td>
                      <td className="px-6 py-4 font-medium text-xs">
                        {row.service}
                      </td>
                      <td className="px-6 py-4 text-right text-xs">
                        {row.totalReq}
                      </td>
                      <td className="px-4 py-4 text-right text-xs">
                        {row.esc1}
                      </td>
                      <td className="px-4 py-4 text-right text-xs">
                        {row.esc2}
                      </td>
                      <td className="px-4 py-4 text-right text-xs">
                        {row.esc3}
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-mono">
                        {formatHHMMSS(row.avgRecSec)}
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-mono">
                        {formatHHMMSS(row.avgInPSec)}
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-mono">
                        {formatHHMMSS(row.avgSchSec)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      No data available for the selected filters.
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
