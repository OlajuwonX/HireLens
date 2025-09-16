import {Link, useNavigate, useParams} from "react-router";
import {useEffect, useState} from "react";
import {usePuterStore} from "../lib/puter";
import Particles from "../components/Particles";
import Summary from "../components/summary";
import Details from "../components/details";
import ATS from "../components/ATS";

export const meta = () => ([
    { title: 'HireLens | Review' },
    { name: 'description', content: 'Professional background overview' },
])

const Resume = () => {
    const {auth, isLoading, fs, kv } = usePuterStore();
    const {id} = useParams(); //destructure id coming from react-router
    const [imageUrl, setImageUrl] = useState("");
    const [resumeUrl, setResumeUrl] = useState("");
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if(!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`); //if a user tries to access a
        // secured route
        // without
        // authenticated they will be blocked here.
    }, [isLoading])

    useEffect(() => {
        const loadResume = async () => {
            const resume = await kv.get(`resume:${id}`); //to get access to a specific resume.
            if(!resume) return;

            const data = JSON.parse(resume); //Blobs are used to read pdf files, ie pdf blobs to pdf file, img
            // blobs to img files.

            const resumeBlob = await fs.read(data.resumePath);
            if(!resumeBlob) return;

            const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
            const resumeUrl = URL.createObjectURL(pdfBlob);
            setResumeUrl(resumeUrl);

            const imageBlob = await fs.read(data.imagePath);
            if(!imageBlob) return;
            const imageUrl = URL.createObjectURL(imageBlob);
            setImageUrl(imageUrl);

            setFeedback(data.feedback)
            console.log({resumeUrl, imageUrl, feedback: data.feedback});
        }
        loadResume();
    }, [id]) //to load data about current resume immediately, id is passed to recall function after access to id is
    // fetched. resume is loaded from key value store coming from puter.

    return (
        <main className="!pt-0">
            <nav className="resume-nav overflow-auto relative z-10">
                <Link to="/" className="back-button">
                    <img src="/icon/back.svg" alt="back" className="size-2.5" />
                    <span className="text-gray-900 text-sm font-semibold">Back to Homepage</span>
                </Link>
            </nav>
            {/* Particles Background*/}
            <div className="absolute inset-0 z-0 h-full">
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
            <div className="flex flex-col w-full lg:flex-row md:flex-col sm:flex-col relative">
                <section className="feedback-section">
                    <h2 className="text-4xl font-semibold !text-gray-900">Resume Analysis</h2>
                    {feedback ? (
                        <div
                            className="flex flex-col gap-8 animate-in fade-in duration-1000 text-gray-900"
                        >
                            <Summary feedback={feedback} />
                            <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
                            <Details feedback={feedback} />
                        </div>
                    ) : (
                        <img
                            src="/images/resume-scan-2.gif"
                            className="w-full"
                        />
                    )}
                </section>

                <section
                    className="feedback-section h-[100vh] top-0 sticky items-center justify--center">
                    {imageUrl && resumeUrl && (
                        <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit">
                            <a
                                href={resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <img
                                    src={imageUrl}
                                    className="w-full h-full object-contain rounded-2xl"
                                    title="resume"
                                />
                            </a>
                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}
export default Resume