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
  Activity
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
        href: "/dashboard/team",
        label: "Team",
        icon: Users,
      },
      {
        href: "/dashboard/notes",
        label: "Notes",
        icon: FileText,
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