import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AddVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onVideoAdded: () => void;
  currentVideoCount: number;
  maxVideos: number;
}

const AddVideoDialog = ({ 
  open, 
  onOpenChange, 
  userId, 
  onVideoAdded, 
  currentVideoCount, 
  maxVideos 
}: AddVideoDialogProps) => {
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50);
  };

  const extractVideoId = (url: string) => {
    // Extract TikTok video ID from various URL formats
    const patterns = [
      /tiktok\.com\/@[^\/]+\/video\/(\d+)/,
      /tiktok\.com\/v\/(\d+)/,
      /vm\.tiktok\.com\/([A-Za-z0-9]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentVideoCount >= maxVideos) {
      toast({
        title: 'Video limit reached',
        description: `You can only add ${maxVideos} videos with your current plan.`,
        variant: 'destructive',
      });
      return;
    }

    if (!tiktokUrl || !title) {
      toast({
        title: 'Missing information',
        description: 'Please provide both TikTok URL and title.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const videoId = extractVideoId(tiktokUrl);
      if (!videoId) {
        throw new Error('Invalid TikTok URL format');
      }

      const slug = generateSlug(title);
      
      // Check if slug already exists for this user
      const { data: existingVideo } = await supabase
        .from('videos')
        .select('id')
        .eq('user_id', userId)
        .eq('video_slug', slug)
        .single();

      if (existingVideo) {
        throw new Error('A video with a similar title already exists');
      }

      // Attempt to fetch thumbnail
      let thumbnailUrl: string | null = null;
      try {
        const resp = await fetch('/api/fetch-thumbnail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: tiktokUrl }),
        });
        const data = await resp.json();
        thumbnailUrl = data.thumbnailUrl || null;
      } catch (err) {
        // fallback: leave thumbnailUrl as null
      }

      const { error } = await supabase
        .from('videos')
        .insert({
          user_id: userId,
          tiktok_url: tiktokUrl,
          title: title,
          description: description || null,
          video_slug: slug,
          position: currentVideoCount,
          thumbnail_url: thumbnailUrl,
        });

      if (error) throw error;

      toast({
        title: 'Video added successfully',
        description: 'Your TikTok video has been added to your collection.',
      });

      // Reset form
      setTiktokUrl('');
      setTitle('');
      setDescription('');
      
      onVideoAdded();
    } catch (error: any) {
      console.error('Error adding video:', error);
      toast({
        title: 'Error adding video',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add TikTok Video</DialogTitle>
          <DialogDescription>
            Add a new TikTok video to your landing page. You can add up to {maxVideos} videos.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tiktok-url">TikTok URL *</Label>
            <Input
              id="tiktok-url"
              placeholder="https://www.tiktok.com/@username/video/123456789"
              value={tiktokUrl}
              onChange={(e) => setTiktokUrl(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Title (2-3 words) *</Label>
            <Input
              id="title"
              placeholder="Amazing Recipe"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={50}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (6-10 words)</Label>
            <Textarea
              id="description"
              placeholder="Quick and easy breakfast recipe for busy mornings"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Video
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVideoDialog;