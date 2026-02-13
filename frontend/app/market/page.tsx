"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useUser } from "@/lib/hooks/useUser";
import { Button } from "@/components/ui/button";
import { RequestCard } from "@/components/features/market/RequestCard";
import { FilterSidebar } from "@/components/features/market/FilterSidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getRequests } from "@/lib/supabase-api";
import type { TaskRequest, RequestStatus, RequestCategory } from "@/lib/types";

export default function MarketPage() {
  const { address } = useUser();
  const [requests, setRequests] = useState<TaskRequest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus | "all">("all");
  const [selectedCategories, setSelectedCategories] = useState<RequestCategory[]>([]);
  const [showNewRequest, setShowNewRequest] = useState(false);

  // New request form state
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [formCategory, setFormCategory] = useState<RequestCategory>("smart-contract");
  const [formDeadline, setFormDeadline] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const loadRequests = useCallback(async () => {
    const data = await getRequests(
      selectedStatus === "all" ? undefined : { status: selectedStatus }
    );
    const filtered =
      selectedCategories.length > 0
        ? data.filter((r) => selectedCategories.includes(r.category))
        : data;
    setRequests(filtered);
  }, [selectedStatus, selectedCategories]);

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 30_000);
    return () => clearInterval(interval);
  }, [loadRequests]);

  const handleCategoryToggle = (cat: RequestCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch("/api/market/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDesc,
          budget: parseInt(formBudget),
          category: formCategory,
          deadline: new Date(formDeadline).toISOString(),
          address,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Request failed (${res.status})`);
      }
      setShowNewRequest(false);
      setFormTitle("");
      setFormDesc("");
      setFormBudget("");
      setFormDeadline("");
      loadRequests();
      toast.success("Request created!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create request");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight">
            <span className="text-gradient-amber">Marketplace</span>
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2 text-sm tracking-wide">
            <span className="w-6 h-px bg-gradient-to-r from-cyan-500/50 to-transparent" />
            Browse tasks and submit proposals
          </p>
        </div>
        <Button onClick={() => setShowNewRequest(true)} className="glow-amber-sm btn-hover-lift">
          New Request
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-col lg:flex-row gap-8">
        <FilterSidebar
          selectedStatus={selectedStatus}
          selectedCategories={selectedCategories}
          onStatusChange={setSelectedStatus}
          onCategoryToggle={handleCategoryToggle}
        />

        <div className="flex-1">
          <div className="grid md:grid-cols-2 gap-6">
            {requests.map((req) => (
              <RequestCard key={req.id} request={req} />
            ))}
          </div>
          {requests.length === 0 && (
            <p className="text-center text-muted-foreground py-20">
              No requests found.
            </p>
          )}
        </div>
      </div>

      {/* New Request Modal */}
      <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Create New Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRequest} className="flex flex-col gap-4 mt-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-1.5">Title</label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Smart Contract Audit"
                required
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1.5">Description</label>
              <Textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Describe your task in detail..."
                required
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1.5">Budget (FORGE)</label>
                <Input
                  type="number"
                  value={formBudget}
                  onChange={(e) => setFormBudget(e.target.value)}
                  placeholder="5000"
                  required
                  min={1}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1.5">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as RequestCategory)}
                  className="w-full bg-background border border-input px-3 py-2 text-sm rounded-md
                           transition-all duration-200 focus:border-cyan-500/40 focus:shadow-[0_0_8px_rgba(6,182,212,0.15)] focus:outline-none"
                >
                  <option value="smart-contract">Smart Contract</option>
                  <option value="frontend">Frontend</option>
                  <option value="data-analysis">Data Analysis</option>
                  <option value="audit">Audit</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1.5">Deadline</label>
              <Input
                type="date"
                value={formDeadline}
                onChange={(e) => setFormDeadline(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Request"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
