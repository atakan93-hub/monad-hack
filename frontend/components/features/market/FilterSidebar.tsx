"use client";

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
    <aside className="w-full lg:w-56 space-y-6">
      {/* Status */}
      <div>
        <h4 className="text-sm font-medium mb-3">Status</h4>
        <div className="space-y-2">
          {statuses.map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <input
                type="radio"
                name="status"
                checked={selectedStatus === value}
                onChange={() => onStatusChange(value)}
                className="accent-primary"
              />
              <span className="text-muted-foreground">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <h4 className="text-sm font-medium mb-3">Category</h4>
        <div className="space-y-2">
          {categories.map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(value)}
                onChange={() => onCategoryToggle(value)}
                className="accent-primary"
              />
              <span className="text-muted-foreground">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
