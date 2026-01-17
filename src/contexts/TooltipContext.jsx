/**
 * src/contexts/TooltipContext.jsx
 *
 * Purpose: Global tooltip state coordinator to ensure only one tooltip (session or event) is visible at a time.
 * Prevents tooltip conflicts and provides clean API for tooltip management across components.
 *
 * Changelog:
 * v1.0.1 - 2026-01-16 - Split hook into separate file for react-refresh compliance.
 * v1.0.0 - 2026-01-16 - Initial implementation with single tooltip coordination
 */

import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import TooltipContext from './TooltipContextBase';

/**
 * TooltipProvider Component
 * Manages global tooltip state across the application
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export function TooltipProvider({ children }) {
    const [activeTooltip, setActiveTooltip] = useState(null);

    /**
     * Open a tooltip and close any existing one
     * @param {string} type - Tooltip type ('session' or 'event')
     * @param {string|number} id - Unique identifier for the tooltip
     */
    const openTooltip = useCallback((type, id) => {
        setActiveTooltip({ type, id });
    }, []);

    /**
     * Close the currently active tooltip
     * @param {string} type - Optional: only close if this type is active
     */
    const closeTooltip = useCallback((type) => {
        if (type && activeTooltip?.type !== type) return;
        setActiveTooltip(null);
    }, [activeTooltip]);

    /**
     * Check if a specific tooltip is currently active
     * @param {string} type - Tooltip type
     * @param {string|number} id - Tooltip ID
     * @returns {boolean}
     */
    const isTooltipActive = useCallback((type, id) => {
        return activeTooltip?.type === type && activeTooltip?.id === id;
    }, [activeTooltip]);

    const value = {
        activeTooltip,
        openTooltip,
        closeTooltip,
        isTooltipActive,
    };

    return (
        <TooltipContext.Provider value={value}>
            {children}
        </TooltipContext.Provider>
    );
}

TooltipProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

