/**
 * renderer/+onRenderClient.jsx
 * 
 * Purpose: Client-side hydration entry for vite-plugin-ssr. Hydrates the
 * prerendered marketing pages and mounts the /app shell once loaded.
 * 
 * Changelog:
 * v1.0.0 - 2025-12-18 - Initial hydration implementation using React 19.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { PageShell } from './PageShell';

export async function onRenderClient(pageContext) {
    const { Page, pageProps } = pageContext;
    const rootContainer = document.getElementById('page-view') || document.getElementById('root');

    if (!rootContainer) {
        throw new Error('Root container not found. Expected #page-view or #root element.');
    }

    if (!Page) {
        console.error('No Page component found in pageContext', pageContext);
        return;
    }

    ReactDOM.hydrateRoot(
        rootContainer,
        <PageShell pageContext={pageContext}>
            <Page {...pageProps} />
        </PageShell>,
    );
}
