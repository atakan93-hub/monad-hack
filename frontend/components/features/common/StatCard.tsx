import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold font-heading mt-1">{value}</p>
          </div>
          {icon && (
            <div className="text-primary text-2xl">{icon}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
