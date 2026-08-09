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
};

export const primaryNavigation: NavItem[] = [
  { label: "Overview", href: "/dashboard", Icon: LayoutDashboard },
  { label: "Saved Jobs", href: "/dashboard/jobs", Icon: Briefcase },
  { label: "Applications", href: "/dashboard/applications", Icon: Send },
  { label: "Resumes", href: "/dashboard/resumes", Icon: FileText },
  { label: "AI Documents", href: "/dashboard/documents", Icon: Sparkles },
  { label: "Analytics", href: "/dashboard/analytics", Icon: BarChart3 },
];

export const secondaryNavigation: NavItem[] = [
  { label: "Settings", href: "/settings/account", Icon: Settings },
];

export function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
