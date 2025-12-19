/**
 * src/components/AboutPage.jsx
 * 
 * Purpose: Public About page accessible at /about for SEO and external discovery.
 * Renders the same content as the Settings Drawer About tab using shared content module.
 * Includes proper SEO metadata, structured data, and mobile-first responsive design.
 * 
 * Changelog:
 * v1.1.0 - 2025-12-18 - Removed react-helmet-async; client title/description updates for /app.
 * v1.0.0 - 2025-12-17 - Initial implementation with SEO metadata and MUI components
 */

import { useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Paper,
  Button,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { aboutContent, aboutMeta } from '../content/aboutContent';

/**
 * Render content block based on type
 */
const ContentBlock = ({ block }) => {
  if (block.type === 'paragraph') {
    return (
      <Typography
        variant="body1"
        sx={{
          fontSize: { xs: '0.95rem', sm: '1rem' },
          lineHeight: 1.7,
          mb: 2,
          color: 'text.primary',
          '& strong': { fontWeight: 700 },
          '& a': {
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' }
          }
        }}
        dangerouslySetInnerHTML={{ __html: block.text }}
      />
    );
  }

  if (block.type === 'list') {
    return (
      <List
        sx={{
          mb: 3,
          '& .MuiListItem-root': {
            alignItems: 'flex-start',
            px: 0,
            py: 1
          }
        }}
      >
        {block.items.map((item, index) => (
          <ListItem key={index} disableGutters>
            <ListItemText
              primary={
                <Typography
                  component="span"
                  sx={{
                    fontSize: { xs: '0.95rem', sm: '1rem' },
                    lineHeight: 1.7,
                    color: 'text.primary'
                  }}
                >
                  <strong>{item.label}:</strong> {item.text}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    );
  }

  return null;
};

ContentBlock.propTypes = {
  block: PropTypes.shape({
    type: PropTypes.string.isRequired,
    text: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired
      })
    )
  }).isRequired
};

/**
 * About Page Component
 * 
 * Features:
 * - SEO-optimized with client-side title/description updates for /app
 * - Structured data handled in SSR marketing pages; content mirrored here
 * - Mobile-first responsive design
 * - MUI theming and components
 * - Shared content source with Settings Drawer
 */
export default function AboutPage() {
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = aboutMeta.title;
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) {
      descTag.setAttribute('content', aboutMeta.description);
    }
  }, []);

  return (
    <>
      <Box
        sx={{
          minHeight: 'var(--t2t-vv-height, 100dvh)',
          bgcolor: 'background.default',
          py: { xs: 3, sm: 5, md: 6 }
        }}
      >
        <Container maxWidth="md">
          {/* Back to App Button */}
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{
              mb: 3,
              textTransform: 'none',
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            Back to App
          </Button>

          {/* Main Content Card */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4, md: 5 },
              borderRadius: 3,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            {/* Page Header */}
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
                fontWeight: 700,
                mb: 1,
                color: 'text.primary'
              }}
            >
              {aboutContent.title}
            </Typography>

            <Typography
              variant="subtitle1"
              sx={{
                fontSize: { xs: '1rem', sm: '1.1rem' },
                color: 'text.secondary',
                mb: 4,
                fontWeight: 500
              }}
            >
              {aboutContent.subtitle}
            </Typography>

            <Divider sx={{ mb: 4 }} />

            {/* Content Sections */}
            {aboutContent.sections.map((section, index) => (
              <Box key={index} sx={{ mb: index < aboutContent.sections.length - 1 ? 4 : 0 }}>
                {section.title && (
                  <Typography
                    variant="h2"
                    component="h2"
                    sx={{
                      fontSize: { xs: '1.3rem', sm: '1.5rem' },
                      fontWeight: 700,
                      mb: 2,
                      color: 'text.primary'
                    }}
                  >
                    {section.title}
                  </Typography>
                )}

                {section.content.map((block, blockIndex) => (
                  <ContentBlock key={blockIndex} block={block} />
                ))}
              </Box>
            ))}

            {/* Call to Action */}
            <Divider sx={{ my: 4 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/')}
                sx={{
                  textTransform: 'none',
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 2
                }}
              >
                Start Using Time 2 Trade
              </Button>
            </Box>
          </Paper>

          {/* Footer Note */}
          <Typography
            variant="body2"
            sx={{
              mt: 3,
              textAlign: 'center',
              color: 'text.secondary',
              fontSize: '0.875rem'
            }}
          >
            Questions? Follow us on{' '}
            <a
              href="https://x.com/time2_trade"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit', fontWeight: 600 }}
            >
              @time2_trade
            </a>
          </Typography>
        </Container>
      </Box>
    </>
  );
}
