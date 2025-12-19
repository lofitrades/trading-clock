/**
 * renderer/PageShell.jsx
 * 
 * Purpose: Shared layout wrapper for vite-plugin-ssr pages.
 * Provides a consistent root element and class hooks for global styles while
 * letting each page control its own content and structure.
 * 
 * Changelog:
 * v1.0.0 - 2025-12-18 - Initial shared shell for marketing and app pages.
 */

export function PageShell({ children }) {
    return (
        <div className="page-shell">
            <div className="page-shell__inner">{children}</div>
        </div>
    );
}
