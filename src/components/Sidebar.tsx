"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Users,
  Upload,
  KanbanSquare,
  LayoutDashboard,
  Settings,
  LogOut,
  CalendarRange,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions/auth";

const NAV = [
  { href: "/today", label: "Today", icon: Sparkles },
  { href: "/review", label: "Weekly review", icon: CalendarRange },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ userName, companyName }: { userName: string; companyName?: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 flex-shrink-0 flex-col border-r border-slate-200 bg-white max-md:hidden">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">
          A
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight text-slate-900">AdvisorFlow AI</div>
          <div className="text-xs text-slate-400">Relationship copilot</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 px-2">
          <div className="truncate text-sm font-medium text-slate-800">{userName}</div>
          {companyName && <div className="truncate text-xs text-slate-400">{companyName}</div>}
        </div>
        <form action={logoutAction}>
          <button type="submit" className="btn-ghost w-full justify-start">
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
