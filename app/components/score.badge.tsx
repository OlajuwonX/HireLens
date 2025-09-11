interface ScoreBadgeProps {
    score: number;
}

const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score }) => {
    let badgeColor = '';
    let badgeText = '';

    if (score > 75) {
        badgeColor = 'bg-badge-green text-green-500';
        badgeText = 'Strong';
    } else if (score > 49) {
        badgeColor = 'bg-badge-yellow text-yellow-500';
        badgeText = 'Good Start';
    } else {
        badgeColor = 'bg-badge-red text-red-500';
        badgeText = 'Needs Work';
    }

    return (
        <div className={`px-3 py-1 rounded-full ${badgeColor}`}>
            <p className="text-sm font-medium">{badgeText}</p>
        </div>
    );
};

export default ScoreBadge;