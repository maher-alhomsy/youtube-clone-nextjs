'use client';

import { z } from 'zod';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useTRPC } from '@/trpc/client';
import { DEFAULT_LIMIT } from '@/constants';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { playlistInsertSchema } from '@/db/schema';
import { ResponsiveModal } from '@/components/responsive-modal';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = playlistInsertSchema
  .omit({ userId: true })
  .extend({ name: z.string().min(1) });

export const PlaylistCreateModal = ({ open, onOpenChange }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '' },
  });

  const { mutate: createPlaylistMutate, isPending } = useMutation(
    trpc.playlists.create.mutationOptions({
      onSuccess: () => {
        toast.success('Playlist created successfully');
        queryClient.invalidateQueries(
          trpc.playlists.getMany.infiniteQueryOptions(
            { limit: DEFAULT_LIMIT },
            { getNextPageParam: (lastPage) => lastPage.nextCursor },
          ),
        );
        form.reset();
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createPlaylistMutate({ ...values });
  };

  return (
    <ResponsiveModal
      open={open}
      title="Create Playlist"
      onOpenChange={onOpenChange}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  {...field}
                  placeholder="Enter a name for your playlist"
                />
              </Field>
            )}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending}
              className="cursor-pointer"
            >
              Create
            </Button>
          </div>
        </FieldGroup>
      </form>
    </ResponsiveModal>
  );
};
