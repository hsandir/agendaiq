# AgendaIQ Theme System Rules & Guidelines

## 🎨 Centralized Theme System Overview

AgendaIQ now features a comprehensive, centralized theme system with 5 professionally designed themes:

1. **Modern Purple** - Dark theme based on the provided design with purple accents
2. **Classic Light** - Clean and professional light theme (default)
3. **Dark Mode** - Modern dark theme for reduced eye strain
4. **High Contrast** - Maximum contrast for accessibility
5. **Nature Green** - Calming green theme inspired by nature

## 📱 Mobile & Cross-Browser Compatibility

### Mobile Optimizations
- All themes are fully responsive with mobile-first design
- Touch-friendly interface elements with appropriate sizes
- Viewport meta tag automatically configured
- Font smoothing optimized for all devices
- Proper color scheme declarations for native elements

### Cross-Browser Support
- CSS variables with fallbacks for older browsers
- Vendor prefixes for webkit, moz, and ms
- Consistent rendering across Chrome, Firefox, Safari, and Edge
- Print-friendly styles included

## 🛠️ Theme Implementation Rules

### For New Pages

When creating new pages in AgendaIQ, follow these rules:

#### 1. Use CSS Variables Instead of Hardcoded Colors
```tsx
// ❌ Wrong - Hardcoded colors
<div style={{ backgroundColor: '#3B82F6', color: '#FFFFFF' }}>

// ✅ Correct - Theme variables
<div style={{ 
  backgroundColor: 'var(--color-primary)', 
  color: 'var(--color-primary-foreground)' 
}}>
```

#### 2. Import Theme Styles
```tsx
// At the top of your page component
import '@/styles/theme-variables.css';
```

#### 3. Use Theme-Aware Components
```tsx
import { useTheme } from '@/lib/theme/theme-provider';

function MyComponent() {
  const { theme } = useTheme();
  
  return (
    <div style={{
      background: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      boxShadow: theme.shadows.md,
    }}>
      Content
    </div>
  );
}
```

#### 4. Responsive Design Rules
```tsx
// Use container class for consistent spacing
<div className="container">
  {/* Your content */}
</div>

// For custom responsive styles
<style jsx>{`
  .my-component {
    padding: var(--spacing-md);
  }
  
  @media (max-width: 768px) {
    .my-component {
      padding: var(--spacing-sm);
    }
  }
`}</style>
```

#### 5. Accessibility Requirements
```tsx
// Always include proper ARIA attributes
<button
  aria-label="Close dialog"
  style={{
    background: 'var(--color-button-primary)',
    color: 'var(--color-button-primary-text)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
  }}
  onFocus={(e) => {
    e.target.style.outline = '2px solid var(--color-primary)';
    e.target.style.outlineOffset = '2px';
  }}
>
  Close
</button>
```

### Available CSS Variables

#### Colors
```css
/* Primary colors */
var(--color-primary)
var(--color-primary-light)
var(--color-primary-dark)
var(--color-primary-foreground)

/* Background colors */
var(--color-background)
var(--color-background-secondary)
var(--color-background-tertiary)

/* Text colors */
var(--color-text)
var(--color-text-secondary)
var(--color-text-muted)
var(--color-text-inverse)

/* UI elements */
var(--color-card)
var(--color-card-hover)
var(--color-border)
var(--color-sidebar)
var(--color-header)

/* Status colors */
var(--color-success)
var(--color-warning)
var(--color-error)
var(--color-info)

/* Button variants */
var(--color-button-primary)
var(--color-button-primary-hover)
var(--color-button-primary-text)
```

#### Spacing & Layout
```css
/* Spacing */
var(--spacing-xs)    /* 0.25rem */
var(--spacing-sm)    /* 0.5rem */
var(--spacing-md)    /* 1rem */
var(--spacing-lg)    /* 1.5rem */
var(--spacing-xl)    /* 2rem */
var(--spacing-xxl)   /* 3rem */

/* Border radius */
var(--radius-sm)     /* 0.25rem */
var(--radius-md)     /* 0.375rem */
var(--radius-lg)     /* 0.5rem */
var(--radius-xl)     /* 0.75rem */
var(--radius-full)   /* 9999px */

/* Shadows */
var(--shadow-sm)
var(--shadow-md)
var(--shadow-lg)
var(--shadow-xl)

/* Fonts */
var(--font-primary)
var(--font-secondary)
var(--font-mono)
```

## 📋 New Page Template

Use this template when creating new pages:

```tsx
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import '@/styles/theme-variables.css';

export const metadata = {
  title: 'Page Title - AgendaIQ',
  description: 'Page description',
};

export default async function NewPage() {
  const user = await requireAuth(AuthPresets.requireAuth);

  return (
    <div className="page-container" style={{
      padding: 'var(--spacing-xl)',
      maxWidth: '1200px',
      margin: '0 auto',
      minHeight: 'calc(100vh - 200px)',
    }}>
      <div className="page-header" style={{
        marginBottom: 'var(--spacing-xxl)',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          color: 'var(--color-text)',
          marginBottom: 'var(--spacing-md)',
          fontFamily: 'var(--font-primary)',
        }}>
          Page Title
        </h1>
        <p style={{
          fontSize: '1.125rem',
          color: 'var(--color-text-secondary)',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: '1.6',
        }}>
          Page description
        </p>
      </div>

      <div className="page-content" style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-xl)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Your page content */}
      </div>

      <style jsx>{`
        .page-container {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 768px) {
          .page-container {
            padding: var(--spacing-lg);
          }
          
          .page-header h1 {
            font-size: 2rem;
          }
          
          .page-header p {
            font-size: 1rem;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .page-container {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
```

## 🔧 Theme Integration Checklist

Before deploying new pages, ensure:

- [ ] All colors use CSS variables
- [ ] Component is responsive (mobile-first)
- [ ] Accessibility attributes are included
- [ ] Theme variables CSS is imported
- [ ] Focus states are properly styled
- [ ] Print styles are considered
- [ ] Reduced motion preferences respected
- [ ] High contrast mode supported
- [ ] Cross-browser compatibility tested

## 🎯 Best Practices

### 1. Consistent Spacing
Use the predefined spacing variables for consistent layouts:
```css
margin: var(--spacing-md) 0;
padding: var(--spacing-lg);
gap: var(--spacing-sm);
```

### 2. Semantic Color Usage
- Use `--color-primary` for main actions and branding
- Use `--color-secondary` for supporting elements
- Use `--color-success/warning/error` for status indicators
- Use `--color-text-*` variants for different text hierarchy

### 3. Responsive Typography
```css
/* Base size */
font-size: 1rem;

/* Mobile adjustment */
@media (max-width: 768px) {
  font-size: 0.875rem;
}
```

### 4. Interactive States
Always provide hover, focus, and active states:
```css
.interactive-element {
  transition: all 0.2s ease-in-out;
}

.interactive-element:hover {
  background-color: var(--color-card-hover);
  transform: translateY(-1px);
}

.interactive-element:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

## 🚫 What NOT to Do

1. **Don't hardcode colors**: Never use hex codes directly
2. **Don't ignore mobile**: Always test on mobile devices
3. **Don't skip accessibility**: Always include ARIA attributes
4. **Don't use fixed sizes**: Use relative units and CSS variables
5. **Don't forget browser testing**: Test on multiple browsers
6. **Don't override theme variables**: Work with the system, not against it

## 📈 Performance Considerations

- CSS variables are cached by the browser
- Theme switching is optimized with smooth transitions
- Mobile-first approach reduces unnecessary CSS
- Print styles are separated to reduce main bundle size
- Font loading is optimized for performance

This theme system ensures consistent, accessible, and maintainable styling across the entire AgendaIQ application while providing users with the flexibility to choose their preferred visual experience.