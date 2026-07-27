'use client';

import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';

// Whether we are framed is a fact about the browser, not React state, and it
// cannot change for the life of the document — hence a subscribe that never
// fires. `useSyncExternalStore` is what reads that safely across the server
// boundary: the server snapshot assumes framed, so the banner is absent from
// the HTML and appears only once the client confirms it is a top-level window.
const subscribeToNothing = () => () => {};
const isFramed = () => window !== window.top;
const isFramedOnServer = () => true;

export function DraftModeBanner() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const isIframe = useSyncExternalStore(
    subscribeToNothing,
    isFramed,
    isFramedOnServer
  );

  const handleExitDraft = async () => {
    setIsExiting(true);
    try {
      await fetch('/api/exit-preview');
      router.refresh();
    } catch (error) {
      console.error('Failed to exit draft mode:', error);
      setIsExiting(false);
    }
  };

  if (isIframe) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-secondary text-black px-6 py-3 rounded-lg shadow-lg flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="inline-block w-4 h-4 bg-black rounded-full animate-pulse" />
        <span className="font-semibold">Draft Mode</span>
      </div>
      <button
        onClick={handleExitDraft}
        disabled={isExiting}
        className="bg-black text-white px-4 py-1 rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {isExiting ? 'Exiting...' : 'Exit Draft'}
      </button>
    </div>
  );
}
