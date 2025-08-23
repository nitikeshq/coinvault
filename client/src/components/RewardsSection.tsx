interface RewardsSectionProps {
  currentPool: number;
  newContributors: number;
  eligibleMembers: number;
  estimatedReward: number;
  userPendingRewards?: number;
}

export function RewardsSection({ 
  currentPool, 
  newContributors, 
  eligibleMembers, 
  estimatedReward,
  userPendingRewards = 0 
}: RewardsSectionProps) {
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <div className="bg-gradient-to-r from-green-900 to-blue-900 p-6 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-white">🎁 Weekly Rewards Pool</h4>
        {userPendingRewards > 0 && (
          <div className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            Pending: {formatCurrency(userPendingRewards)}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-black/20 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-400">{formatCurrency(currentPool)}</div>
          <div className="text-sm text-gray-300">Current Pool</div>
        </div>
        <div className="bg-black/20 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-400">{newContributors}</div>
          <div className="text-sm text-gray-300">New Contributors</div>
        </div>
        <div className="bg-black/20 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-400">{eligibleMembers}</div>
          <div className="text-sm text-gray-300">Eligible Members</div>
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-sm text-gray-300 mb-2">Estimated reward per member this week:</div>
        <div className="text-xl font-bold text-yellow-400">{formatCurrency(estimatedReward)} each</div>
      </div>
      
      <div className="mt-4 text-xs text-gray-400 text-center">
        <p>• 10% of deposits from new members goes to existing members weekly</p>
        <p>• Example: 5 people deposit ₹100 each → ₹50 goes to pool → distributed among existing members</p>
        <p>• Only existing members receive rewards, new depositors contribute to next week's pool</p>
      </div>
      
      <div className="mt-4 flex justify-center">
        <div className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm cursor-pointer">
          View My Rewards History
        </div>
      </div>
    </div>
  );
}