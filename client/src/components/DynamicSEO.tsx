import { useEffect } from 'react';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';

export function DynamicSEO() {
  const { settings } = useWebsiteSettings();

  useEffect(() => {
    if (settings) {
      // Update title
      const title = settings.seoTitle || `${settings.siteName || 'Crypto Wallet'} - Secure BEP-20 Token Wallet`;
      document.title = title;
      
      // Update meta description
      const description = settings.seoDescription || "Secure cryptocurrency wallet for BEP-20 tokens with NFT marketplace, trading, and DeFi features";
      let metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      } else {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        metaDescription.setAttribute('content', description);
        document.head.appendChild(metaDescription);
      }
      
      // Update meta keywords
      const keywords = settings.seoKeywords || "cryptocurrency, wallet, BEP-20, NFT, trading, DeFi, blockchain";
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute('content', keywords);
      } else {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        metaKeywords.setAttribute('content', keywords);
        document.head.appendChild(metaKeywords);
      }
      
      // Update Open Graph meta tags
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', title);
      } else {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        ogTitle.setAttribute('content', title);
        document.head.appendChild(ogTitle);
      }
      
      let ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute('content', description);
      } else {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        ogDescription.setAttribute('content', description);
        document.head.appendChild(ogDescription);
      }
      
      // Update apple-mobile-web-app-title
      let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (appleTitle) {
        appleTitle.setAttribute('content', settings.siteName || 'Crypto Wallet');
      }
    }
  }, [settings]);

  return null; // This component only handles side effects
}