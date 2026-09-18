import { ADMIN_ROOT_PATH, OPS_CONSOLE_PATH } from "@/features/admin/constants";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Bug,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Mic,
  ScrollText,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  Icon: typeof LayoutDashboard;
  ready: boolean;
  badge?: "NEW";
};

const allNavigation: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    Icon: LayoutDashboard,
    ready: true,
  },
  { label: "Resumes", href: "/dashboard/resumes", Icon: FileText, ready: true },
  {
    label: "Applications",
    href: "/dashboard/applications",
    Icon: Send,
    ready: true,
  },
  {
    label: "Saved Jobs",
    href: "/dashboard/jobs",
    Icon: Briefcase,
    ready: true,
  },
  {
    label: "AI Documents",
    href: "/dashboard/documents",
    Icon: Sparkles,
    ready: true,
  },
  {
    label: "Interview",
    href: "/dashboard/interview",
    Icon: Mic,
    ready: true,
    badge: "NEW",
  },
];

export const primaryNavigation = allNavigation.filter((item) => item.ready);

export const utilityRoutes: NavItem[] = [
  { label: "Settings", href: "/settings/account", Icon: Settings, ready: true },
];

export const adminEntry: NavItem = {
  label: "Administration",
  href: ADMIN_ROOT_PATH,
  Icon: ShieldCheck,
  ready: true,
};

const allAdminNavigation: NavItem[] = [
  { label: "Users", href: "/admin/users", Icon: Users, ready: true },
  { label: "Feature Usage", href: "/admin/usage", Icon: Activity, ready: true },
  { label: "Errors", href: "/admin/errors", Icon: AlertTriangle, ready: true },
  {
    label: "Audit Log",
    href: "/admin/audit-log",
    Icon: ScrollText,
    ready: true,
  },
  { label: "Bug Reports", href: OPS_CONSOLE_PATH, Icon: Bug, ready: true },
  { label: "System Health", href: "/admin/health", Icon: HeartPulse, ready: false },
];

export const adminNavigation = allAdminNavigation.filter((item) => item.ready);

export const backToAppEntry: NavItem = {
  label: "Back to HireLens",
  href: "/dashboard",
  Icon: ArrowLeft,
  ready: true,
};

export function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isAdminModePath(pathname: string) {
  return (
    pathname === ADMIN_ROOT_PATH ||
    pathname.startsWith(`${ADMIN_ROOT_PATH}/`) ||
    pathname === OPS_CONSOLE_PATH ||
    pathname.startsWith(`${OPS_CONSOLE_PATH}/`)
  );
}
