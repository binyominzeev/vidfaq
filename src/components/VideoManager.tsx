import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import VideoCard from './VideoCard';
import AddVideoDialog from './AddVideoDialog';

interface Video {
  id: string;
  tiktok_url: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  video_slug: string;
  position: number;
  is_active: boolean;
}

interface VideoManagerProps {
  userId: string;
  maxVideos: number;
}

const VideoManager = ({ userId, maxVideos }: VideoManagerProps) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, [userId]);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: 'Error loading videos',
        description: 'Please try refreshing the page.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVideoAdded = () => {
    fetchVideos();
    setShowAddDialog(false);
  };

  const handleVideoUpdated = () => {
    fetchVideos();
  };

  const handleVideoDeleted = () => {
    fetchVideos();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Videos</CardTitle>
          <CardDescription>Loading your TikTok videos...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Your Videos</CardTitle>
              <CardDescription>
                Manage your TikTok videos ({videos.length}/{maxVideos})
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowAddDialog(true)}
              disabled={videos.length >= maxVideos}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Video
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No videos added yet. Add your first TikTok video to get started!
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Video
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onUpdate={handleVideoUpdated}
                  onDelete={handleVideoDeleted}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddVideoDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        userId={userId}
        onVideoAdded={handleVideoAdded}
        currentVideoCount={videos.length}
        maxVideos={maxVideos}
      />
    </>
  );
};

export default VideoManager;