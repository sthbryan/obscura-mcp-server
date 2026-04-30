import { z } from "zod";

export const queryInputSchema = z.object({
  url: z.string().url("Invalid URL"),
  selector: z.string().optional(),
  text: z.string().optional(),
});

export type QueryInput = z.infer<typeof queryInputSchema>;

export interface QueryResult {
  url: string;
  selector?: string;
  text?: string;
  result: string;
  timestamp: string;
}
