import { z } from "zod"

export const EnqueueTestJobInput = z.object({
  message: z.string().min(1).max(500),
})

export type EnqueueTestJobInput = z.infer<typeof EnqueueTestJobInput>
