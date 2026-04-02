import { z } from 'zod';
import { and, eq, getTableColumns, inArray } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { UTApi } from 'uploadthing/server';

import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from '@/trpc/init';
import { db } from '@/db';
import { mux } from '@/lib/mux';
import { workflow } from '@/lib/workflow';
import {
  users,
  videoReactions,
  videos,
  videoUpdateSchema,
  videoViews,
} from '@/db/schema';

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
        title: 'test Video',
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

      const [video] = await db
        .with(viewerReaction)
        .select({
          ...getTableColumns(videos),
          user: { ...getTableColumns(users) },

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
        .where(eq(videos.id, videoId));

      if (!video) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return video;
    }),
});
