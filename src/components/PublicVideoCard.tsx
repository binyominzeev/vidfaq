import React from 'react';

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

interface PublicVideoCardProps {
  video: Video;
}

const PublicVideoCard: React.FC<PublicVideoCardProps> = ({ video }) => {
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
      {video.thumbnail_url && (
        <img
          src={video.thumbnail_url}
          alt={video.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-lg font-bold mb-2">{video.title}</h3>
        {video.description && <p className="text-sm text-muted-foreground mb-2">{video.description}</p>}
        <a
          href={`/${video.video_slug}`}
          className="inline-block mt-2 text-indigo-600 hover:underline font-medium"
        >
          View Details
        </a>
      </div>
    </div>
  );
};

export default PublicVideoCard;
