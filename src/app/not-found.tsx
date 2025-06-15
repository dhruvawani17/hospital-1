
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import React from 'react'; // For Suspense
import { APP_NAME } from '@/lib/constants';
import { Frown } from 'lucide-react';

function NotFoundPageDisplay() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center py-10">
      <Frown className="w-24 h-24 text-primary mb-6" />
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-3xl font-headline mb-6">Oops! Page Not Found.</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        It seems like the page you were looking for doesn't exist or has been moved.
        Let's get you back on track.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg">
          <Link href="/">Go to Homepage</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/services">Explore Our Services</Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mt-12">
        If you believe this is an error, please contact support for {APP_NAME}.
      </p>
    </div>
  );
}

export default function NotFound() {
  return (
    <React.Suspense fallback={
        <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center py-12">
            {/* You can add a more sophisticated skeleton/loader here if needed */}
            <p className="text-lg text-muted-foreground">Loading page...</p>
        </div>
    }>
        <NotFoundPageDisplay />
    </React.Suspense>
  );
}
