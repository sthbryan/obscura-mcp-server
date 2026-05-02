import { z } from "zod";

export const fetchInputSchema = z.object({
  url: z.string().url(),
  type: z.enum(["html", "markdown", "text"]).default("markdown"),
  source: z.enum(["obscura", "native"]).optional(),
});
