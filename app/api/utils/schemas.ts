import { z } from "zod";

export const ZDecisionSchema = z.object({
  decision: z.boolean(),
});

export type DecisionSchema = z.infer<typeof ZDecisionSchema>;

export type Status = "not-started" | "in-progress" | "success" | "error";
