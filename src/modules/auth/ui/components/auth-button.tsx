'use client';

import { SignInButton, UserButton, Show } from '@clerk/nextjs';
import { ClapperboardIcon, UserCircleIcon, UserIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

export const AuthButton = () => {
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button
            variant="outline"
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 border-blue-500/20 rounded-full shadow-none"
          >
            <UserCircleIcon />
            Sign in
          </Button>
        </SignInButton>
      </Show>

      <Show when="signed-in">
        <UserButton>
          <UserButton.MenuItems>
            <UserButton.Link
              label="My profile"
              href="/users/current"
              labelIcon={<UserIcon className="size-4" />}
            />
            <UserButton.Link
              label="Studio"
              href="/studio"
              labelIcon={<ClapperboardIcon className="size-4" />}
            />
          </UserButton.MenuItems>
        </UserButton>
      </Show>
    </>
  );
};
