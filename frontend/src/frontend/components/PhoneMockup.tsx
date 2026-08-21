import { Star, MapPin, Calendar, CheckCircle2, Search, Sparkles } from "lucide-react";

export function PhoneMockup() {
  return (
    <div className="relative flex items-center justify-center py-4">
      {/* Background Soft Glow */}
      <div className="absolute -inset-4 rounded-full bg-cyan-400/25 blur-3xl" />

      <div className="relative flex items-center gap-2 sm:gap-4">
        {/* Left Phone: App Home Feed */}
        <div className="relative w-[190px] shrink-0 overflow-hidden rounded-[2.2rem] border-[6px] border-slate-900 bg-slate-900 shadow-2xl transition-all hover:-translate-y-1 sm:w-[225px]">
          {/* Top Speaker Notch */}
          <div className="absolute top-0 inset-x-0 z-20 flex justify-center pt-1.5">
            <div className="h-3 w-20 rounded-full bg-slate-800" />
          </div>

          <div className="flex h-[380px] flex-col bg-slate-50 pt-6 text-slate-900 sm:h-[430px]">
            {/* App Header */}
            <div className="bg-white p-3 border-b border-slate-100 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="grid size-6 place-items-center rounded-lg bg-cyan-500 text-[10px] font-black text-white shadow-2xs">
                    S+
                  </div>
                  <span className="text-xs font-black tracking-tight text-slate-900">ServicePlus</span>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-cyan-50 border border-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-800">
                  <MapPin className="size-3 text-cyan-600" />
                  Dubai
                </div>
              </div>

              {/* High Contrast Search Bar */}
              <div className="mt-2.5 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100/90 px-2.5 py-1.5 text-[10px] font-semibold text-slate-800">
                <Search className="size-3 text-cyan-600 shrink-0" />
                <span className="truncate">Search "Home Cleaning"...</span>
              </div>
            </div>

            {/* Banner */}
            <div className="m-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 p-3 text-white shadow-sm">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-[#FFC836] px-1.5 py-0.5 text-[9px] font-black text-slate-900">
                  30% OFF
                </span>
                <Sparkles className="size-3.5 text-cyan-200" />
              </div>
              <p className="mt-1 text-xs font-black leading-tight text-white">
                Home Cleaning & AC Care
              </p>
              <span className="mt-2 inline-block rounded-full bg-white px-2.5 py-0.5 text-[9px] font-extrabold text-cyan-800 shadow-2xs">
                Book Now →
              </span>
            </div>

            {/* Category Grid */}
            <div className="px-2.5">
              <p className="text-[10px] font-black text-slate-900 tracking-tight">Top Categories</p>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {[
                  { name: "Cleaning", icon: "✨", color: "bg-sky-100 text-sky-800" },
                  { name: "AC Care", icon: "❄️", color: "bg-cyan-100 text-cyan-800" },
                  { name: "Salon", icon: "✂️", color: "bg-pink-100 text-pink-800" },
                  { name: "Plumbing", icon: "🔧", color: "bg-amber-100 text-amber-800" },
                  { name: "Pest Care", icon: "🪲", color: "bg-emerald-100 text-emerald-800" },
                  { name: "Handyman", icon: "🔨", color: "bg-purple-100 text-purple-800" },
                ].map((item) => (
                  <div key={item.name} className="flex flex-col items-center rounded-xl border border-slate-100 bg-white p-1.5 text-center shadow-2xs">
                    <span className={`grid size-6 place-items-center rounded-lg text-xs font-bold ${item.color}`}>
                      {item.icon}
                    </span>
                    <span className="mt-1 text-[9px] font-extrabold text-slate-900 leading-none">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Phone: Booking Step Preview */}
        <div className="relative -ml-4 w-[190px] shrink-0 overflow-hidden rounded-[2.2rem] border-[6px] border-slate-900 bg-slate-900 shadow-2xl transition-all hover:-translate-y-1 sm:-ml-6 sm:w-[225px]">
          {/* Top Speaker Notch */}
          <div className="absolute top-0 inset-x-0 z-20 flex justify-center pt-1.5">
            <div className="h-3 w-20 rounded-full bg-slate-800" />
          </div>

          <div className="flex h-[380px] flex-col bg-white pt-6 text-slate-900 sm:h-[430px]">
            {/* Header */}
            <div className="border-b border-slate-100 px-3 py-2 text-center bg-slate-50/50">
              <span className="text-xs font-black text-slate-900 block">Select Date & Slot</span>
              <p className="text-[9px] font-extrabold text-cyan-700">Step 1 of 2</p>
            </div>

            {/* Professional Badge Card */}
            <div className="m-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-2.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80"
                  alt="Professional"
                  className="size-8 rounded-full object-cover ring-2 ring-cyan-500/30"
                />
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-[11px] font-black text-slate-900">Sarah M.</p>
                    <CheckCircle2 className="size-3 text-cyan-600" />
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-amber-600 font-bold">
                    <Star className="size-2.5 fill-amber-400 text-amber-400" />
                    <span>4.9</span>
                    <span className="text-slate-500 font-semibold">(142 reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Slot Picker */}
            <div className="px-2.5">
              <div className="flex items-center justify-between text-[9.5px] font-black text-slate-900">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3 text-cyan-600" /> Today, Aug 21
                </span>
                <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">Available</span>
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                {["10:00 AM", "01:30 PM", "04:00 PM", "06:30 PM"].map((time, idx) => (
                  <div
                    key={time}
                    className={`rounded-xl px-2 py-1.5 text-center text-[9.5px] font-extrabold border ${
                      idx === 1
                        ? "border-cyan-500 bg-cyan-500 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    {time}
                  </div>
                ))}
              </div>
            </div>

            {/* Address Summary */}
            <div className="mt-2.5 px-2.5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-[9px]">
                <span className="font-black text-slate-900 block">📍 Delivery Address:</span>
                <p className="truncate text-slate-700 font-bold mt-0.5">Al Wasl Road, Villa 42, Dubai</p>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-auto p-2.5">
              <div className="rounded-2xl bg-[#FFC836] py-2 text-center text-[10px] font-black text-slate-900 shadow-md">
                Confirm & Pay (AED 120)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
