'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Inline ScrollArea component to avoid creating additional files
const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn('relative overflow-hidden', className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollAreaPrimitive.Scrollbar
      orientation="vertical"
      className="flex touch-none select-none bg-transparent p-0.5"
    >
      <ScrollAreaPrimitive.Thumb className="flex-1 rounded-full bg-primary" />
    </ScrollAreaPrimitive.Scrollbar>
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

// Theme definitions
const THEMES: Record<string, Record<string, string>> = {
  zoom:     { '--background': '215 100% 95%', '--foreground': '215 100% 10%', '--primary': '215 100% 55%' },
  otter:    { '--background': '261 50% 98%', '--foreground': '261 50% 15%', '--primary': '261 74% 60%' },
  notta:    { '--background': '150 50% 97%', '--foreground': '150 50% 15%', '--primary': '154 63% 50%' },
  midnight: { '--background': '220 40% 8%',  '--foreground': '220 20% 95%', '--primary': '220 80% 65%' },
  sunrise:  { '--background': '25 100% 95%', '--foreground': '25 100% 15%', '--primary': '25 100% 50%' },
  forest:   { '--background': '130 25% 95%', '--foreground': '130 30% 10%', '--primary': '130 45% 40%' },
  candy:    { '--background': '340 60% 97%', '--foreground': '340 60% 15%', '--primary': '340 80% 60%' },
  slate:    { '--background': '210 15% 96%', '--foreground': '210 15% 15%', '--primary': '210 25% 45%' },
  classic:  { '--background': '0 0% 100%', '--foreground': '0 0% 10%', '--primary': '0 0% 20%' },
  neon:     { '--background': '0 0% 0%',   '--foreground': '0 0% 100%','--primary': '50 100% 50%' },
};

export default function DesignSystemDemoPage() {
  const [theme, setTheme] = useState('zoom');

  useEffect(() => {
    const root = document.documentElement;
    const vars = THEMES[theme];
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [theme]);

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-semibold">Design System Demo</h1>
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(THEMES).map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>
      <ScrollArea className="flex-1 p-4">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Card key={n}>
              <CardHeader>
                <CardTitle>Widget {n}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus.
                </p>
                <Button className="w-full">Action</Button>
              </CardContent>
            </Card>
          ))}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 border-b pb-2 font-medium">
                <span>Date</span>
                <span>Event</span>
                <span>Status</span>
              </div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="grid grid-cols-3 gap-2 border-b py-2 last:border-0">
                  <span>2024-0{i}-12</span>
                  <span>Item #{i}</span>
                  <span className="text-primary">Completed</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </main>
  );
}
