import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BatteryCharging,
  BookOpen,
  Box,
  Cable,
  ClipboardCheck,
  Cog,
  Earth,
  Fuel,
  Lightbulb,
  Network,
  Percent,
  Shield,
  Sun,
  Table,
  ToggleLeft,
  Zap,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Zap,
  Box,
  Percent,
  Cable,
  ToggleLeft,
  BatteryCharging,
  BarChart3,
  Network,
  BookOpen,
  Cog,
  Fuel,
  Earth,
  Lightbulb,
  Sun,
  Table,
  Shield,
  ClipboardCheck,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? Zap;
  return <Icon className={className} aria-hidden />;
}
