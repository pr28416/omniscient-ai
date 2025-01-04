import { z } from "zod";

export const ZDecisionSchema = z.object({
  decision: z.boolean(),
});

export type DecisionSchema = z.infer<typeof ZDecisionSchema>;
