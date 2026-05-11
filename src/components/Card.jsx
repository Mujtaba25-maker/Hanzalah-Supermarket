export default function Card({ title, icon: Icon, action, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-white/5 bg-[#151515] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="text-[#ff2d83]" />}
          <h2 className="text-lg font-black text-white">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
