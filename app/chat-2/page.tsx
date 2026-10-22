"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronDown,
  Inbox,
  Clock,
  MessageSquare,
  Smartphone,
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
} from "recharts";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

// --- CONSTANTS & CONFIG ---
const MONTHS = ["Jan 2026", "Feb 2026", "Mar 2026"];

const SOURCE_TYPES = [
  "Messenger",
  "LINE",
  "Facebook",
  "Instagram",
  "WhatsApp",
  "WeChat",
  "Viber",
];

const SOURCE_COLORS: Record<string, string> = {
  Messenger: "#ec4899", // Pink
  LINE: "#10b981", // Emerald/Green
  Facebook: "#3b82f6", // Blue
  Instagram: "#f59e0b", // Amber/Orange
  WhatsApp: "#22c55e", // Green
  WeChat: "#14b8a6", // Teal
  Viber: "#8b5cf6", // Purple
};

// --- MOCK DATA GENERATOR ---
const generateMockData = () => {
  const data: any[] = [];

  for (let m of MONTHS) {
    // วนลูปสร้างข้อมูล 24 ชั่วโมง
    for (let hour = 0; hour < 24; hour++) {
      // สุ่มให้บางชั่วโมงไม่มีข้อมูลเพื่อความสมจริง
      if (Math.random() > 0.8 && hour < 8) continue;

      // สุ่มจำนวน source type ที่มีข้อความในชั่วโมงนี้
      const activeSources = SOURCE_TYPES.filter(() => Math.random() > 0.4);

      activeSources.forEach((source) => {
        // จำลองให้ช่วงเวลา 10.00 - 15.00 และ 19.00 - 22.00 มีข้อความเยอะ (Peak)
        let multiplier = 1;
        if ((hour >= 10 && hour <= 15) || (hour >= 19 && hour <= 22)) {
          multiplier = Math.floor(Math.random() * 5) + 2;
        }

        const conversations = Math.floor(Math.random() * 10 * multiplier) + 1;
        const messages =
          conversations + Math.floor(Math.random() * 20 * multiplier);

        data.push({
          id: `msg-${m}-${hour}-${source}`,
          month: m,
          hour: hour.toString().padStart(2, "0") + ":00",
          hourNum: hour,
          sourceType: source,
          conversations,
          messages,
        });
      });
    }
  }
  return data;
};

const rawData = generateMockData();

// --- HELPER COMPONENTS ---
const EmptyPage = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-[#f8fafc] py-20">
    <div className="p-4 bg-slate-200/50 rounded-full mb-4">
      <Inbox size={48} className="text-slate-400" />
    </div>
    <h2 className="text-2xl font-semibold text-slate-800 mb-2">{title}</h2>
    <p>{description}</p>
  </div>
);

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

  // ปิด Dropdown เมื่อคลิกพื้นที่อื่น
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
      // ถ้าเดิมเลือก All อยู่ เมื่อติ๊กอันใดอันหนึ่ง จะให้เหลือแค่อันนั้น
      onChange([option]);
    } else if (selected.includes(option)) {
      // ยกเลิกการเลือก
      const newSelected = selected.filter((item) => item !== option);
      onChange(newSelected);
    } else {
      // เพิ่มการเลือก
      onChange([...selected, option]);
    }
  };

  const handleAllClick = () => {
    onChange([]); // Array ว่างหมายถึง All
  };

  const displayText =
    selected.length === 0
      ? `All ${label}s`
      : selected.length === 1
      ? selected[0]
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
        <div className="absolute z-50 top-[100%] left-0 mt-1 w-full bg-white border border-slate-200 rounded shadow-lg max-h-60 overflow-y-auto">
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
              <span className="text-sm text-slate-700">{opt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function Chat2Page() {
  const [currentDate, setCurrentDate] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

  // ใช้ Array ในการเก็บข้อมูล Filter เพื่อรองรับการเลือกหลายรายการ
  const [filters, setFilters] = useState<{
    months: string[];
    sourceTypes: string[];
  }>({
    months: [],
    sourceTypes: [],
  });

  // กรองข้อมูลตาม Filter
  const filteredData = useMemo(() => {
    return rawData.filter((row) => {
      const matchMonth =
        filters.months.length === 0 || filters.months.includes(row.month);
      const matchSource =
        filters.sourceTypes.length === 0 ||
        filters.sourceTypes.includes(row.sourceType);
      return matchMonth && matchSource;
    });
  }, [filters]);

  // คำนวณสรุปข้อมูลรวม (Metrics)
  const metrics = useMemo(() => {
    let totalMsgs = 0;
    let totalConvs = 0;
    const hourCounts: Record<string, number> = {};

    filteredData.forEach((row) => {
      totalMsgs += row.messages;
      totalConvs += row.conversations;
      hourCounts[row.hour] = (hourCounts[row.hour] || 0) + row.messages;
    });

    let peakHour = "N/A";
    let maxMsgs = 0;
    Object.entries(hourCounts).forEach(([h, count]) => {
      if (count > maxMsgs) {
        maxMsgs = count;
        peakHour = h;
      }
    });

    return {
      conversations: totalConvs,
      messages: totalMsgs,
      peakHour,
      peakHourMessages: maxMsgs,
    };
  }, [filteredData]);

  // เตรียมข้อมูลสำหรับ Stacked Bar Chart
  const chartData = useMemo(() => {
    const groupedByHour: Record<string, any> = {};

    for (let i = 0; i < 24; i++) {
      const h = i.toString().padStart(2, "0") + ":00";
      groupedByHour[h] = { hour: h, hourNum: i };
      SOURCE_TYPES.forEach((src) => (groupedByHour[h][src] = 0));
    }

    filteredData.forEach((row) => {
      if (groupedByHour[row.hour]) {
        groupedByHour[row.hour][row.sourceType] += row.messages;
      }
    });

    return Object.values(groupedByHour).sort((a, b) => a.hourNum - b.hourNum);
  }, [filteredData]);

  // เตรียมข้อมูลสำหรับ Data Table
  const tableData = useMemo(() => {
    const groups: any = {};

    filteredData.forEach((row) => {
      const key = `${row.hour}|${row.sourceType}`;
      if (!groups[key]) {
        groups[key] = {
          hour: row.hour,
          hourNum: row.hourNum,
          sourceType: row.sourceType,
          conversations: 0,
          messages: 0,
        };
      }
      groups[key].conversations += row.conversations;
      groups[key].messages += row.messages;
    });

    const sortedArray = Object.values(groups).sort((a: any, b: any) => {
      return b.messages - a.messages;
    });

    return sortedArray.map((row: any, index) => ({
      order: index + 1,
      ...row,
    }));
  }, [filteredData]);

  const resetFilters = () => {
    setFilters({ months: [], sourceTypes: [] });
  };

  // --- EXPORT FUNCTIONS ---
  const exportCSV = () => {
    const headers = [
      "Order Number",
      "Message Hour",
      "Source Type",
      "Conversations",
      "Messages",
    ];
    const rows = tableData.map((row: any) => [
      row.order,
      row.hour,
      row.sourceType,
      row.conversations,
      row.messages,
    ]);

    rows.push(["Grand Total", "", "", metrics.conversations, metrics.messages]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((item) => `"${item}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Peak_Hours_Data_${currentDate}.csv`);
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
        pdf.save(`Peak_Hours_Data_${currentDate}.pdf`);
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    }
    setIsExporting(false);
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
              USER ENGAGEMENT {currentDate ? `· ${currentDate}` : ""}
            </p>
            <h1 className="text-3xl font-bold text-[#0f172a] uppercase tracking-tight">
              Messages Peak Hours
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

        {/* MULTI-SELECT FILTERS */}
        <div
          className="flex flex-wrap gap-4 items-end mb-4 pb-4 border-b border-slate-200"
          data-html2canvas-ignore="true"
        >
          <CheckboxDropdown
            label="Month"
            options={MONTHS}
            selected={filters.months}
            onChange={(val) => setFilters((prev) => ({ ...prev, months: val }))}
          />
          <CheckboxDropdown
            label="Source"
            options={SOURCE_TYPES}
            selected={filters.sourceTypes}
            onChange={(val) =>
              setFilters((prev) => ({ ...prev, sourceTypes: val }))
            }
          />

          <button
            onClick={resetFilters}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition py-2 px-2"
          >
            Clear all
          </button>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="flex-1 px-8 pb-8">
          <EmptyPage
            title="No data available"
            description="No peak hours data available for the selected filters."
          />
        </div>
      ) : (
        <div className="px-8 pb-12 space-y-6">
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
              <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 tracking-widest uppercase mb-4">
                <MessageSquare size={14} /> Total Messages
              </p>
              <div>
                <p className="text-5xl font-bold text-[#0f172a] mb-2">
                  {metrics.messages.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
              <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 tracking-widest uppercase mb-4">
                <Clock size={14} /> Peak Hour
              </p>
              <div>
                <p className="text-5xl font-bold text-[#ec4899] mb-2">
                  {metrics.peakHour}
                </p>
                <p className="text-sm text-slate-500 font-medium print:hidden">
                  Highest volume recorded
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
              <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 tracking-widest uppercase mb-4">
                <Inbox size={14} /> Conversations
              </p>
              <div>
                <p className="text-5xl font-bold text-[#0f172a] mb-2">
                  {metrics.conversations.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
              <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 tracking-widest uppercase mb-4">
                <Smartphone size={14} /> Active Sources
              </p>
              <div>
                <p className="text-5xl font-bold text-[#0f172a] mb-2">
                  {filters.sourceTypes.length === 0
                    ? SOURCE_TYPES.length
                    : filters.sourceTypes.length}
                </p>
                <p className="text-sm text-slate-500 font-medium print:hidden">
                  Platforms monitored
                </p>
              </div>
            </div>
          </div>

          {/* STACKED BAR CHART */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col page-break-inside-avoid">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-[11px] font-semibold text-slate-800 tracking-widest uppercase">
                Messages Peak Hours - Social Media Overview
              </h3>
            </div>
            <div className="p-6 h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="hour"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
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
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: "12px",
                      color: "#64748b",
                      paddingTop: "10px",
                    }}
                  />

                  {/* แสดง Stacked Bar ตาม Source Types ที่ผู้ใช้เลือก */}
                  {SOURCE_TYPES.map(
                    (type) =>
                      (filters.sourceTypes.length === 0 ||
                        filters.sourceTypes.includes(type)) && (
                        <Bar
                          key={type}
                          dataKey={type}
                          stackId="a"
                          fill={SOURCE_COLORS[type]}
                          radius={0}
                        />
                      )
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DATA TABLE */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-[11px] font-semibold text-slate-800 tracking-widest uppercase">
                Messages Peak Hours Summary
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-slate-500 bg-white">
                  <tr>
                    <th className="px-6 py-3 font-normal text-xs uppercase tracking-wider">
                      NO.
                    </th>
                    <th className="px-6 py-3 font-normal text-xs uppercase tracking-wider">
                      Message Hour
                    </th>
                    <th className="px-6 py-3 font-normal text-xs uppercase tracking-wider">
                      Source Type
                    </th>
                    <th className="px-6 py-3 font-normal text-xs uppercase tracking-wider text-right">
                      Conversations
                    </th>
                    <th className="px-6 py-3 font-normal text-xs uppercase tracking-wider text-right">
                      Messages
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[#0f172a]">
                  {tableData.map((row: any) => (
                    <tr
                      key={`${row.hour}-${row.sourceType}`}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4 text-slate-500">{row.order}</td>
                      <td className="px-6 py-4">{row.hour}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor:
                                SOURCE_COLORS[row.sourceType] || "#cbd5e1",
                            }}
                          ></span>
                          {row.sourceType}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {row.conversations.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {row.messages.toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  {/* GRAND TOTAL ROW */}
                  <tr className="bg-slate-50 border-t border-slate-200">
                    <td
                      className="px-6 py-4 font-semibold text-slate-800"
                      colSpan={3}
                    >
                      Grand Total
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-800">
                      {metrics.conversations.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-800">
                      {metrics.messages.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
