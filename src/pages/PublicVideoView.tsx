import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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

const PublicVideoView = () => {
  const { slug } = useParams<{ slug: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("videos")
      .select("*")
      .eq("video_slug", slug)
      .eq("is_active", true)
      .single()
      .then(({ data }) => {
        setVideo(data);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!video) {
    return <div className="min-h-screen flex items-center justify-center">Video not found.</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="max-w-xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-4">{video.title}</h1>
        {video.description && <p className="mb-4 text-muted-foreground">{video.description}</p>}
        {/* Embedded TikTok player */}
        <div className="aspect-video mb-4">
          <iframe
            src={`https://www.tiktok.com/embed/v2/${extractTikTokId(video.tiktok_url)}`}
            width="100%"
            height="400"
            allow="encrypted-media"
            allowFullScreen
            frameBorder="0"
            title="TikTok Video"
          />
        </div>
      </div>
    </div>
  );
};

// Helper to extract TikTok video ID from URL
function extractTikTokId(url: string): string {
  const match = url.match(/video\/(\d+)/);
  return match ? match[1] : "";
}

export default PublicVideoView;
