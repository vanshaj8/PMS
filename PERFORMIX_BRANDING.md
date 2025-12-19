# Performix Branding Guide

## Brand Identity

**Application Name:** Performix  
**Tagline:** Where goals turn into growth

## Logo

The Performix logo features:
- **Icon:** An upward trending arrow with a target circle, representing growth and goal achievement
- **Colors:** Gradient from #667eea (purple-blue) to #764ba2 (purple)
- **Typography:** Inter font family, bold weight for the name

### Logo Components

1. **SVG Logo** (`frontend/src/assets/logo.svg`)
   - Full logo with icon and text
   - Scalable vector format

2. **React Logo Component** (`frontend/src/components/Logo.tsx`)
   - Reusable React component
   - Variants: `full`, `icon`, `text`
   - Sizes: `small`, `medium`, `large`
   - Optional tagline display

### Usage

```tsx
import Logo from './components/Logo';

// Full logo with tagline
<Logo variant="full" size="large" showTagline={true} />

// Icon only
<Logo variant="icon" size="medium" />

// Text only
<Logo variant="text" size="small" />
```

## Color Palette

### Primary Colors
- **Primary Purple:** #667eea
- **Primary Purple Dark:** #764ba2
- **Gradient:** linear-gradient(135deg, #667eea 0%, #764ba2 100%)

### Usage
- AppBar background: Gradient
- Logo: Gradient
- Primary buttons: Gradient
- Accent elements: Gradient

## Typography

- **Font Family:** Inter (primary), system fonts (fallback)
- **Logo Text:** Bold (700 weight)
- **Tagline:** Regular (400 weight), secondary color

## Updated Files

### Frontend
- ✅ `frontend/index.html` - Page title updated
- ✅ `frontend/src/components/Logo.tsx` - New logo component
- ✅ `frontend/src/components/Layout.tsx` - Uses new logo
- ✅ `frontend/src/pages/LoginPage.tsx` - Uses new logo with tagline
- ✅ `frontend/src/assets/logo.svg` - SVG logo file
- ✅ `frontend/package.json` - Package name updated

### Backend
- ✅ `backend-java/src/main/resources/application.yml` - Application name updated

## Brand Message

**Performix** represents a platform where:
- Goals are set and tracked
- Growth is measured and achieved
- Performance is managed holistically
- Teams and individuals reach their potential

The tagline "Where goals turn into growth" emphasizes the transformation from planning to achievement.

## Implementation Notes

1. The logo is implemented as a React component for flexibility
2. SVG format ensures scalability at any size
3. Gradient colors match the existing AppBar design
4. Logo can be used in multiple contexts (header, login, emails, etc.)

## Future Enhancements

- Add favicon with Performix logo
- Create logo variations (light/dark themes)
- Add logo to email templates
- Create marketing materials with consistent branding

