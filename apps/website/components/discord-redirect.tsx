"use client";

import { useEffect } from "react";
import { DISCORD_URL } from "@/lib/site";

export function DiscordRedirect() {
  useEffect(() => {
    window.location.replace(DISCORD_URL);
  }, []);

  return null;
}
