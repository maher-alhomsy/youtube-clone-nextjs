import { Button } from '@/components/ui/button';
import { Show, SignInButton, SignUpButton } from '@clerk/nextjs';

export default function Home() {
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
