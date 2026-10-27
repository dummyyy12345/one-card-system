import {
  Users,
  Shield,
  KeyRound,
  Monitor,
  ScanFace,
  Logs,
  ScanLine,
} from "lucide-react";

export const rolePermission = [
  { role: "admin", permission: "Users", icon: Users },
  { role: "admin", permission: "Roles", icon: Shield },
  { role: "admin", permission: "Permissions", icon: KeyRound },
  { role: "admin", permission: "Devices", icon: Monitor },
  { role: "admin", permission: "Access", icon: ScanLine },
  { role: "registrar", permission: "Students", icon: Users },
  { role: "gate", permission: "Current", icon: ScanFace },
  { role: "gate", permission: "History", icon: Logs },
  {
    role: "cafeteria",
    permission: "cafe",
    icon: Users,
    label: "Access dashboard",
  },
  { role: "cafe", permission: "cafe", icon: Users, label: "Access dashboard" },
  {
    role: "dormitory",
    permission: "dormitory",
    icon: Users,
    label: "Access dashboard",
  },
  {
    role: "librarian",
    permission: "librarian",
    icon: Users,
    label: "Access dashboard",
  },
  {
    role: "library",
    permission: "librarian",
    icon: Users,
    label: "Access dashboard",
  },
];
