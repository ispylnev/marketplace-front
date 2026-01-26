import { LucideIcon } from "lucide-react";

interface ProfileMenuItemProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  variant?: "default" | "danger" | "success" | "warning";
  disabled?: boolean;
}

export function ProfileMenuItem({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  disabled = false
}: ProfileMenuItemProps) {
  const getVariantStyles = () => {
    if (disabled) {
      return "text-gray-400 cursor-not-allowed";
    }
    
    switch (variant) {
      case "danger":
        return "text-red-600 hover:text-red-700";
      case "success":
        return "text-emerald-600 hover:text-emerald-700 font-medium";
      case "warning":
        return "text-yellow-600 hover:text-yellow-700";
      default:
        return "text-[#2D2E30]";
    }
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-3 ${
        !disabled && 'hover:bg-[#BCCEA9]/10'
      } transition-colors ${getVariantStyles()}`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}

