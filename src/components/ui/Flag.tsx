import { getFlagCode } from "@/lib/formatting";

interface FlagProps {
  team: string;
  size?: "small" | "medium" | "large";
}

const sizeMap = {
  small: "h-4 w-6",
  medium: "h-6 w-9",
  large: "h-8 w-12",
};

export function Flag({ team, size = "small" }: FlagProps) {
  const code = getFlagCode(team);

  if (!code) return null;

  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      alt={team}
      className={`inline-block rounded-sm object-cover mr-2 ${sizeMap[size]}`}
    />
  );
}
