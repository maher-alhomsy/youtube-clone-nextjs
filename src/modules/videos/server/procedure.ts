import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { UTApi } from 'uploadthing/server';
import {
  eq,
  lt,
  or,
  and,
  desc,
  inArray,
  isNotNull,
  getTableColumns,
} from 'drizzle-orm';

import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from '@/trpc/init';
import {
  users,
  videos,
  videoViews,
  subscriptions,
  videoReactions,
  videoUpdateSchema,
} from '@/db/schema';
import { db } from '@/db';
import { mux } from '@/lib/mux';
import { workflow } from '@/lib/workflow';

export const videosRouter = createTRPCRouter({
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const { id: userId } = ctx.user;

    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        passthrough: userId,
        // mp4_support: 'standard',
        playback_policies: ['public'],
        inputs: [
          { generated_subtitles: [{ language_code: 'en', name: 'English' }] },
        ],
      },
      cors_origin: '*',
    });

    const [video] = await db
      .insert(videos)
      .values({
        userId,
        title: '',
        muxStatus: 'waiting',
        muxUploadId: upload.id,
      })
      .returning();

    return { video, url: upload.url };
  }),

  update: protectedProcedure
    .input(videoUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;

      const { title, description, categoryId, visibility } = input;

      if (!input.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Video ID is required.',
        });
      }

      const [updatedVideo] = await db
        .update(videos)
        .set({
          title,
          categoryId,
          visibility,
          description,
          updatedAt: new Date(),
        })
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
        .returning();

      if (!updatedVideo) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return updatedVideo;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: videoId } = input;
      const { id: userId } = ctx.user;

      const [removedVideo] = await db
        .delete(videos)
        .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
        .returning();

      if (removedVideo.muxAssetId) {
        await mux.video.assets.delete(removedVideo.muxAssetId);
      }

      if (!removedVideo) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return removedVideo;
    }),

  restoreThumbnail: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { id: videoId } = input;
      const { id: userId } = ctx.user;

      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));

      if (!existingVideo) throw new TRPCError({ code: 'NOT_FOUND' });

      if (existingVideo.thumbnailKey) {
        const auapi = new UTApi();

        await auapi.deleteFiles(existingVideo.thumbnailKey);
        await db
          .update(videos)
          .set({ thumbnailKey: null, thumbnailUrl: null })
          .where(and(eq(videos.id, input.id), eq(videos.userId, userId)));
      }

      if (!existingVideo.muxPlaybackId) {
        throw new TRPCError({ code: 'BAD_REQUEST' });
      }

      const thumbnailUrl = `https://image.mux.com/${existingVideo.muxPlaybackId}/thumbnail.jpg`;

      // const utapi = new UTApi();
      // const uploadedThumbnail =
      //   await utapi.uploadFilesFromUrl(tempThumbnailUrl);

      // if (!uploadedThumbnail.data) {
      //   throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      // }

      // const { key: thumbnailKey, ufsUrl: thumbnailUrl } =
      //   uploadedThumbnail.data;

      const [updatedVideo] = await db
        .update(videos)
        .set({ thumbnailUrl })
        .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
        .returning();

      return updatedVideo;
    }),

  generateTitle: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: videoId } = input;
      const { id: userId } = ctx.user;

      const { workflowRunId } = await workflow.trigger({
        url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/title`,
        body: { userId, videoId },
      });

      return workflowRunId;
    }),

  generateDescription: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: videoId } = input;
      const { id: userId } = ctx.user;

      const { workflowRunId } = await workflow.trigger({
        url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/description`,
        body: { userId, videoId },
      });

      return workflowRunId;
    }),

  generateThumbnail: protectedProcedure
    .input(z.object({ id: z.uuid(), prompt: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id: videoId, prompt } = input;
      const { id: userId } = ctx.user;

      const { workflowRunId } = await workflow.trigger({
        url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/thumbnail`,
        body: { userId, videoId, prompt },
      });

      return workflowRunId;
    }),

  getOne: baseProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input, ctx }) => {
      const { clerkId } = ctx;
      const { id: videoId } = input;

      let userId;

      const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, clerkId ? [clerkId] : []));

      if (user) userId = user.id;

      const viewerReaction = db.$with('viewer_reaction').as(
        db
          .select({
            type: videoReactions.type,
            videoId: videoReactions.videoId,
          })
          .from(videoReactions)
          .where(inArray(videoReactions.userId, userId ? [userId] : [])),
      );

      const viewerSubscriptions = db.$with('viewer_subscriptions').as(
        db
          .select()
          .from(subscriptions)
          .where(inArray(subscriptions.viewerId, userId ? [userId] : [])),
      );

      const [video] = await db
        .with(viewerReaction, viewerSubscriptions)
        .select({
          ...getTableColumns(videos),
          user: {
            ...getTableColumns(users),
            viewerSubscribed: isNotNull(viewerSubscriptions.viewerId).mapWith(
              Boolean,
            ),

            subscriberCount: db.$count(
              subscriptions,
              eq(subscriptions.creatorId, users.id),
            ),
          },

          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),

          likeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, 'like'),
            ),
          ),

          dislikeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, 'dislike'),
            ),
          ),

          viewerReaction: viewerReaction.type,
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .leftJoin(viewerReaction, eq(viewerReaction.videoId, videos.id))
        .leftJoin(
          viewerSubscriptions,
          eq(viewerSubscriptions.creatorId, users.id),
        )
        .where(eq(videos.id, videoId));

      if (!video) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return video;
    }),

  revalidate: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { id: videoId } = input;
      const { id: userId } = ctx.user;

      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));

      if (!existingVideo) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (!existingVideo.muxUploadId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot revalidate a video without an upload ID',
        });
      }

      const directUpload = await mux.video.uploads.retrieve(
        existingVideo.muxUploadId,
      );

      if (!directUpload || !directUpload.asset_id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Mux upload not found',
        });
      }

      const asset = await mux.video.assets.retrieve(directUpload.asset_id);

      if (!asset) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Mux asset not found',
        });
      }

      const duration = asset.duration ? Math.round(asset.duration * 1000) : 0;

      const [updatedVideo] = await db
        .update(videos)
        .set({
          duration,
          muxAssetId: asset.id,
          muxStatus: asset.status,
          muxPlaybackId: asset.playback_ids?.[0]?.id || null,
        })
        .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
        .returning();

      return updatedVideo;
    }),

  getMany: baseProcedure
    .input(
      z.object({
        userId: z.uuid().nullish(),
        categoryId: z.uuid().nullish(),
        limit: z.number().min(1).max(100),
        cursor: z.object({ id: z.uuid(), updatedAt: z.date() }).nullish(),
      }),
    )
    .query(async ({ input }) => {
      const { limit, cursor, categoryId, userId } = input;

      const data = await db
        .select({
          ...getTableColumns(videos),
          user: users,
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
          likeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.type, 'like'),
              eq(videoReactions.videoId, videos.id),
            ),
          ),
          dislikeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.type, 'dislike'),
              eq(videoReactions.videoId, videos.id),
            ),
          ),
        })
        .from(videos)
        .innerJoin(users, eq(users.id, videos.userId))
        .where(
          and(
            eq(videos.visibility, 'public'),
            categoryId ? eq(videos.categoryId, categoryId) : undefined,
            userId ? eq(videos.userId, userId) : undefined,
            cursor
              ? or(
                  lt(videos.updatedAt, cursor.updatedAt),
                  and(
                    eq(videos.updatedAt, cursor.updatedAt),
                    lt(videos.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(videos.updatedAt), desc(videos.id))
        .limit(limit + 1);

      const hasMore = data.length > limit;
      // Remove the last item if there is more data
      const items = hasMore ? data.slice(0, -1) : data;

      // Set the next cursor to the last item if there is more data
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? { id: lastItem.id, updatedAt: lastItem.updatedAt }
        : null;

      return { items, nextCursor };
    }),

  getManyTrending: baseProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100),
        cursor: z.object({ id: z.uuid(), viewCount: z.number() }).nullish(),
      }),
    )
    .query(async ({ input }) => {
      const { limit, cursor } = input;

      const viewCountSubquery = db.$count(
        videoViews,
        eq(videoViews.videoId, videos.id),
      );

      const data = await db
        .select({
          ...getTableColumns(videos),
          user: users,
          viewCount: viewCountSubquery,
          likeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.type, 'like'),
              eq(videoReactions.videoId, videos.id),
            ),
          ),
          dislikeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.type, 'dislike'),
              eq(videoReactions.videoId, videos.id),
            ),
          ),
        })
        .from(videos)
        .innerJoin(users, eq(users.id, videos.userId))
        .where(
          and(
            eq(videos.visibility, 'public'),
            cursor
              ? or(
                  lt(viewCountSubquery, cursor.viewCount),
                  and(
                    eq(viewCountSubquery, cursor.viewCount),
                    lt(videos.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(viewCountSubquery), desc(videos.id))
        .limit(limit + 1);

      const hasMore = data.length > limit;
      // Remove the last item if there is more data
      const items = hasMore ? data.slice(0, -1) : data;

      // Set the next cursor to the last item if there is more data
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? { id: lastItem.id, viewCount: lastItem.viewCount }
        : null;

      return { items, nextCursor };
    }),

  getManySubscribed: protectedProcedure
    .input(
      z.object({
        categoryId: z.uuid().nullish(),
        limit: z.number().min(1).max(100),
        cursor: z.object({ id: z.uuid(), updatedAt: z.date() }).nullish(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { limit, cursor, categoryId } = input;

      const viewerSubscriptions = db
        .$with('viewer_subscriptions')
        .as(
          db
            .select({ userId: subscriptions.creatorId })
            .from(subscriptions)
            .where(eq(subscriptions.viewerId, userId)),
        );

      const data = await db
        .with(viewerSubscriptions)
        .select({
          ...getTableColumns(videos),
          user: users,
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
          likeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.type, 'like'),
              eq(videoReactions.videoId, videos.id),
            ),
          ),
          dislikeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.type, 'dislike'),
              eq(videoReactions.videoId, videos.id),
            ),
          ),
        })
        .from(videos)
        .innerJoin(users, eq(users.id, videos.userId))
        .innerJoin(
          viewerSubscriptions,
          eq(viewerSubscriptions.userId, users.id),
        )
        .where(
          and(
            eq(videos.visibility, 'public'),
            categoryId ? eq(videos.categoryId, categoryId) : undefined,
            cursor
              ? or(
                  lt(videos.updatedAt, cursor.updatedAt),
                  and(
                    eq(videos.updatedAt, cursor.updatedAt),
                    lt(videos.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(desc(videos.updatedAt), desc(videos.id))
        .limit(limit + 1);

      const hasMore = data.length > limit;
      // Remove the last item if there is more data
      const items = hasMore ? data.slice(0, -1) : data;

      // Set the next cursor to the last item if there is more data
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? { id: lastItem.id, updatedAt: lastItem.updatedAt }
        : null;

      return { items, nextCursor };
    }),
});
