"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AutoMoveEffect() {
  useEffect(() => {
    async function runAutoMove() {
      try {
        const today = new Date().toISOString().slice(0, 10);

        const { error } = await supabase
          .from("applications")
          .update({ status: "Awaiting Result" })
          .eq("status", "Applied")
          .eq("archived", false)
          .lt("deadline", today);

        if (error) {
          console.error("Auto-move failed:", error);
        }
      } catch {
        // silent — auto-move is best-effort
      }
    }

    runAutoMove();
  }, []);

  return null;
}
