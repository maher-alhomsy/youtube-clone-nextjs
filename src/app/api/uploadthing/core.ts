import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { UploadThingError, UTApi } from 'uploadthing/server';
import { createUploadthing, type FileRouter } from 'uploadthing/next';

import { db } from '@/db';
import { users, videos } from '@/db/schema';

const f = createUploadthing();

export const ourFileRouter = {
  thumbnailUploader: f({
    image: { maxFileSize: '4MB', maxFileCount: 1 },
  })
    .input(z.object({ videoId: z.uuid() }))
    .middleware(async ({ input }) => {
      const { userId: clerkUserId } = await auth();

      if (!clerkUserId) throw new UploadThingError('Unauthorized');

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkUserId));

      if (!user) throw new UploadThingError('User not found');

      const [existingVideo] = await db
        .select({ thumbnailKey: videos.thumbnailKey })
        .from(videos)
        .where(and(eq(videos.id, input.videoId), eq(videos.userId, user.id)));

      if (!existingVideo) throw new UploadThingError('Video not found');

      if (existingVideo.thumbnailKey) {
        const auapi = new UTApi();

        await auapi.deleteFiles(existingVideo.thumbnailKey);
        await db
          .update(videos)
          .set({ thumbnailKey: null, thumbnailUrl: null })
          .where(and(eq(videos.id, input.videoId), eq(videos.userId, user.id)));
      }

      return { ...input, userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db
        .update(videos)
        .set({ thumbnailUrl: file.ufsUrl, thumbnailKey: file.key })
        .where(
          and(
            eq(videos.id, metadata.videoId),
            eq(videos.userId, metadata.userId),
          ),
        );

      return { uploadedBy: metadata.userId };
    }),
  bannerUploader: f({
    image: { maxFileSize: '4MB', maxFileCount: 1 },
  })
    .middleware(async () => {
      const { userId: clerkUserId } = await auth();

      if (!clerkUserId) throw new UploadThingError('Unauthorized');

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkUserId));

      if (!user) throw new UploadThingError('User not found');

      if (user.bannerKey) {
        const auapi = new UTApi();

        await auapi.deleteFiles(user.bannerKey);

        await db
          .update(users)
          .set({ bannerKey: null, bannerUrl: null })
          .where(eq(users.id, user.id));
      }

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db
        .update(users)
        .set({ bannerUrl: file.ufsUrl, bannerKey: file.key })
        .where(and(eq(users.id, metadata.userId)));

      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
