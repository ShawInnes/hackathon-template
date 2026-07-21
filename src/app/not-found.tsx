import NextLink from "next/link"
import { Center } from "@astryxdesign/core/Center"
import { VStack } from "@astryxdesign/core/VStack"
import { Heading } from "@astryxdesign/core/Heading"
import { Text } from "@astryxdesign/core/Text"
import { Link } from "@astryxdesign/core/Link"

export default function NotFound() {
  return (
    <Center height="60vh">
      <VStack gap={4} align="center">
        <Heading level={1} type="display-2" justify="center">
          404
        </Heading>
        <Text color="secondary" justify="center">
          Page not found
        </Text>
        <Link as={NextLink} href="/" isStandalone>
          Back home
        </Link>
      </VStack>
    </Center>
  )
}
