import { Github, FileText, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto">
      <div className="glass border-t border-white/[0.06] py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            &copy; 2026 TaskForge
          </p>
          <div className="flex gap-4">
            <a
              href="#"
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center
                         text-muted-foreground hover:text-foreground hover:bg-white/10
                         transition-all duration-200"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center
                         text-muted-foreground hover:text-foreground hover:bg-white/10
                         transition-all duration-200"
              aria-label="Docs"
            >
              <FileText className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center
                         text-muted-foreground hover:text-foreground hover:bg-white/10
                         transition-all duration-200"
              aria-label="Twitter"
            >
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
