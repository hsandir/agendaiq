"use client";

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface RoleData {
  id: number;
  title: string;
  priority: number;
  category: string | null;
  is_leadership: boolean;
  Department?: {
    id: number;
    name: string;
  };
  Staff?: Array<{
    id: number;
    users: {
      name: string | null;
      email: string;
    };
  }>;
}

export default function RoleManagement() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (!response.ok) throw new Error('Failed to fetch roles');
      const data = await response.json();
      setRoles(data);
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: 'Failed to load roles. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Management</CardTitle>
        <CardDescription>
          Manage roles and their properties in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Staff Count</TableHead>
              <TableHead>Leadership</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.title}</TableCell>
                <TableCell>{role.category || 'N/A'}</TableCell>
                <TableCell>{role.department?.name || 'No Department'}</TableCell>
                <TableCell>{role.staff?.length ?? 0}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    role.is_leadership 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-foreground'
                  }`}>
                    {role.is_leadership ? 'Yes' : 'No'}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {/* TODO: Implement edit role */}}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {roles.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No roles found. Please set up roles first.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 