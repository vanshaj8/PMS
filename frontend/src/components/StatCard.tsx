import { Card, CardContent, Box, Typography, SvgIconProps } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactElement<SvgIconProps>;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  sx?: SxProps<Theme>;
}

export default function StatCard({ title, value, icon, color = 'primary', trend, sx }: StatCardProps) {
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

  // If color is a hex color string, create a custom color object
  const isHexColor = typeof color === 'string' && color.startsWith('#');
  const colors = isHexColor 
    ? { 
        bg: color, // Use solid color for hex
        iconBg: hexToRgba(color, 0.1)
      }
    : (colorMap[color] || colorMap.primary); // Fallback to primary if color not found

  return (
    <Card
      sx={{
        background: colors.bg,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        ...sx,
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: trend ? 1 : 0 }}>
              {value}
            </Typography>
            {trend && (
              <Typography
                variant="caption"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.9,
                }}
              >
                <span style={{ marginRight: 4 }}>{trend.isPositive ? '↑' : '↓'}</span>
                {Math.abs(trend.value)}% from last period
              </Typography>
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
}

