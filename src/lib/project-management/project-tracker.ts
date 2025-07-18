/**
 * PROJECT TRACKER SYSTEM
 * 
 * Bu sistem projedeki tüm görevleri, değişiklikleri ve ilerlemeleri takip eder.
 */

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'security' | 'ui-ux' | 'database' | 'api' | 'testing' | 'deployment';
  phase: 'planning' | 'development' | 'testing' | 'deployment' | 'maintenance';
  assignedTo?: string;
  estimatedHours?: number;
  actualHours?: number;
  startDate?: Date;
  dueDate?: Date;
  completedDate?: Date;
  dependencies: string[]; // Task IDs
  blockers: string[]; // Task IDs
  files: string[]; // Affected files
  changes: TaskChange[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskChange {
  id: string;
  taskId: string;
  type: 'status' | 'priority' | 'assignment' | 'description' | 'dependency';
  oldValue: any;
  newValue: any;
  timestamp: Date;
  userId: string;
  notes?: string;
}

export interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  status: 'upcoming' | 'active' | 'completed';
  startDate?: Date;
  endDate?: Date;
  tasks: string[]; // Task IDs
  dependencies: string[]; // Phase IDs
  progress: number; // 0-100
}

export class ProjectTracker {
  private static instance: ProjectTracker;
  private tasks = new Map<string, ProjectTask>();
  private phases = new Map<string, ProjectPhase>();
  private history: TaskChange[] = [];
  
  static getInstance(): ProjectTracker {
    if (!ProjectTracker.instance) {
      ProjectTracker.instance = new ProjectTracker();
    }
    return ProjectTracker.instance;
  }

  // Initialize with current project state
  async initialize(): Promise<void> {
    await this.loadCurrentState();
    await this.createInitialTasks();
  }

  // Load current project state from database
  private async loadCurrentState(): Promise<void> {
    // Implementation for loading from database
    console.log('Loading project state from database...');
  }

  // Create initial tasks based on current project state
  private async createInitialTasks(): Promise<void> {
    const currentTasks = [
      {
        id: 'SEC-001',
        title: 'Fix Prisma Field Naming Issues',
        description: 'Standardize all Prisma field names (Staff vs staff, Role vs role)',
        status: 'in-progress' as const,
        priority: 'critical' as const,
        category: 'database' as const,
        phase: 'development' as const,
        files: [
          'src/app/dashboard/settings/system/page.tsx',
          'src/app/dashboard/settings/audit/page.tsx',
          'src/app/dashboard/layout.tsx'
        ],
        tags: ['prisma', 'field-naming', 'critical-fix']
      },
      {
        id: 'SEC-002',
        title: 'Implement Dynamic RBAC System',
        description: 'Replace static role checks with dynamic role-based access control',
        status: 'pending' as const,
        priority: 'high' as const,
        category: 'security' as const,
        phase: 'development' as const,
        dependencies: ['SEC-001'],
        files: [
          'src/lib/security/dynamic-rbac.ts',
          'src/lib/security/dynamic-menu.ts',
          'src/components/dashboard/Sidebar.tsx'
        ],
        tags: ['rbac', 'dynamic', 'security']
      }
    ];

    for (const task of currentTasks) {
      await this.createTask(task);
    }
  }

  // Create new task
  async createTask(taskData: Partial<ProjectTask>): Promise<ProjectTask> {
    const task: ProjectTask = {
      id: taskData.id || this.generateTaskId(),
      title: taskData.title!,
      description: taskData.description!,
      status: taskData.status || 'pending',
      priority: taskData.priority || 'medium',
      category: taskData.category || 'database',
      phase: taskData.phase || 'development',
      dependencies: taskData.dependencies || [],
      blockers: taskData.blockers || [],
      files: taskData.files || [],
      changes: [],
      tags: taskData.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tasks.set(task.id, task);
    await this.saveTask(task);
    
    return task;
  }

  // Update task
  async updateTask(taskId: string, updates: Partial<ProjectTask>, userId: string, notes?: string): Promise<ProjectTask> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const changes: TaskChange[] = [];
    
    // Track changes
    Object.entries(updates).forEach(([key, newValue]) => {
      const oldValue = (task as any)[key];
      if (oldValue !== newValue) {
        changes.push({
          id: this.generateChangeId(),
          taskId,
          type: key as any,
          oldValue,
          newValue,
          timestamp: new Date(),
          userId,
          notes
        });
      }
    });

    // Update task
    const updatedTask: ProjectTask = {
      ...task,
      ...updates,
      changes: [...task.changes, ...changes],
      updatedAt: new Date()
    };

    this.tasks.set(taskId, updatedTask);
    await this.saveTask(updatedTask);
    
    return updatedTask;
  }

  // Get all tasks
  getAllTasks(): ProjectTask[] {
    return Array.from(this.tasks.values());
  }

  // Get task by ID
  getTask(taskId: string): ProjectTask | undefined {
    return this.tasks.get(taskId);
  }

  // Generate task ID
  private generateTaskId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${timestamp}-${random}`.toUpperCase();
  }

  // Generate change ID
  private generateChangeId(): string {
    return `ch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  // Save task to database
  private async saveTask(task: ProjectTask): Promise<void> {
    console.log(`Saving task: ${task.id} - ${task.title}`);
  }
} 