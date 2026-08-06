export default function Loading() {
  return (
    <main className="min-h-screen bg-white px-6 py-8 text-gray-950">
      <div className="mx-auto w-full max-w-5xl animate-pulse">
        <div className="h-9 w-40 rounded bg-gray-100" />
        <div className="mt-20 h-10 w-full max-w-2xl rounded bg-gray-100" />
        <div className="mt-4 h-5 w-full max-w-xl rounded bg-gray-100" />
      </div>
    </main>
  );
}
