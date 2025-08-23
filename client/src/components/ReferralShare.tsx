import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Share2, 
  Copy, 
  Users, 
  Gift, 
  MessageCircle, 
  Mail, 
  Twitter,
  ExternalLink,
  TrendingUp
} from 'lucide-react';
import { useReferralShare } from '@/hooks/useReferralShare';
import { useQuery } from '@tanstack/react-query';

interface ReferralEarning {
  id: string;
  referredUsername: string;
  depositAmount: number;
  earningsAmount: number;
  createdAt: string;
}

export default function ReferralShare() {
  const { referralCode, referralUrl, shareReferralUrl, isSharing } = useReferralShare();

  // Fetch referral earnings
  const { data: referralEarnings = [] } = useQuery<ReferralEarning[]>({
    queryKey: ['/api/user/referral-earnings'],
  });

  const totalEarnings = referralEarnings.reduce((sum, earning) => sum + earning.earningsAmount, 0);

  const shareButtons = [
    {
      platform: 'copy' as const,
      icon: <Copy className="h-4 w-4" />,
      label: 'Copy Link',
      color: 'bg-gray-600 hover:bg-gray-700'
    },
    {
      platform: 'telegram' as const,
      icon: <MessageCircle className="h-4 w-4" />,
      label: 'Telegram',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      platform: 'whatsapp' as const,
      icon: <MessageCircle className="h-4 w-4" />,
      label: 'WhatsApp',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      platform: 'twitter' as const,
      icon: <Twitter className="h-4 w-4" />,
      label: 'Twitter',
      color: 'bg-sky-500 hover:bg-sky-600'
    },
    {
      platform: 'email' as const,
      icon: <Mail className="h-4 w-4" />,
      label: 'Email',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Referral Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-800">{referralEarnings.length}</div>
            <div className="text-blue-600 text-sm">Referrals</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 text-center">
            <Gift className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-800">{totalEarnings.toFixed(2)}</div>
            <div className="text-green-600 text-sm">Total Earnings</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-800">5%</div>
            <div className="text-purple-600 text-sm">Commission Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Share Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share2 className="h-5 w-5 text-blue-600" />
            <span>Share Your Referral Link</span>
          </CardTitle>
          <CardDescription>
            Earn 5% of every deposit your friends make! Share your unique referral link to start earning.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Referral Code Display */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Your Referral Code</label>
            <div className="flex items-center space-x-2">
              <Input
                value={referralCode || ''}
                readOnly
                className="font-mono bg-gray-50"
              />
              <Badge className="bg-blue-600">{referralCode}</Badge>
            </div>
          </div>

          {/* Referral URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Your Referral Link</label>
            <Input
              value={referralUrl}
              readOnly
              className="font-mono bg-gray-50 text-sm"
            />
          </div>

          <Separator />

          {/* Share Buttons */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">Share via:</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {shareButtons.map((button) => (
                <Button
                  key={button.platform}
                  onClick={() => shareReferralUrl(button.platform)}
                  disabled={isSharing}
                  className={`${button.color} text-white flex items-center justify-center space-x-2 text-sm`}
                  data-testid={`button-share-${button.platform}`}
                >
                  {button.icon}
                  <span className="hidden sm:inline">{button.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* How it Works */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center">
              <Gift className="h-4 w-4 mr-2" />
              How Referrals Work
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Share your referral link with friends</li>
              <li>• They register using your link or referral code</li>
              <li>• You earn 5% of their deposit amount</li>
              <li>• Earnings are credited instantly when their deposit is approved</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      {referralEarnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Referral Earnings History</CardTitle>
            <CardDescription>Your recent referral earnings and commissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {referralEarnings.map((earning) => (
                <div key={earning.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{earning.referredUsername}</div>
                      <div className="text-sm text-gray-600">
                        Deposit: ${earning.depositAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      +${earning.earningsAmount.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(earning.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}