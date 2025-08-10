'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/lib/theme/theme-provider';
import { 
  Palette, 
  Save, 
  RotateCcw, 
  Download, 
  Upload,
  Copy,
  Check,
  Sparkles,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Calendar,
  Users,
  FileText,
  Settings,
  Home,
  BarChart3,
  Bell,
  Search,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Wand2
} from 'lucide-react';

interface CustomTheme {
  id: string;
  name: string;
  colors: Record<string, string>;
  isDark: boolean;
  createdAt: string;
}

const presetPalettes = [
  {
    name: 'Midnight Ocean',
    isDark: true,
    colors: {
      background: '220 40 10',
      foreground: '210 40 98',
      primary: '217 91 60',
      'primary-foreground': '210 40 98',
    }
  },
  {
    name: 'Sunset Glow',
    isDark: false,
    colors: {
      background: '30 40 98',
      foreground: '30 40 10',
      primary: '25 95 53',
      'primary-foreground': '0 0 100',
    }
  },
  {
    name: 'Forest Dream',
    isDark: false,
    colors: {
      background: '120 30 98',
      foreground: '120 30 10',
      primary: '142 76 36',
      'primary-foreground': '0 0 100',
    }
  },
  {
    name: 'Royal Purple',
    isDark: true,
    colors: {
      background: '270 30 10',
      foreground: '270 10 95',
      primary: '271 91 65',
      'primary-foreground': '0 0 100',
    }
  },
  {
    name: 'Cherry Blossom',
    isDark: false,
    colors: {
      background: '340 30 98',
      foreground: '340 30 10',
      primary: '350 89 60',
      'primary-foreground': '0 0 100',
    }
  },
  {
    name: 'Arctic Blue',
    isDark: false,
    colors: {
      background: '200 30 98',
      foreground: '200 30 10',
      primary: '199 89 48',
      'primary-foreground': '0 0 100',
    }
  }
];

interface CustomThemeEditorProps {
  onClose?: () => void;
}

export function CustomThemeEditor({ onClose }: CustomThemeEditorProps = {}) {
  const { customTheme, setCustomTheme, setTheme } = useTheme();
  const [themeName, setThemeName] = useState('My Custom Theme');
  const [isDark, setIsDark] = useState(true);
  const [activeColorKey, setActiveColorKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [colors, setColors] = useState<Record<string, string>>({
    // Base colors
    background: '222 47 11',
    foreground: '213 31 91',
    
    // Primary colors
    primary: '262 80 50',
    'primary-foreground': '0 0 100',
    
    // Secondary colors
    secondary: '240 5 64',
    'secondary-foreground': '240 6 10',
    
    // Accent colors
    accent: '240 5 84',
    'accent-foreground': '240 6 10',
    
    // Destructive colors
    destructive: '0 84 60',
    'destructive-foreground': '0 0 98',
    
    // Muted colors
    muted: '240 5 84',
    'muted-foreground': '240 4 46',
    
    // Card colors
    card: '222 47 15',
    'card-foreground': '213 31 91',
    
    // Popover colors
    popover: '222 47 11',
    'popover-foreground': '213 31 91',
    
    // Border colors
    border: '240 6 20',
    input: '240 6 20',
    ring: '262 80 50',
  });
  
  const [savedThemes, setSavedThemes] = useState<CustomTheme[]>([]);
  const [activeTab, setActiveTab] = useState('colors');
  const [copied, setCopied] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Load custom theme on mount
  useEffect(() => {
    if (customTheme) {
      setThemeName(customTheme.name || 'My Custom Theme');
      if (customTheme.colors) {
        // Convert hex colors to HSL for the editor
        const hslColors: Record<string, string> = {};
        Object.entries(customTheme.colors).forEach(([key, hex]) => {
          hslColors[key.replace(/([A-Z])/g, '-$1').toLowerCase()] = hexToHsl(hex);
        });
        setColors(hslColors);
      }
      setIsDark(customTheme.isDark || false);
    }
  }, [customTheme]);

  useEffect(() => {
    // Load saved themes from localStorage
    const saved = localStorage.getItem('agendaiq-custom-themes');
    if (saved) {
      try {
        setSavedThemes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load custom themes:', e);
      }
    }
  }, []);

  // Clear highlight after 3 seconds
  useEffect(() => {
    if (activeColorKey) {
      const timer = setTimeout(() => {
        setActiveColorKey(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeColorKey]);

  // Helper function to convert hex to HSL string
  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)} ${Math.round(l * 100)}`;
  };

  const hslToHex = (hsl: string) => {
    const [h, s, l] = hsl.split(' ').map(Number);
    const hNorm = h / 360;
    const sNorm = s / 100;
    const lNorm = l / 100;

    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = c * (1 - Math.abs(((hNorm * 6) % 2) - 1));
    const m = lNorm - c / 2;

    let r = 0, g = 0, b = 0;
    if (hNorm < 1/6) {
      r = c; g = x; b = 0;
    } else if (hNorm < 2/6) {
      r = x; g = c; b = 0;
    } else if (hNorm < 3/6) {
      r = 0; g = c; b = x;
    } else if (hNorm < 4/6) {
      r = 0; g = x; b = c;
    } else if (hNorm < 5/6) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }

    const toHex = (n: number) => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const updateColor = (key: string, value: string) => {
    const hslValue = value.startsWith('#') ? hexToHsl(value) : value;
    setColors(prev => ({
      ...prev,
      [key]: hslValue
    }));
    setActiveColorKey(key);
  };

  const applyPreset = (preset: typeof presetPalettes[0]) => {
    setSelectedPreset(preset.name);
    setIsDark(preset.isDark);
    
    // Apply preset colors and generate complementary colors
    const newColors = { ...colors };
    Object.entries(preset.colors).forEach(([key, value]) => {
      newColors[key] = value;
    });
    
    // Auto-generate complementary colors if not provided
    if (!preset.colors.secondary) {
      const [h, s, l] = preset.colors.primary.split(' ').map(Number);
      newColors.secondary = `${(h + 60) % 360} ${s} ${l}`;
      newColors['secondary-foreground'] = preset.isDark ? '0 0 98' : '0 0 10';
    }
    
    if (!preset.colors.accent) {
      const [h, s, l] = preset.colors.primary.split(' ').map(Number);
      newColors.accent = `${(h + 180) % 360} ${s * 0.7} ${l * 1.2}`;
      newColors['accent-foreground'] = preset.isDark ? '0 0 98' : '0 0 10';
    }
    
    if (!preset.colors.muted) {
      newColors.muted = preset.isDark ? '240 5 84' : '240 5 96';
      newColors['muted-foreground'] = preset.isDark ? '240 4 46' : '240 4 16';
    }
    
    if (!preset.colors.card) {
      const [h, s, l] = preset.colors.background.split(' ').map(Number);
      newColors.card = preset.isDark ? `${h} ${s} ${l + 5}` : `${h} ${s} ${l - 2}`;
      newColors['card-foreground'] = preset.colors.foreground;
    }
    
    if (!preset.colors.border) {
      newColors.border = preset.isDark ? '240 6 20' : '240 6 80';
      newColors.input = newColors.border;
    }
    
    setColors(newColors);
  };

  const saveTheme = () => {
    const newTheme: CustomTheme = {
      id: `custom-${Date.now()}`,
      name: themeName,
      colors: colors,
      isDark: isDark,
      createdAt: new Date().toISOString()
    };

    const updated = [...savedThemes, newTheme];
    setSavedThemes(updated);
    localStorage.setItem('agendaiq-custom-themes', JSON.stringify(updated));
  };

  const applyTheme = async () => {
    setIsLoading(true);
    
    try {
      // Convert HSL colors back to hex for API
      const hexColors: Record<string, string> = {};
      Object.entries(colors).forEach(([key, hsl]) => {
        hexColors[key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = hslToHex(hsl);
      });

      const customThemeData = {
        name: themeName,
        colors: hexColors,
        isDark: isDark
      };

      // Save to database via API
      const response = await fetch('/api/user/custom-theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customThemeData),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update theme provider state
        if (setCustomTheme) {
          setCustomTheme(result.customTheme);
        }
        
        // Switch to custom theme
        await setTheme('custom');
        
        // Close the editor if callback provided
        if (onClose) {
          onClose();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to save custom theme:', errorData);
        alert(`Failed to save custom theme: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving custom theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTheme = (theme: CustomTheme) => {
    setThemeName(theme.name);
    setColors(theme.colors);
    setIsDark(theme.isDark);
  };

  const deleteTheme = (themeId: string) => {
    const updated = savedThemes.filter(t => t.id !== themeId);
    setSavedThemes(updated);
    localStorage.setItem('agendaiq-custom-themes', JSON.stringify(updated));
  };

  const exportTheme = () => {
    const themeData = {
      name: themeName,
      colors: colors,
      isDark: isDark,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(themeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${themeName.toLowerCase().replace(/\s+/g, '-')}-theme.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyThemeCode = () => {
    const cssVariables = Object.entries(colors)
      .map(([key, value]) => `  --${key}: ${value};`)
      .join('\n');
    
    const code = `:root {\n${cssVariables}\n}`;
    
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper function to get highlight class
  const getHighlightClass = (keys: string[]) => {
    if (keys.some(key => activeColorKey === key)) {
      return 'ring-4 ring-purple-500 ring-opacity-50 animate-pulse';
    }
    return '';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Panel - Editor */}
      <div className="space-y-6 overflow-y-auto pr-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <Input
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                className="text-xl font-bold border-0 px-0 focus:ring-0"
                placeholder="Theme Name"
              />
              <p className="text-sm text-muted-foreground">Create your perfect workspace theme</p>
            </div>
          </div>

          {/* Theme Mode Toggle */}
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <button
              onClick={() => setIsDark(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                !isDark ? 'bg-background shadow-sm' : 'hover:bg-background/50'
              }`}
            >
              <Sun className="h-4 w-4" />
              Light
            </button>
            <button
              onClick={() => setIsDark(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                isDark ? 'bg-background shadow-sm' : 'hover:bg-background/50'
              }`}
            >
              <Moon className="h-4 w-4" />
              Dark
            </button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-4 mt-4">
            {/* Quick Presets */}
            <div className="grid grid-cols-3 gap-2">
              {presetPalettes.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={`p-3 rounded-lg border transition-all hover:scale-105 ${
                    selectedPreset === preset.name 
                      ? 'border-primary ring-2 ring-primary ring-offset-2' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex gap-1 mb-2">
                    {Object.values(preset.colors).slice(0, 3).map((color, i) => (
                      <div
                        key={i}
                        className="h-3 flex-1 rounded"
                        style={{ backgroundColor: `hsl(${color})` }}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-medium">{preset.name}</p>
                </button>
              ))}
            </div>

            {/* Color Editors */}
            <div className="space-y-4">
              {/* Primary Colors */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  Primary Colors
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {['background', 'foreground', 'primary', 'primary-foreground'].map((key) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key} className="text-xs capitalize">
                        {key.replace('-', ' ')}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={key}
                          type="color"
                          value={hslToHex(colors[key])}
                          onChange={(e) => updateColor(key, e.target.value)}
                          onFocus={() => setActiveColorKey(key)}
                          className="w-12 h-9 p-1 cursor-pointer"
                        />
                        <Input
                          value={colors[key]}
                          onChange={(e) => updateColor(key, e.target.value)}
                          onFocus={() => setActiveColorKey(key)}
                          placeholder="H S L"
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Secondary Colors */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary" />
                  Secondary & Accent
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {['secondary', 'secondary-foreground', 'accent', 'accent-foreground'].map((key) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key} className="text-xs capitalize">
                        {key.replace('-', ' ')}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={key}
                          type="color"
                          value={hslToHex(colors[key])}
                          onChange={(e) => updateColor(key, e.target.value)}
                          onFocus={() => setActiveColorKey(key)}
                          className="w-12 h-9 p-1 cursor-pointer"
                        />
                        <Input
                          value={colors[key]}
                          onChange={(e) => updateColor(key, e.target.value)}
                          onFocus={() => setActiveColorKey(key)}
                          placeholder="H S L"
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* UI Colors */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted" />
                  UI Elements
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {['muted', 'muted-foreground', 'card', 'card-foreground', 'border', 'input'].map((key) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key} className="text-xs capitalize">
                        {key.replace('-', ' ')}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={key}
                          type="color"
                          value={hslToHex(colors[key])}
                          onChange={(e) => updateColor(key, e.target.value)}
                          onFocus={() => setActiveColorKey(key)}
                          className="w-12 h-9 p-1 cursor-pointer"
                        />
                        <Input
                          value={colors[key]}
                          onChange={(e) => updateColor(key, e.target.value)}
                          onFocus={() => setActiveColorKey(key)}
                          placeholder="H S L"
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={applyTheme} 
                className="flex-1"
                disabled={isLoading}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save & Apply Theme'}
              </Button>
              <Button onClick={saveTheme} variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={exportTheme} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="presets" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {presetPalettes.map((preset) => (
                <Card 
                  key={preset.name}
                  className="p-4 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                  onClick={() => applyPreset(preset)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{preset.name}</h4>
                    {preset.isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </div>
                  <div className="space-y-2">
                    {Object.entries(preset.colors).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: `hsl(${value})` }}
                        />
                        <div className="flex-1">
                          <p className="text-xs font-medium capitalize">{key.replace('-', ' ')}</p>
                          <p className="text-xs text-muted-foreground">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="saved" className="space-y-4 mt-4">
            {savedThemes.length > 0 ? (
              <div className="space-y-3">
                {savedThemes.map((theme) => (
                  <Card key={theme.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {['background', 'primary', 'secondary'].map((key) => (
                            <div
                              key={key}
                              className="w-6 h-6 rounded"
                              style={{ backgroundColor: `hsl(${theme.colors[key]})` }}
                            />
                          ))}
                        </div>
                        <div>
                          <h4 className="font-semibold">{theme.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {new Date(theme.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadTheme(theme)}
                        >
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteTheme(theme.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No saved themes yet</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Panel - Live Preview (Sticky) */}
      <div className="lg:sticky lg:top-0 lg:h-screen bg-muted/30 rounded-lg p-4 overflow-hidden">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Live Preview</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`p-2 rounded ${previewDevice === 'desktop' ? 'bg-background shadow-sm' : ''}`}
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`p-2 rounded ${previewDevice === 'mobile' ? 'bg-background shadow-sm' : ''}`}
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          className={`${
            previewDevice === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
          } rounded-lg overflow-y-auto shadow-2xl`}
          style={{
            '--background': colors.background,
            '--foreground': colors.foreground,
            '--primary': colors.primary,
            '--primary-foreground': colors['primary-foreground'],
            '--secondary': colors.secondary,
            '--secondary-foreground': colors['secondary-foreground'],
            '--accent': colors.accent,
            '--accent-foreground': colors['accent-foreground'],
            '--destructive': colors.destructive,
            '--destructive-foreground': colors['destructive-foreground'],
            '--muted': colors.muted,
            '--muted-foreground': colors['muted-foreground'],
            '--card': colors.card,
            '--card-foreground': colors['card-foreground'],
            '--border': colors.border,
            maxHeight: 'calc(100vh - 120px)'
          } as React.CSSProperties}
        >
          {/* Preview App */}
          <div className={`bg-[hsl(var(--background))] text-[hsl(var(--foreground))] transition-all ${getHighlightClass(['background', 'foreground'])}`}>
            {/* Header */}
            <header className={`bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] p-4 transition-all ${getHighlightClass(['card', 'card-foreground', 'border'])}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 bg-[hsl(var(--primary))] rounded-lg flex items-center justify-center transition-all ${getHighlightClass(['primary'])}`}>
                    <span className={`text-[hsl(var(--primary-foreground))] font-bold text-sm ${getHighlightClass(['primary-foreground'])}`}>AQ</span>
                  </div>
                  <h1 className="font-bold text-lg">AgendaIQ</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button className={`p-2 hover:bg-[hsl(var(--muted))] rounded-lg transition-all ${getHighlightClass(['muted'])}`}>
                    <Search className="h-4 w-4" />
                  </button>
                  <button className={`p-2 hover:bg-[hsl(var(--muted))] rounded-lg transition-all ${getHighlightClass(['muted'])}`}>
                    <Bell className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </header>

            {/* Navigation */}
            <div className="flex">
              {previewDevice === 'desktop' && (
                <aside className={`w-64 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] p-4 min-h-[500px] transition-all ${getHighlightClass(['card', 'border'])}`}>
                  <nav className="space-y-1">
                    <a className={`flex items-center gap-3 px-3 py-2 bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] rounded-lg transition-all ${getHighlightClass(['primary'])}`}>
                      <Home className="h-4 w-4" />
                      <span className="text-sm font-medium">Dashboard</span>
                    </a>
                    <a className={`flex items-center gap-3 px-3 py-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-all ${getHighlightClass(['muted-foreground', 'muted'])}`}>
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Meetings</span>
                    </a>
                    <a className={`flex items-center gap-3 px-3 py-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-all ${getHighlightClass(['muted-foreground', 'muted'])}`}>
                      <Users className="h-4 w-4" />
                      <span className="text-sm">Team</span>
                    </a>
                    <a className={`flex items-center gap-3 px-3 py-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-all ${getHighlightClass(['muted-foreground', 'muted'])}`}>
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">Documents</span>
                    </a>
                    <a className={`flex items-center gap-3 px-3 py-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] rounded-lg transition-all ${getHighlightClass(['muted-foreground', 'muted'])}`}>
                      <Settings className="h-4 w-4" />
                      <span className="text-sm">Settings</span>
                    </a>
                  </nav>
                </aside>
              )}

              {/* Main Content */}
              <main className="flex-1 p-6">
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`bg-[hsl(var(--card))] p-4 rounded-lg border border-[hsl(var(--border))] transition-all ${getHighlightClass(['card', 'border'])}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm text-[hsl(var(--muted-foreground))] ${getHighlightClass(['muted-foreground'])}`}>Total Meetings</p>
                        <Calendar className={`h-4 w-4 text-[hsl(var(--primary))] ${getHighlightClass(['primary'])}`} />
                      </div>
                      <p className="text-2xl font-bold">24</p>
                      <p className={`text-xs text-[hsl(var(--muted-foreground))] ${getHighlightClass(['muted-foreground'])}`}>+12% from last month</p>
                    </div>
                    <div className={`bg-[hsl(var(--card))] p-4 rounded-lg border border-[hsl(var(--border))] transition-all ${getHighlightClass(['card', 'border'])}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm text-[hsl(var(--muted-foreground))] ${getHighlightClass(['muted-foreground'])}`}>Team Members</p>
                        <Users className={`h-4 w-4 text-[hsl(var(--secondary))] ${getHighlightClass(['secondary'])}`} />
                      </div>
                      <p className="text-2xl font-bold">142</p>
                      <p className={`text-xs text-[hsl(var(--muted-foreground))] ${getHighlightClass(['muted-foreground'])}`}>+5 new this week</p>
                    </div>
                    <div className={`bg-[hsl(var(--card))] p-4 rounded-lg border border-[hsl(var(--border))] transition-all ${getHighlightClass(['card', 'border'])}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm text-[hsl(var(--muted-foreground))] ${getHighlightClass(['muted-foreground'])}`}>Productivity</p>
                        <BarChart3 className={`h-4 w-4 text-[hsl(var(--accent))] ${getHighlightClass(['accent'])}`} />
                      </div>
                      <p className="text-2xl font-bold">89%</p>
                      <p className={`text-xs text-[hsl(var(--muted-foreground))] ${getHighlightClass(['muted-foreground'])}`}>Above average</p>
                    </div>
                  </div>

                  {/* Meeting List */}
                  <div className={`bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] transition-all ${getHighlightClass(['card', 'border'])}`}>
                    <div className={`p-4 border-b border-[hsl(var(--border))] ${getHighlightClass(['border'])}`}>
                      <h2 className="font-semibold">Upcoming Meetings</h2>
                    </div>
                    <div className={`divide-y divide-[hsl(var(--border))] ${getHighlightClass(['border'])}`}>
                      <div className={`p-4 hover:bg-[hsl(var(--muted))]/50 transition-all ${getHighlightClass(['muted'])}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">Team Standup</h3>
                            <p className={`text-sm text-[hsl(var(--muted-foreground))] ${getHighlightClass(['muted-foreground'])}`}>Today at 10:00 AM</p>
                          </div>
                          <span className={`px-2 py-1 bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-xs rounded-full transition-all ${getHighlightClass(['primary'])}`}>
                            In 2 hours
                          </span>
                        </div>
                      </div>
                      <div className={`p-4 hover:bg-[hsl(var(--muted))]/50 transition-all ${getHighlightClass(['muted'])}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">Project Review</h3>
                            <p className={`text-sm text-[hsl(var(--muted-foreground))] ${getHighlightClass(['muted-foreground'])}`}>Today at 2:00 PM</p>
                          </div>
                          <span className={`px-2 py-1 bg-[hsl(var(--secondary))]/10 text-[hsl(var(--secondary))] text-xs rounded-full transition-all ${getHighlightClass(['secondary'])}`}>
                            Scheduled
                          </span>
                        </div>
                      </div>
                      <div className={`p-4 hover:bg-[hsl(var(--muted))]/50 transition-all ${getHighlightClass(['muted'])}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">Client Meeting</h3>
                            <p className={`text-sm text-[hsl(var(--muted-foreground))] ${getHighlightClass(['muted-foreground'])}`}>Tomorrow at 11:00 AM</p>
                          </div>
                          <span className={`px-2 py-1 bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] text-xs rounded-full transition-all ${getHighlightClass(['accent'])}`}>
                            Important
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button className={`px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg hover:opacity-90 transition-all ${getHighlightClass(['primary', 'primary-foreground'])}`}>
                      Create Meeting
                    </button>
                    <button className={`px-4 py-2 bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] rounded-lg hover:opacity-90 transition-all ${getHighlightClass(['secondary', 'secondary-foreground'])}`}>
                      View Calendar
                    </button>
                    <button className={`px-4 py-2 border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))] transition-all ${getHighlightClass(['border', 'muted'])}`}>
                      Export Report
                    </button>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}