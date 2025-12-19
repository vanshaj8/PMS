import { Card, CardContent, Box, Typography, SvgIconProps, Tooltip, Chip } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import { ArrowUpward, ArrowDownward, Warning as WarningIcon } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactElement<SvgIconProps>;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  isUrgent?: boolean;
  tooltip?: string;
  sx?: SxProps<Theme>;
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  color = 'primary', 
  trend, 
  onClick,
  severity,
  isUrgent,
  tooltip,
  sx 
}: StatCardProps) {
  const colorMap: Record<string, { bg: string; iconBg: string }> = {
    primary: { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', iconBg: 'rgba(102, 126, 234, 0.1)' },
    secondary: { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', iconBg: 'rgba(245, 87, 108, 0.1)' },
    success: { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', iconBg: 'rgba(79, 172, 254, 0.1)' },
    warning: { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', iconBg: 'rgba(250, 112, 154, 0.1)' },
    error: { bg: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)', iconBg: 'rgba(255, 107, 107, 0.1)' },
    info: { bg: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', iconBg: 'rgba(48, 207, 208, 0.1)' },
  };

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Determine severity-based color if not explicitly set
  const getSeverityColor = () => {
    if (severity === 'critical') return 'error';
    if (severity === 'high') return 'error';
    if (severity === 'medium') return 'warning';
    if (severity === 'low') return 'success';
    return color;
  };

  // If color is a hex color string, create a custom color object
  const isHexColor = typeof color === 'string' && color.startsWith('#');
  const finalColor = severity ? getSeverityColor() : color;
  const colors = isHexColor 
    ? { 
        bg: color, // Use solid color for hex
        iconBg: hexToRgba(color, 0.1)
      }
    : (colorMap[finalColor] || colorMap.primary); // Fallback to primary if color not found

  const cardContent = (
    <Card
      onClick={onClick}
      sx={{
        background: colors.bg,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
          zIndex: 1,
        } : {},
        border: isUrgent ? '2px solid #ffeb3b' : 'none',
        boxShadow: isUrgent ? '0 0 10px rgba(255, 235, 59, 0.5)' : 'none',
        ...sx,
      }}
    >
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ flex: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1.5, fontSize: '0.875rem' }}>
              {title}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 700, 
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                  lineHeight: 1.2,
                }}
              >
                {value}
              </Typography>
              {isUrgent && (
                <WarningIcon 
                  sx={{ 
                    fontSize: { xs: 20, sm: 24 }, 
                    color: '#ffeb3b',
                    flexShrink: 0,
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                    },
                    animation: 'pulse 2s infinite',
                  }} 
                />
              )}
            </Box>
            {trend && (
              <Typography
                variant="caption"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.9,
                  fontSize: '0.75rem',
                  mb: 0.5,
                }}
              >
                {trend.isPositive ? (
                  <ArrowUpward sx={{ fontSize: 14, mr: 0.5, color: '#4caf50' }} />
                ) : (
                  <ArrowDownward sx={{ fontSize: 14, mr: 0.5, color: '#f44336' }} />
                )}
                {Math.abs(trend.value)}% from last period
              </Typography>
            )}
            {severity && (
              <Chip
                label={severity.toUpperCase()}
                size="small"
                sx={{
                  mt: 0.5,
                  bgcolor: severity === 'critical' ? 'rgba(244, 67, 54, 0.3)' :
                          severity === 'high' ? 'rgba(255, 152, 0, 0.3)' :
                          severity === 'medium' ? 'rgba(255, 193, 7, 0.3)' :
                          'rgba(76, 175, 80, 0.3)',
                  color: 'white',
                  fontSize: '0.7rem',
                  height: '20px',
                }}
              />
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                backgroundColor: colors.iconBg,
                borderRadius: 2,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                ml: 1,
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
        }}
      />
    </Card>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow>
        {cardContent}
      </Tooltip>
    );
  }

  return cardContent;
}

