export default function StatCard({ title, value, change, icon: Icon, tone = "teal" }) {
  const tones = {
    teal: "bg-teal-50 text-teal-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700"
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <strong className="mt-2 block text-3xl font-black text-slate-950">{value}</strong>
          <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">{change}</span>
        </div>
        <span className={`grid h-12 w-12 place-items-center rounded-2xl text-xl ${tones[tone]}`}>
          <Icon />
        </span>
      </div>
    </article>
  );
}
