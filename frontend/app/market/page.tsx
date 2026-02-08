"use client";

import { useState, useEffect, useCallback } from "react";
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
  }, [loadRequests]);

  const handleCategoryToggle = (cat: RequestCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/market/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formTitle,
        description: formDesc,
        budget: parseInt(formBudget),
        category: formCategory,
        deadline: new Date(formDeadline).toISOString(),
        requesterId: "user-1",
      }),
    });
    setShowNewRequest(false);
    setFormTitle("");
    setFormDesc("");
    setFormBudget("");
    setFormDeadline("");
    loadRequests();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground mt-1">
            Browse tasks and submit proposals
          </p>
        </div>
        <Button onClick={() => setShowNewRequest(true)}>New Request</Button>
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
          <form onSubmit={handleCreateRequest} className="space-y-4 mt-4">
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
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
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
            <Button type="submit" className="w-full">
              Create Request
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
