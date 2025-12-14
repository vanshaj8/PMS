import { Card, CardContent, CardHeader, SxProps, Theme } from '@mui/material';
import { ReactNode } from 'react';

interface ModernCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  sx?: SxProps<Theme>;
  headerSx?: SxProps<Theme>;
}

export default function ModernCard({ title, subtitle, children, action, sx, headerSx }: ModernCardProps) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        '&:hover': {
          boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(-2px)',
        },
        ...sx,
      }}
    >
      {(title || action) && (
        <CardHeader
          title={title}
          subheader={subtitle}
          action={action}
          sx={{
            pb: 1,
            ...headerSx,
          }}
        />
      )}
      <CardContent sx={{ pt: title ? 0 : 2 }}>{children}</CardContent>
    </Card>
  );
}

