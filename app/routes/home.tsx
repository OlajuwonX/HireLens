import type { Route } from "./+types/home";
import Navbar from "../components/navbar";
import Particles from "../components/Particles";
import {resumes} from "../../constants";
import ResumeCard from "../components/resume.card";
import { useNavigate} from "react-router";
import {useEffect} from "react";
import {usePuterStore} from "../lib/puter";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "HireLens" },
    { name: "description", content: "Analyse your resume." },
  ];
}

export default function Home() {
    const { isLoading, auth } = usePuterStore();
    const navigate = useNavigate();

    useEffect(() => {
        if(!auth.isAuthenticated) navigate('/auth?next=/'); //if a user tries to access a secured route without
        // authenticated they will be blocked here.
    }, [auth.isAuthenticated])

    return (
    <main className="relative w-full h-screen overflow-auto bg-gray-100">
      <Navbar />
      {/* Particles Background*/}
      <div className="absolute inset-0 z-0">
        <Particles
            particleColors={["#00ff00", "#00008b", "#ff0000"]}
            particleCount={200}
            particleSpread={12}
            speed={0.2}
            particleBaseSize={130}
            moveParticlesOnHover={true}
            alphaParticles={false}
            disableRotation={false}
            className="w-full h-full"
        />
      </div>
      <section className="main-section relative z-10 pt-12 pb-20 px-4">
        <div className="page-heading text-center">
          <h1>Monitor Your Applications and Resume Scores</h1>
          <h2>Stay Ahead: Track Submissions and AI Insights</h2>
        </div>

          {resumes.length > 0 && (
              <div className="resumes-section w-full max-w-7xl">
                  {resumes.map((resume) => (
                      <ResumeCard key={resume.id} resume={resume} />
                  ))}
              </div>
          )}
      </section>


    </main>
  );
}
