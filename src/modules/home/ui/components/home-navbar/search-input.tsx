'use client';

import { Suspense, useState } from 'react';

import { SearchIcon, XIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { APP_URL } from '@/constants';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export const SearchInput = () => {
  return (
    <Suspense fallback={<Skeleton className="w-full h-10" />}>
      <SearchInputSuspense />
    </Suspense>
  );
};

const SearchInputSuspense = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get('query') || '';
  const categoryId = searchParams.get('categoryId') || '';

  const [value, setValue] = useState(initialQuery);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const url = new URL('/search', APP_URL);
    const newQuery = value.trim();
    url.searchParams.set('query', encodeURIComponent(newQuery));

    if (categoryId) {
      url.searchParams.set('categoryId', categoryId);
    }

    if (newQuery === '') {
      url.searchParams.delete('query');
    }

    setValue(newQuery);
    router.push(url.toString());
  };

  return (
    <form className="flex w-full max-w-150" onSubmit={handleSearch}>
      <div className="relative w-full">
        <input
          value={value}
          type="text"
          placeholder="Search"
          onChange={(e) => setValue(e.target.value)}
          className="w-full pl-4 py-2 pr-12 rounded-l-full border focus:outline-none focus:border-blue-500"
        />

        {value && (
          <Button
            size="icon"
            type="button"
            variant="ghost"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
            onClick={() => setValue('')}
          >
            <XIcon className="text-gray-500" />
          </Button>
        )}
      </div>

      <button
        type="submit"
        disabled={!value.trim()}
        className="px-5 py-2.5 bg-gray-100 border border-l-0 rounded-r-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <SearchIcon className="size-5" />
      </button>
    </form>
  );
};
