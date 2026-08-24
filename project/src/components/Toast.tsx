import { useApp } from '../store';

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-slide-up">
      <div className="glass-strong rounded-xl px-6 py-4 flex items-center gap-3 shadow-2xl">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span className="text-sm text-white font-medium">{toast}</span>
      </div>
    </div>
  );
}
