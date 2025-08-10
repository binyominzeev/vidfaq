import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, LogOut, Settings, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import VideoManager from '@/components/VideoManager';

interface Profile {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  subdomain: string | null;
  is_premium: boolean;
}

interface Subscription {
  plan_type: string;
  max_videos: number;
  max_subdomains: number;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSubscription();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error loading profile',
        description: 'Please try refreshing the page.',
        variant: 'destructive',
      });
    }
  };

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">VidFAQ</h1>
              {profile?.subdomain && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`https://${profile.subdomain}.vidfaq.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Visit Site
                  </a>
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={subscription?.plan_type === 'premium' ? 'default' : 'secondary'}>
                {subscription?.plan_type?.toUpperCase() || 'FREE'}
              </Badge>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.full_name || profile?.username}!
          </h2>
          <p className="text-muted-foreground">
            Manage your TikTok video landing page
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Subdomain</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profile?.subdomain || 'Not set'}
              </div>
              <p className="text-xs text-muted-foreground">
                {profile?.subdomain ? `${profile.subdomain}.vidfaq.com` : 'Configure your subdomain'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Video Limit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subscription?.max_videos || 10}
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum videos allowed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plan Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {subscription?.plan_type || 'Free'}
              </div>
              <p className="text-xs text-muted-foreground">
                Current subscription plan
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Video Manager */}
        <VideoManager userId={user?.id || ''} maxVideos={subscription?.max_videos || 10} />
      </div>
    </div>
  );
};

export default Dashboard;