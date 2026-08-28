"use client";

import { useEffect } from "react";
import { pushRecentArticle } from "@/lib/storage/local";

export function TrackRecentArticle({ id }: { id: string }) {
  useEffect(() => {
    pushRecentArticle(id);
  }, [id]);
  return null;
}
