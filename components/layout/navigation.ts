import { ADMIN_ROOT_PATH, OPS_CONSOLE_PATH } from "@/features/admin/constants";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Bug,
  Compass,
  FileText,
  HeartPulse,
  IdCard,
  LaptopMinimal,
  Puzzle,
  Inbox,
  LayoutDashboard,
  Mic,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export type NavGroup = "today" | "find" | "apply" | "materials" | "hear-back";

export type NavItem = {
  label: string;
  href: string;
  Icon: typeof LayoutDashboard;
  ready: boolean;
  badge?: "NEW";
  group?: NavGroup;
  also?: string[];
  tab?: boolean;
};

export const navGroupLabels: Record<NavGroup, string | null> = {
  today: null,
  find: "Find",
  apply: "Apply",
  materials: "Materials",
  "hear-back": "Hear back",
};

const allNavigation: NavItem[] = [
  { label: "Today", href: "/dashboard", Icon: LayoutDashboard, ready: true, group: "today", tab: true },
  { label: "Discover", href: "/dashboard/discover", Icon: Compass, ready: true, group: "find", tab: true },
  {
    label: "Applications",
    href: "/dashboard/jobs",
    Icon: Briefcase,
    ready: true,
    group: "apply",
    also: ["/dashboard/applications", "/dashboard/auto-apply"],
    tab: true,
  },
  { label: "Resumes", href: "/dashboard/resumes", Icon: FileText, ready: true, group: "materials" },
  { label: "AI Documents", href: "/dashboard/documents", Icon: Sparkles, ready: true, group: "materials" },
  { label: "Replies", href: "/dashboard/responses", Icon: Inbox, ready: true, group: "hear-back", tab: true },
  {
    label: "Interview prep",
    href: "/dashboard/interview",
    Icon: Mic,
    ready: true,
    badge: "NEW",
    group: "hear-back",
  },
];

export const primaryNavigation = allNavigation.filter((item) => item.ready);

export const navigationGroups = (Object.keys(navGroupLabels) as NavGroup[])
  .map((group) => ({
    group,
    label: navGroupLabels[group],
    items: primaryNavigation.filter((item) => item.group === group),
  }))
  .filter((entry) => entry.items.length > 0);

export const tabNavigation = primaryNavigation.filter((item) => item.tab);

export const utilityRoutes: NavItem[] = [
  { label: "Career profile", href: "/settings/profile", Icon: IdCard, ready: true },
  { label: "Settings", href: "/settings/account", Icon: Settings, ready: true },
  { label: "Browser extension", href: "/settings/extension", Icon: Puzzle, ready: true },
  { label: "Local worker", href: "/settings/worker", Icon: LaptopMinimal, ready: true },
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
  { label: "System Health", href: "/admin/health", Icon: HeartPulse, ready: true },
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

export function isActiveItem(pathname: string, item: Pick<NavItem, "href" | "also">) {
  return [item.href, ...(item.also ?? [])].some((href) => isActivePath(pathname, href));
}

export function isAdminModePath(pathname: string) {
  return (
    pathname === ADMIN_ROOT_PATH ||
    pathname.startsWith(`${ADMIN_ROOT_PATH}/`) ||
    pathname === OPS_CONSOLE_PATH ||
    pathname.startsWith(`${OPS_CONSOLE_PATH}/`)
  );
}
