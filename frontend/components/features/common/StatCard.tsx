import { CyberCard } from "@/components/ui/CyberCard";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <CyberCard progressBar dots className="p-5">
      <div className="flex items-start justify-between relative z-[1]">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold font-heading text-primary mt-2">{value}</p>
        </div>
        {icon && (
          <div className="w-10 h-10 flex items-center justify-center text-cyan-400/60">
            {icon}
          </div>
        )}
      </div>
    </CyberCard>
  );
}
