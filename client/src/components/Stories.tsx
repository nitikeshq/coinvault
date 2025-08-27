import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card } from './ui/card';
import { Play } from 'lucide-react';

interface Story {
  id: string;
  userId: string;
  username: string;
  profileImageUrl?: string;
  videoThumbnail: string;
  videoUrl: string;
  createdAt: string;
}

interface StoriesProps {
  stories: Story[];
  onStoryClick: (story: Story) => void;
}

export function Stories({ stories, onStoryClick }: StoriesProps) {
  if (!stories.length) {
    return null;
  }

  return (
    <div className="w-full bg-gray-900 p-4 border-b border-gray-800">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {stories.map((story) => (
          <div
            key={story.id}
            className="flex-shrink-0 cursor-pointer group"
            onClick={() => onStoryClick(story)}
          >
            <div className="relative">
              {/* Story Ring */}
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 group-hover:from-yellow-300 group-hover:via-pink-400 group-hover:to-purple-500 transition-all duration-200">
                <div className="w-full h-full rounded-full p-0.5 bg-gray-900">
                  <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-800">
                    {/* Video Thumbnail */}
                    <img
                      src={story.videoThumbnail}
                      alt={`${story.username}'s story`}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }}
                    />
                    
                    {/* Fallback for broken thumbnail */}
                    <div className="hidden w-full h-full bg-gray-700 rounded-full items-center justify-center text-white text-xs">
                      <Play size={20} className="text-gray-400" />
                    </div>
                    
                    {/* Play Icon Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Play size={16} className="text-white fill-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* User Avatar */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-gray-900 bg-gray-900">
                <Avatar className="w-full h-full">
                  <AvatarImage 
                    src={story.profileImageUrl} 
                    alt={story.username}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xs bg-gray-700 text-gray-300">
                    {story.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Username */}
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-300 truncate max-w-[64px]">
                {story.username}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Stories;
