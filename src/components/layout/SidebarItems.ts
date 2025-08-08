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
  Palette
} from "lucide-react";

export interface NavigationItem {
  href: string;
  label: string;
  icon: any;
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
      {
        href: "/dashboard/team",
        label: "Team",
        icon: Users,
      },
      {
        href: "/dashboard/notes",
        label: "Notes",
        icon: FileText,
      },
      {
        href: "/dashboard/development",
        label: "Development Tools",
        icon: FlaskConical,
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
            href: "/dashboard/settings/roles",
            label: "Role Management",
            icon: Shield,
          },
          {
            href: "/dashboard/settings/role-hierarchy",
            label: "Role Hierarchy",
            icon: TrendingUp,
          },
          {
            href: "/dashboard/settings/role-hierarchy/visualization",
            label: "Hierarchy Visualization", 
            icon: Eye,
          },
          {
            href: "/dashboard/settings/users",
            label: "User Management",
            icon: UserCheck,
          },
          {
            href: "/dashboard/settings/theme",
            label: "Theme",
            icon: Palette,
          },
          {
            href: "/dashboard/settings/security",
            label: "Security",
            icon: Lock,
          },
          {
            href: "/dashboard/settings/audit",
            label: "Audit Logs",
            icon: Activity,
          },
        ],
      },
    ],
  },
];