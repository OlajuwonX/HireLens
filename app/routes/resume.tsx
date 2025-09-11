import {Link, useParams} from "react-router";
import {useEffect} from "react";

export const meta = () => ([
    { title: 'HireLens | Review' },
    { name: 'description', content: 'Professional background overview' },
])

const Resume = () => {

    const {id} = useParams(); //destructure id coming from react-router

    useEffect(() => {}) //to load data about current resume immediately
    return (
        <main className="!pt-0">
            <nav className="resume-nav">
                <Link to="/" className="back-button">
                    <img src="/icon/back.svg" alt="back" className="size-2.5" />
                    <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
                </Link>
            </nav>
            <div className="flex flex-col w-full max-lg:flex-col-reverse">
                <section
                    className="feedback-section">
                    {imageUrl && resumeUrl && (
                        <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit">

                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}
export default Resume
