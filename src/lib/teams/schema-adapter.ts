/**
 * Schema Adapter for Teams API
 * Provides compatibility between old and new schema formats
 */

interface LegacyTeam {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  purpose: string;
  start_date: Date;
  end_date?: Date | null;
  is_recurring: boolean;
  budget?: any;
  school_id?: number | null;
  department_id?: number | null;
  district_id?: number | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

interface ModernTeam {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  metadata?: any;
  _count?: {
    team_members: number;
    team_knowledge: number;
  };
}

interface LegacyKnowledge {
  id: string;
  team_id: string;
  title: string;
  content: string;
  category: string;
  visibility: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  type?: string | null;
  tags?: string[];
  url?: string | null;
  is_pinned?: boolean | null;
  metadata?: any;
}

interface ModernKnowledge {
  id: number | string;
  team_id: string;
  title: string;
  description?: string | null;
  type: string;
  category?: string | null;
  url?: string | null;
  content?: string | null;
  tags?: string[] | null;
  is_public: boolean;
  views_count: number;
  downloads_count: number;
  created_at: Date | string;
  updated_at: Date | string;
  created_by_staff_id?: number | null;
  metadata?: any;
}

/**
 * Convert legacy team format to modern format
 */
export function legacyToModernTeam(legacy: any): ModernTeam {
  return {
    id: legacy.id,
    name: legacy.name,
    description: legacy.description || legacy.purpose || null,
    type: legacy.type,
    is_active: legacy.is_active !== undefined ? legacy.is_active : (legacy.status === 'ACTIVE'),
    created_at: legacy.created_at,
    updated_at: legacy.updated_at,
    metadata: legacy.metadata || {
      code: legacy.code,
      status: legacy.status,
      purpose: legacy.purpose,
      start_date: legacy.start_date,
      end_date: legacy.end_date,
      is_recurring: legacy.is_recurring,
      budget: legacy.budget,
      school_id: legacy.school_id,
      department_id: legacy.department_id,
      district_id: legacy.district_id,
      created_by: legacy.created_by
    },
    _count: legacy._count
  };
}

/**
 * Convert modern team format to legacy format
 */
export function modernToLegacyTeam(modern: ModernTeam): any {
  const metadata = modern.metadata || {};
  return {
    id: modern.id,
    name: modern.name,
    code: metadata.code || `TEAM_${modern.id}`,
    type: modern.type,
    status: modern.is_active ? 'ACTIVE' : 'INACTIVE',
    purpose: metadata.purpose || modern.description || '',
    start_date: metadata.start_date || modern.created_at,
    end_date: metadata.end_date || null,
    is_recurring: metadata.is_recurring || false,
    budget: metadata.budget || null,
    school_id: metadata.school_id || null,
    department_id: metadata.department_id || null,
    district_id: metadata.district_id || null,
    created_by: metadata.created_by || 0,
    created_at: modern.created_at,
    updated_at: modern.updated_at,
    // Include modern fields too
    description: modern.description,
    is_active: modern.is_active,
    metadata: modern.metadata
  };
}

/**
 * Convert legacy knowledge format to modern format
 */
export function legacyToModernKnowledge(legacy: any): ModernKnowledge {
  // Handle both string and number IDs
  const id = typeof legacy.id === 'string' && !isNaN(Number(legacy.id)) 
    ? Number(legacy.id);
    : legacy.id;

  return {
    id: id,
    team_id: legacy.team_id,
    title: legacy.title,
    description: legacy.description || null,
    type: legacy.type || 'NOTE',
    category: legacy.category !== 'NOTE' ? legacy.category : null,
    url: legacy.url,
    content: legacy.content || null,
    tags: legacy.tags || null,
    is_public: legacy.is_public !== undefined 
      ? legacy.is_public 
      : (legacy.visibility === 'PUBLIC'),
    views_count: legacy.views_count || 0,
    downloads_count: legacy.downloads_count || 0,
    created_at: legacy.created_at,
    updated_at: legacy.updated_at,
    created_by_staff_id: legacy.created_by_staff_id || null,
    metadata: legacy.metadata
  };
}

/**
 * Convert modern knowledge format to legacy format
 */
export function modernToLegacyKnowledge(modern: ModernKnowledge): any {
  return {
    id: String(modern.id),
    team_id: modern.team_id,
    title: modern.title,
    content: modern.content || modern.description || '',
    category: modern.category || 'NOTE',
    visibility: modern.is_public ? 'PUBLIC' : 'TEAM',
    created_by: modern.metadata?.created_by || 0,
    created_at: modern.created_at,
    updated_at: modern.updated_at,
    type: modern.type,
    tags: modern.tags || [],
    url: modern.url,
    is_pinned: modern.metadata?.is_pinned || false,
    metadata: modern.metadata,
    // Include modern fields too
    description: modern.description,
    is_public: modern.is_public,
    views_count: modern.views_count,
    downloads_count: modern.downloads_count,
    created_by_staff_id: modern.created_by_staff_id
  };
}

/**
 * Ensure team has all required fields for both schemas
 */
export function ensureTeamCompatibility(team: any): any {
  const modern = legacyToModernTeam(team);
  const legacy = modernToLegacyTeam(modern);
  
  // Merge both formats
  return {
    ...legacy,
    ...modern,
    // Ensure _count is included
    _count: team._count || {
      team_members: 0,
      team_knowledge: 0
    }
  };
}

/**
 * Ensure knowledge has all required fields for both schemas
 */
export function ensureKnowledgeCompatibility(knowledge: any): any {
  const modern = legacyToModernKnowledge(knowledge);
  const legacy = modernToLegacyKnowledge(modern);
  
  // Merge both formats
  return {
    ...legacy,
    ...modern
  };
}

/**
 * Process team array for compatibility
 */
export function processTeamsArray(teams: any[]): any[] {
  return teams.map(team => ensureTeamCompatibility(team));
}

/**
 * Process knowledge array for compatibility
 */
export function processKnowledgeArray(knowledge: any[]): any[] {
  return knowledge.map(item => ensureKnowledgeCompatibility(item));
}