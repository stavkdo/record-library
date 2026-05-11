import { Vinyl } from '../components/Vinyl';

export function DashboardPage() {
  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 bg-spotlight pointer-events-none" />
      <div className="relative h-full flex flex-col items-center justify-center gap-10 px-8">
        <div className="text-center animate-fade-up">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-medium mb-3">
            Now spinning
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-zinc-100 tracking-tight">
            Pick a library to start
          </h1>
          <p className="text-zinc-400 mt-3 max-w-md mx-auto">
            Open one from the sidebar, or create a new collection to begin curating your records.
          </p>
        </div>
        <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
          <Vinyl size={360} />
        </div>
      </div>
    </div>
  );
}
