import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PublicProfileHeader from "@/components/PublicProfileHeader";

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

interface PublicVideoViewProps {
  slug?: string;
}

const PublicVideoView = ({ slug }: PublicVideoViewProps) => {
  const params = useParams<{ slug: string }>();
  const videoSlug = slug ?? params.slug;
  const [video, setVideo] = useState<Video | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { signOut } = useAuth();

  useEffect(() => {
    if (!videoSlug) return;
    // Get subdomain
    const host = window.location.hostname;
    const subdomain = host.split('.')[0];
    // Fetch video
    supabase
      .from("videos")
      .select("*")
      .eq("video_slug", videoSlug)
      .eq("is_active", true)
      .single()
      .then(({ data }) => {
        setVideo(data);
        // Fetch profile for header
        supabase
          .from("profiles")
          .select("*")
          .eq("subdomain", subdomain)
          .single()
          .then(({ data }) => {
            setProfile(data);
            setLoading(false);
          });
      });
  }, [videoSlug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!video) {
    return <div className="min-h-screen flex items-center justify-center">Video not found.</div>;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12 relative">
      <div className="max-w-xl mx-auto">
        {profile && (
          <PublicProfileHeader
            name={profile.full_name || profile.username}
            description={profile.description}
            subdomain={profile.subdomain}
          />
        )}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-4">{video.title}</h1>
          {video.description && <p className="mb-4 text-muted-foreground">{video.description}</p>}
          {/* Embedded TikTok player */}
          <div className="aspect-video mb-4">
            <iframe
              src={`https://www.tiktok.com/embed/v2/${extractTikTokId(video.tiktok_url)}`}
              width="100%"
              height="800"
              allow="encrypted-media"
              allowFullScreen
              frameBorder="0"
              title="TikTok Video"
            />
          </div>
        </div>
      </div>
      <footer className="w-full py-4 bg-white border-t text-center text-xs text-gray-500">
        Powered by <a href="https://vidfaq.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">VidFAQ</a>
      </footer>
    </div>
  );
};

// Helper to extract TikTok video ID from URL
function extractTikTokId(url: string): string {
  const match = url.match(/video\/(\d+)/);
  return match ? match[1] : "";
}

export default PublicVideoView;
