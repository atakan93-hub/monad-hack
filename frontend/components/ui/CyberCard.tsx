import { cn } from "@/lib/utils";

interface CyberCardProps {
  children: React.ReactNode;
  className?: string;
  dots?: boolean;
  progressBar?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export function CyberCard({
  children,
  className,
  dots = true,
  progressBar = false,
  onClick,
}: CyberCardProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag className={cn("cyber-frame text-left w-full", className)} onClick={onClick}>
      <span className="cyber-corner-tl" />
      <span className="cyber-corner-tr" />
      <span className="cyber-corner-bl" />
      <span className="cyber-corner-br" />

      {dots && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-[2] pointer-events-none">
          <span className="cyber-dot" />
          <span className="cyber-dot" />
          <span className="cyber-dot" />
        </div>
      )}

      {progressBar && <span className="cyber-progress" />}

      {children}
    </Tag>
  );
}
