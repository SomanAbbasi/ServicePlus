import { Star, MapPin, Calendar, CheckCircle2 } from "lucide-react";

export function PhoneMockup() {
  return (
    <div className="relative flex items-center justify-center py-4">
      {/* Background Soft Glow */}
      <div className="absolute -inset-4 rounded-full bg-cyan-400/20 blur-2xl" />

      <div className="relative flex items-center gap-3 sm:gap-5">
        {/* Left Phone: App Home Feed */}
        <div className="relative w-[170px] shrink-0 overflow-hidden rounded-[2rem] border-[5px] border-slate-900 bg-slate-900 shadow-2xl transition-transform hover:-translate-y-1 sm:w-[200px]">
          {/* Top Speaker Notch */}
          <div className="absolute top-0 inset-x-0 z-20 flex justify-center pt-1.5">
            <div className="h-2.5 w-16 rounded-full bg-slate-800" />
          </div>

          <div className="flex h-[350px] flex-col bg-slate-50 pt-5 text-slate-800 sm:h-[400px]">
            {/* App Header */}
            <div className="bg-white p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="grid size-5 place-items-center rounded bg-cyan-500 text-[9px] font-black text-white">
                    S+
                  </div>
                  <span className="text-[11px] font-bold tracking-tight text-slate-900">ServicePlus</span>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-600">
                  <MapPin className="size-2.5 text-cyan-600" />
                  Dubai
                </div>
              </div>

              {/* Search Bar in App */}
              <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-[9px] text-slate-400">
                <MapPin className="size-2.5" />
                <span>Search home services...</span>
              </div>
            </div>

            {/* Banner */}
            <div className="m-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 p-2.5 text-white shadow-xs">
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[8px] font-medium">30% OFF</span>
              <p className="mt-1 text-[10px] font-bold leading-tight">Home Cleaning & AC Care</p>
              <span className="mt-1 inline-block rounded-full bg-white px-2 py-0.5 text-[8px] font-bold text-cyan-700">
                Book Now
              </span>
            </div>

            {/* Category Grid */}
            <div className="px-2.5">
              <p className="text-[9px] font-bold text-slate-700">Top Categories</p>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {[
                  { name: "Cleaning", icon: "✨", color: "bg-sky-100 text-sky-700" },
                  { name: "AC Care", icon: "❄️", color: "bg-cyan-100 text-cyan-700" },
                  { name: "Salon", icon: "✂️", color: "bg-pink-100 text-pink-700" },
                  { name: "Plumbing", icon: "🔧", color: "bg-amber-100 text-amber-700" },
                  { name: "Pest", icon: "🪲", color: "bg-emerald-100 text-emerald-700" },
                  { name: "PCR", icon: "🧪", color: "bg-purple-100 text-purple-700" },
                ].map((item) => (
                  <div key={item.name} className="flex flex-col items-center rounded-lg bg-white p-1 text-center shadow-2xs">
                    <span className={`grid size-6 place-items-center rounded-md text-[10px] ${item.color}`}>
                      {item.icon}
                    </span>
                    <span className="mt-1 text-[7.5px] font-medium leading-none text-slate-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Phone: Booking Step Preview */}
        <div className="relative -ml-5 w-[170px] shrink-0 overflow-hidden rounded-[2rem] border-[5px] border-slate-900 bg-slate-900 shadow-2xl transition-transform hover:-translate-y-1 sm:-ml-7 sm:w-[200px]">
          {/* Top Speaker Notch */}
          <div className="absolute top-0 inset-x-0 z-20 flex justify-center pt-1.5">
            <div className="h-2.5 w-16 rounded-full bg-slate-800" />
          </div>

          <div className="flex h-[350px] flex-col bg-white pt-5 text-slate-800 sm:h-[400px]">
            {/* Header */}
            <div className="border-b border-slate-100 px-3 py-2 text-center">
              <span className="text-[10px] font-bold text-slate-800">Select Date & Slot</span>
              <p className="text-[7.5px] text-slate-400">Step 1 of 2</p>
            </div>

            {/* Professional Badge Card */}
            <div className="m-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80"
                  alt="Professional"
                  className="size-7 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-[9.5px] font-bold text-slate-800">Sarah M.</p>
                    <CheckCircle2 className="size-2.5 text-cyan-600" />
                  </div>
                  <div className="flex items-center gap-0.5 text-[7.5px] text-amber-500">
                    <Star className="size-2 fill-amber-400 text-amber-400" />
                    <span className="font-bold">4.9</span>
                    <span className="text-slate-400">(142 reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Slot Picker */}
            <div className="px-2.5">
              <div className="flex items-center justify-between text-[8.5px] font-semibold text-slate-700">
                <span className="flex items-center gap-1">
                  <Calendar className="size-2.5 text-cyan-600" /> Today, Aug 20
                </span>
                <span className="text-[7.5px] font-bold text-cyan-600">Available</span>
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1">
                {["10:00 AM", "01:30 PM", "04:00 PM", "06:30 PM"].map((time, idx) => (
                  <div
                    key={time}
                    className={`rounded-md px-1.5 py-1 text-center text-[8px] font-medium border ${
                      idx === 1
                        ? "border-cyan-500 bg-cyan-50 font-bold text-cyan-700 shadow-2xs"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    {time}
                  </div>
                ))}
              </div>
            </div>

            {/* Address Summary */}
            <div className="mt-2.5 px-2.5">
              <div className="rounded-lg bg-slate-50 p-1.5 text-[7.5px]">
                <span className="font-bold text-slate-700">Location:</span>
                <p className="truncate text-slate-500">Al Wasl Road, Villa 42, Dubai</p>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-auto p-2.5">
              <div className="rounded-xl bg-cyan-600 py-1.5 text-center text-[9px] font-bold text-white shadow-md">
                Confirm & Pay (AED 120)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
