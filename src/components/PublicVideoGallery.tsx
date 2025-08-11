import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PublicVideoCard from './PublicVideoCard';

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

interface PublicVideoGalleryProps {
  userId: string;
  maxVideos: number;
}

const PublicVideoGallery = ({ userId, maxVideos }: PublicVideoGalleryProps) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, [userId]);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('position', { ascending: true });
      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading videos...</div>;
  }

  if (videos.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No public videos available.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((video) => (
        <PublicVideoCard key={video.id} video={video} />
      ))}
    </div>
  );
};

export default PublicVideoGallery;
