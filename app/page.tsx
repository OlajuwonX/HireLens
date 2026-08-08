import Image from "next/image";
import Link from "next/link";

const capabilities = [
  {
    title: "Resume analysis",
    description: "See where your resume matches — and where it doesn't.",
  },
  {
    title: "Job targeting",
    description: "Turn job descriptions into clear requirements.",
  },
  {
    title: "Application documents",
    description: "Generate tailored cover letters and follow-ups.",
  },
  {
    title: "Tracking",
    description: "Follow every opportunity from discovery to offer.",
  },
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
          <Link
            href="/sign-in"
            className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
          >
            Sign in
          </Link>
        </nav>

        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold leading-tight text-gray-950 sm:text-5xl">
            Build a stronger application for every job you want.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600">
            Analyze your resume against real job requirements, spot missing
            evidence, generate tailored application documents, and keep your
            entire job search organized from one workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/sign-in"
              className="inline-flex h-11 items-center bg-gray-950 px-5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Create free account
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex h-11 items-center border border-gray-300 px-5 text-sm font-semibold text-gray-950 hover:bg-gray-50"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {capabilities.map((item) => (
            <div
              key={item.title}
              className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3"
            >
              <p className="text-sm font-semibold text-gray-950">{item.title}</p>
              <p className="mt-1 text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
