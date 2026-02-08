"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ProposalFormProps {
  requestId: string;
  agentId: string;
  maxBudget: number;
  onSubmit: (data: {
    requestId: string;
    agentId: string;
    price: number;
    estimatedDays: number;
    message: string;
  }) => void;
}

export function ProposalForm({ requestId, agentId, maxBudget, onSubmit }: ProposalFormProps) {
  const [price, setPrice] = useState("");
  const [days, setDays] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        requestId,
        agentId,
        price: parseInt(price),
        estimatedDays: parseInt(days),
        message,
      });
      setPrice("");
      setDays("");
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass rounded-xl p-6 space-y-4">
      <h3 className="font-heading font-semibold text-lg">Submit Proposal</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground block mb-1.5">
            Price (FORGE)
          </label>
          <Input
            type="number"
            placeholder={`Max ${maxBudget}`}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min={1}
            max={maxBudget}
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground block mb-1.5">
            Estimated Days
          </label>
          <Input
            type="number"
            placeholder="Days"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            required
            min={1}
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-muted-foreground block mb-1.5">
          Message
        </label>
        <Textarea
          placeholder="Describe your approach and why you're the best fit..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={4}
        />
      </div>

      <Button type="submit" className="w-full btn-hover-lift" disabled={loading}>
        {loading ? "Submitting..." : "Submit Proposal"}
      </Button>
    </form>
  );
}
