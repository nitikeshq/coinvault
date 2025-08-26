import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Users, DollarSign, Medal, Crown } from "lucide-react";
import type { 
  TokenConfig, 
} from "@shared/schema";
export default function Advertisements() {
  const { data: topInvestors = [] } = useQuery<any[]>({
    queryKey: ['/api/leaderboard/investors'],
  });

  const { data: topReferrers = [] } = useQuery<any[]>({
    queryKey: ['/api/leaderboard/referrers'],
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <Star className="h-5 w-5 text-gray-400" />;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          🏆 Leaderboards
        </h1>
        <p className="text-gray-600 text-lg">
          Celebrating our top performers and most successful referrers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Investors Leaderboard */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-3 text-2xl text-blue-800">
              <DollarSign className="h-8 w-8 text-blue-600" />
              Top 10 Investors
            </CardTitle>
            <p className="text-blue-600">Leading contributors to our ecosystem</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topInvestors.length > 0 ? (
                topInvestors.map((investor) => (
                  <div 
                    key={investor.user.id}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 hover:shadow-md ${
                      investor.rank <= 3 
                        ? 'bg-white border-2 border-blue-300 shadow-md' 
                        : 'bg-white/70 border border-blue-200'
                    }`}
                    data-testid={`investor-${investor.rank}`}
                  >
                    <div className="flex items-center gap-4">
                      <Badge className={`${getRankBadgeColor(investor.rank)} px-3 py-1 text-lg font-bold min-w-[40px] justify-center`}>
                        #{investor.rank}
                      </Badge>
                      {getRankIcon(investor.rank)}
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {investor.user.name || 'Anonymous'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {investor.user.email?.substring(0, 3)}***
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 text-lg">
                        CHIL {parseFloat(investor.totalInvested).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">Total Investment</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No investors yet</p>
                  <p className="text-sm text-gray-400">Be the first to make an investment!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Referrers Leaderboard */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-3 text-2xl text-purple-800">
              <Users className="h-8 w-8 text-purple-600" />
              Top 10 Referrers
            </CardTitle>
            <p className="text-purple-600">Most successful community builders</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topReferrers.length > 0 ? (
                topReferrers.map((referrer) => (
                  <div 
                    key={referrer.user.id}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 hover:shadow-md ${
                      referrer.rank <= 3 
                        ? 'bg-white border-2 border-purple-300 shadow-md' 
                        : 'bg-white/70 border border-purple-200'
                    }`}
                    data-testid={`referrer-${referrer.rank}`}
                  >
                    <div className="flex items-center gap-4">
                      <Badge className={`${getRankBadgeColor(referrer.rank)} px-3 py-1 text-lg font-bold min-w-[40px] justify-center`}>
                        #{referrer.rank}
                      </Badge>
                      {getRankIcon(referrer.rank)}
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {referrer.user.name || 'Anonymous'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {referrer.user.email?.substring(0, 3)}***
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600 text-lg">
                        ${parseFloat(referrer.totalEarnings).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {referrer.referralCount} referrals
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No referrers yet</p>
                  <p className="text-sm text-gray-400">Start referring friends to earn rewards!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How it Works Section */}
      <div className="mt-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
        <h2 className="text-3xl font-bold text-center mb-6">How Our Referral System Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6">
            <div className="bg-white/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">1. Share Your Code</h3>
            <p className="text-blue-100">Get your unique referral code and share it with friends</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6">
            <div className="bg-white/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">2. They Invest</h3>
            <p className="text-blue-100">When your friends make deposits, you both benefit</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6">
            <div className="bg-white/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">3. Earn 5% Bonus</h3>
            <p className="text-blue-100">Receive 5% of their deposit value as bonus tokens</p>
          </div>
        </div>
      </div>
    </div>
  );
}