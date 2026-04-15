'use client';

import { useState } from 'react';

import { PlusIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PlaylistsSection } from '../sections/playlists-section';
import { PlaylistCreateModal } from '../components/playlist-create-modal';

export const PlaylistsView = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="max-w-600 mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6">
      <PlaylistCreateModal open={isModalOpen} onOpenChange={setIsModalOpen} />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Playlists</h1>
          <p className="text-xs text-muted-foreground">
            Collections you have created
          </p>
        </div>

        <Button
          size="icon"
          variant="outline"
          onClick={() => setIsModalOpen(true)}
          className="rounded-full cursor-pointer"
        >
          <PlusIcon />
        </Button>
      </div>

      <PlaylistsSection />
    </div>
  );
};
