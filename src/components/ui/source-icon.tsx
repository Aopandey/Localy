import { UsersRound, Hash, MessageCircle, Send } from "lucide-react";
import type { Source } from "@/lib/types";
export function SourceIcon({
  source,
  small = false,
}: {
  source: Source;
  small?: boolean;
}) {
  const Icon =
    source === "Facebook Group"
      ? UsersRound
      : source === "Reddit"
        ? MessageCircle
        : source === "Discord"
          ? Hash
          : Send;
  return (
    <span
      className={`source-icon source-${source.split(" ")[0].toLowerCase()} ${small ? "source-small" : ""}`}
    >
      <Icon size={small ? 14 : 18} />
    </span>
  );
}
