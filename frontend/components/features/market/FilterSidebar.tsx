"use client";

import { Check } from "lucide-react";
import { CyberCard } from "@/components/ui/CyberCard";
import type { RequestStatus, RequestCategory } from "@/lib/types";

const categories: { value: RequestCategory; label: string }[] = [
  { value: "smart-contract", label: "Smart Contract" },
  { value: "frontend", label: "Frontend" },
  { value: "data-analysis", label: "Data Analysis" },
  { value: "audit", label: "Audit" },
  { value: "other", label: "Other" },
];

const statuses: { value: RequestStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "disputed", label: "Disputed" },
];

interface FilterSidebarProps {
  selectedStatus: RequestStatus | "all";
  selectedCategories: RequestCategory[];
  onStatusChange: (status: RequestStatus | "all") => void;
  onCategoryToggle: (category: RequestCategory) => void;
}

export function FilterSidebar({
  selectedStatus,
  selectedCategories,
  onStatusChange,
  onCategoryToggle,
}: FilterSidebarProps) {
  return (
    <aside className="w-full lg:w-56 flex flex-col gap-6">
      {/* Status */}
      <CyberCard dots={false} className="p-5">
        <div className="relative z-[1] flex flex-col gap-3">
          <h4 className="text-sm font-medium">Status</h4>
          <div className="flex flex-col gap-2">
            {statuses.map(({ value, label }) => (
              <label
                key={value}
                className="flex items-center gap-2.5 cursor-pointer text-sm group"
                onClick={() => onStatusChange(value)}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                  ${selectedStatus === value
                    ? "border-primary bg-primary/20 shadow-[0_0_6px_rgba(245,158,11,0.3)]"
                    : "border-white/20 group-hover:border-white/40"
                  }`}
                >
                  {selectedStatus === value && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </div>
                <span className={selectedStatus === value ? "text-foreground" : "text-muted-foreground"}>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </CyberCard>

      {/* Category */}
      <CyberCard dots={false} className="p-5">
        <div className="relative z-[1] flex flex-col gap-3">
          <h4 className="text-sm font-medium">Category</h4>
          <div className="flex flex-col gap-2">
            {categories.map(({ value, label }) => (
              <label
                key={value}
                className="flex items-center gap-2.5 cursor-pointer text-sm group"
                onClick={() => onCategoryToggle(value)}
              >
                <div className={`w-4 h-4 border-2 flex items-center justify-center transition-all
                  ${selectedCategories.includes(value)
                    ? "border-accent bg-accent/20 shadow-[0_0_6px_rgba(6,182,212,0.3)]"
                    : "border-white/20 group-hover:border-white/40"
                  }`}
                >
                  {selectedCategories.includes(value) && (
                    <Check className="w-3 h-3 text-accent" />
                  )}
                </div>
                <span className={selectedCategories.includes(value) ? "text-foreground" : "text-muted-foreground"}>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </CyberCard>
    </aside>
  );
}
