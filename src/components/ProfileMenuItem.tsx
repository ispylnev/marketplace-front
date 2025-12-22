import { LucideIcon } from "lucide-react";

interface ProfileMenuItemProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  variant?: "default" | "danger";
}

export function ProfileMenuItem({ 
  icon: Icon, 
  label, 
  onClick,
  variant = "default" 
}: ProfileMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#BCCEA9]/10 transition-colors ${
        variant === "danger" ? "text-red-600" : "text-[#2D2E30]"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}

