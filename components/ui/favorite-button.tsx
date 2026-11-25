"use client";

import { Star } from "lucide-react";
import { useOptionalRegion } from "@/components/providers/region-provider";
import { useFavorites } from "@/components/providers/favorite-provider";
import { useToast } from "@/components/providers/toast-provider";

export function FavoriteButton({ toolId, toolName }: { toolId: string; toolName: string }) {
  const { isFavorite, toggle } = useFavorites();
  const { push } = useToast();
  const region = useOptionalRegion();
  const active = isFavorite(toolId);
  const en = region === "US";

  return (
    <button
      type="button"
      className="relative z-10 rounded-full p-2 text-muted transition-colors duration-150 hover:bg-info hover:text-primary"
      aria-pressed={active}
      aria-label={
        en
          ? active
            ? `Remove ${toolName} from favorites`
            : `Add ${toolName} to favorites`
          : active
            ? `${toolName} 즐겨찾기 해제`
            : `${toolName} 즐겨찾기`
      }
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const nowFav = toggle(toolId);
        push(
          en
            ? nowFav
              ? "Saved to favorites."
              : "Removed from favorites."
            : nowFav
              ? "즐겨찾기에 저장했습니다."
              : "즐겨찾기를 해제했습니다.",
        );
      }}
    >
      <Star className={`size-4 ${active ? "fill-primary text-primary" : ""}`} />
    </button>
  );
}
