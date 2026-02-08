import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  return (
    <Link href={`/market/${request.id}`}>
      <Card className="cursor-pointer hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5 h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">
              {categoryLabels[request.category]}
            </Badge>
            <Badge variant="outline" className={statusColors[request.status]}>
              {request.status.replace("_", " ")}
            </Badge>
          </div>
          <h3 className="font-heading font-semibold text-lg mt-2 leading-tight">
            {request.title}
          </h3>
        </CardHeader>

        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {request.description}
          </p>
        </CardContent>

        <CardFooter className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-primary font-semibold text-sm">
            {request.budget.toLocaleString()} FORGE
          </span>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{request.proposals.length} proposals</span>
            <span>{daysLeft > 0 ? `${daysLeft}d left` : "Ended"}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
