export default function Loading() {
  return (
    <main className="min-h-screen bg-surface px-6 py-8 text-text-primary">
      <div className="mx-auto w-full max-w-5xl animate-pulse">
        <div className="h-9 w-40 rounded bg-surface-elevated" />
        <div className="mt-20 h-10 w-full max-w-2xl rounded bg-surface-elevated" />
        <div className="mt-4 h-5 w-full max-w-xl rounded bg-surface-elevated" />
      </div>
    </main>
  );
}
