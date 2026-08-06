import Image from "next/image";

const foundationItems = [
  "Next.js 15 App Router shell",
  "Mobile-first SaaS foundation",
  "Resume workspace direction",
  "Port 5000 development standard",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white px-6 py-8 text-gray-950">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col justify-between gap-10">
        <nav className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/hllogo.png"
              alt=""
              width={44}
              height={36}
              priority
              className="rounded-sm"
            />
            <span className="text-xl font-bold">HireLens</span>
          </div>
          <span className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600">
            Stage 01
          </span>
        </nav>

        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-normal text-green-700">
            Foundation ready
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-gray-950 sm:text-5xl">
            A production SaaS foundation for resume analysis and application
            tracking.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600">
            This stage establishes the Next.js App Router base. Product
            features will move in through the staged rebuild plan so every
            commit stays easy to review and debug.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {foundationItems.map((item) => (
            <div
              key={item}
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
