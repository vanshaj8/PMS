import { Box, Typography } from '@mui/material';

interface LogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
}

export default function Logo({ variant = 'full', size = 'medium', showTagline = false }: LogoProps) {
  const sizes = {
    small: { icon: 24, text: '1rem', tagline: '0.7rem' },
    medium: { icon: 32, text: '1.5rem', tagline: '0.85rem' },
    large: { icon: 48, text: '2rem', tagline: '1rem' },
  };

  const currentSize = sizes[size];

  const LogoIcon = () => (
    <Box
      sx={{
        width: currentSize.icon,
        height: currentSize.icon,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={currentSize.icon}
        height={currentSize.icon}
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#667eea', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#764ba2', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        {/* Upward trending arrow representing growth */}
        <path
          d="M 8 30 L 20 8 L 32 30"
          fill="none"
          stroke="url(#logoGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 8 30 L 20 18 L 32 30"
          fill="url(#logoGradient)"
          opacity="0.3"
        />
        {/* Goal target circle */}
        <circle cx="20" cy="8" r="4" fill="url(#logoGradient)" />
        {/* Base line */}
        <line
          x1="6"
          y1="30"
          x2="34"
          y2="30"
          stroke="url(#logoGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </Box>
  );

  if (variant === 'icon') {
    return <LogoIcon />;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <LogoIcon />
      {(variant === 'full' || variant === 'text') && (
        <Box>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 700,
              fontSize: currentSize.text,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.2,
            }}
          >
            Performix
          </Typography>
          {showTagline && (
            <Typography
              variant="caption"
              sx={{
                fontSize: currentSize.tagline,
                color: 'text.secondary',
                display: 'block',
                lineHeight: 1.2,
                mt: 0.25,
              }}
            >
              Where goals turn into growth
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

