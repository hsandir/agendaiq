/**
 * FULL PROJECT TRACKER SYSTEM
 * Database persistence ile tam task management
 */

import { DynamicRBAC } from '../security/dynamic-rbac-full';
import { AuthenticatedUser } from '../auth/auth-utils';
import { prisma } from '../prisma';

// ===== DATABASE SCHEMA INTEGRATION =====

// We'll create new tables for project management if they don't exist
// For now, we'll use SystemSetting table to store project data as JSONB

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'security' | 'ui-ux' | 'database' | 'api' | 'testing' | 'deployment' | 'workflow';
  phase: 'planning' | 'development' | 'testing' | 'deployment' | 'maintenance';
  assignedTo?: string;
  assignedToStaffId?: number;
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
  metadata?: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  schoolId?: number;
  departmentId?: number;
  districtId?: number;
}

export interface TaskChange {
  id: string;
  timestamp: Date;
  userId: string;
  field: string;
  oldValue: any;
  newValue: any;
  reason: string;
}

export interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  startDate?: Date;
  endDate?: Date;
  tasks: string[]; // Task IDs
  dependencies: string[]; // Phase IDs
  progress: number; // 0-100
  metadata?: Record<string, any>;
}

export interface ProjectMilestone {
  id: string;
  name: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  tasks: string[]; // Task IDs that must be completed
  status: 'pending' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ProjectMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  averageCompletionTime: number; // days
  productivityScore: number; // 0-100
  categoryBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  assigneeBreakdown: Record<string, number>;
  lastUpdated: Date;
}

// ===== FULL PROJECT TRACKER CLASS =====

export class ProjectTracker {
  private static instance: ProjectTracker;
  private rbac: DynamicRBAC;
  private tasksCache = new Map<string, ProjectTask>();
  private phasesCache = new Map<string, ProjectPhase>();
  private milestonesCache = new Map<string, ProjectMilestone>();
  private metricsCache: ProjectMetrics | null = null;
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate = 0;

  static getInstance(): ProjectTracker {
    if (!ProjectTracker.instance) {
      ProjectTracker.instance = new ProjectTracker();
    }
    return ProjectTracker.instance;
  }

  constructor() {
    this.rbac = DynamicRBAC.getInstance();
  }

  // Initialize project tracker with database setup
  async initialize(): Promise<void> {
    try {
      // Check if project management data exists in SystemSetting
      await this.ensureProjectDataStructure();
      
      // Load initial tasks if none exist
      const existingTasks = await this.getAllTasksFromDB();
      if (existingTasks.length === 0) {
        await this.createInitialTasks();
      }
      
      // Refresh cache
      await this.refreshCache();
      
      console.log('✅ Project Tracker initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Project Tracker:', error);
      throw error;
    }
  }

  // Ensure project data structure exists in database
  private async ensureProjectDataStructure(): Promise<void> {
    try {
      // Check if project_tasks exists
      const existingTasks = await prisma.systemSetting.findUnique({
        where: { key: 'project_tasks' }
      });

      if (!existingTasks) {
        await prisma.systemSetting.create({
          key: 'project_tasks',
          value: []
        });
      }

      // Check if project_phases exists
      const existingPhases = await prisma.systemSetting.findUnique({
        where: { key: 'project_phases' }
      });

      if (!existingPhases) {
        await prisma.systemSetting.create({
          key: 'project_phases',
          value: []
        });
      }

      // Check if project_milestones exists
      const existingMilestones = await prisma.systemSetting.findUnique({
        where: { key: 'project_milestones' }
      });

      if (!existingMilestones) {
        await prisma.systemSetting.create({
          key: 'project_milestones',
          value: []
        });
      }

      // Check if project_metrics exists
      const existingMetrics = await prisma.systemSetting.findUnique({
        where: { key: 'project_metrics' }
      });

      if (!existingMetrics) {
        await prisma.systemSetting.create({
          key: 'project_metrics',
          value: this.generateInitialMetrics()
        });
      }
    } catch (error) {
      console.error('Error ensuring project data structure:', error);
      throw error;
    }
  }

  // Create initial project tasks
  private async createInitialTasks(): Promise<void> {
    const initialTasks: Partial<ProjectTask>[] = [
      {
        title: 'Complete Dynamic RBAC System Implementation',
        description: 'Finish implementing the full dynamic RBAC system with database integration',
        status: 'in-progress',
        priority: 'critical',
        category: 'security',
        phase: 'development',
        files: [
          'src/lib/security/dynamic-rbac-full.ts',
          'src/lib/auth/auth-utils.ts'
        ],
        tags: ['rbac', 'security', 'authentication'],
        estimatedHours: 16
      },
      {
        title: 'Implement Full Rule Engine Validation',
        description: 'Complete the rule engine with real-time validation and auto-fix capabilities',
        status: 'in-progress',
        priority: 'high',
        category: 'workflow',
        phase: 'development',
        files: [
          'src/lib/project-management/rule-engine-full.ts'
        ],
        tags: ['rules', 'validation', 'automation'],
        estimatedHours: 12
      },
      {
        title: 'Setup File Watching System',
        description: 'Implement comprehensive file watching with chokidar for real-time workflow triggers',
        status: 'completed',
        priority: 'high',
        category: 'workflow',
        phase: 'development',
        files: [
          'src/lib/project-management/auto-workflow-full.ts'
        ],
        tags: ['file-watching', 'automation', 'workflow'],
        estimatedHours: 8,
        completedDate: new Date()
      },
      {
        title: 'Database Schema Validation',
        description: 'Ensure all Prisma queries use correct field naming conventions',
        status: 'pending',
        priority: 'critical',
        category: 'database',
        phase: 'development',
        files: [
          'src/app/**/*.{ts,tsx}'
        ],
        tags: ['prisma', 'database', 'schema'],
        estimatedHours: 6
      },
      {
        title: 'API Authentication Enforcement',
        description: 'Ensure all API routes use proper authentication patterns with full RBAC',
        status: 'pending',
        priority: 'high',
        category: 'security',
        phase: 'development',
        files: [
          'src/app/api/**/route.ts'
        ],
        tags: ['api', 'authentication', 'security'],
        estimatedHours: 10
      },
      {
        title: 'Project Management Dashboard Completion',
        description: 'Complete the project management dashboard with full functionality',
        status: 'in-progress',
        priority: 'medium',
        category: 'ui-ux',
        phase: 'development',
        files: [
          'src/app/dashboard/project-management/page.tsx'
        ],
        tags: ['dashboard', 'ui', 'project-management'],
        estimatedHours: 8
      }
    ];

    for (const taskData of initialTasks) {
      await this.createTask(taskData as any);
    }
  }

  // Create new task with full validation and database persistence
  async createTask(taskData: Partial<ProjectTask>, user?: AuthenticatedUser): Promise<ProjectTask> {
    // Validate required fields
    if (!taskData.title || !taskData.description) {
      throw new Error('Task title and description are required');
    }

    // Check permissions if user provided
    if (user && !(await this.rbac.hasPermission(user, 'task_management', 'create'))) {
      throw new Error('Insufficient permissions to create tasks');
    }

    // Generate task ID
    const taskId = this.generateTaskId();
    
    // Get user context for assignments
    let assignedToStaffId: number | undefined;
    let schoolId: number | undefined;
    let departmentId: number | undefined;
    let districtId: number | undefined;

    if (user) {
      const primaryStaff = await this.rbac.getPrimaryStaff(user);
      if (primaryStaff) {
        assignedToStaffId = primaryStaff.id;
        schoolId = primaryStaff.school_id;
        departmentId = primaryStaff.department_id;
        districtId = primaryStaff.district_id;
      }
    }

    // Create complete task object
    const task: ProjectTask = {
      id: taskId,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status || 'pending',
      priority: taskData.priority || 'medium',
      category: taskData.category || 'workflow',
      phase: taskData.phase || 'planning',
      assignedTo: taskData.assignedTo || user?.email,
      assignedToStaffId: taskData.assignedToStaffId || assignedToStaffId,
      estimatedHours: taskData.estimatedHours,
      actualHours: taskData.actualHours,
      startDate: taskData.startDate,
      dueDate: taskData.dueDate,
      completedDate: taskData.completedDate,
      dependencies: taskData.dependencies || [],
      blockers: taskData.blockers || [],
      files: taskData.files || [],
      changes: [],
      tags: taskData.tags || [],
      metadata: taskData.metadata,
      createdBy: user?.email || 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      schoolId,
      departmentId,
      districtId
    };

    // Save to database
    await this.saveTaskToDB(task);
    
    // Update cache
    this.tasksCache.set(taskId, task);
    
    // Update metrics
    await this.updateMetrics();
    
    console.log(`✅ Created task: ${task.title} (${taskId})`);
    
    return task;
  }

  // Update existing task with change tracking
  async updateTask(
    taskId: string, 
    updates: Partial<ProjectTask>, 
    userId: string, 
    reason: string,
    user?: AuthenticatedUser
  ): Promise<ProjectTask> {
    // Check permissions
    if (user && !(await this.rbac.hasPermission(user, 'task_management', 'update'))) {
      throw new Error('Insufficient permissions to update tasks');
    }

    const existingTask = await this.getTask(taskId);
    if (!existingTask) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Track changes
    const changes: TaskChange[] = [...existingTask.changes];
    
    for (const [field, newValue] of Object.entries(updates)) {
      if (field === 'changes') continue; // Skip changes field itself
      
      const oldValue = (existingTask as any)[field];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          id: this.generateChangeId(),
          timestamp: new Date(),
          userId,
          field,
          oldValue,
          newValue,
          reason
        });
      }
    }

    // Create updated task
    const updatedTask: ProjectTask = {
      ...existingTask,
      ...updates,
      changes,
      updatedAt: new Date()
    };

    // Handle status changes
    if (updates.status === 'completed' && !updatedTask.completedDate) {
      updatedTask.completedDate = new Date();
    }

    // Save to database
    await this.saveTaskToDB(updatedTask);
    
    // Update cache
    this.tasksCache.set(taskId, updatedTask);
    
    // Update metrics
    await this.updateMetrics();
    
    console.log(`✅ Updated task: ${updatedTask.title} (${taskId})`);
    
    return updatedTask;
  }

  // Get task by ID with permission checking
  async getTask(taskId: string, user?: AuthenticatedUser): Promise<ProjectTask | null> {
    // Check cache first
    if (this.isCacheValid() && this.tasksCache.has(taskId)) {
      const task = this.tasksCache.get(taskId)!;
      
      // Check permissions
      if (user && !(await this.canAccessTask(task, user))) {
        throw new Error('Insufficient permissions to access this task');
      }
      
      return task;
    }

    // Load from database
    const task = await this.getTaskFromDB(taskId);
    if (!task) return null;

    // Check permissions
    if (user && !(await this.canAccessTask(task, user))) {
      throw new Error('Insufficient permissions to access this task');
    }

    // Update cache
    this.tasksCache.set(taskId, task);
    
    return task;
  }

  // Check if user can access a task
  private async canAccessTask(task: ProjectTask, user: AuthenticatedUser): Promise<boolean> {
    // Admin can access all tasks
    if (await this.rbac.isAdmin(user)) {
      return true;
    }

    // User can access their own tasks
    if (task.assignedTo === user.email || task.createdBy === user.email) {
      return true;
    }

    // Staff can access tasks in their department/school
    const userStaff = await this.rbac.getUserStaff(user);
    for (const staff of userStaff) {
      if (task.schoolId === staff.school_id || task.departmentId === staff.department_id) {
        return true;
      }
    }

    return false;
  }

  // Get all tasks with filtering and permissions
  async getAllTasks(user?: AuthenticatedUser, filters?: TaskFilters): Promise<ProjectTask[]> {
    let tasks = await this.getAllTasksFromDB();

    // Apply permission filtering
    if (user) {
      const accessibleTasks: ProjectTask[] = [];
      for (const task of tasks) {
        try {
          if (await this.canAccessTask(task, user)) {
            accessibleTasks.push(task);
          }
        } catch (error) {
          // Skip inaccessible tasks
        }
      }
      tasks = accessibleTasks;
    }

    // Apply filters
    if (filters) {
      tasks = this.applyFilters(tasks, filters);
    }

    // Update cache
    tasks.forEach(task => this.tasksCache.set(task.id, task));

    return tasks;
  }

  // Apply filters to task list
  private applyFilters(tasks: ProjectTask[], filters: TaskFilters): ProjectTask[] {
    return tasks.filter(task => {
      if (filters.status && !filters.status.includes(task.status)) return false;
      if (filters.priority && !filters.priority.includes(task.priority)) return false;
      if (filters.category && !filters.category.includes(task.category)) return false;
      if (filters.phase && !filters.phase.includes(task.phase)) return false;
      if (filters.assignedTo && task.assignedTo !== filters.assignedTo) return false;
      if (filters.createdBy && task.createdBy !== filters.createdBy) return false;
      if (filters.tags && !filters.tags.some(tag => task.tags.includes(tag))) return false;
      if (filters.schoolId && task.schoolId !== filters.schoolId) return false;
      if (filters.departmentId && task.departmentId !== filters.departmentId) return false;
      if (filters.createdAfter && task.createdAt < filters.createdAfter) return false;
      if (filters.createdBefore && task.createdAt > filters.createdBefore) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!task.title.toLowerCase().includes(searchLower) &&
            !task.description.toLowerCase().includes(searchLower) &&
            !task.tags.some(tag => tag.toLowerCase().includes(searchLower))) {
          return false;
        }
      }
      return true;
    });
  }

  // Delete task with permission checking
  async deleteTask(taskId: string, user?: AuthenticatedUser): Promise<boolean> {
    // Check permissions
    if (user && !(await this.rbac.hasPermission(user, 'task_management', 'delete'))) {
      throw new Error('Insufficient permissions to delete tasks');
    }

    const task = await this.getTask(taskId, user);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Remove from database
    await this.deleteTaskFromDB(taskId);
    
    // Remove from cache
    this.tasksCache.delete(taskId);
    
    // Update metrics
    await this.updateMetrics();
    
    console.log(`✅ Deleted task: ${task.title} (${taskId})`);
    
    return true;
  }

  // Calculate comprehensive project metrics
  async calculateMetrics(user?: AuthenticatedUser): Promise<ProjectMetrics> {
    const tasks = await this.getAllTasks(user);
    const now = new Date();
    
    const metrics: ProjectMetrics = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
      blockedTasks: tasks.filter(t => t.status === 'blocked').length,
      overdueTasks: tasks.filter(t => t.dueDate && t.dueDate < now && t.status !== 'completed').length,
      averageCompletionTime: this.calculateAverageCompletionTime(tasks),
      productivityScore: this.calculateProductivityScore(tasks),
      categoryBreakdown: this.calculateCategoryBreakdown(tasks),
      priorityBreakdown: this.calculatePriorityBreakdown(tasks),
      assigneeBreakdown: this.calculateAssigneeBreakdown(tasks),
      lastUpdated: new Date()
    };

    // Cache metrics
    this.metricsCache = metrics;
    
    // Save to database
    await this.saveMetricsToDB(metrics);
    
    return metrics;
  }

  // Calculate average completion time in days
  private calculateAverageCompletionTime(tasks: ProjectTask[]): number {
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.startDate && t.completedDate);
    
    if (completedTasks.length === 0) return 0;
    
    const totalDays = completedTasks.reduce((sum, task) => {
      const startTime = task.startDate!.getTime();
      const endTime = task.completedDate!.getTime();
      const days = (endTime - startTime) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    
    return totalDays / completedTasks.length;
  }

  // Calculate productivity score (0-100)
  private calculateProductivityScore(tasks: ProjectTask[]): number {
    if (tasks.length === 0) return 0;
    
    const weights = {
      completed: 10,
      'in-progress': 5,
      pending: 2,
      blocked: 0,
      cancelled: 0
    };
    
    const priorityMultipliers = {
      critical: 2.0,
      high: 1.5,
      medium: 1.0,
      low: 0.7
    };
    
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    for (const task of tasks) {
      const baseScore = weights[task.status] || 0;
      const multiplier = priorityMultipliers[task.priority] || 1.0;
      const taskScore = baseScore * multiplier;
      
      totalScore += taskScore;
      maxPossibleScore += weights.completed * multiplier;
    }
    
    return maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  }

  // Calculate category breakdown
  private calculateCategoryBreakdown(tasks: ProjectTask[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    for (const task of tasks) {
      breakdown[task.category] = (breakdown[task.category] || 0) + 1;
    }
    
    return breakdown;
  }

  // Calculate priority breakdown
  private calculatePriorityBreakdown(tasks: ProjectTask[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    for (const task of tasks) {
      breakdown[task.priority] = (breakdown[task.priority] || 0) + 1;
    }
    
    return breakdown;
  }

  // Calculate assignee breakdown
  private calculateAssigneeBreakdown(tasks: ProjectTask[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    for (const task of tasks) {
      const assignee = task.assignedTo || 'Unassigned';
      breakdown[assignee] = (breakdown[assignee] || 0) + 1;
    }
    
    return breakdown;
  }

  // Generate initial metrics
  private generateInitialMetrics(): ProjectMetrics {
    return {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      blockedTasks: 0,
      overdueTasks: 0,
      averageCompletionTime: 0,
      productivityScore: 0,
      categoryBreakdown: {},
      priorityBreakdown: {},
      assigneeBreakdown: {},
      lastUpdated: new Date()
    };
  }

  // Update metrics in database
  private async updateMetrics(): Promise<void> {
    try {
      const metrics = await this.calculateMetrics();
      await this.saveMetricsToDB(metrics);
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  }

  // Database operations
  private async saveTaskToDB(task: ProjectTask): Promise<void> {
    try {
      const tasks = await this.getAllTasksFromDB();
      const taskIndex = tasks.findIndex(t => t.id === task.id);
      
      if (taskIndex >= 0) {
        tasks[taskIndex] = task;
      } else {
        tasks.push(task);
      }
      
      await prisma.systemSetting.upsert({
        where: { key: 'project_tasks' },
        create: { key: 'project_tasks', value: tasks },
        update: { value: tasks }
      });
    } catch (error) {
      console.error('Error saving task to database:', error);
      throw error;
    }
  }

  private async getTaskFromDB(taskId: string): Promise<ProjectTask | null> {
    try {
      const tasks = await this.getAllTasksFromDB();
      return tasks.find(t => t.id === taskId) || null;
    } catch (error) {
      console.error('Error getting task from database:', error);
      return null;
    }
  }

  private async getAllTasksFromDB(): Promise<ProjectTask[]> {
    try {
      const result = await prisma.systemSetting.findUnique({
        where: { key: 'project_tasks' }
      });
      
      if (!result || !Array.isArray(result.value)) {
        return [];
      }
      
      // Convert dates from JSON
      return (result.value as any[]).map(task => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        startDate: task.startDate ? new Date(task.startDate) : undefined,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        completedDate: task.completedDate ? new Date(task.completedDate) : undefined,
        changes: task.changes.map((change: any) => ({
          ...change,
          timestamp: new Date(change.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Error getting all tasks from database:', error);
      return [];
    }
  }

  private async deleteTaskFromDB(taskId: string): Promise<void> {
    try {
      const tasks = await this.getAllTasksFromDB();
      const filteredTasks = tasks.filter(t => t.id !== taskId);
      
      await prisma.systemSetting.update({
        where: { key: 'project_tasks' },
        data: { value: filteredTasks }
      });
    } catch (error) {
      console.error('Error deleting task from database:', error);
      throw error;
    }
  }

  private async saveMetricsToDB(metrics: ProjectMetrics): Promise<void> {
    try {
      await prisma.systemSetting.upsert({
        where: { key: 'project_metrics' },
        create: { key: 'project_metrics', value: metrics },
        update: { value: metrics }
      });
    } catch (error) {
      console.error('Error saving metrics to database:', error);
    }
  }

  // Utility methods
  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChangeId(): string {
    return `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.cacheExpiry;
  }

  // Cache management
  async refreshCache(): Promise<void> {
    this.tasksCache.clear();
    this.phasesCache.clear();
    this.milestonesCache.clear();
    this.metricsCache = null;
    this.lastCacheUpdate = Date.now();
  }

  // Get project statistics
  async getProjectStatistics(user?: AuthenticatedUser): Promise<any> {
    const tasks = await this.getAllTasks(user);
    const metrics = await this.calculateMetrics(user);
    
    return {
      overview: {
        totalTasks: metrics.totalTasks,
        completedTasks: metrics.completedTasks,
        inProgressTasks: metrics.inProgressTasks,
        pendingTasks: metrics.pendingTasks,
        blockedTasks: metrics.blockedTasks,
        overdueTasks: metrics.overdueTasks
      },
      performance: {
        averageCompletionTime: metrics.averageCompletionTime,
        productivityScore: metrics.productivityScore
      },
      breakdown: {
        categories: metrics.categoryBreakdown,
        priorities: metrics.priorityBreakdown,
        assignees: metrics.assigneeBreakdown
      },
      recent: {
        recentTasks: tasks
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .slice(0, 10),
        recentCompletions: tasks
          .filter(t => t.status === 'completed' && t.completedDate)
          .sort((a, b) => (b.completedDate!.getTime() - a.completedDate!.getTime()))
          .slice(0, 5)
      }
    };
  }

  // Task dependency management
  async checkTaskDependencies(taskId: string): Promise<{ canStart: boolean; blockedBy: string[] }> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const blockedBy: string[] = [];

    for (const dependencyId of task.dependencies) {
      const dependency = await this.getTask(dependencyId);
      if (dependency && dependency.status !== 'completed') {
        blockedBy.push(dependency.id);
      }
    }

    return {
      canStart: blockedBy.length === 0,
      blockedBy
    };
  }

  // Bulk operations
  async bulkUpdateTasks(
    taskIds: string[], 
    updates: Partial<ProjectTask>, 
    user?: AuthenticatedUser
  ): Promise<ProjectTask[]> {
    // Check permissions
    if (user && !(await this.rbac.hasPermission(user, 'task_management', 'update'))) {
      throw new Error('Insufficient permissions to bulk update tasks');
    }

    const updatedTasks: ProjectTask[] = [];

    for (const taskId of taskIds) {
      try {
        const updatedTask = await this.updateTask(
          taskId, 
          updates, 
          user?.email || 'system', 
          'Bulk update operation',
          user
        );
        updatedTasks.push(updatedTask);
      } catch (error) {
        console.error(`Error updating task ${taskId} in bulk operation:`, error);
      }
    }

    return updatedTasks;
  }

  // Export/Import functionality
  async exportTasks(user?: AuthenticatedUser): Promise<any> {
    const tasks = await this.getAllTasks(user);
    const metrics = await this.calculateMetrics(user);
    
    return {
      exportDate: new Date(),
      exportedBy: user?.email || 'system',
      tasks,
      metrics,
      version: '1.0'
    };
  }

  async importTasks(data: any, user?: AuthenticatedUser): Promise<{ imported: number; errors: string[] }> {
    // Check permissions
    if (user && !(await this.rbac.hasPermission(user, 'task_management', 'create'))) {
      throw new Error('Insufficient permissions to import tasks');
    }

    let imported = 0;
    const errors: string[] = [];

    if (data.tasks && Array.isArray(data.tasks)) {
      for (const taskData of data.tasks) {
        try {
          // Generate new ID to avoid conflicts
          delete taskData.id;
          await this.createTask(taskData, user);
          imported++;
        } catch (error) {
          errors.push(`Error importing task "${taskData.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    return { imported, errors };
  }
}

// ===== INTERFACES =====

export interface TaskFilters {
  status?: ProjectTask['status'][];
  priority?: ProjectTask['priority'][];
  category?: ProjectTask['category'][];
  phase?: ProjectTask['phase'][];
  assignedTo?: string;
  createdBy?: string;
  tags?: string[];
  schoolId?: number;
  departmentId?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  search?: string;
} 