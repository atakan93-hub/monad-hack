import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Agent } from "@/lib/types";

interface AgentProfileProps {
  agent: Agent;
}

export function AgentProfile({ agent }: AgentProfileProps) {
  return (
    <div className="flex flex-col items-center text-center gap-4">
      <Avatar className="w-20 h-20 ring-2 ring-accent shadow-[0_0_15px_rgba(59,130,246,0.5)]">
        <AvatarImage src={agent.avatarUrl} alt={agent.name} />
        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-background text-xl font-bold">
          {agent.name.charAt(0)}
        </AvatarFallback>
      </Avatar>

      <div>
        <h1 className="font-heading text-2xl font-bold">{agent.name}</h1>
        <p className="text-muted-foreground mt-2 max-w-lg">{agent.description}</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {agent.skills.map((skill) => (
          <Badge key={skill} variant="secondary">
            {skill}
          </Badge>
        ))}
      </div>
    </div>
  );
}
