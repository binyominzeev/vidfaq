import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

interface VideoCardProps {
  video: Video;
  onUpdate: () => void;
  onDelete: () => void;
}

const VideoCard = ({ video, onUpdate, onDelete }: VideoCardProps) => {
  const [loading, setLoading] = useState(false);

  const toggleActive = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('videos')
        .update({ is_active: !video.is_active })
        .eq('id', video.id);

      if (error) throw error;
      
      toast({
        title: `Video ${video.is_active ? 'hidden' : 'shown'}`,
        description: `Video is now ${video.is_active ? 'hidden from' : 'visible on'} your landing page.`,
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error toggling video visibility:', error);
      toast({
        title: 'Error',
        description: 'Failed to update video visibility.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteVideo = async () => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', video.id);

      if (error) throw error;
      
      toast({
        title: 'Video deleted',
        description: 'Video has been removed from your collection.',
      });
      
      onDelete();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete video.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Thumbnail */}
        <div className="aspect-video bg-muted relative">
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-foreground">No thumbnail</span>
            </div>
          )}
          <div className="absolute top-2 left-2">
            <Badge variant={video.is_active ? 'default' : 'secondary'}>
              {video.is_active ? 'Live' : 'Hidden'}
            </Badge>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold mb-1 line-clamp-1">{video.title}</h3>
          {video.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {video.description}
            </p>
          )}
          
          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleActive}
                disabled={loading}
              >
                {video.is_active ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={video.tiktok_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // TODO: Implement edit functionality
                  toast({
                    title: 'Coming soon',
                    description: 'Video editing will be available soon.',
                  });
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deleteVideo}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Slug: {video.video_slug}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoCard;