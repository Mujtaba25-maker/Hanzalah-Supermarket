export default function StatCard({ title, value, change, icon: Icon, tone = "teal" }) {
  const tones = {
    teal: "text-[#38f2e1]",
    blue: "text-[#ff8a3d]",
    amber: "text-[#d4ff36]",
    rose: "text-[#ff2d83]"
  };

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/5 bg-[#151515] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:border-[#ff2d83]/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#b5b5b5]">{title}</p>
          <strong className={`mt-2 block text-3xl font-black ${tones[tone]}`}>{value}</strong>
          <span className="mt-3 inline-flex rounded-full bg-[#1f1f1f] px-2.5 py-1 text-xs font-black text-[#6df2a8]">{change}</span>
        </div>
        <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-xl ${tones[tone]}`}>
          <Icon />
        </span>
      </div>
      <svg className={`mt-4 h-10 w-full opacity-70 ${tones[tone]}`} viewBox="0 0 160 44" fill="none" aria-hidden="true">
        <path d="M2 36C20 7 32 7 48 28C62 47 75 38 84 19C94 -2 111 2 119 23C130 52 143 35 158 5" stroke="currentColor" strokeWidth="3" />
      </svg>
    </article>
  );
}
