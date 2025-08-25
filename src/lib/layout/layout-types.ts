// Layout Types for AgendaIQ
// Supports different layout modes for sidebar, header positioning, and grid systems

export interface LayoutPreference {
  id: string;
  name: string;
  description: string;
  sidebarPosition: 'left' | 'right' | 'top' | 'hidden';
  headerStyle: 'fixed' | 'sticky' | 'inline' | 'minimal';
  gridSystem: 'classic' | 'modern' | 'compact' | 'dashboard';
  navigationStyle: 'sidebar' | 'topbar' | 'hybrid' | 'minimal';
  contentLayout: 'single-column' | 'two-column' | 'three-column' | 'grid';
  spacing: 'compact' | 'normal' | 'spacious'
}

// Predefined Layout Options
export const layoutPreferences: LayoutPreference[] = [
  {
    id: 'classic',
    name: 'Classic Layout',
    description: 'Traditional sidebar with top navigation bar',
    sidebarPosition: 'left',
    headerStyle: 'fixed',
    gridSystem: 'classic',
    navigationStyle: 'sidebar',
    contentLayout: 'single-column',
    spacing: 'normal',
  },
  {
    id: 'modern',
    name: 'Modern Dashboard',
    description: 'Grid-based layout with sticky sidebar and enhanced spacing',
    sidebarPosition: 'left',
    headerStyle: 'sticky',
    gridSystem: 'modern',
    navigationStyle: 'sidebar',
    contentLayout: 'two-column',
    spacing: 'spacious',
  },
  {
    id: 'compact',
    name: 'Compact View',
    description: 'Space-efficient layout for smaller screens',
    sidebarPosition: 'left',
    headerStyle: 'minimal',
    gridSystem: 'compact',
    navigationStyle: 'hybrid',
    contentLayout: 'single-column',
    spacing: 'compact',
  },
  {
    id: 'executive',
    name: 'Executive Dashboard',
    description: 'Three-column layout with comprehensive overview panels',
    sidebarPosition: 'left',
    headerStyle: 'sticky',
    gridSystem: 'dashboard',
    navigationStyle: 'sidebar',
    contentLayout: 'three-column',
    spacing: 'spacious',
  },
  {
    id: 'minimal',
    name: 'Minimal Interface',
    description: 'Clean, distraction-free layout with hidden navigation',
    sidebarPosition: 'hidden',
    headerStyle: 'minimal',
    gridSystem: 'modern',
    navigationStyle: 'minimal',
    contentLayout: 'single-column',
    spacing: 'normal',
  },
];

// Layout Configuration Classes
export const layoutClasses = {
  gridSystem: {
    classic: 'flex min-h-screen',
    modern: 'grid grid-cols-[260px_1fr] min-h-screen',
    compact: 'flex min-h-screen',
    dashboard: 'grid grid-cols-[280px_1fr] min-h-screen',
  },
  sidebar: {
    left: 'order-first',
    right: 'order-last',
    top: 'w-full h-auto order-first',
    hidden: 'hidden',
  },
  header: {
    fixed: 'fixed top-0 left-0 right-0 z-50',
    sticky: 'sticky top-0 z-10',
    inline: 'relative',
    minimal: 'relative border-0 shadow-none',
  },
  content: {
    'single-column': 'max-w-4xl mx-auto',
    'two-column': 'grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8',
    'three-column': 'grid grid-cols-1 lg:grid-cols-[300px_1fr_280px] gap-6',
    'grid': 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6',
  },
  spacing: {
    compact: 'px-4 py-4',
    normal: 'px-6 py-6',
    spacious: 'px-8 py-8 lg:px-12',
  },
};

export const getLayoutPreference = (id: string): LayoutPreference => {
  return layoutPreferences.find(layout => layout.id === id) || layoutPreferences[0];
};