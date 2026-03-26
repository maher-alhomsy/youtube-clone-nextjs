import { db } from '@/db';
import { mux } from '@/lib/mux';
import { videos } from '@/db/schema';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';

export const videosRouter = createTRPCRouter({
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const { id: userId } = ctx.user;

    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        passthrough: userId,
        // mp4_support: 'standard',
        playback_policies: ['public'],
      },
      cors_origin: '*',
    });

    console.log({ upload });

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
});
