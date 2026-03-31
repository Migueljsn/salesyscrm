"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BarChart2,
  User,
  Settings,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

function NavLink({ href, label, icon }: NavItem) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/app" && href !== "/admin" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
        isActive
          ? "bg-stone-800 text-white font-medium"
          : "text-stone-300 hover:bg-stone-800 hover:text-white"
      }`}
    >
      <span className={isActive ? "text-amber-300" : "text-stone-500"}>
        {icon}
      </span>
      {label}
    </Link>
  );
}

export function ClientNavLinks() {
  return (
    <>
      <NavLink href="/app" label="Visão geral" icon={<LayoutDashboard size={16} />} />
      <NavLink href="/app/leads" label="Leads" icon={<Users size={16} />} />
      <NavLink href="/app/reports" label="Relatórios" icon={<BarChart2 size={16} />} />
      <NavLink href="/app/profile" label="Meu perfil" icon={<User size={16} />} />
      <NavLink href="/app/settings" label="Configurações" icon={<Settings size={16} />} />
    </>
  );
}

export function AdminNavLinks() {
  return (
    <>
      <NavLink href="/app" label="Visão geral" icon={<LayoutDashboard size={16} />} />
      <NavLink href="/admin" label="Admin" icon={<ShieldCheck size={16} />} />
      <NavLink href="/admin/clients" label="Clientes" icon={<Building2 size={16} />} />
      <NavLink href="/admin/reports" label="Relatórios" icon={<BarChart2 size={16} />} />
      <NavLink href="/app/profile" label="Meu perfil" icon={<User size={16} />} />
    </>
  );
}
