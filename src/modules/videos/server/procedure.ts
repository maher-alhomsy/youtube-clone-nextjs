import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

import { db } from '@/db';
import { mux } from '@/lib/mux';
import { videos, videoUpdateSchema } from '@/db/schema';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';

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
});
