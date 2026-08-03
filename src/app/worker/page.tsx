import { auth } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import { env } from "@/lib/env"
import { PageLayout } from "@/components/page-layout"
import { getQueueStats, getRecentJobs, jobStatus, type JobRow } from "@/lib/jobs/status"
import { EnqueueTestJobForm } from "@/components/enqueue-test-job-form"
import { Card } from "@astryxdesign/core/Card"
import { Heading } from "@astryxdesign/core/Heading"
import { Text } from "@astryxdesign/core/Text"
import { VStack } from "@astryxdesign/core/VStack"
import { HStack } from "@astryxdesign/core/HStack"
import { Table, proportional } from "@astryxdesign/core/Table"

interface JobTableRow extends Record<string, unknown> {
  id: string
  task: string
  status: string
  attempts: string
  runAt: string
  lastError: string
}

function toTableRow(job: JobRow): JobTableRow {
  return {
    id: job.id,
    task: job.taskIdentifier,
    status: jobStatus(job),
    attempts: `${job.attempts}/${job.maxAttempts}`,
    runAt: job.runAt.toLocaleString(),
    lastError: job.lastError ?? "—",
  }
}

export default async function WorkerStatusPage() {
  if (!env.ENABLE_WORKER) {
    notFound()
  }

  const session = await auth()

  if (!session?.user) {
    redirect("/signin")
  }

  const [stats, jobs] = await Promise.all([getQueueStats(), getRecentJobs()])

  return (
    <PageLayout user={session.user}>
      <VStack gap={6}>
        <VStack gap={2}>
          <Heading level={1}>Worker Status</Heading>
          <Text color="secondary">
            Live queue state from Graphile Worker. Completed jobs are deleted on success and are not
            shown here.
          </Text>
        </VStack>

        <HStack gap={4}>
          <Card>
            <VStack gap={1}>
              <Text size="sm" weight="medium" color="secondary">
                Pending
              </Text>
              <Heading level={2}>{stats.pending}</Heading>
            </VStack>
          </Card>
          <Card>
            <VStack gap={1}>
              <Text size="sm" weight="medium" color="secondary">
                Running
              </Text>
              <Heading level={2}>{stats.running}</Heading>
            </VStack>
          </Card>
          <Card>
            <VStack gap={1}>
              <Text size="sm" weight="medium" color="secondary">
                Failed
              </Text>
              <Heading level={2}>{stats.failed}</Heading>
            </VStack>
          </Card>
        </HStack>

        <Card>
          <VStack gap={4}>
            <Heading level={2}>Enqueue a test job</Heading>
            <EnqueueTestJobForm />
          </VStack>
        </Card>

        <Card>
          <VStack gap={4}>
            <Heading level={2}>Recent jobs</Heading>
            {jobs.length === 0 ? (
              <Text color="secondary">No pending, running, or failed jobs.</Text>
            ) : (
              <Table
                data={jobs.map(toTableRow)}
                idKey="id"
                columns={[
                  { key: "task", header: "Task", width: proportional(2) },
                  { key: "status", header: "Status", width: proportional(1) },
                  { key: "attempts", header: "Attempts", width: proportional(1) },
                  { key: "runAt", header: "Run at", width: proportional(2) },
                  { key: "lastError", header: "Last error", width: proportional(3) },
                ]}
                dividers="rows"
                isStriped
              />
            )}
          </VStack>
        </Card>
      </VStack>
    </PageLayout>
  )
}
