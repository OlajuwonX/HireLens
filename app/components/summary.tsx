import ScoreGuage from "./score.guage";

const Summary = ({feedback}: {feedback: Feedback}) => {
    return (
        <div className="bg-white rounded-2xl shadow-md w-full">
            <div className="flex flex-row items-center p-4 gap-8">
                <ScoreGuage score={feedback.overallScore} />
            </div>
        </div>
    )
}
export default Summary
