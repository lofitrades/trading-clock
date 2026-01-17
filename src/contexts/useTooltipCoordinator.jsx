/**
 * src/contexts/useTooltipCoordinator.jsx
 * 
 * Purpose: Hook to access the tooltip coordinator context.
 * Ensures consumers are mounted within TooltipProvider.
 * 
 * Changelog:
 * v1.0.0 - 2026-01-16 - Extracted from TooltipContext.jsx for react-refresh compliance.
 */

import { useContext } from 'react';
import TooltipContext from './TooltipContextBase';

/**
 * Hook to access tooltip coordinator
 * @returns {Object} Tooltip context value
 * @throws {Error} If used outside TooltipProvider
 */
export function useTooltipCoordinator() {
    const context = useContext(TooltipContext);
    if (!context) {
        throw new Error('useTooltipCoordinator must be used within TooltipProvider');
    }
    return context;
}

export default useTooltipCoordinator;
