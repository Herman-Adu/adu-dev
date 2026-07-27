'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { API_URL } from '@/lib/utils';

export const Preview = () => {
  const router = useRouter();

  useEffect(() => {
    const isStrapiPreviewMessage = (
      value: unknown
    ): value is
      | { type: 'strapiUpdate' }
      | { type: 'strapiScript'; payload: { script: string } } => {
      if (typeof value !== 'object' || value === null) return false;
      const message = value as { type?: unknown; payload?: unknown };
      if (message.type === 'strapiUpdate') return true;
      if (message.type !== 'strapiScript') return false;
      const payload = message.payload as { script?: unknown } | undefined;
      return typeof payload?.script === 'string';
    };

    const handleMessage = async (message: MessageEvent<unknown>) => {
      const { origin, data } = message;

      if (origin !== API_URL) {
        return;
      }

      // The payload crosses a window boundary, so its shape is a claim rather
      // than a guarantee — and one branch injects a <script>. Narrow before
      // reading through it.
      if (!isStrapiPreviewMessage(data)) {
        return;
      }

      if (data.type === 'strapiUpdate') {
        router.refresh();
      } else if (data.type === 'strapiScript') {
        const script = window.document.createElement('script');
        script.textContent = data.payload.script;
        window.document.head.appendChild(script);
      }
    };

    // Add the event listener
    window.addEventListener('message', handleMessage);

    // Let Strapi know we're ready to receive the script
    window.parent?.postMessage({ type: 'previewReady' }, '*');

    // Remove the event listener on unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [router]);

  return null;
};
