"use client"

import { useState } from "react"
import { enqueueTestJobAction } from "@/lib/actions/enqueue-test-job"
import { TextInput } from "@astryxdesign/core/TextInput"
import { Button } from "@astryxdesign/core/Button"
import { HStack } from "@astryxdesign/core/HStack"

export function EnqueueTestJobForm() {
  const [message, setMessage] = useState("")

  return (
    <form action={enqueueTestJobAction}>
      <HStack gap={2} align="end">
        <TextInput label="Message" htmlName="message" value={message} onChange={setMessage} />
        <Button type="submit" label="Enqueue" variant="primary" />
      </HStack>
    </form>
  )
}
