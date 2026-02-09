import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CyberCard } from "@/components/ui/CyberCard";
import { FileCode, Layout, BarChart3, ShieldCheck, Package, type LucideIcon } from "lucide-react";
import type { TaskRequest } from "@/lib/types";

const statusColors: Record<string, string> = {
  open: "bg-primary/20 text-primary border-primary/30",
  in_progress: "bg-accent/20 text-accent border-accent/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-muted text-muted-foreground border-border",
  disputed: "bg-red-500/20 text-red-400 border-red-500/30",
};

const categoryLabels: Record<string, string> = {
  "smart-contract": "Smart Contract",
  frontend: "Frontend",
  "data-analysis": "Data Analysis",
  audit: "Audit",
  other: "Other",
};

const categoryIcons: Record<string, { icon: LucideIcon; color: string }> = {
  "smart-contract": { icon: FileCode, color: "text-accent" },
  frontend: { icon: Layout, color: "text-purple-400" },
  "data-analysis": { icon: BarChart3, color: "text-green-400" },
  audit: { icon: ShieldCheck, color: "text-primary" },
  other: { icon: Package, color: "text-muted-foreground" },
};

interface RequestCardProps {
  request: TaskRequest;
}

export function RequestCard({ request }: RequestCardProps) {
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(request.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );

  const cat = categoryIcons[request.category] ?? categoryIcons.other;
  const CatIcon = cat.icon;

  return (
    <Link href={`/market/${request.id}`}>
      <CyberCard className="cursor-pointer h-full p-5 flex flex-col gap-3">
        <div className="relative z-[1] flex flex-col gap-3 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <CatIcon className={`w-4 h-4 ${cat.color}`} />
            <Badge variant="secondary">
              {categoryLabels[request.category]}
            </Badge>
            <Badge variant="outline" className={statusColors[request.status]}>
              {request.status.replace("_", " ")}
            </Badge>
          </div>
          <h3 className="font-heading font-semibold text-lg leading-tight">
            {request.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {request.description}
          </p>
        </div>

        <div className="relative z-[1] flex items-center justify-between pt-3 border-t border-cyan-500/10">
          <span className="text-primary font-semibold text-sm">
            {request.budget.toLocaleString()} FORGE
          </span>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{request.proposals.length} proposals</span>
            <span>{daysLeft > 0 ? `${daysLeft}d left` : "Ended"}</span>
          </div>
        </div>
      </CyberCard>
    </Link>
  );
}
