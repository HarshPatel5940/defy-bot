import { z } from "zod";

const DefyUserSchema = z.object({
  walletAddress: z.string(),
  balance: z.object({
    points: z.number(),
    totalPointsEarned: z.number(),
  }),
  connections: z
    .array(
      z.object({
        id: z.string(),
        provider: z.string(),
        email: z.string().email(),
        name: z.string(),
      }),
    )
    .optional(),
});

export type DefyUser = z.infer<typeof DefyUserSchema>;
