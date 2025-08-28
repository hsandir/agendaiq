import React from 'react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeamList } from '@/components/teams/TeamList';
import { TeamDetails } from '@/components/teams/TeamDetails';
import { TeamMembers } from '@/components/teams/TeamMembers';
import { TeamKnowledge } from '@/components/teams/TeamKnowledge';
import { CreateTeamDialog } from '@/components/teams/CreateTeamDialog';
import { AddMemberDialog } from '@/components/teams/AddMemberDialog';
import { CreateKnowledgeDialog } from '@/components/teams/CreateKnowledgeDialog';
import { EditKnowledgeDialog } from '@/components/teams/EditKnowledgeDialog';
import { KnowledgeDetailModal } from '@/components/teams/KnowledgeDetailModal';

// Mock fetch
global.fetch = jest.fn() as any;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn()
  }),
  useSearchParams: () => ({
    get: jest.fn()
  })
}));

// Mock shadcn components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogTrigger: ({ children }: any) => <div>{children}</div>
}));

describe('TeamList Component', () => {
  const mockTeams = [
    {
      id: 'team1',
      name: 'Engineering Team',
      type: 'DEPARTMENT',
      status: 'ACTIVE',
      purpose: 'Software development',
      is_active: true,
      _count: { team_members: 5, team_knowledge: 10 }
    },
    {
      id: 'team2',
      name: 'Marketing Team',
      type: 'DEPARTMENT',
      status: 'ACTIVE',
      purpose: 'Marketing activities',
      is_active: true,
      _count: { team_members: 3, team_knowledge: 5 }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render team list', () => {
    render(<TeamList teams={mockTeams} />);
    
    expect(screen.getByText('Engineering Team')).toBeInTheDocument();
    expect(screen.getByText('Marketing Team')).toBeInTheDocument();
    expect(screen.getByText('5 members')).toBeInTheDocument();
    expect(screen.getByText('3 members')).toBeInTheDocument();
  });

  it('should show team type badges', () => {
    render(<TeamList teams={mockTeams} />);
    
    const badges = screen.getAllByText('DEPARTMENT');
    expect(badges).toHaveLength(2);
  });

  it('should display knowledge count', () => {
    render(<TeamList teams={mockTeams} />);
    
    expect(screen.getByText('10 resources')).toBeInTheDocument();
    expect(screen.getByText('5 resources')).toBeInTheDocument();
  });

  it('should handle empty team list', () => {
    render(<TeamList teams={[]} />);
    
    expect(screen.getByText(/No teams found/i)).toBeInTheDocument();
  });

  it('should filter inactive teams when showInactive is false', () => {
    const teamsWithInactive = [
      ...mockTeams,
      {
        id: 'team3',
        name: 'Inactive Team',
        type: 'PROJECT',
        status: 'INACTIVE',
        purpose: 'Old project',
        is_active: false,
        _count: { team_members: 0, team_knowledge: 0 }
      }
    ];

    const { rerender } = render(<TeamList teams={teamsWithInactive} showInactive={false} />);
    
    expect(screen.queryByText('Inactive Team')).not.toBeInTheDocument();
    
    rerender(<TeamList teams={teamsWithInactive} showInactive={true} />);
    expect(screen.getByText('Inactive Team')).toBeInTheDocument();
  });
});

describe('CreateTeamDialog Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ team: { id: 'new-team', name: 'New Team' } })
    });
  });

  it('should render create team form', () => {
    render(<CreateTeamDialog open={true} onOpenChange={() => {}} />);
    
    expect(screen.getByLabelText(/Team Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Team Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Purpose/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(<CreateTeamDialog open={true} onOpenChange={() => {}} />);
    
    const submitButton = screen.getByRole('button', { name: /Create Team/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Team name is required/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const onSuccess = jest.fn();
    render(<CreateTeamDialog open={true} onOpenChange={() => {}} onSuccess={onSuccess} />);
    
    const user = userEvent.setup();
    
    await (user as Record<string, unknown>).type(screen.getByLabelText(/Team Name/i), 'New Test Team');
    await (user as Record<string, unknown>).selectOptions(screen.getByLabelText(/Team Type/i), 'PROJECT');
    await (user as Record<string, unknown>).type(screen.getByLabelText(/Purpose/i), 'Test purpose');
    await (user as Record<string, unknown>).type(screen.getByLabelText(/Description/i), 'Test description');
    
    const submitButton = screen.getByRole('button', { name: /Create Team/i });
    await (user as Record<string, unknown>).click(submitButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/teams', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'New Test Team',
          type: 'PROJECT',
          purpose: 'Test purpose',
          description: 'Test description'
        })
      }));
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});

describe('TeamMembers Component', () => {
  const mockMembers = [
    {
      id: 1,
      user_id: 1,
      role: 'LEADER',
      joined_at: new Date('2024-01-01'),
      user: { id: 1, name: 'John Doe', email: 'john@example.com' },
      staff: { id: 1, first_name: 'John', last_name: 'Doe' }
    },
    {
      id: 2,
      user_id: 2,
      role: 'MEMBER',
      joined_at: new Date('2024-01-15'),
      user: { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      staff: { id: 2, first_name: 'Jane', last_name: 'Smith' }
    }
  ];

  it('should render team members list', () => {
    render(<TeamMembers teamId="team1" members={mockMembers} canManage={true} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('LEADER')).toBeInTheDocument();
    expect(screen.getByText('MEMBER')).toBeInTheDocument();
  });

  it('should show add member button when canManage is true', () => {
    render(<TeamMembers teamId="team1" members={mockMembers} canManage={true} />);
    
    expect(screen.getByRole('button', { name: /Add Member/i })).toBeInTheDocument();
  });

  it('should not show add member button when canManage is false', () => {
    render(<TeamMembers teamId="team1" members={mockMembers} canManage={false} />);
    
    expect(screen.queryByRole('button', { name: /Add Member/i })).not.toBeInTheDocument();
  });

  it('should handle member removal', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Member removed' })
    });

    render(<TeamMembers teamId="team1" members={mockMembers} canManage={true} />);
    
    const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
    fireEvent.click(removeButtons[1]); // Remove Jane
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/teams/team1/members?user_id=2', {
        method: 'DELETE'
      });
    });
  });
});

describe('TeamKnowledge Component', () => {
  const mockKnowledge = [
    {
      id: 1,
      title: 'Team Guidelines',
      type: 'DOCUMENT',
      url: 'https://example.com/doc1',
      description: 'Team guidelines document',
      is_public: false,
      views_count: 10,
      downloads_count: 5,
      created_at: new Date('2024-01-01'),
      created_by: {
        user: { name: 'John Doe' }
      }
    },
    {
      id: 2,
      title: 'Training Video',
      type: 'VIDEO',
      url: 'https://example.com/video1',
      description: 'Training video for new members',
      is_public: true,
      views_count: 25,
      downloads_count: 0,
      created_at: new Date('2024-01-15'),
      created_by: {
        user: { name: 'Jane Smith' }
      }
    }
  ];

  it('should render knowledge resources', () => {
    render(<TeamKnowledge teamId="team1" knowledge={mockKnowledge} canManage={true} />);
    
    expect(screen.getByText('Team Guidelines')).toBeInTheDocument();
    expect(screen.getByText('Training Video')).toBeInTheDocument();
    expect(screen.getByText('DOCUMENT')).toBeInTheDocument();
    expect(screen.getByText('VIDEO')).toBeInTheDocument();
  });

  it('should display view and download counts', () => {
    render(<TeamKnowledge teamId="team1" knowledge={mockKnowledge} canManage={true} />);
    
    expect(screen.getByText(/10 views/i)).toBeInTheDocument();
    expect(screen.getByText(/5 downloads/i)).toBeInTheDocument();
    expect(screen.getByText(/25 views/i)).toBeInTheDocument();
  });

  it('should show public/private badges', () => {
    render(<TeamKnowledge teamId="team1" knowledge={mockKnowledge} canManage={true} />);
    
    expect(screen.getByText('Private')).toBeInTheDocument();
    expect(screen.getByText('Public')).toBeInTheDocument();
  });

  it('should filter by resource type', async () => {
    const { rerender } = render(
      <TeamKnowledge teamId="team1" knowledge={mockKnowledge} canManage={true} />
    );
    
    const filterSelect = screen.getByLabelText(/Filter by type/i);
    fireEvent.change(filterSelect, { target: { value: 'DOCUMENT' } });
    
    await waitFor(() => {
      expect(screen.getByText('Team Guidelines')).toBeInTheDocument();
      expect(screen.queryByText('Training Video')).not.toBeInTheDocument();
    });
  });

  it('should open knowledge detail modal on click', () => {
    render(<TeamKnowledge teamId="team1" knowledge={mockKnowledge} canManage={true} />);
    
    fireEvent.click(screen.getByText('Team Guidelines'));
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Team guidelines document/i)).toBeInTheDocument();
  });
});

describe('AddMemberDialog Component', () => {
  const mockUsers = [
    { id: 3, email: 'newuser@example.com', name: 'New User' },
    { id: 4, email: 'another@example.com', name: 'Another User' }
  ];

  beforeEach(() => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockUsers })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ member: { id: 3, user_id: 3, role: 'MEMBER' } })
      });
  });

  it('should render add member form', async () => {
    render(<AddMemberDialog teamId="team1" open={true} onOpenChange={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Select User/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Role/i)).toBeInTheDocument();
    });
  });

  it('should load available users', async () => {
    render(<AddMemberDialog teamId="team1" open={true} onOpenChange={() => {}} />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users?available_for_team=team1');
    });
  });

  it('should submit new member', async () => {
    const onSuccess = jest.fn();
    render(
      <AddMemberDialog 
        teamId="team1" 
        open={true} 
        onOpenChange={() => {}} 
        onSuccess={onSuccess}
      />
    );
    
    await waitFor(() => {
      screen.getByLabelText(/Select User/i);
    });

    const user = userEvent.setup();
    
    await (user as Record<string, unknown>).selectOptions(screen.getByLabelText(/Select User/i), '3');
    await (user as Record<string, unknown>).selectOptions(screen.getByLabelText(/Role/i), 'MEMBER');
    
    const submitButton = screen.getByRole('button', { name: /Add Member/i });
    await (user as Record<string, unknown>).click(submitButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/teams/team1/members', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          user_id: 3,
          role: 'MEMBER'
        })
      }));
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});

describe('KnowledgeDetailModal Component', () => {
  const mockKnowledge = {
    id: 1,
    title: 'Team Guidelines',
    type: 'DOCUMENT',
    url: 'https://example.com/doc1',
    description: 'Comprehensive team guidelines',
    content: 'This is the content of the document',
    is_public: false,
    views_count: 15,
    downloads_count: 8,
    tags: ['guidelines', 'team', 'process'],
    metadata: {
      file_size: '2.5 MB',
      format: 'PDF',
      pages: 25
    },
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-15'),
    created_by: {
      user: { name: 'John Doe', email: 'john@example.com' }
    }
  };

  it('should render knowledge details', () => {
    render(
      <KnowledgeDetailModal 
        knowledge={mockKnowledge} 
        open={true} 
        onOpenChange={() => {}}
        canEdit={true}
      />
    );
    
    expect(screen.getByText('Team Guidelines')).toBeInTheDocument();
    expect(screen.getByText('Comprehensive team guidelines')).toBeInTheDocument();
    expect(screen.getByText('15 views')).toBeInTheDocument();
    expect(screen.getByText('8 downloads')).toBeInTheDocument();
  });

  it('should display metadata', () => {
    render(
      <KnowledgeDetailModal 
        knowledge={mockKnowledge} 
        open={true} 
        onOpenChange={() => {}}
        canEdit={true}
      />
    );
    
    expect(screen.getByText('2.5 MB')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('25 pages')).toBeInTheDocument();
  });

  it('should show edit button when canEdit is true', () => {
    render(
      <KnowledgeDetailModal 
        knowledge={mockKnowledge} 
        open={true} 
        onOpenChange={() => {}}
        canEdit={true}
      />
    );
    
    expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
  });

  it('should not show edit button when canEdit is false', () => {
    render(
      <KnowledgeDetailModal 
        knowledge={mockKnowledge} 
        open={true} 
        onOpenChange={() => {}}
        canEdit={false}
      />
    );
    
    expect(screen.queryByRole('button', { name: /Edit/i })).not.toBeInTheDocument();
  });

  it('should handle download action', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['file content']);
    });

    render(
      <KnowledgeDetailModal 
        knowledge={mockKnowledge} 
        open={true} 
        onOpenChange={() => {}}
        canEdit={true}
      />
    );
    
    const downloadButton = screen.getByRole('button', { name: /Download/i });
    fireEvent.click(downloadButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/teams/${mockKnowledge.team_id}/knowledge/${mockKnowledge.id}/download`
      );
    });
  });
});