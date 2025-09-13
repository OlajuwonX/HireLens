import type { Route } from "./+types/home";
import Navbar from "../components/navbar";
import Particles from "../components/Particles";
import ResumeCard from "../components/resume.card";
import {Link, useNavigate} from "react-router";
import {useEffect, useState} from "react";
import {usePuterStore} from "../lib/puter";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "HireLens" },
    { name: "description", content: "Analyse your resume." },
  ];
}

export default function Home() {
    const { auth, kv } = usePuterStore();
    const navigate = useNavigate();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loadingResumes, setLoadingResumes] = useState<boolean>(false);

    useEffect(() => {
        if(!auth.isAuthenticated) navigate('/auth?next=/'); //if a user tries to access a secured route without
        // authenticated they will be blocked here.
    }, [auth.isAuthenticated])

    useEffect(() => {
        const loadResumes = async() => {
            setLoadingResumes(true);

            const resumes = (await kv.list('resume:*', true)) as KVItem[]

            const parsedResumes = resumes?.map((resume) => (
                JSON.parse(resume.value) as Resume
            ))
            console.log(parsedResumes, parsedResumes);
            setResumes(parsedResumes || []);
            setLoadingResumes(false);
        }
        loadResumes()
    }, []);

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
          <h1 className="text-6xl md:text-4xl sm:text-xl text-gradient leading-tight tracking-[-2px] font-semibold">Monitor Your Applications and Resume Scores</h1>
            {!loadingResumes && resumes?.length === 0 ? (
                <h2>Upload your resume for review</h2>
            ) : (
                <h2>Stay Ahead: Track Submissions and AI Insights</h2>
            )}
        </div>
          {loadingResumes && (
              <div className="flex flex-col justify-center items-center">
                  <img src="/images/resume-scan-2.gif" alt="Scanning" />
              </div>
          )}

          {!loadingResumes && resumes.length > 0 && (
              <div className="resumes-section w-full max-w-7xl">
                  {resumes.map((resume) => (
                      <ResumeCard key={resume.id} resume={resume} />
                  ))}
              </div>
          )}

          {!loadingResumes && resumes?.length === 0 && (
              <div className="flex flex-col itemscenter justify-center mt-10 gap-4">
                  <Link to="/upload" className="font-semibold primary-button w-fit text-xl">Upload Resume</Link>
              </div>
          )}
      </section>


    </main>
  );
}
