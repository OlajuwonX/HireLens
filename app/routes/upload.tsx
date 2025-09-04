import {useState} from 'react'
import Navbar from "../components/navbar";
import Particles from "../components/Particles";

const Upload = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {}

    return (
        <main className="relative w-full h-screen overflow-auto bg-gray-200">
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
                    {isProcessing ? (
                        <>
                            <h2>
                                {statusText}
                            </h2>
                            <img src="/images/resume-scan.gif" alt="resumeScan" className="full" />
                        </>
                    ) : (
                        <h2>Upload your resume to check your ATS score and improvement tips</h2>
                    )}
                    {!isProcessing && (
                        <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4">

                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}
export default Upload
