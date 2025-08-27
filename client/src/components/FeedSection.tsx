import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Stories from "@/components/Stories";
import UserSearch from "@/components/UserSearch";
import { Link } from "wouter";
import { 
  Heart, 
  MessageCircle, 
  Gift, 
  Share2, 
  Upload, 
  Play, 
  Pause,
  User,
  UserPlus,
  Eye,
  Send,
  Search,
  ArrowLeft
} from "lucide-react";

interface VideoData {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  viewCount: number;
  likeCount: number;
  giftCount: number;
  commentCount: number;
  user: {
    id: string;
    name: string;
    username: string;
    profileImageUrl: string;
    isVerified: boolean;
    followerCount: number;
  };
  createdAt: string;
}

interface FeedSectionProps {
  onBack?: () => void;
}

export default function FeedSection({ onBack }: FeedSectionProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Upload states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");

  // Story and search states
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [selectedStory, setSelectedStory] = useState<any>(null);

  // Check if Feed is enabled
  const { data: feedSettings } = useQuery({
    queryKey: ["/api/feed/settings"],
  });

  // Get gift types for gifting
  const { data: giftTypes = [] } = useQuery<any[]>({
    queryKey: ["/api/feed/gift-types"],
    enabled: feedSettings?.isEnabled,
  });

  // Get stories for the top section
  const { data: stories = [] } = useQuery<any[]>({
    queryKey: ["/api/feed/stories"],
    queryFn: () => apiRequest("GET", "/api/feed/stories"),
    enabled: feedSettings?.isEnabled,
  });

  // Infinite query for feed videos
  const {
    data: videosData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["/api/feed/videos"],
    queryFn: ({ pageParam = 0 }) => 
      apiRequest("GET", `/api/feed/videos?page=${pageParam}&limit=5`),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === 5 ? pages.length : undefined;
    },
    enabled: feedSettings?.isEnabled,
  });

  const videos = videosData?.pages.flat() || [];

  // Auto-play video when it comes into view
  useEffect(() => {
    if (!videos.length) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoId = entry.target.getAttribute('data-video-id');
          const video = videoRefs.current[videoId!];
          
          if (entry.isIntersecting && video) {
            // Pause all other videos
            Object.values(videoRefs.current).forEach(v => v.pause());
            
            // Play this video
            video.play().catch(console.error);
            setActiveVideo(videoId);
            
            // Track view
            apiRequest("POST", `/api/feed/video/${videoId}/view`);
          }
        });
      },
      { threshold: 0.7 }
    );

    // Observe all video containers
    document.querySelectorAll('[data-video-id]').forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [videos]);

  // Upload video mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return fetch('/api/feed/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({ title: "Success!", description: "Video uploaded successfully!" });
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTitle("");
      setUploadDescription("");
      queryClient.invalidateQueries({ queryKey: ["/api/feed/videos"] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Like video mutation
  const likeMutation = useMutation({
    mutationFn: ({ videoId, action }: { videoId: string; action: 'like' | 'unlike' }) =>
      apiRequest("POST", `/api/feed/video/${videoId}/like`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed/videos"] });
    },
  });

  // Follow user mutation
  const followMutation = useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: 'follow' | 'unfollow' }) =>
      apiRequest("POST", `/api/feed/user/${userId}/follow`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed/videos"] });
    },
  });

  // Gift sending mutation
  const giftMutation = useMutation({
    mutationFn: ({ videoId, giftTypeId, message }: { videoId: string; giftTypeId: string; message?: string }) =>
      apiRequest("POST", `/api/feed/video/${videoId}/gift`, { giftTypeId, message }),
    onSuccess: () => {
      toast({ title: "Gift sent!", description: "Your gift has been sent successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
    },
    onError: (error: any) => {
      toast({
        title: "Gift Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // 100MB
        toast({
          title: "File too large",
          description: "Please select a video smaller than 100MB",
          variant: "destructive",
        });
        return;
      }
      setUploadFile(file);
    }
  };

  const handleUpload = () => {
    if (!uploadFile || !uploadTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a video and enter a title",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('video', uploadFile);
    formData.append('title', uploadTitle);
    formData.append('description', uploadDescription);

    uploadMutation.mutate(formData);
  };

  const handleLike = (videoId: string, isLiked: boolean) => {
    console.log('handleLike called with videoId:', videoId, 'isLiked:', isLiked);
    if (!videoId || videoId === 'undefined') {
      console.error('Invalid video ID:', videoId);
      toast({
        title: "Error",
        description: "Video ID is missing",
        variant: "destructive",
      });
      return;
    }
    
    likeMutation.mutate({
      videoId,
      action: isLiked ? 'unlike' : 'like'
    });
  };

  const handleFollow = (userId: string, isFollowing: boolean) => {
    followMutation.mutate({
      userId,
      action: isFollowing ? 'unfollow' : 'follow'
    });
  };

  const handleGift = (videoId: string, giftTypeId: string) => {
    giftMutation.mutate({ videoId, giftTypeId });
  };

  // Scroll to load more videos
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 1000 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (!feedSettings?.isEnabled) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Feed Coming Soon</h2>
            <p className="text-gray-600">The Feed feature is currently being prepared. Check back soon!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-black min-h-screen relative">
      {/* Header with Back Button, Upload and Search */}
      <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-md lg:max-w-4xl xl:max-w-6xl bg-black bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Button 
            size="icon" 
            variant="ghost" 
            className="text-white hover:text-blue-400"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-white font-bold text-lg">ChillMan Feed</h1>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowUserSearch(true)}
            className="rounded-full w-10 h-10 bg-gray-800 hover:bg-gray-700"
            size="icon"
            variant="ghost"
          >
            <Search className="w-5 h-5 text-white" />
          </Button>
          <Button
            onClick={() => setShowUploadModal(true)}
            className="rounded-full w-10 h-10 bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600"
            size="icon"
          >
            <Upload className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Stories Section */}
      <div className="pt-16">
        <Stories 
          stories={stories} 
          onStoryClick={setSelectedStory}
        />
      </div>

      {/* Video Feed */}
      <div className="relative">{/* Header spacing */}
        {/* Loading State */}
        {!videosData && (
          <div className="flex items-center justify-center h-screen">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading Feed...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {videosData && videos.length === 0 && (
          <div className="flex items-center justify-center h-screen">
            <div className="text-white text-center px-8">
              <div className="mb-6">
                <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold mb-4">No Videos Yet</h2>
              <p className="text-gray-300 mb-6">Be the first to share a video on ChillMan Feed!</p>
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload First Video
              </Button>
            </div>
          </div>
        )}

        {/* Video List */}
        <div className="lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:p-4">
          {videos.map((video: VideoData, index) => {
            console.log('Rendering video:', video.id, video);
            return (
            <div
              key={video.id}
              data-video-id={video.id}
              className="relative w-full h-screen lg:h-96 xl:h-80 snap-start lg:rounded-lg lg:overflow-hidden lg:bg-gray-900"
            >
              {/* Video Player */}
              <video
                ref={(el) => {
                  if (el) videoRefs.current[video.id] = el;
                }}
                className="w-full h-full object-cover lg:rounded-lg"
                loop
                muted
                playsInline
                poster={video.thumbnailUrl}
              >
                <source src={video.videoUrl} type="video/mp4" />
              </video>

              {/* Video Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent lg:from-black/90">{/* Mobile: full screen, Desktop: grid with fixed height */}
              <div className="flex items-end justify-between">
                {/* Left side - Video info */}
                <div className="flex-1 text-white">
                  <div className="flex items-center space-x-3 mb-2">
                    <Link href={`/profile/${video.user?.id || ''}`}>
                      <div className="w-10 h-10 rounded-full border-2 border-white cursor-pointer hover:border-blue-400 transition-colors overflow-hidden bg-gray-700">
                        {video.user?.profileImageUrl ? (
                          <img
                            src={video.user?.profileImageUrl}
                            alt={video.user?.name || 'User'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center text-white font-semibold ${video.user?.profileImageUrl ? 'hidden' : 'flex'}`}>
                          {(video.user?.name || video.user?.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      </div>
                    </Link>
                    <div className="flex-1">
                      <Link href={`/profile/${video.user?.id || ''}`}>
                        <div className="flex items-center space-x-2 cursor-pointer hover:text-blue-300 transition-colors">
                          <span className="font-semibold">@{video.user?.username || 'anonymous'}</span>
                          {video.user?.isVerified && (
                            <Badge variant="secondary" className="text-xs">✓</Badge>
                          )}
                        </div>
                      </Link>
                      <div className="text-xs text-gray-300">
                        {video.user?.followerCount || 0} followers
                      </div>
                    </div>
                    <Button
                      onClick={() => handleFollow(video.user?.id || '', false)} // TODO: Track follow status
                      size="sm"
                      variant="outline"
                      className="text-white border-white hover:bg-white hover:text-black"
                      disabled={!video.user?.id}
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <h3 className="font-medium mb-1">{video.title}</h3>
                  {video.description && (
                    <p className="text-sm text-gray-300 line-clamp-2">{video.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-300">
                    <span className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{video.viewCount}</span>
                    </span>
                  </div>
                </div>

                {/* Right side - Actions */}
                <div className="flex flex-col items-center space-y-6 ml-4">
                  {/* Like */}
                  <div className="flex flex-col items-center">
                    <Button
                      onClick={() => handleLike(video.id, false)} // TODO: Track like status
                      size="icon"
                      variant="ghost"
                      className="text-white hover:text-red-400 w-12 h-12"
                    >
                      <Heart className="w-6 h-6" />
                    </Button>
                    <span className="text-white text-xs">{video.likeCount}</span>
                  </div>

                  {/* Comments */}
                  <div className="flex flex-col items-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:text-blue-400 w-12 h-12"
                    >
                      <MessageCircle className="w-6 h-6" />
                    </Button>
                    <span className="text-white text-xs">{video.commentCount}</span>
                  </div>

                  {/* Gifts */}
                  <div className="flex flex-col items-center">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-white hover:text-yellow-400 w-12 h-12"
                        >
                          <Gift className="w-6 h-6" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Send Gift</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                          {giftTypes.map((gift: any) => (
                            <Button
                              key={gift.id}
                              onClick={() => handleGift(video.id, gift.id)}
                              variant="outline"
                              className="flex flex-col items-center p-4 h-auto"
                              disabled={giftMutation.isPending}
                            >
                              <span className="text-2xl mb-1">{gift.emoji}</span>
                              <span className="text-sm">{gift.displayName}</span>
                              <span className="text-xs text-gray-500">{gift.tokenCost} tokens</span>
                            </Button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <span className="text-white text-xs">{video.giftCount}</span>
                  </div>

                  {/* Share */}
                  <div className="flex flex-col items-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:text-green-400 w-12 h-12"
                    >
                      <Share2 className="w-6 h-6" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
          })}
        </div>

        {/* Loading indicator */}
        {isFetchingNextPage && (
          <div className="h-screen flex items-center justify-center bg-black">
            <div className="text-white">Loading more videos...</div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="mb-2"
              />
              {uploadFile && (
                <p className="text-sm text-gray-600">
                  Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(1)} MB)
                </p>
              )}
            </div>
            
            <Input
              placeholder="Video title"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
            />
            
            <Textarea
              placeholder="Description (optional)"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              rows={3}
            />
            
            <div className="flex space-x-2">
              <Button
                onClick={handleUpload}
                disabled={!uploadFile || !uploadTitle.trim() || uploadMutation.isPending}
                className="flex-1"
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowUploadModal(false)}
                disabled={uploadMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Search Modal */}
      <UserSearch
        isOpen={showUserSearch}
        onClose={() => setShowUserSearch(false)}
      />
    </div>
  );
}
