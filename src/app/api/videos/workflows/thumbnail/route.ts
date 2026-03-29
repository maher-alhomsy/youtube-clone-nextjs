import { and, eq } from 'drizzle-orm';
import { UTApi } from 'uploadthing/server';
import { serve } from '@upstash/workflow/nextjs';

import { db } from '@/db';
import { videos } from '@/db/schema';

interface InputType {
  userId: string;
  prompt: string;
  videoId: string;
}

export const { POST } = serve(async (context) => {
  const { userId, videoId, prompt } = context.requestPayload as InputType;

  const video = await context.run('get-video', async () => {
    const [video] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.userId, userId), eq(videos.id, videoId)));

    if (!video) {
      throw new Error('Video not found');
    }

    return video;
  });

  const { body } = await context.call<{ data: { url: string }[] }>(
    'generate-thumbnail',
    {
      url: 'https://api.openai.com/v1/images/generations',
      method: 'POST',
      body: JSON.stringify({
        prompt,
        n: 1,
        model: 'dall-e-3',
        size: '1792x1024',
      }),
      headers: {
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'content-type': 'application/json',
      },
    },
  );

  const tempThumbnailUrl = body.data[0].url;

  if (!tempThumbnailUrl) {
    throw new Error('Failed to generate thumbnail');
  }

  const utapi = new UTApi();

  await context.run('clean-thumbnail', async () => {
    if (video.thumbnailKey) {
      await utapi.deleteFiles(video.thumbnailKey);

      await db
        .update(videos)
        .set({ thumbnailKey: null, thumbnailUrl: null })
        .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
    }
  });

  const uploadedThumbnail = await context.run('upload-thumbnail', async () => {
    const { data } = await utapi.uploadFilesFromUrl(tempThumbnailUrl);

    if (!data) throw new Error('Failed to upload thumbnail');

    return data;
  });

  await context.run('update-video', async () => {
    await db
      .update(videos)
      .set({
        thumbnailKey: uploadedThumbnail.key,
        thumbnailUrl: uploadedThumbnail.ufsUrl,
      })
      .where(and(eq(videos.userId, video.userId), eq(videos.id, video.id)));
  });
});
