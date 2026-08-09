import {
  BarChart3,
  Briefcase,
  FileText,
  LayoutDashboard,
  Send,
  Settings,
  Sparkles,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  Icon: typeof LayoutDashboard;
  ready: boolean;
};

const allNavigation: NavItem[] = [
  { label: "Overview", href: "/dashboard", Icon: LayoutDashboard, ready: true },
  { label: "Saved Jobs", href: "/dashboard/jobs", Icon: Briefcase, ready: true },
  {
    label: "Applications",
    href: "/dashboard/applications",
    Icon: Send,
    ready: false,
  },
  { label: "Resumes", href: "/dashboard/resumes", Icon: FileText, ready: true },
  {
    label: "AI Documents",
    href: "/dashboard/documents",
    Icon: Sparkles,
    ready: false,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    Icon: BarChart3,
    ready: false,
  },
];

export const primaryNavigation = allNavigation.filter((item) => item.ready);

export const utilityRoutes: NavItem[] = [
  { label: "Settings", href: "/settings/account", Icon: Settings, ready: true },
];

export function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
