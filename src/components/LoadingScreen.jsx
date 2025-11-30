// src/components/LoadingScreen.jsx
import React from 'react';
import { Box, Fade } from '@mui/material';
import LoadingAnimation from './LoadingAnimation';

const LoadingScreen = ({ isLoading, clockSize = 375 }) => {

  return (
    <Fade in={isLoading} timeout={300}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#F9F9F9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          gap: 3,
        }}
      >
        <LoadingAnimation clockSize={clockSize} isLoading={isLoading} />
        <Box
          sx={{
            fontSize: '1.2rem',
            fontWeight: 500,
            color: '#4B4B4B',
            fontFamily: 'Roboto, sans-serif',
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 0.6 },
              '50%': { opacity: 1 },
            },
          }}
        >
          Loading Time 2 Trade...
        </Box>
      </Box>
    </Fade>
  );
};

export default LoadingScreen;
