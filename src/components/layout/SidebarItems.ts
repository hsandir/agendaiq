import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  FileText, 
  Settings,
  TrendingUp,
  Eye,
  UserCheck,
  Shield,
  Lock,
  Activity,
  FlaskConical,
  Brain,
  Search,
  BarChart,
  CheckSquare,
  GitBranch,
  UserCog,
  Palette,
  Monitor,
  User,
  ShieldCheck,
  Server,
  Code,
  Video,
  Briefcase,
  LogOut,
  Bug
} from "lucide-react";

export interface NavigationItem {
  href: string;
  label: string;
  icon: Record<string, unknown>;
  children?: NavigationItem[];
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export const sidebarItems: NavigationSection[] = [
  {
    title: "Main",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
      {
        href: "/dashboard/meetings",
        label: "Meetings",
        icon: Calendar,
      },
      {
        href: "/dashboard/teams",
        label: "Teams",
        icon: Users,
      },
      {
        href: "/dashboard/meeting-intelligence",
        label: "Meeting Intelligence",
        icon: Brain,
        children: [
          {
            href: "/dashboard/meeting-intelligence",
            label: "Overview",
            icon: Brain,
          },
          {
            href: "/dashboard/meeting-intelligence/search",
            label: "Search",
            icon: Search,
          },
          {
            href: "/dashboard/meeting-intelligence/analytics",
            label: "Analytics",
            icon: BarChart,
          },
          {
            href: "/dashboard/meeting-intelligence/action-items",
            label: "Action Items",
            icon: CheckSquare,
          },
          {
            href: "/dashboard/meeting-intelligence/continuity",
            label: "Meeting Chains",
            icon: GitBranch,
          },
          {
            href: "/dashboard/meeting-intelligence/role-tasks",
            label: "Role Tasks",
            icon: UserCog,
          },
        ],
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        href: "/dashboard/settings",
        label: "Settings",
        icon: Settings,
        children: [
          {
            href: "/dashboard/settings/profile",
            label: "Account",
            icon: User,
            children: [
              {
                href: "/dashboard/settings/profile",
                label: "Profile",
                icon: User,
              },
              {
                href: "/dashboard/settings/interface",
                label: "Interface & Theme",
                icon: Monitor,
              },
              {
                href: "/dashboard/settings/theme",
                label: "Theme Selection",
                icon: Palette,
              },
              {
                href: "/dashboard/settings/layout",
                label: "Layout Settings",
                icon: Monitor,
              },
              {
                href: "/dashboard/settings/security",
                label: "Security",
                icon: Lock,
              },
              {
                href: "/dashboard/settings/security/2fa",
                label: "Two-Factor Auth",
                icon: Shield,
              },
            ],
          },
          {
            href: "/dashboard/settings/role-hierarchy",
            label: "Admin",
            icon: ShieldCheck,
            children: [
              {
                href: "/dashboard/settings/role-hierarchy",
                label: "Role Hierarchy",
                icon: TrendingUp,
              },
              {
                href: "/dashboard/settings/permissions",
                label: "Permissions",
                icon: Lock,
              },
              {
                href: "/dashboard/settings/staff-upload",
                label: "Staff Upload",
                icon: Users,
              },
              {
                href: "/dashboard/settings/school",
                label: "School Management",
                icon: FileText,
              },
            ],
          },
          {
            href: "/dashboard/settings/system",
            label: "Production",
            icon: Server,
            children: [
              {
                href: "/dashboard/settings/system",
                label: "System Settings",
                icon: Settings,
              },
              {
                href: "/dashboard/settings/audit",
                label: "Audit Logs",
                icon: Activity,
              },
              {
                href: "/dashboard/settings/backup",
                label: "Backup & Restore",
                icon: Shield,
              },
              {
                href: "/dashboard/page-selection",
                label: "Page Selection",
                icon: FileText,
              },
            ],
          },
          {
            href: "/dashboard/development",
            label: "Development",
            icon: Code,
            children: [
              {
                href: "/dashboard/development",
                label: "Development Tools",
                icon: FlaskConical,
              },
              {
                href: "/dashboard/monitoring",
                label: "Live Monitoring",
                icon: Monitor,
              },
              {
                href: "/dashboard/debug",
                label: "Debug Dashboard",
                icon: Bug,
              },
              {
                href: "/dashboard/development/performance",
                label: "Performance Monitor",
                icon: Activity,
              },
              {
                href: "/dashboard/development/permissions-check",
                label: "Permissions Check",
                icon: Shield,
              },
            ],
          },
          {
            href: "/dashboard/settings/meeting-templates",
            label: "Meeting",
            icon: Briefcase,
            children: [
              {
                href: "/dashboard/settings/meeting-templates",
                label: "Meeting Templates",
                icon: FileText,
              },
              {
                href: "/dashboard/settings/meeting-management",
                label: "Meeting Management",
                icon: Calendar,
              },
              {
                href: "/dashboard/settings/meeting-permissions",
                label: "Meeting Permissions",
                icon: Shield,
              },
              {
                href: "/dashboard/settings/meeting-audit",
                label: "Meeting Audit",
                icon: Activity,
              },
              {
                href: "/dashboard/settings/meeting-help",
                label: "Meeting Help",
                icon: FileText,
              },
            ],
          },
          {
            href: "/dashboard/settings/zoom-integration",
            label: "Zoom",
            icon: Video,
            children: [
              {
                href: "/dashboard/settings/zoom-integration",
                label: "Zoom Integration",
                icon: Video,
              },
              {
                href: "/dashboard/settings/zoom-user-preferences",
                label: "User Preferences",
                icon: UserCog,
              },
            ],
          },
        ],
      },
    ],
  },
];