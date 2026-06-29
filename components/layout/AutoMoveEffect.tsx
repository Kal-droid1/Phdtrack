"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AutoMoveEffect() {
  useEffect(() => {
    async function runAutoMove() {
      try {
        const today = new Date().toISOString().slice(0, 10);

        await supabase
          .from("applications")
          .update({ status: "Awaiting Result" })
          .eq("status", "Applied")
          .eq("archived", false)
          .lt("deadline", today);
      } catch {
        // silent — auto-move is best-effort
      }
    }

    runAutoMove();
  }, []);

  return null;
}
