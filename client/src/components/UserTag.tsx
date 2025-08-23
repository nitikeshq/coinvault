interface UserTagProps {
  tag: string;
  totalInvestmentInr: number;
  showAmount?: boolean;
}

export function UserTag({ tag, totalInvestmentInr, showAmount = false }: UserTagProps) {
  const getTagColor = (tag: string): string => {
    switch (tag) {
      case "Whales":
        return "bg-gradient-to-r from-purple-600 to-pink-600 text-white";
      case "Sharks":
        return "bg-gradient-to-r from-red-600 to-orange-600 text-white";
      case "VVIP":
        return "bg-gradient-to-r from-yellow-600 to-orange-500 text-white";
      case "VIP":
        return "bg-gradient-to-r from-blue-600 to-purple-600 text-white";
      case "Premium":
        return "bg-gradient-to-r from-green-600 to-blue-600 text-white";
      case "Members":
        return "bg-gradient-to-r from-slate-700 to-slate-800 text-white border border-slate-600";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getTagIcon = (tag: string): string => {
    switch (tag) {
      case "Whales":
        return "🐋";
      case "Sharks":
        return "🦈";
      case "VVIP":
        return "💎";
      case "VIP":
        return "👑";
      case "Premium":
        return "⭐";
      case "Members":
        return "👤";
      default:
        return "📱";
    }
  };

  const formatAmount = (amount: number): string => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toFixed(0)}`;
  };

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTagColor(tag)}`}>
      <span className="mr-1">{getTagIcon(tag)}</span>
      <span>{tag}</span>
      {showAmount && totalInvestmentInr > 0 && (
        <span className="ml-2 text-xs opacity-90">
          ({formatAmount(totalInvestmentInr)})
        </span>
      )}
    </div>
  );
}