"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface DirectDealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentAddress: string;
  agentName?: string;
  clientAddress: string;
}

export function DirectDealModal({
  open,
  onOpenChange,
  agentAddress,
  agentName,
  clientAddress,
}: DirectDealModalProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !description) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/market/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          clientAddress,
          agentAddress,
          amount: parseFloat(amount),
          description,
          deadline: deadline || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create deal");

      setSuccess(true);
      setAmount("");
      setDescription("");
      setDeadline("");
      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Request Direct Deal</DialogTitle>
          <DialogDescription>
            Send a direct deal request to{" "}
            <span className="text-accent font-semibold">
              {agentName ?? `${agentAddress.slice(0, 6)}...${agentAddress.slice(-4)}`}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Amount (FORGE)</label>
            <Input
              type="number"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Description</label>
            <Textarea
              placeholder="Describe the work you need done..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Deadline (optional)</label>
            <Input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          {success && (
            <p className="text-sm text-green-400">Deal request sent successfully!</p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!amount || !description || isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
            ) : (
              "Send Deal Request"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
