'use client';

import { Suspense, useState } from 'react';

import Link from 'next/link';
import Image from 'next/image';
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
  Loader2Icon,
  SparklesIcon,
  CopyCheckIcon,
  ImagePlusIcon,
  RotateCcwIcon,
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
import { Input } from '@/components/ui/input';
import { snakeCaseToTitle } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { videoUpdateSchema } from '@/db/schema';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_URL, DEFAULT_LIMIT } from '@/constants';
import { THUMBNAIL_FALLBACK } from '@/modules/videos/constants';
import { VideoPlayer } from '@/modules/videos/ui/components/video-player';
import { ThumbnailUploadModal } from '../components/thumbnail-upload-modal';
import { ThumbnailGenerateModal } from '../components/thumbnail-generate-modal';

interface Props {
  videoId: string;
}

const FormSectionSuspense = ({ videoId }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCopied, setIsCopied] = useState(false);
  const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false);
  const [thumbnailGenerateModalOpen, setThumbnailGenerateModalOpen] =
    useState(false);

  const { data } = useSuspenseQuery(
    trpc.studio.getOne.queryOptions({ id: videoId }),
  );

  const { data: categories } = useSuspenseQuery(
    trpc.categories.getMany.queryOptions(),
  );

  const { mutate, isPending } = useMutation(
    trpc.videos.update.mutationOptions({
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
    trpc.videos.remove.mutationOptions({
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

  const { mutate: revalidateMutate, isPending: isRevalidating } = useMutation(
    trpc.videos.revalidate.mutationOptions({
      onSuccess() {
        queryClient.invalidateQueries(
          trpc.studio.getMany.infiniteQueryOptions(
            { limit: DEFAULT_LIMIT },
            { getNextPageParam: (lastpage) => lastpage.nextCursor },
          ),
        );

        queryClient.invalidateQueries(
          trpc.studio.getOne.queryOptions({ id: videoId }),
        );

        toast.success('Video revalidated');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const { mutate: restoreThumbnailMutate } = useMutation(
    trpc.videos.restoreThumbnail.mutationOptions({
      onSuccess() {
        queryClient.invalidateQueries(
          trpc.studio.getMany.infiniteQueryOptions(
            { limit: DEFAULT_LIMIT },
            { getNextPageParam: (lastpage) => lastpage.nextCursor },
          ),
        );

        queryClient.invalidateQueries(
          trpc.studio.getOne.queryOptions({ id: videoId }),
        );

        toast.success('Thumbnail restored');
      },

      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const { mutate: generateTitleMutate, isPending: isGeneratingTitle } =
    useMutation(
      trpc.videos.generateTitle.mutationOptions({
        onSuccess: () => {
          toast.success('Background job started');
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }),
    );

  const {
    mutate: generateDescriptionMutate,
    isPending: isGeneratingDescription,
  } = useMutation(
    trpc.videos.generateDescription.mutationOptions({
      onSuccess: () => {
        toast.success('Background job started');
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

  const fullUrl = `${APP_URL || 'http://localhost:3000'}/videos/${videoId}`;
  const onCopy = async () => {
    await navigator.clipboard.writeText(fullUrl);

    setIsCopied(true);

    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <>
      <ThumbnailUploadModal
        videoId={videoId}
        open={thumbnailModalOpen}
        onOpenChange={setThumbnailModalOpen}
      />

      <ThumbnailGenerateModal
        videoId={videoId}
        open={thumbnailGenerateModalOpen}
        onOpenChange={setThumbnailGenerateModalOpen}
      />

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
                <Button variant="ghost" size="icon" className="cursor-pointer">
                  <MoreVerticalIcon />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={isRevalidating}
                  className="cursor-pointer"
                  onClick={() => revalidateMutate({ id: videoId })}
                >
                  <RotateCcwIcon className="size-4 mr-2" />
                  Revalidate
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => removeMutate({ id: videoId })}
                >
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
                    <FieldLabel>
                      <div className="flex items-center gap-x-2">
                        Title
                        <Button
                          size="icon"
                          type="button"
                          variant="outline"
                          title="Generate title with AI"
                          aria-label="Generate title with AI"
                          disabled={isGeneratingTitle || !data.muxTrackId}
                          className="cursor-pointer rounded-full size-6 [&_svg]:size-3"
                          onClick={() => generateTitleMutate({ id: videoId })}
                        >
                          {isGeneratingTitle ? (
                            <Loader2Icon className="animate-spin" />
                          ) : (
                            <SparklesIcon />
                          )}
                        </Button>
                      </div>
                    </FieldLabel>
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
                    <FieldLabel>
                      <div className="flex items-center gap-x-2">
                        Description
                        <Button
                          size="icon"
                          type="button"
                          variant="outline"
                          title="Generate description with AI"
                          aria-label="Generate description with AI"
                          disabled={isGeneratingDescription || !data.muxTrackId}
                          className="cursor-pointer rounded-full size-6 [&_svg]:size-3"
                          onClick={() =>
                            generateDescriptionMutate({ id: videoId })
                          }
                        >
                          {isGeneratingDescription ? (
                            <Loader2Icon className="animate-spin" />
                          ) : (
                            <SparklesIcon />
                          )}
                        </Button>
                      </div>
                    </FieldLabel>
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
                name="thumbnailUrl"
                control={form.control}
                render={() => (
                  <Field>
                    <FieldLabel>Thumbnail</FieldLabel>

                    <div className="p-0.5 border border-dashed border-neutral-400 relative h-21 w-38.25! group">
                      <Image
                        fill
                        alt="thumbnail"
                        className="object-cover"
                        unoptimized={!!data.thumbnailUrl}
                        src={data.thumbnailUrl ?? THUMBNAIL_FALLBACK}
                      />

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            type="button"
                            className="cursor-pointer bg-black/50 hover:bg-black/50 absolute top-1 right-1 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 duration-300 size-7"
                          >
                            <MoreVerticalIcon className="text-white" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                          align="start"
                          side="right"
                          className="w-37.5"
                        >
                          <DropdownMenuItem
                            onClick={() => setThumbnailModalOpen(true)}
                          >
                            <ImagePlusIcon className="size-4 mr-1" />
                            Change
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => setThumbnailGenerateModalOpen(true)}
                          >
                            <SparklesIcon className="size-4 mr-1" />
                            AI-generated
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() =>
                              restoreThumbnailMutate({ id: videoId })
                            }
                          >
                            <RotateCcwIcon className="size-4 mr-1" />
                            Restore
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
                    <p className="text-muted-foreground text-xs">
                      Video status
                    </p>
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
    </>
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
  return (
    <div>
      <div className="flex items-center justify-between mb-6 ">
        <div className="space-y-2">
          <Skeleton className="w-32 h-7" />
          <Skeleton className="w-40 h-4" />
        </div>

        <Skeleton className="w-24 h-9" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="space-y-8 lg:col-span-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="w-full h-10" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="w-full h-55" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="w-38.25 h-21" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="w-full h-10" />
          </div>
        </div>

        <div className="flex flex-col gap-y-8 lg:col-span-2">
          <div className="flex flex-col gap-4 bg-[#F9F9F9] rounded-xl overflow-hidden">
            <Skeleton className="aspect-video" />

            <div className="p-4 space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="w-full h-5" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="w-32 h-5" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="w-32 h-5" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="w-full h-10" />
          </div>
        </div>
      </div>
    </div>
  );
};
