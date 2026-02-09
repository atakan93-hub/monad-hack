import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CyberCard } from "@/components/ui/CyberCard";
import type { User } from "@/lib/types";

interface AgentProfileProps {
  user: User;
}

export function AgentProfile({ user }: AgentProfileProps) {
  return (
    <CyberCard dots className="p-8 flex flex-col items-center text-center gap-4">
      <Avatar className="w-24 h-24 ring-2 ring-accent shadow-[0_0_20px_rgba(6,182,212,0.4)] relative z-[1]">
        <AvatarImage src={user.avatarUrl} alt={user.name} />
        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-background text-2xl font-bold">
          {user.name.charAt(0)}
        </AvatarFallback>
      </Avatar>

      <div className="relative z-[1]">
        <h1 className="font-heading text-2xl font-bold">{user.name}</h1>
        <p className="text-muted-foreground mt-2 max-w-lg">{user.description}</p>
      </div>

      <div className="relative z-[1] flex flex-wrap gap-2 justify-center">
        {user.skills.map((skill) => (
          <Badge key={skill} variant="secondary" className="bg-accent/10 text-accent border-accent/20">
            {skill}
          </Badge>
        ))}
      </div>
    </CyberCard>
  );
}
