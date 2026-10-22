import { Inbox } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-[#f8fafc] py-20">
      <div className="p-4 bg-slate-200/50 rounded-full mb-4">
        <Inbox size={48} className="text-slate-400" />
      </div>
      <h2 className="text-2xl font-semibold text-slate-800 mb-2">Home</h2>
      <p></p>
    </div>
  );
}
