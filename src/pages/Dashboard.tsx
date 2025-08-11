import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, LogOut, Settings, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import VideoManager from '@/components/VideoManager';
import { 
  Video, 
  Home, 
  User as UserIcon,
  Menu,
  X,
  Crown
} from "lucide-react";

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
  const [subdomainInput, setSubdomainInput] = useState<string>("");
  const [subdomainSaving, setSubdomainSaving] = useState<boolean>(false);

  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubdomainInput(e.target.value);
  };

  const handleSubdomainSave = async () => {
    if (!user || !subdomainInput) return;
    setSubdomainSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subdomain: subdomainInput })
        .eq('user_id', user.id);
      if (error) throw error;
      setProfile(prev => prev ? { ...prev, subdomain: subdomainInput } : prev);
      toast({
        title: 'Subdomain updated!',
        description: `Your site is now available at https://${subdomainInput}.vidfaq.com`,
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error updating subdomain',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubdomainSaving(false);
    }
  };
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
  setSubdomainInput(data?.subdomain || "");
  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubdomainInput(e.target.value);
  };

  const handleSubdomainSave = async () => {
    if (!user || !subdomainInput) return;
    setSubdomainSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subdomain: subdomainInput })
        .eq('user_id', user.id);
      if (error) throw error;
      setProfile(prev => prev ? { ...prev, subdomain: subdomainInput } : prev);
      toast({
        title: 'Subdomain updated!',
        description: `Your site is now available at https://${subdomainInput}.vidfaq.com`,
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error updating subdomain',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubdomainSaving(false);
    }
  };
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
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                VidFAQ
              </span>
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
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={subdomainInput}
                  onChange={handleSubdomainChange}
                  className="border rounded px-3 py-2 text-lg font-bold"
                  placeholder="Enter subdomain"
                  disabled={subdomainSaving}
                />
                <Button
                  size="sm"
                  onClick={handleSubdomainSave}
                  disabled={subdomainSaving || !subdomainInput}
                  className="w-fit"
                >
                  {subdomainSaving ? "Saving..." : "Update"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {subdomainInput ? `${subdomainInput}.vidfaq.com` : 'Configure your subdomain'}
                </p>
              </div>
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