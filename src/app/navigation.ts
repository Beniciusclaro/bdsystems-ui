import type { LucideIcon } from 'lucide-react';
import {
  Boxes,
  BriefcaseBusiness,
  Calculator,
  ChartNoAxesCombined,
  ContactRound,
  Hammer,
  PackageOpen,
  Truck,
  Users,
} from 'lucide-react';

export interface NavigationItem {
  path: string;
  label: string;
  eyebrow: string;
  icon: LucideIcon;
}

export const navigationItems: NavigationItem[] = [
  {
    path: '/dashboard',
    label: 'Visão geral',
    eyebrow: 'Painel de operação',
    icon: ChartNoAxesCombined,
  },
  { path: '/employees', label: 'Funcionários', eyebrow: 'Cadastros', icon: Users },
  { path: '/clients', label: 'Clientes', eyebrow: 'Cadastros', icon: ContactRound },
  { path: '/suppliers', label: 'Fornecedores', eyebrow: 'Cadastros', icon: Truck },
  { path: '/tools', label: 'Ferramentas', eyebrow: 'Recursos', icon: Hammer },
  { path: '/materials', label: 'Materiais', eyebrow: 'Recursos', icon: PackageOpen },
  {
    path: '/planning',
    label: 'Obras e mão de obra',
    eyebrow: 'Planeamento',
    icon: BriefcaseBusiness,
  },
  { path: '/compositions', label: 'Composições', eyebrow: 'Planeamento', icon: Boxes },
  { path: '/budgets', label: 'Orçamentos', eyebrow: 'Planeamento', icon: Calculator },
];

export function getNavigationItem(pathname: string): NavigationItem {
  return (
    navigationItems.find(
      (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
    ) ?? navigationItems[0]
  );
}
