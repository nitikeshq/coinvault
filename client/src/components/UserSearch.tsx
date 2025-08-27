import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Search, X, UserPlus, UserCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';

interface User {
  id: string;
  name: string;
  profileImageUrl?: string;
  followerCount: number;
  isFollowing?: boolean;
}

interface UserSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSearch({ isOpen, onClose }: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search users query
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['searchUsers', debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm.trim() || debouncedSearchTerm.length < 2) {
        return [];
      }

      const response = await fetch(`/api/users/search?q=${encodeURIComponent(debouncedSearchTerm)}`);
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      return response.json();
    },
    enabled: debouncedSearchTerm.length >= 2,
  });

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: 'follow' | 'unfollow' }) => {
      const response = await fetch(`/api/user/${userId}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} user`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['searchUsers'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });

  const handleFollow = (userId: string, isCurrentlyFollowing: boolean) => {
    followMutation.mutate({
      userId,
      action: isCurrentlyFollowing ? 'unfollow' : 'follow',
    });
  };

  const handleClose = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Search size={20} />
            Search Users
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Search Results */}
          <div className="max-h-80 overflow-y-auto space-y-2">
            {isLoading && debouncedSearchTerm && (
              <div className="text-center py-4 text-gray-400">
                Searching...
              </div>
            )}

            {!isLoading && debouncedSearchTerm && users.length === 0 && (
              <div className="text-center py-4 text-gray-400">
                No users found
              </div>
            )}

            {users.map((user: User) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
                <Link href={`/profile/${user.id}`} onClick={handleClose}>
                  <div className="flex items-center gap-3 cursor-pointer flex-1">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.profileImageUrl} alt={user.name} />
                      <AvatarFallback className="bg-gray-700 text-gray-300">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-gray-400 text-sm">
                        {user.followerCount} followers
                      </p>
                    </div>
                  </div>
                </Link>

                <Button
                  onClick={() => handleFollow(user.id, user.isFollowing || false)}
                  disabled={followMutation.isPending}
                  variant={user.isFollowing ? "secondary" : "default"}
                  size="sm"
                  className={`ml-3 ${
                    user.isFollowing 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {user.isFollowing ? (
                    <>
                      <UserCheck size={16} className="mr-1" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} className="mr-1" />
                      Follow
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>

          {!debouncedSearchTerm && (
            <div className="text-center py-8 text-gray-400">
              Enter at least 2 characters to search for users
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default UserSearch;
