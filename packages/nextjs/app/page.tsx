
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-background font-sans flex flex-col">
      {/* Header / Intro Section */}
      <header className="w-full px-6 pt-12 pb-8 flex flex-col items-center text-center bg-background/80 shadow-md">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary mb-3 drop-shadow-lg">Accounts</h1>
        <p className="max-w-xl text-lg sm:text-xl text-foreground/80 mb-4">Welcome to the dashboard.</p>
      </header>

      {/* Card App Launcher Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        
      </main>

      <footer className="w-full py-6 text-center text-xs text-foreground/60 border-t border-foreground/10 mt-auto">
        &copy; {new Date().getFullYear()} Victor Diaz / VDCODER - Accounts
      </footer>
    </div>
  );
}
