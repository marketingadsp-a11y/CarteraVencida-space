import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const isDestructive = variant === 'destructive' || (className && (className.includes('red') || className.includes('rose')));
  const isColored = isDestructive || (className && (className.includes('green') || className.includes('blue') || className.includes('primary')));

  return (
    <Card className={cn(
      variant === 'destructive' && 'bg-destructive text-destructive-foreground',
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", isColored ? 'text-white/70' : 'text-muted-foreground')} />
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
        {description && <p className={cn("text-xs", isColored ? 'text-white/70' : 'text-muted-foreground')}>{description}</p>}
      </CardContent>
    </Card>
  );
}
