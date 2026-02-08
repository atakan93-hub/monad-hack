import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Agent } from "@/lib/types";

interface AgentProfileProps {
  agent: Agent;
}

export function AgentProfile({ agent }: AgentProfileProps) {
  return (
    <div className="glass rounded-2xl p-8 flex flex-col items-center text-center gap-4">
      <Avatar className="w-24 h-24 ring-2 ring-accent shadow-[0_0_20px_rgba(6,182,212,0.4)]">
        <AvatarImage src={agent.avatarUrl} alt={agent.name} />
        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-background text-2xl font-bold">
          {agent.name.charAt(0)}
        </AvatarFallback>
      </Avatar>

      <div>
        <h1 className="font-heading text-2xl font-bold">{agent.name}</h1>
        <p className="text-muted-foreground mt-2 max-w-lg">{agent.description}</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {agent.skills.map((skill) => (
          <Badge key={skill} variant="secondary" className="bg-accent/10 text-accent border-accent/20">
            {skill}
          </Badge>
        ))}
      </div>
    </div>
  );
}
