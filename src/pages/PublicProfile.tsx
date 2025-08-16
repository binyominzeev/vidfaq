import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PublicProfileHeader from "@/components/PublicProfileHeader";
import PublicVideoGallery from "@/components/PublicVideoGallery";

function getSubdomain() {
  const host = window.location.hostname;
  const parts = host.split(".");
  if (parts.length > 2) return parts[0]; // username.vidfaq.com
  return null;
}

const PublicProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [debugSubdomain, setDebugSubdomain] = useState<string | null>(null);
  useEffect(() => {
    const subdomain = getSubdomain();
    setDebugSubdomain(subdomain);
    if (!subdomain) {
      setLoading(false);
      return;
    }
    supabase
      .from("profiles")
      .select("*")
      .eq("subdomain", subdomain)
      .single()
      .then(({ data, error }) => {
        setProfile(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Profile not found</h2>
          <p className="text-muted-foreground">This subdomain does not exist.</p>
          <div className="mt-4 text-xs text-gray-400">
            Debug: Queried subdomain: <b>{debugSubdomain ?? "(none)"}</b>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <PublicProfileHeader
          name={profile.full_name || profile.username}
          description={profile.description}
          subdomain={profile.subdomain}
        />
        <div className="mt-8">
          <PublicVideoGallery userId={profile.user_id} maxVideos={profile.video_limit || 10} />
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
