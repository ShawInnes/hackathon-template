"use server"

import { revalidatePath } from "next/cache"
import { EnqueueTestJobInput } from "@/lib/schemas/worker"
import { enqueueLogMessage } from "@/lib/jobs/enqueue"

export async function enqueueTestJobAction(formData: FormData) {
  const parsed = EnqueueTestJobInput.safeParse({
    message: formData.get("message"),
  })

  if (!parsed.success) {
    return
  }

  await enqueueLogMessage({ message: parsed.data.message })
  revalidatePath("/worker")
}
