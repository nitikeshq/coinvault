import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  Camera, 
  Edit, 
  Gift, 
  Heart, 
  MessageCircle, 
  Share2, 
  UserPlus, 
  Users, 
  Video,
  Image as ImageIcon,
  Smile,
  Play,
  Upload,
  ArrowLeft
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  username: string;
  bio: string;
  profileImageUrl: string;
  bannerImageUrl: string;
  followerCount: number;
  followingCount: number;
  videoCount: number;
  isVerified: boolean;
  isFollowing?: boolean;
}

interface VideoPost {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  createdAt: string;
}

interface NFT {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: string;
  createdAt: string;
}

interface Meme {
  id: string;
  caption: string;
  imageUrl: string;
  createdAt: string;
}

export default function Profile() {
  const { userId } = useParams();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
  });
  const [uploadingImage, setUploadingImage] = useState<'profile' | 'banner' | null>(null);

  const isOwnProfile = currentUser?.id === userId;

  // User Profile Query
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: [`/api/user/${userId}/profile`],
    enabled: !!userId,
  });

  // User Videos Query
  const { data: videos = [] } = useQuery<VideoPost[]>({
    queryKey: [`/api/user/${userId}/videos`],
    enabled: !!userId,
  });

  // User NFTs Query (only for own profile due to privacy)
  const { data: nfts = [] } = useQuery<NFT[]>({
    queryKey: [`/api/user/${userId}/nfts`],
    enabled: !!userId && isOwnProfile,
  });

  // User Memes Query (only for own profile due to privacy)
  const { data: memes = [] } = useQuery<Meme[]>({
    queryKey: [`/api/user/${userId}/memes`],
    enabled: !!userId && isOwnProfile,
  });

  // Follow/Unfollow Mutation
  const followMutation = useMutation({
    mutationFn: ({ action }: { action: 'follow' | 'unfollow' }) =>
      apiRequest("POST", `/api/feed/user/${userId}/${action}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}/profile`] });
      toast({
        title: "Success",
        description: profile?.isFollowing ? "Unfollowed successfully" : "Following successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    },
  });

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", `/api/user/profile`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}/profile`] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Upload Image Mutation
  const uploadImageMutation = useMutation({
    mutationFn: ({ file, type }: { file: File; type: 'profile' | 'banner' }) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', type);
      return apiRequest("POST", "/api/user/upload-image", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}/profile`] });
      setUploadingImage(null);
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    },
    onError: () => {
      setUploadingImage(null);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    },
  });

  const handleFollow = () => {
    const action = profile?.isFollowing ? 'unfollow' : 'follow';
    followMutation.mutate({ action });
  };

  const handleUpdateProfile = () => {
    updateProfileMutation.mutate(editForm);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(type);
    uploadImageMutation.mutate({ file, type });
  };

  useEffect(() => {
    if (profile && isOwnProfile) {
      setEditForm({
        name: profile.name || '',
        bio: profile.bio || '',
      });
    }
  }, [profile, isOwnProfile]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-4">The profile you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/")}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <Link href="/">
          <Button size="icon" variant="outline" className="bg-white shadow-lg hover:shadow-xl">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
      </div>
      
      {/* Banner Section */}
      <div className="relative">
        <div 
          className="h-48 md:h-64 bg-gradient-to-r from-blue-500 to-purple-600 bg-cover bg-center"
          style={{
            backgroundImage: profile.bannerImageUrl ? `url(${profile.bannerImageUrl})` : undefined
          }}
        >
          {isOwnProfile && (
            <div className="absolute top-4 right-4">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'banner')}
                  className="hidden"
                  disabled={uploadingImage === 'banner'}
                />
                <Button size="sm" variant="secondary" disabled={uploadingImage === 'banner'}>
                  <Camera className="w-4 h-4 mr-1" />
                  {uploadingImage === 'banner' ? 'Uploading...' : 'Change Banner'}
                </Button>
              </label>
            </div>
          )}
        </div>

        {/* Profile Image */}
        <div className="absolute -bottom-16 left-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
              {profile.profileImageUrl ? (
                <img
                  src={profile.profileImageUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300">
                  <span className="text-4xl text-gray-600">
                    {profile.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
            {isOwnProfile && (
              <label className="absolute bottom-2 right-2 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'profile')}
                  className="hidden"
                  disabled={uploadingImage === 'profile'}
                />
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700">
                  <Camera className="w-4 h-4" />
                </div>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="pt-20 px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                {profile.isVerified && (
                  <Badge variant="secondary" className="text-blue-600">✓ Verified</Badge>
                )}
              </div>
              <p className="text-xl text-gray-600 mb-2">@{profile.username}</p>
              <p className="text-gray-700 max-w-md">{profile.bio || "No bio available"}</p>
              
              {/* Stats */}
              <div className="flex space-x-6 mt-4">
                <div className="text-center">
                  <div className="font-bold text-xl text-gray-900">{profile.followerCount}</div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-xl text-gray-900">{profile.followingCount}</div>
                  <div className="text-sm text-gray-600">Following</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-xl text-gray-900">{profile.videoCount}</div>
                  <div className="text-sm text-gray-600">Videos</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {isOwnProfile ? (
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Your name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Bio</label>
                        <Textarea
                          value={editForm.bio}
                          onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                          placeholder="Tell us about yourself..."
                          rows={3}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleUpdateProfile}
                          disabled={updateProfileMutation.isPending}
                          className="flex-1"
                        >
                          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <>
                  <Button
                    onClick={handleFollow}
                    disabled={followMutation.isPending}
                    variant={profile.isFollowing ? "outline" : "default"}
                  >
                    {followMutation.isPending ? (
                      "Loading..."
                    ) : profile.isFollowing ? (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                  <Button variant="outline">
                    <Gift className="w-4 h-4 mr-2" />
                    Send Gift
                  </Button>
                  <Button variant="outline">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="videos" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
              <TabsTrigger value="videos" className="flex items-center space-x-2">
                <Video className="w-4 h-4" />
                <span>Videos</span>
              </TabsTrigger>
              {isOwnProfile && (
                <>
                  <TabsTrigger value="nfts" className="flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4" />
                    <span>NFTs</span>
                  </TabsTrigger>
                  <TabsTrigger value="memes" className="flex items-center space-x-2">
                    <Smile className="w-4 h-4" />
                    <span>Memes</span>
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="about" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>About</span>
              </TabsTrigger>
            </TabsList>

            {/* Videos Tab */}
            <TabsContent value="videos">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {videos.map((video) => (
                  <Card key={video.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <video
                        src={video.videoUrl}
                        poster={video.thumbnailUrl}
                        className="w-full h-48 object-cover rounded-t-lg"
                        controls
                        preload="metadata"
                      />
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        <Play className="w-3 h-3 inline mr-1" />
                        {video.viewCount}
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2 mb-1">{video.title}</h3>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{video.likeCount} likes</span>
                        <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {videos.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No videos uploaded yet</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* NFTs Tab (Own Profile Only) */}
            {isOwnProfile && (
              <TabsContent value="nfts">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {nfts.map((nft) => (
                    <Card key={nft.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                      <img
                        src={nft.imageUrl}
                        alt={nft.name}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm mb-1">{nft.name}</h3>
                        <div className="flex items-center justify-between text-xs">
                          <Badge variant="outline">{nft.rarity}</Badge>
                          <span className="text-gray-500">{new Date(nft.createdAt).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {nfts.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">No NFTs collected yet</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            {/* Memes Tab (Own Profile Only) */}
            {isOwnProfile && (
              <TabsContent value="memes">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {memes.map((meme) => (
                    <Card key={meme.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                      <img
                        src={meme.imageUrl}
                        alt={meme.caption}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <CardContent className="p-3">
                        <p className="text-sm line-clamp-2">{meme.caption}</p>
                        <span className="text-xs text-gray-500">{new Date(meme.createdAt).toLocaleDateString()}</span>
                      </CardContent>
                    </Card>
                  ))}
                  {memes.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <Smile className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">No memes created yet</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            {/* About Tab */}
            <TabsContent value="about">
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Profile Information</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-gray-600">Username:</span>
                          <span className="ml-2 font-medium">@{profile.username}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Member Since:</span>
                          <span className="ml-2">January 2024</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <span className="ml-2">
                            {profile.isVerified ? (
                              <Badge variant="secondary" className="text-blue-600">✓ Verified</Badge>
                            ) : (
                              <span className="text-gray-500">Not Verified</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Statistics</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Videos:</span>
                          <span className="font-medium">{profile.videoCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Followers:</span>
                          <span className="font-medium">{profile.followerCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Following:</span>
                          <span className="font-medium">{profile.followingCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
