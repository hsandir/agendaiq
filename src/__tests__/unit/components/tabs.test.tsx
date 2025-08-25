import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

describe('Tabs Component', () => {
  it('renders without crashing', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Content 1')).toBeInTheDocument();
  })

  it('switches tabs when clicked', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    // Initially tab1 content should be visible
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
    // Click on tab2
    await (user as Record<string, unknown>).click(screen.getByText('Tab 2'))
    
    // Now tab2 content should be visible
    await waitFor(() => {
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    })
  })

  it('calls onValueChange when tab changes', async () => {
    const user = userEvent.setup();
    const handleValueChange = jest.fn();
    render(
      <Tabs defaultValue="tab1" onValueChange={handleValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    await (user as Record<string, unknown>).click(screen.getByText('Tab 2'))
    
    expect(handleValueChange).toHaveBeenCalledWith('tab2');
  })

  it('controlled mode works correctly', () => {
    const { rerender } = render(
      <Tabs value="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
    // Change controlled value
    rerender(
      <Tabs value="tab2">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    expect(screen.getByText('Content 2')).toBeInTheDocument();
  })

  it('applies custom className', () => {
    const { container } = render(
      <Tabs defaultValue="tab1" className="custom-tabs-class">
        <TabsList className="custom-list-class">
          <TabsTrigger value="tab1" className="custom-trigger-class">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" className="custom-content-class">Content 1</TabsContent>
      </Tabs>
    );
    expect(container.querySelector('.custom-tabs-class')).toBeInTheDocument();
    expect(container.querySelector('.custom-list-class')).toBeInTheDocument();
    expect(container.querySelector('.custom-trigger-class')).toBeInTheDocument();
    expect(container.querySelector('.custom-content-class')).toBeInTheDocument();
  })

  it('handles multiple tabs correctly', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>
    );
    // Click through all tabs
    await (user as Record<string, unknown>).click(screen.getByText('Tab 2'))
    expect(screen.getByText('Content 2')).toBeInTheDocument();
    await (user as Record<string, unknown>).click(screen.getByText('Tab 3'))
    expect(screen.getByText('Content 3')).toBeInTheDocument();
    await (user as Record<string, unknown>).click(screen.getByText('Tab 1'))
    expect(screen.getByText('Content 1')).toBeInTheDocument();
  })
})