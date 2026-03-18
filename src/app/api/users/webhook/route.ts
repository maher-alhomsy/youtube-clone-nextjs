import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { verifyWebhook } from '@clerk/nextjs/webhooks';

import { db } from '@/db';
import { users } from '@/db/schema';

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    const { id } = evt.data;
    const eventType = evt.type;
    console.log(
      `Received webhook with ID ${id} and event type of ${eventType}`,
    );

    if (eventType === 'user.created') {
      const { id: clerkId, image_url, first_name, last_name } = evt.data;

      await db.insert(users).values({
        clerkId,
        imageUrl: image_url,
        name: `${first_name} ${last_name}`,
      });
    }

    if (eventType === 'user.deleted') {
      const { id: clerkId } = evt.data;

      if (!clerkId) {
        return new Response('Clerk ID not found in webhook payload', {
          status: 400,
        });
      }

      await db.delete(users).where(eq(users.clerkId, clerkId));
    }

    if (eventType === 'user.updated') {
      const { id: clerkId } = evt.data;

      await db
        .update(users)
        .set({
          imageUrl: evt.data.image_url,
          name: `${evt.data.first_name} ${evt.data.last_name}`,
        })
        .where(eq(users.clerkId, clerkId));
    }

    return new Response('Webhook received', { status: 200 });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error verifying webhook', { status: 400 });
  }
}
