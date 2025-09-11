import ScoreGuage from "./score.guage";
import ScoreBadge from "./score.badge";

const Category= ({title, score}: { title: string, score: number }) => {

    const textColor = score > 75 ? "text-green-500" : score > 49 ? "text-yellow-500" : "text-red-500";

    return (
        <div className="resume-summary">
            <div className="category">
                <div className="flex font-semibold flex-row gap-2 items-center justify-center">
                    <p className="text-2xl sm:text-xl md:text-xl ">{title}</p>
                    <ScoreBadge score={score} />
                </div>
                <p className="text-2xl sm:text-xl md:text-xl font-semibold">
                    <span className={textColor}>
                        {score}
                    </span>/100
                </p>
            </div>
        </div>
    )
}

const Summary = ({feedback}: {feedback: Feedback}) => {
    return (
        <div className="bg-inherit rounded-2xl shadow-md w-full">
            <div className="flex flex-row items-center p-4 gap-8">
                <ScoreGuage score={feedback.overallScore} />
                <div className="flex flex-col gap-2">
                    <h2 className="">Your Resume Score</h2>
                    <p className="text-sm text-gray-600">
                        This score is calculated based on the variables listed below
                    </p>
                </div>
            </div>

            <Category title="Tone & Style" score={feedback.toneAndStyle.score} />
            <Category title="Content" score={feedback.content.score} />
            <Category title="Structure" score={feedback.structure.score} />
            <Category title="Skills" score={feedback.skills.score} />
        </div>
    )
}
export default Summary
