'use client';

import { Suspense, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import {
  CopyIcon,
  LockIcon,
  TrashIcon,
  Globe2Icon,
  CopyCheckIcon,
  MoreVerticalIcon,
} from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import { Controller, useForm } from 'react-hook-form';
import { ErrorBoundary } from 'react-error-boundary';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from '@/components/ui/select';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { useTRPC } from '@/trpc/client';
import { DEFAULT_LIMIT } from '@/constants';
import { Input } from '@/components/ui/input';
import { snakeCaseToTitle } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { videoUpdateSchema } from '@/db/schema';
import { Textarea } from '@/components/ui/textarea';
import { VideoPlayer } from '@/modules/videos/ui/components/video-player';

interface Props {
  videoId: string;
}

const FormSectionSuspense = ({ videoId }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCopied, setIsCopied] = useState(false);

  const { data } = useSuspenseQuery(
    trpc.studio.getOne.queryOptions({ id: videoId }),
  );

  const { data: categories } = useSuspenseQuery(
    trpc.categories.getMany.queryOptions(),
  );

  const { mutate, isPending } = useMutation(
    trpc.vidoes.update.mutationOptions({
      onSuccess() {
        queryClient.invalidateQueries(
          trpc.studio.getOne.queryOptions({ id: videoId }),
        );

        queryClient.invalidateQueries(
          trpc.studio.getMany.infiniteQueryOptions(
            { limit: DEFAULT_LIMIT },
            { getNextPageParam: (lastpage) => lastpage.nextCursor },
          ),
        );

        toast.success('Video updated');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const { mutate: removeMutate } = useMutation(
    trpc.vidoes.remove.mutationOptions({
      onSuccess() {
        queryClient.invalidateQueries(
          trpc.studio.getMany.infiniteQueryOptions(
            { limit: DEFAULT_LIMIT },
            { getNextPageParam: (lastpage) => lastpage.nextCursor },
          ),
        );

        toast.success('Video removed');
        router.push('/studio');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const form = useForm<z.infer<typeof videoUpdateSchema>>({
    defaultValues: data,
    resolver: zodResolver(videoUpdateSchema),
  });

  const onSubmit = (data: z.infer<typeof videoUpdateSchema>) => {
    mutate(data);
  };

  const fullUrl = `${process.env.VERCEL_URL || 'http://localhost:3000'}/videos/${videoId}`;
  const onCopy = async () => {
    await navigator.clipboard.writeText(fullUrl);

    setIsCopied(true);

    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <form id="studio-form" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex items-center justify-between mb-6 ">
        <div>
          <h1 className="text-2xl font-bold">Video details</h1>
          <p className="text-xs text-muted-foreground">
            Manage your vide details
          </p>
        </div>

        <div className="flex items-center gap-x-2">
          <Button
            type="submit"
            form="studio-form"
            disabled={isPending}
            className="cursor-pointer"
          >
            Save
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVerticalIcon />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => removeMutate({ id: videoId })}>
                <TrashIcon className="size-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="space-y-8 lg:col-span-3">
          <FieldGroup>
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Title</FieldLabel>
                  <Input {...field} placeholder="Add a title to your video" />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Description</FieldLabel>
                  <Textarea
                    {...field}
                    rows={10}
                    value={field.value ?? ''}
                    className="resize-none pr-10"
                    placeholder="Add a description to your video"
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="categoryId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Category</FieldLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>

                    <SelectContent>
                      {categories.map(({ id, name }) => (
                        <SelectItem key={id} value={id}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </div>

        <div className="flex flex-col gap-y-8 lg:col-span-2">
          <div className="flex flex-col gap-4 bg-[#F9F9F9] rounded-xl overflow-hidden h-fit">
            <div className="aspect-video overflow-hidden relative">
              <VideoPlayer
                playbackId={data.muxPlaybackId}
                thumbnailUrl={data.thumbnailUrl}
              />
            </div>

            <div className="p-4 flex flex-col gap-y-6">
              <div className="flex justify-between items-center gap-x-2">
                <div className="flex flex-col gap-y-1">
                  <p className="text-muted-foreground text-xs">Video Link</p>
                  <div className="flex items-center gap-x-2">
                    <Link href={`/videos/${data.id}`}>
                      <p className="line-clamp-1 text-sm text-blue-500">
                        {fullUrl}
                      </p>
                    </Link>

                    <Button
                      size="icon"
                      type="button"
                      variant="ghost"
                      onClick={onCopy}
                      disabled={isCopied}
                      className="shrink-0 cursor-pointer"
                    >
                      {isCopied ? <CopyCheckIcon /> : <CopyIcon />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-y-1">
                  <p className="text-muted-foreground text-xs">Video status</p>
                  <p className="text-sm">
                    {snakeCaseToTitle(data.muxStatus || 'preparing')}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-y-1">
                  <p className="text-muted-foreground text-xs">
                    Subtitles status
                  </p>
                  <p className="text-sm">
                    {snakeCaseToTitle(data.muxTrackStatus || 'no_subtitles')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <FieldGroup className="mb-6">
            <Controller
              name="visibility"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Visibility</FieldLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a visibility" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="public">
                        <Globe2Icon className="size-4 mr-2" />
                        Public
                      </SelectItem>
                      <SelectItem value="private">
                        <LockIcon className="size-4 mr-2" />
                        Private
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </div>
      </div>
    </form>
  );
};

export const FormSection = ({ videoId }: Props) => {
  return (
    <Suspense fallback={<FormSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <FormSectionSuspense videoId={videoId} />
      </ErrorBoundary>
    </Suspense>
  );
};

const FormSectionSkeleton = () => {
  return <p>Loading...</p>;
};
