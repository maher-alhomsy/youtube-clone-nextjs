'use client';

import { PlusIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

const StudioUploadModal = () => {
  return (
    <Button variant="secondary">
      <PlusIcon />
      Create
    </Button>
  );
};

export default StudioUploadModal;
