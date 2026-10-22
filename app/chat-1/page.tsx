"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { ChevronDown, Inbox } from "lucide-react";
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
const RESPONSE_LEVELS = {
  1: "Less Than 5 Minutes",
  2: "Slow Response",
  3: "Delayed / Needs Improvement",
  4: "Critical",
  5: "No Response",
};

const PIE_COLORS = ["#10b981", "#f59e0b", "#f97316", "#ef4444", "#6b7280"];

const MONTHS = ["Jan 2026", "Feb 2026", "Mar 2026"];
const PLATFORMS = ["iOS", "Android"];
const AUTOMATED_OPTIONS = ["Automated", "Non-Automated"];
const RESPONSE_LEVEL_OPTIONS = Object.entries(RESPONSE_LEVELS).map(
  ([k, v]) => `${k} - ${v}`
);

// --- MOCK DATA GENERATOR ---
const generateMockData = () => {
  const data = [];
  for (let i = 1; i <= 300; i++) {
    const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
    const month = MONTHS[Math.floor(Math.random() * MONTHS.length)];
    const isAuto = Math.random() > 0.8;
    const isNoResponse = Math.random() > 0.9;

    let respTimeSec = 0;
    let level = 5;

    if (!isNoResponse) {
      const rand = Math.random();
      if (rand < 0.4) respTimeSec = Math.floor(Math.random() * 299);
      else if (rand < 0.7) respTimeSec = Math.floor(Math.random() * 600) + 300;
      else if (rand < 0.9)
        respTimeSec = Math.floor(Math.random() * 17000) + 900;
      else respTimeSec = Math.floor(Math.random() * 20000) + 18000;

      if (respTimeSec < 300) level = 1;
      else if (respTimeSec <= 900) level = 2;
      else if (respTimeSec <= 18000) level = 3;
      else level = 4;
    }

    data.push({
      id: `conv-${i}`,
      platform,
      month,
      responseLevel: level,
      msgCount: Math.floor(Math.random() * 5) + 1,
      isAutomated: isAuto,
      respTimeSec: isNoResponse ? null : respTimeSec,
    });
  }
  return data;
};

const rawData = generateMockData();

// --- HELPER FUNCTIONS & COMPONENTS ---
const formatTime = (totalSeconds: number | null) => {
  if (totalSeconds === null || isNaN(totalSeconds)) return "N/A";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
};

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
              <span className="text-sm text-slate-700">{opt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function Chat1Page() {
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

  // ใช้ Array ในการเก็บข้อมูล Filter
  const [filters, setFilters] = useState<{
    months: string[];
    platforms: string[];
    responseLevels: string[];
    automated: string[];
  }>({
    months: [],
    platforms: [],
    responseLevels: [],
    automated: [],
  });

  const filteredData = useMemo(() => {
    return rawData.filter((row) => {
      const matchMonth =
        filters.months.length === 0 || filters.months.includes(row.month);
      const matchPlatform =
        filters.platforms.length === 0 ||
        filters.platforms.includes(row.platform);

      // กรอง Response Level (เทียบแค่ตัวเลขตัวแรก)
      const matchLevel =
        filters.responseLevels.length === 0 ||
        filters.responseLevels.some((lvlStr) =>
          lvlStr.startsWith(row.responseLevel.toString())
        );

      // กรอง Automated
      let matchAuto = true;
      if (filters.automated.length > 0) {
        const isAutoStr = row.isAutomated ? "Automated" : "Non-Automated";
        matchAuto = filters.automated.includes(isAutoStr);
      }

      return matchMonth && matchPlatform && matchLevel && matchAuto;
    });
  }, [filters]);

  const metrics = useMemo(() => {
    let totalMsgs = 0;
    let autoResp = 0;
    let totalRespTime = 0;
    let validRespCount = 0;

    filteredData.forEach((row) => {
      if (!row.isAutomated) totalMsgs += row.msgCount;
      if (row.isAutomated) autoResp += 1;

      if (row.respTimeSec !== null) {
        totalRespTime += row.respTimeSec;
        validRespCount += 1;
      }
    });

    const avgRespTime =
      validRespCount > 0 ? totalRespTime / validRespCount : null;

    return {
      conversations: filteredData.length,
      messages: totalMsgs,
      avgRespTime,
      automated: autoResp,
    };
  }, [filteredData]);

  const platformData = useMemo(() => {
    const counts = { iOS: { conv: 0, msg: 0 }, Android: { conv: 0, msg: 0 } };
    filteredData.forEach((row) => {
      // @ts-ignore
      if (counts[row.platform]) {
        // @ts-ignore
        counts[row.platform].conv += 1;
        // @ts-ignore
        if (!row.isAutomated) counts[row.platform].msg += row.msgCount;
      }
    });
    return [
      { name: "iOS", Conversations: counts.iOS.conv, Messages: counts.iOS.msg },
      {
        name: "Android",
        Conversations: counts.Android.conv,
        Messages: counts.Android.msg,
      },
    ];
  }, [filteredData]);

  const pieData = useMemo(() => {
    const levels: any = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    filteredData.forEach((row) => {
      levels[row.responseLevel] += row.msgCount;
    });

    return Object.entries(levels)
      .filter(([_, count]: any) => count > 0)
      .map(([level, count]) => ({
        // @ts-ignore
        name: RESPONSE_LEVELS[level],
        level: parseInt(level),
        value: count,
      }));
  }, [filteredData]);

  const tableData = useMemo(() => {
    const groups: any = {};

    filteredData.forEach((row) => {
      const key = `${row.month}|${row.responseLevel}`;
      if (!groups[key]) {
        groups[key] = {
          month: row.month,
          level: row.responseLevel,
          convs: 0,
          msgs: 0,
          totalTime: 0,
          timeCount: 0,
        };
      }
      groups[key].convs += 1;
      if (!row.isAutomated) groups[key].msgs += row.msgCount;
      if (row.respTimeSec !== null) {
        groups[key].totalTime += row.respTimeSec;
        groups[key].timeCount += 1;
      }
    });

    const sortedArray = Object.values(groups).sort((a: any, b: any) => {
      if (a.month !== b.month) return a.month.localeCompare(b.month);
      return a.level - b.level;
    });

    return sortedArray.map((row: any, index) => ({
      order: index + 1,
      month: row.month,
      // @ts-ignore
      levelLabel: `${row.level} - ${RESPONSE_LEVELS[row.level]}`,
      conversations: row.convs,
      messages: row.msgs,
      avgTime: row.timeCount > 0 ? row.totalTime / row.timeCount : null,
    }));
  }, [filteredData]);

  const resetFilters = () => {
    setFilters({
      months: [],
      platforms: [],
      responseLevels: [],
      automated: [],
    });
  };

  // --- EXPORT FUNCTIONS ---
  const exportCSV = () => {
    const headers = [
      "Order",
      "Month",
      "Response Level",
      "Conversations",
      "Messages",
      "AVG Response Time",
    ];

    const rows = tableData.map((row: any) => [
      row.order,
      row.month,
      row.levelLabel,
      row.conversations,
      row.messages,
      formatTime(row.avgTime),
    ]);

    rows.push([
      "Grand Total",
      "",
      "",
      metrics.conversations,
      metrics.messages,
      formatTime(metrics.avgRespTime),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((item) => `"${item}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Engagement_Data_${currentDate}.csv`);
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
        pdf.save(`Engagement_Data_${currentDate}.pdf`);
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    }
    setIsExporting(false);
  };

  if (!isMounted) {
    return null;
  }

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
              Messages & Conversations
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
                  Export as CSV (Table Data)
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
            label="Platform"
            options={PLATFORMS}
            selected={filters.platforms}
            onChange={(val) =>
              setFilters((prev) => ({ ...prev, platforms: val }))
            }
          />
          <CheckboxDropdown
            label="Response Level"
            options={RESPONSE_LEVEL_OPTIONS}
            selected={filters.responseLevels}
            onChange={(val) =>
              setFilters((prev) => ({ ...prev, responseLevels: val }))
            }
          />
          <CheckboxDropdown
            label="Type"
            options={AUTOMATED_OPTIONS}
            selected={filters.automated}
            onChange={(val) =>
              setFilters((prev) => ({ ...prev, automated: val }))
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
            description="No conversation volume data available for the selected filters."
          />
        </div>
      ) : (
        <div className="px-8 pb-12 space-y-6">
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
              <p className="text-[11px] font-semibold text-slate-500 tracking-widest uppercase mb-4">
                Total Conversations
              </p>
              <div>
                <p className="text-5xl font-bold text-[#0f172a] mb-2">
                  {metrics.conversations.toLocaleString()}
                </p>
                <p className="text-sm text-emerald-600 font-medium">
                  +12% vs 7d
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
              <p className="text-[11px] font-semibold text-slate-500 tracking-widest uppercase mb-4">
                Total Messages
              </p>
              <div>
                <p className="text-5xl font-bold text-[#0f172a] mb-2">
                  {metrics.messages.toLocaleString()}
                </p>
                <p className="text-sm text-emerald-600 font-medium">
                  +8% this month
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
              <p className="text-[11px] font-semibold text-slate-500 tracking-widest uppercase mb-4">
                Average Response
              </p>
              <div>
                <p className="text-5xl font-bold text-[#0f172a] mb-2">
                  {formatTime(metrics.avgRespTime)}
                </p>
                <p className="text-sm text-rose-500 font-medium">
                  +15s vs average
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
              <p className="text-[11px] font-semibold text-slate-500 tracking-widest uppercase mb-4">
                Automated
              </p>
              <div>
                <p className="text-5xl font-bold text-[#0f172a] mb-2">
                  {metrics.automated.toLocaleString()}
                </p>
                <p className="text-sm text-slate-500 font-medium">
                  Responses sent
                </p>
              </div>
            </div>
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col page-break-inside-avoid">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-[11px] font-semibold text-slate-800 tracking-widest uppercase">
                  Platform Breakdown · Selected Period
                </h3>
              </div>
              <div className="p-6 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={platformData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f8fafc" }}
                      contentStyle={{
                        borderRadius: "4px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "none",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: "12px", color: "#64748b" }}
                    />
                    <Bar
                      dataKey="Conversations"
                      fill="#1e293b"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="Messages"
                      fill="#94a3b8"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col page-break-inside-avoid">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-[11px] font-semibold text-slate-800 tracking-widest uppercase">
                  Response Level Breakdown
                </h3>
              </div>
              <div className="p-6 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent = 0 }) =>
                        `${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      innerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[entry.level - 1]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "4px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "none",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      wrapperStyle={{ fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* DATA TABLE */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-[11px] font-semibold text-slate-800 tracking-widest uppercase">
                Message Handling Time Summary
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
                      Month
                    </th>
                    <th className="px-6 py-3 font-normal text-xs uppercase tracking-wider">
                      Response Level
                    </th>
                    <th className="px-6 py-3 font-normal text-xs uppercase tracking-wider text-right">
                      Conversations
                    </th>
                    <th className="px-6 py-3 font-normal text-xs uppercase tracking-wider text-right">
                      Messages
                    </th>
                    <th className="px-6 py-3 font-normal text-xs uppercase tracking-wider text-right">
                      AVG Response Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[#0f172a]">
                  {tableData.map((row: any) => (
                    <tr
                      key={row.order}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4 text-slate-500">{row.order}</td>
                      <td className="px-6 py-4">{row.month}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor:
                                PIE_COLORS[
                                  parseInt(row.levelLabel.charAt(0)) - 1
                                ],
                            }}
                          ></span>
                          {row.levelLabel}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {row.conversations.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {row.messages.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-600">
                        {formatTime(row.avgTime)}
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
                    <td className="px-6 py-4 text-right font-mono font-semibold text-slate-800">
                      {formatTime(metrics.avgRespTime)}
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
