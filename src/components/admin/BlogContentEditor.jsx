/**
 * src/components/admin/BlogContentEditor.jsx
 * 
 * Purpose: Rich text editor for blog content with HTML sanitization.
 * Uses basic textarea with HTML preview for MVP (can be upgraded to WYSIWYG later).
 * BEP: Sanitizes output, whitelist-based embed validation, responsive design
 * 
 * Changelog:
 * v1.0.0 - 2026-02-04 - Initial implementation (Phase 2 Blog)
 */

import { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
    Box,
    TextField,
    Tabs,
    Tab,
    Typography,
    Stack,
    IconButton,
    Tooltip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CodeIcon from '@mui/icons-material/Code';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import TitleIcon from '@mui/icons-material/Title';
import { ALLOWED_EMBED_DOMAINS } from '../../types/blogTypes';

/**
 * Sanitize HTML content (BEP security)
 * Removes scripts, dangerous attributes, and validates embeds
 * Note: For production, consider using DOMPurify library
 */
const sanitizeHtml = (html) => {
    if (!html) return '';

    // Remove script tags and event handlers
    let sanitized = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '')
        .replace(/javascript:/gi, '');

    // Validate iframe sources (only allow whitelisted domains)
    sanitized = sanitized.replace(
        /<iframe[^>]*src="([^"]*)"[^>]*>/gi,
        (match, src) => {
            const url = new URL(src, 'https://example.com');
            const isAllowed = ALLOWED_EMBED_DOMAINS.some(
                (domain) => url.hostname === domain || url.hostname.endsWith('.' + domain)
            );
            return isAllowed ? match : '<!-- embed removed -->';
        }
    );

    return sanitized;
};

/**
 * Simple HTML preview renderer
 */
const HtmlPreview = ({ html }) => {
    const sanitized = useMemo(() => sanitizeHtml(html), [html]);

    return (
        <Box
            sx={{
                p: 2,
                minHeight: 300,
                bgcolor: 'background.default',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'auto',
                '& h1, & h2, & h3, & h4, & h5, & h6': {
                    mt: 2,
                    mb: 1,
                },
                '& p': {
                    mb: 1.5,
                },
                '& ul, & ol': {
                    pl: 3,
                    mb: 1.5,
                },
                '& blockquote': {
                    borderLeft: 4,
                    borderColor: 'primary.main',
                    pl: 2,
                    my: 2,
                    fontStyle: 'italic',
                },
                '& img': {
                    maxWidth: '100%',
                    height: 'auto',
                },
                '& a': {
                    color: 'primary.main',
                },
                '& pre': {
                    bgcolor: 'grey.100',
                    p: 1.5,
                    borderRadius: 1,
                    overflow: 'auto',
                },
                '& code': {
                    bgcolor: 'grey.100',
                    px: 0.5,
                    borderRadius: 0.5,
                    fontFamily: 'monospace',
                },
            }}
            dangerouslySetInnerHTML={{ __html: sanitized }}
        />
    );
};

HtmlPreview.propTypes = {
    html: PropTypes.string,
};

const BlogContentEditor = ({ value, onChange }) => {
    const { t } = useTranslation('admin');
    const [activeTab, setActiveTab] = useState(0); // 0 = edit, 1 = preview
    const [textareaRef, setTextareaRef] = useState(null);

    // Insert text at cursor position
    const insertAtCursor = useCallback((before, after = '') => {
        if (!textareaRef) return;

        const start = textareaRef.selectionStart;
        const end = textareaRef.selectionEnd;
        const selectedText = value.substring(start, end);
        const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end);

        onChange(newValue);

        // Reset cursor position
        setTimeout(() => {
            textareaRef.focus();
            const newPos = start + before.length + selectedText.length + after.length;
            textareaRef.setSelectionRange(newPos, newPos);
        }, 0);
    }, [value, onChange, textareaRef]);

    // Toolbar buttons
    const toolbarButtons = [
        { icon: <FormatBoldIcon fontSize="small" />, title: 'Bold', action: () => insertAtCursor('<strong>', '</strong>') },
        { icon: <FormatItalicIcon fontSize="small" />, title: 'Italic', action: () => insertAtCursor('<em>', '</em>') },
        { icon: <TitleIcon fontSize="small" />, title: 'Heading', action: () => insertAtCursor('<h2>', '</h2>') },
        { icon: <LinkIcon fontSize="small" />, title: 'Link', action: () => insertAtCursor('<a href="">', '</a>') },
        { icon: <ImageIcon fontSize="small" />, title: 'Image', action: () => insertAtCursor('<img src="" alt="" />') },
        { icon: <FormatListBulletedIcon fontSize="small" />, title: 'Bullet List', action: () => insertAtCursor('<ul>\n  <li>', '</li>\n</ul>') },
        { icon: <FormatListNumberedIcon fontSize="small" />, title: 'Numbered List', action: () => insertAtCursor('<ol>\n  <li>', '</li>\n</ol>') },
        { icon: <FormatQuoteIcon fontSize="small" />, title: 'Quote', action: () => insertAtCursor('<blockquote>', '</blockquote>') },
    ];

    return (
        <Box>
            {/* Tab switcher */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                    <Tab
                        icon={<CodeIcon />}
                        iconPosition="start"
                        label={t('blog.editor.html')}
                    />
                    <Tab
                        icon={<VisibilityIcon />}
                        iconPosition="start"
                        label={t('blog.editor.preview')}
                    />
                </Tabs>
            </Box>

            {/* Toolbar (only in edit mode) */}
            {activeTab === 0 && (
                <Stack direction="row" spacing={0.5} sx={{ mb: 1 }} flexWrap="wrap">
                    {toolbarButtons.map((btn, index) => (
                        <Tooltip key={index} title={btn.title}>
                            <IconButton size="small" onClick={btn.action}>
                                {btn.icon}
                            </IconButton>
                        </Tooltip>
                    ))}
                </Stack>
            )}

            {/* Editor / Preview */}
            {activeTab === 0 ? (
                <TextField
                    fullWidth
                    multiline
                    minRows={15}
                    maxRows={30}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    inputRef={setTextareaRef}
                    placeholder={t('blog.editor.placeholder')}
                    sx={{
                        '& .MuiInputBase-input': {
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                        },
                    }}
                />
            ) : (
                <HtmlPreview html={value} />
            )}

            {/* Help text */}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {t('blog.editor.helpText')}
            </Typography>
        </Box>
    );
};

BlogContentEditor.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
};

export default BlogContentEditor;
