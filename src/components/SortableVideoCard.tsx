import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import VideoCard from './VideoCard';

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

interface SortableVideoCardProps {
  video: Video;
  onUpdate: () => void;
  onDelete: () => void;
}

const SortableVideoCard: React.FC<SortableVideoCardProps> = ({ video, onUpdate, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    boxShadow: isDragging ? '0 0 0 2px #6366f1' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        {...listeners}
        className="flex items-center justify-center cursor-grab hover:cursor-grabbing bg-gray-100 py-2"
        style={{ borderBottom: '1px solid #eee' }}
        title="Drag to reorder"
      >
        <GripVertical className="h-5 w-5 text-gray-500 mr-2" />
        <span className="text-xs text-gray-500">Drag to reorder</span>
      </div>
      <VideoCard video={video} onUpdate={onUpdate} onDelete={onDelete} />
    </div>
  );
};

export default SortableVideoCard;
