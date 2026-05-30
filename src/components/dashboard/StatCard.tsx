import { LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType<LucideProps>;
  variant?: 'default' | 'destructive';
  description?: string;
  className?: string;
  valueClassName?: string;
}

export default function StatCard({ title, value, icon: Icon, variant = 'default', description, className, valueClassName }: StatCardProps) {
  const isDestructive = variant === 'destructive' || (className && (className.includes('red') || className.includes('rose') || className.includes('destructive')));
  const isGreen = className && (className.includes('green') || className.includes('emerald'));
  const isBlue = className && (className.includes('blue') || className.includes('primary'));

  return (
    <div className={cn(
      "glass-card p-6 rounded-2xl relative overflow-hidden",
      isDestructive && "bg-rose-50/70 border-rose-200/50 shadow-[0_4px_24px_rgba(244,63,94,0.03)]",
      isGreen && "bg-emerald-50/70 border-emerald-200/50 shadow-[0_4px_24px_rgba(16,185,129,0.03)]",
      isBlue && "bg-blue-50/70 border-blue-200/50 shadow-[0_4px_24px_rgba(59,130,246,0.03)]"
    )}>
      {/* Visual neon glow spot on top-right */}
      <div className={cn(
        "absolute -top-10 -right-10 w-20 h-20 rounded-full blur-2xl pointer-events-none opacity-20",
        isDestructive && "bg-rose-400",
        isGreen && "bg-emerald-400",
        isBlue && "bg-blue-400",
        !isDestructive && !isGreen && !isBlue && "bg-primary"
      )} />

      <div className="flex flex-row items-center justify-between pb-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</span>
        <Icon className={cn(
          "h-5 w-5",
          isDestructive && "text-rose-500",
          isGreen && "text-emerald-500",
          isBlue && "text-blue-500",
          !isDestructive && !isGreen && !isBlue && "text-primary"
        )} />
      </div>
      <div>
        <div className={cn(
          "text-3xl font-headline font-extrabold text-slate-800 tracking-tight",
          valueClassName
        )}>{value}</div>
        {description && (
          <p className="text-[10px] font-medium text-slate-400 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}
