import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  BatteryCharging,
  BookOpen,
  Box,
  Building2,
  Cable,
  Gauge,
  Network,
  Percent,
  ToggleLeft,
  Zap,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Zap,
  Activity,
  Gauge,
  Box,
  Percent,
  Cable,
  ToggleLeft,
  ArrowLeftRight,
  BatteryCharging,
  BarChart3,
  Building2,
  Network,
  BookOpen,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? Zap;
  return <Icon className={className} aria-hidden />;
}
