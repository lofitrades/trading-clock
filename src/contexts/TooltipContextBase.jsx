/**
 * src/contexts/TooltipContextBase.jsx
 * 
 * Purpose: Shared tooltip context instance for provider/hook separation.
 * Centralizes createContext to keep provider files export React components only.
 * 
 * Changelog:
 * v1.0.0 - 2026-01-16 - Extracted TooltipContext for shared usage.
 */

import { createContext } from 'react';

const TooltipContext = createContext(null);

export default TooltipContext;
