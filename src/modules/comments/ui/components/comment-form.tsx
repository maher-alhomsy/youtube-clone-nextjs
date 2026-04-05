import z from 'zod';
import { toast } from 'sonner';
import { useClerk, useUser } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTRPC } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { commentInsertSchema } from '@/db/schema';
import UserAvatar from '@/components/user-avatar';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldError } from '@/components/ui/field';

interface Props {
  videoId: string;
  onSuccess?: () => void;
}

export const CommentForm = ({ videoId, onSuccess }: Props) => {
  const trpc = useTRPC();
  const clerk = useClerk();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const commentFormSchema = commentInsertSchema
    .omit({ userId: true })
    .extend({ value: z.string().min(3) });

  const form = useForm<z.infer<typeof commentFormSchema>>({
    defaultValues: { value: '', videoId },
    resolver: zodResolver(commentFormSchema),
  });

  const { mutate, isPending } = useMutation(
    trpc.comments.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.comments.getMany.queryOptions({ videoId }),
        );
        form.reset();

        toast.success('Comment added successfully');

        onSuccess?.();
      },

      onError: (error) => {
        toast.error(error.message || 'Failed to add comment');

        if (error.data?.code === 'UNAUTHORIZED') {
          clerk.openSignIn();
        }
      },
    }),
  );

  const onSubmit = (data: z.infer<typeof commentFormSchema>) => {
    mutate(data);
  };

  return (
    <>
      <form
        id="comment-form"
        className="flex gap-4 group"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <UserAvatar
          size="lg"
          name={user?.firstName || 'User'}
          imageUrl={user?.imageUrl || '/user-placeholder.svg'}
        />

        <div className="flex-1">
          <Controller
            name="value"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <Textarea
                  {...field}
                  placeholder="Add a comment..."
                  className="resize-none bg-transparent overflow-hidden min-h-0 h-20"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <div className="flex justify-end gap-2 mt-2">
            <Button
              size="sm"
              type="submit"
              form="comment-form"
              disabled={isPending}
              className="cursor-pointer"
            >
              Comment
            </Button>
          </div>
        </div>
      </form>
    </>
  );
};
