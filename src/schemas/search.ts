import { z } from "zod";

export const searchInputSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(20).optional().default(10),
  source: z.enum(["obscura", "native"]).optional(),
});
