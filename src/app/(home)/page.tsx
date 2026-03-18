import { Button } from '@/components/ui/button';
import { getQueryClient, trpc } from '@/trpc/server';
import { Show, SignInButton, SignUpButton } from '@clerk/nextjs';

export default async function Home() {
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(trpc.hello.queryOptions({ text: 'Hello' }));

  return (
    <>
      <div>I will load videos in the future!</div>

      <Show when="signed-out">
        <SignInButton />

        <SignUpButton>
          <Button>Sign Up</Button>
        </SignUpButton>
      </Show>
    </>
  );
}
