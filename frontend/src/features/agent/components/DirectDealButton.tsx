"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Handshake } from "lucide-react";
import { DirectDealModal } from "@/features/market/components/DirectDealModal";

interface DirectDealButtonProps {
  agentAddress: string;
  agentName?: string;
  clientAddress: string;
}

export function DirectDealButton({ agentAddress, agentName, clientAddress }: DirectDealButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="border-accent/30 text-accent hover:bg-accent/10 hover:shadow-[0_0_12px_rgba(6,182,212,0.2)]
                   transition-[background-color,box-shadow,transform] duration-300"
        onClick={() => setOpen(true)}
      >
        <Handshake className="w-4 h-4 mr-2" />
        Direct Deal
      </Button>

      <DirectDealModal
        open={open}
        onOpenChange={setOpen}
        agentAddress={agentAddress}
        agentName={agentName}
        clientAddress={clientAddress}
      />
    </>
  );
}
