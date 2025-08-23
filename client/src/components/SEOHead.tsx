import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  structuredData?: object;
  siteName?: string;
  logoUrl?: string;
}

export default function SEOHead({
  title = "CryptoWallet Pro - Revolutionary Cryptocurrency Platform",
  description = "Join the future of cryptocurrency with our revolutionary platform. Secure wallet, NFT marketplace, and DApp ecosystem. Limited presale opportunity.",
  keywords = "cryptocurrency, presale, ICO, blockchain, wallet, NFT, DApp, investment, crypto, token sale",
  canonical = window.location.href,
  ogImage,
  ogType = "website",
  structuredData,
  siteName = "CryptoWallet Pro",
  logoUrl
}: SEOHeadProps) {
  
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update or create meta tags
    const updateMeta = (name: string, content: string, property?: boolean) => {
      const attribute = property ? 'property' : 'name';
      const selector = `meta[${attribute}="${name}"]`;
      let element = document.querySelector(selector) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // Update or create link tags
    const updateLink = (rel: string, href: string, type?: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      
      if (!element) {
        element = document.createElement('link');
        element.rel = rel;
        document.head.appendChild(element);
      }
      element.href = href;
      if (type) element.type = type;
    };

    // Basic meta tags
    updateMeta('description', description);
    updateMeta('keywords', keywords);
    updateMeta('robots', 'index, follow');
    updateMeta('author', siteName);
    updateMeta('viewport', 'width=device-width, initial-scale=1, maximum-scale=5');
    updateMeta('theme-color', '#7c3aed');
    updateMeta('application-name', siteName);
    updateMeta('msapplication-TileColor', '#7c3aed');

    // Open Graph
    updateMeta('og:title', title, true);
    updateMeta('og:description', description, true);
    updateMeta('og:type', ogType, true);
    updateMeta('og:url', canonical, true);
    updateMeta('og:site_name', siteName, true);
    updateMeta('og:locale', 'en_US', true);
    
    if (ogImage) {
      updateMeta('og:image', ogImage, true);
      updateMeta('og:image:alt', `${siteName} Logo`, true);
    }

    // Twitter
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    updateMeta('twitter:site', `@${siteName.replace(/\s+/g, '')}`);
    
    if (ogImage) {
      updateMeta('twitter:image', ogImage);
    }

    // Canonical link
    updateLink('canonical', canonical);
    
    // Favicon and icons
    if (logoUrl) {
      updateLink('icon', logoUrl);
      updateLink('apple-touch-icon', logoUrl);
      updateLink('icon', logoUrl, 'image/png');
    }

    // Structured data
    if (structuredData) {
      let scriptElement = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      
      if (!scriptElement) {
        scriptElement = document.createElement('script');
        scriptElement.type = 'application/ld+json';
        document.head.appendChild(scriptElement);
      }
      
      scriptElement.textContent = JSON.stringify(structuredData);
    }

  }, [title, description, keywords, canonical, ogImage, ogType, structuredData, siteName, logoUrl]);

  return null; // This component doesn't render anything
}