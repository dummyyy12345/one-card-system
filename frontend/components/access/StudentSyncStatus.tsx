"use client";

import { useCallback, useState } from "react";
import apiClient from "@/store/apiClient";
import { reportError } from "@/lib/errorReporter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Job = {
  ID: number;
  device_id: number;
  status: "pending" | "succeeded" | "failed" | "cancelled";
  attempts: number;
  synced_at: string | null;
  next_attempt_at: string;
};

export default function StudentSyncStatus({
  studentId,
}: {
  studentId: number;
}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await apiClient.get<{ data: Job[] }>(
        `/api/v1/registrar/student/${studentId}/sync`
      );
      setJobs(response.data.data);
      setError("");
    } catch (cause) {
      reportError("student.syncStatus", cause);
      setError("Could not load device status.");
    }
  }, [studentId]);

  async function retry() {
    setBusy(true);
    try {
      await apiClient.post(`/api/v1/registrar/student/${studentId}/sync/retry`);
      await load();
    } catch (cause) {
      reportError("student.syncRetry", cause);
      setError("Could not queue a retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Device sync
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Device synchronization</DialogTitle>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-red-600">
            {error}
          </p>
        )}
        {jobs.length === 0 ? (
          <p>No device deliveries queued.</p>
        ) : (
          <ul className="space-y-2">
            {jobs.map((job) => (
              <li key={job.ID}>
                Device {job.device_id}: {job.status} · {job.attempts} attempts
              </li>
            ))}
          </ul>
        )}
        <Button
          onClick={() => void retry()}
          disabled={
            busy ||
            !jobs.some(
              (job) => job.status === "failed" || job.status === "cancelled"
            )
          }
        >
          {busy ? "Queuing…" : "Retry failed deliveries"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
