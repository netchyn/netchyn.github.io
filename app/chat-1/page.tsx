"use client";
import React, { useState, useMemo, useEffect } from "react";
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

// --- CONSTANTS & CONFIG ---
const RESPONSE_LEVELS = {
  1: "Less Than 5 Minutes",
  2: "Slow Response",
  3: "Delayed / Needs Improvement",
  4: "Critical",
  5: "No Response",
};

const PIE_COLORS = ["#10b981", "#f59e0b", "#f97316", "#ef4444", "#6b7280"];

// --- MOCK DATA GENERATOR ---
const generateMockData = () => {
  const data = [];
  const platforms = ["iOS", "Android"];
  const months = ["Jan 2026", "Feb 2026", "Mar 2026"];

  for (let i = 1; i <= 300; i++) {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const month = months[Math.floor(Math.random() * months.length)];
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

// --- HELPER FUNCTIONS ---
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

// --- MAIN PAGE COMPONENT ---
export default function Chat1Page() {
  const [currentDate, setCurrentDate] = useState<string>("");

  // 1. เพิ่ม State เช็คการ Mount
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // 2. สั่งให้บอกว่า Component โหลดบน Client เรียบร้อยแล้ว
    setIsMounted(true);

    setCurrentDate(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  const [filters, setFilters] = useState({
    month: "All",
    platform: "All",
    responseLevel: "All",
    automated: "All",
  });

  const filteredData = useMemo(() => {
    return rawData.filter((row) => {
      const matchMonth = filters.month === "All" || row.month === filters.month;
      const matchPlatform =
        filters.platform === "All" || row.platform === filters.platform;
      const matchLevel =
        filters.responseLevel === "All" ||
        row.responseLevel.toString() === filters.responseLevel;

      let matchAuto = true;
      if (filters.automated === "Automated")
        matchAuto = row.isAutomated === true;
      if (filters.automated === "Non-Automated")
        matchAuto = row.isAutomated === false;

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
      // @ts-ignore - แก้ไขการใส่ตัวแปรให้ถูกต้อง
      levelLabel: `${row.level} - ${RESPONSE_LEVELS[row.level]}`,
      conversations: row.convs,
      messages: row.msgs,
      avgTime: row.timeCount > 0 ? row.totalTime / row.timeCount : null,
    }));
  }, [filteredData]);

  const handleFilterChange = (e: any) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      month: "All",
      platform: "All",
      responseLevel: "All",
      automated: "All",
    });
  };

  if (!isMounted) {
    return null; // หรือ return <div className="h-full bg-[#f8fafc]"></div> เพื่อกันหน้าจอกระพริบ
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#f8fafc]">
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
          <div className="flex gap-4">
            <button className="px-6 py-2.5 bg-[#1e293b] text-white text-sm font-medium rounded shadow-sm hover:bg-slate-800 transition">
              EXPORT DATA
            </button>
            <button className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded shadow-sm hover:bg-slate-50 transition">
              MANAGE SETTINGS
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap gap-4 items-end mb-4 pb-4 border-b border-slate-200">
          <div className="w-48">
            <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Month
            </label>
            <div className="relative">
              <select
                name="month"
                value={filters.month}
                onChange={handleFilterChange}
                className="w-full appearance-none bg-white border border-slate-200 text-sm text-slate-700 py-2 pl-3 pr-8 rounded focus:outline-none focus:border-slate-400"
              >
                <option value="All">All Months</option>
                <option value="Jan 2026">Jan 2026</option>
                <option value="Feb 2026">Feb 2026</option>
                <option value="Mar 2026">Mar 2026</option>
              </select>
              <ChevronDown className="absolute right-2 top-2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="w-48">
            <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Platform
            </label>
            <div className="relative">
              <select
                name="platform"
                value={filters.platform}
                onChange={handleFilterChange}
                className="w-full appearance-none bg-white border border-slate-200 text-sm text-slate-700 py-2 pl-3 pr-8 rounded focus:outline-none focus:border-slate-400"
              >
                <option value="All">All Platforms</option>
                <option value="iOS">iOS</option>
                <option value="Android">Android</option>
              </select>
              <ChevronDown className="absolute right-2 top-2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="w-48">
            <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Response Level
            </label>
            <div className="relative">
              <select
                name="responseLevel"
                value={filters.responseLevel}
                onChange={handleFilterChange}
                className="w-full appearance-none bg-white border border-slate-200 text-sm text-slate-700 py-2 pl-3 pr-8 rounded focus:outline-none focus:border-slate-400"
              >
                <option value="All">All Levels</option>
                {Object.entries(RESPONSE_LEVELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    Level {k}: {v}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="w-48">
            <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Automated
            </label>
            <div className="relative">
              <select
                name="automated"
                value={filters.automated}
                onChange={handleFilterChange}
                className="w-full appearance-none bg-white border border-slate-200 text-sm text-slate-700 py-2 pl-3 pr-8 rounded focus:outline-none focus:border-slate-400"
              >
                <option value="All">All Responses</option>
                <option value="Automated">Automated Only</option>
                <option value="Non-Automated">Non-Automated Only</option>
              </select>
              <ChevronDown className="absolute right-2 top-2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
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
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col">
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

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col">
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
                <thead className="border-b border-slate-100 text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-normal text-xs uppercase tracking-wider">
                      Order
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
