import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface ReferralData {
  referralCode: string;
}

export function useReferralShare() {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  
  const { data: referralData } = useQuery<ReferralData>({
    queryKey: ['/api/user/referral-code'],
  });

  const generateReferralUrl = (referralCode?: string) => {
    const baseUrl = window.location.origin;
    const code = referralCode || referralData?.referralCode;
    return code ? `${baseUrl}/register?ref=${code}` : `${baseUrl}/register`;
  };

  const shareReferralUrl = async (platform: 'copy' | 'telegram' | 'whatsapp' | 'twitter' | 'email') => {
    if (!referralData?.referralCode) {
      toast({
        title: "Error",
        description: "Referral code not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);
    const referralUrl = generateReferralUrl();
    const message = `🚀 Join me in the CryptoWallet Pro presale! Use my referral link to get exclusive benefits: ${referralUrl}`;

    try {
      switch (platform) {
        case 'copy':
          await navigator.clipboard.writeText(referralUrl);
          toast({
            title: "Success!",
            description: "Referral link copied to clipboard",
          });
          break;
        
        case 'telegram':
          window.open(`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(message)}`, '_blank');
          break;
        
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
          break;
        
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, '_blank');
          break;
        
        case 'email':
          const subject = 'Join CryptoWallet Pro Presale';
          const body = `Hi there!\n\nI wanted to share an exciting opportunity with you. I'm participating in the CryptoWallet Pro presale and thought you might be interested too.\n\nUse my referral link to get exclusive benefits:\n${referralUrl}\n\nBest regards!`;
          window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
          break;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share referral link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return {
    referralCode: referralData?.referralCode,
    referralUrl: generateReferralUrl(),
    shareReferralUrl,
    isSharing,
  };
}