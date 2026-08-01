"use client"

import { useEffect } from "react"
import { getLogger } from "@logtape/logtape"
import { Center } from "@astryxdesign/core/Center"
import { VStack } from "@astryxdesign/core/VStack"
import { Heading } from "@astryxdesign/core/Heading"
import { Text } from "@astryxdesign/core/Text"
import { Button } from "@astryxdesign/core/Button"

const logger = getLogger(["app", "ui"])

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error("Route error: {message}", { message: error.message, digest: error.digest })
  }, [error])

  return (
    <Center height="60vh">
      <VStack gap={4} align="center">
        <Heading level={2} justify="center">
          Something went wrong
        </Heading>
        <Text color="secondary" size="sm" justify="center">
          {error.message || "An unexpected error occurred."}
        </Text>
        {error.digest && (
          <Text color="secondary" type="code" size="2xs" justify="center">
            ref: {error.digest}
          </Text>
        )}
        <Button label="Try again" onClick={reset} />
      </VStack>
    </Center>
  )
}
