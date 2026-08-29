"use client";

import { useEffect } from "react";
import { pushRecentTool } from "@/lib/storage/local";

export function TrackRecentTool({ id }: { id: string }) {
  useEffect(() => {
    pushRecentTool(id);
  }, [id]);
  return null;
}
