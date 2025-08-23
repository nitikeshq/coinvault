import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar } from "lucide-react";

export default function NewsSection() {
  const { data: news = [] } = useQuery<any[]>({
    queryKey: ['/api/news'],
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      return diffHours === 0 ? "Just now" : `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return "1 day ago";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'market': 'bg-crypto-blue/20 text-crypto-blue',
      'technology': 'bg-crypto-green/20 text-crypto-green',
      'platform': 'bg-crypto-gold/20 text-crypto-gold',
      'regulation': 'bg-red-500/20 text-red-400',
      'investment': 'bg-purple-500/20 text-purple-400',
      'education': 'bg-cyan-500/20 text-cyan-400',
    };
    return colors[category.toLowerCase()] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Latest News</h2>
          <p className="text-gray-400">Stay updated with the latest crypto news and announcements</p>
        </div>

        {news.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((article: any) => (
              <Card 
                key={article.id} 
                className="bg-crypto-dark border-white/10 hover:border-crypto-gold/50 transition-colors overflow-hidden group"
                data-testid={`news-article-${article.id}`}
              >
                {article.imageUrl && (
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={article.imageUrl} 
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400";
                      }}
                    />
                  </div>
                )}
                
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={getCategoryColor(article.category)} data-testid={`news-category-${article.id}`}>
                      {article.category}
                    </Badge>
                    <div className="flex items-center text-xs text-gray-400">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span data-testid={`news-date-${article.id}`}>{formatDate(article.createdAt)}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-crypto-gold transition-colors" data-testid={`news-title-${article.id}`}>
                    {article.title}
                  </h3>
                  
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3" data-testid={`news-description-${article.id}`}>
                    {article.description}
                  </p>
                  
                  {article.externalUrl && (
                    <a 
                      href={article.externalUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-crypto-gold hover:text-yellow-400 text-sm font-medium transition-colors"
                      data-testid={`news-link-${article.id}`}
                    >
                      Read More
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-crypto-gray/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No News Available</h3>
            <p className="text-gray-400 mb-6">Stay tuned for the latest updates and announcements.</p>
          </div>
        )}
      </div>
    </section>
  );
}
