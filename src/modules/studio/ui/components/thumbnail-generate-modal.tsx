'use client';

import { z } from 'zod';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useTRPC } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ResponsiveModal } from '@/components/responsive-modal';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';

interface Props {
  open: boolean;
  videoId: string;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({ prompt: z.string().min(10) });

export const ThumbnailGenerateModal = ({
  open,
  videoId,
  onOpenChange,
}: Props) => {
  const trpc = useTRPC();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { prompt: '' },
  });

  const { mutate: generateThumbnailMutate, isPending } = useMutation(
    trpc.videos.generateThumbnail.mutationOptions({
      onSuccess: () => {
        toast.success('Background job started');
        form.reset();
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    generateThumbnailMutate({ id: videoId, prompt: values.prompt });
  };

  return (
    <ResponsiveModal
      open={open}
      title="Generate a thumbnail"
      onOpenChange={onOpenChange}
    >
      <form
        id="thumbnail-generate-form"
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FieldGroup>
          <Controller
            name="prompt"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Prompt</FieldLabel>
                <Textarea
                  {...field}
                  rows={5}
                  cols={30}
                  className="resize-none"
                  placeholder="A description of wanted thumbnail"
                />
              </Field>
            )}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending}
              className="cursor-pointer"
              form="thumbnail-generate-form"
            >
              Generate
            </Button>
          </div>
        </FieldGroup>
      </form>
    </ResponsiveModal>
  );
};
