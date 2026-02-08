export function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-muted-foreground text-sm">
          &copy; 2026 TaskForge
        </p>
        <div className="flex gap-6">
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            GitHub
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Docs
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Twitter
          </a>
        </div>
      </div>
    </footer>
  );
}
