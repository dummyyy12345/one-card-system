"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import apiClient from "@/store/apiClient";
import { reportError } from "@/lib/errorReporter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Policy = {
  location: string;
  enabled: boolean;
  require_assignment: boolean;
  start_minute: number;
  end_minute: number;
  weekdays: string;
  version: number;
};
type Exception = {
  id: number;
  student_id: number;
  location: string;
  expires_at: string;
  reason: string;
};
type Operations = {
  device_jobs: { status: string; count: number }[];
  device_status: {
    device_id: number;
    name: string;
    location: string;
    out_of_sync: number;
    missing_jobs: number;
    last_confirmed_at: string | null;
  }[];
  source_sync: {
    last_success_at: string | null;
    last_failure_at: string | null;
  };
};
type View = {
  id: number;
  student_id: number;
  actor_id: number;
  viewed_at: string;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const locations = ["gate", "cafeteria", "dormitory", "library"];
function clock(minutes: number) {
  if (minutes === 1440) return "23:59";
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
function minute(time: string) {
  if (time === "23:59") return 1440;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export default function AccessRulesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [operations, setOperations] = useState<Operations | null>(null);
  const [views, setViews] = useState<View[]>([]);
  const [studentId, setStudentId] = useState("");
  const [location, setLocation] = useState("gate");
  const [expiresAt, setExpiresAt] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [
        policyResponse,
        exceptionResponse,
        operationsResponse,
        viewsResponse,
      ] = await Promise.all([
        apiClient.get<{ data: Policy[] }>("/api/v1/admin/access/policies"),
        apiClient.get<{ data: Exception[] }>("/api/v1/admin/access/exceptions"),
        apiClient.get<{ data: Operations }>("/api/v1/admin/access/operations"),
        apiClient.get<{ data: View[] }>("/api/v1/admin/access/student-views"),
      ]);
      setPolicies(policyResponse.data.data);
      setExceptions(exceptionResponse.data.data);
      setOperations(operationsResponse.data.data);
      setViews(viewsResponse.data.data);
      setError("");
    } catch (cause) {
      reportError("access.admin.load", cause);
      setError("Could not load access administration.");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  function editPolicy(locationName: string, patch: Partial<Policy>) {
    setPolicies((current) =>
      current.map((policy) =>
        policy.location === locationName ? { ...policy, ...patch } : policy
      )
    );
  }
  async function savePolicy(policy: Policy) {
    setBusy(true);
    try {
      await apiClient.put(
        `/api/v1/admin/access/policies/${policy.location}`,
        policy
      );
      setNotice(`${policy.location} policy saved.`);
      await load();
    } catch (cause) {
      reportError("access.admin.policy", cause);
      setError("Could not save policy.");
    } finally {
      setBusy(false);
    }
  }
  async function addException(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await apiClient.post("/api/v1/admin/access/exceptions", {
        student_id: Number(studentId),
        location,
        expires_at: new Date(expiresAt).toISOString(),
        reason: reason.trim(),
      });
      setStudentId("");
      setReason("");
      setExpiresAt("");
      setNotice("Temporary exception granted.");
      await load();
    } catch (cause) {
      reportError("access.admin.exception", cause);
      setError(
        "Could not grant exception. Check the student ID, reason, and expiry."
      );
    } finally {
      setBusy(false);
    }
  }
  async function revokeException(id: number) {
    setBusy(true);
    try {
      await apiClient.delete(`/api/v1/admin/access/exceptions/${id}`);
      setNotice("Exception revoked.");
      await load();
    } catch (cause) {
      reportError("access.admin.revoke", cause);
      setError("Could not revoke exception.");
    } finally {
      setBusy(false);
    }
  }

  async function reconcileDevice(id: number) {
    setBusy(true);
    try {
      await apiClient.post(`/api/v1/admin/access/devices/${id}/reconcile`);
      setNotice(`Device ${id} reconciliation queued.`);
      await load();
    } catch (cause) {
      reportError("access.admin.reconcile", cause);
      setError("Could not queue device reconciliation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="space-y-8 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Access rules and operations</h1>
        <p className="text-sm text-muted-foreground">
          Hours use UTC. Changes apply to new decisions and keep a versioned
          audit trail.
        </p>
      </header>
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-green-700">
          {notice}
        </p>
      )}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Location policies</h2>
        {policies.map((policy) => (
          <div
            className="rounded-lg border p-4 space-y-3"
            key={policy.location}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold capitalize">{policy.location}</h3>
              <span className="text-sm">
                Version {policy.version || "default"}
              </span>
            </div>
            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={policy.enabled}
                  onChange={(e) =>
                    editPolicy(policy.location, { enabled: e.target.checked })
                  }
                />{" "}
                Open
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={policy.require_assignment}
                  onChange={(e) =>
                    editPolicy(policy.location, {
                      require_assignment: e.target.checked,
                    })
                  }
                />{" "}
                Require assignment
              </label>
              <label className="flex items-center gap-2">
                From{" "}
                <Input
                  aria-label={`${policy.location} start time UTC`}
                  type="time"
                  value={clock(policy.start_minute)}
                  onChange={(e) =>
                    editPolicy(policy.location, {
                      start_minute: minute(e.target.value),
                    })
                  }
                />
              </label>
              <label className="flex items-center gap-2">
                Until{" "}
                <Input
                  aria-label={`${policy.location} end time UTC`}
                  type="time"
                  value={clock(policy.end_minute)}
                  onChange={(e) =>
                    editPolicy(policy.location, {
                      end_minute: minute(e.target.value),
                    })
                  }
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              {weekdays.map((day, index) => (
                <label className="flex items-center gap-1" key={day}>
                  <input
                    type="checkbox"
                    checked={policy.weekdays[index] === "1"}
                    onChange={(e) =>
                      editPolicy(policy.location, {
                        weekdays:
                          policy.weekdays.substring(0, index) +
                          (e.target.checked ? "1" : "0") +
                          policy.weekdays.substring(index + 1),
                      })
                    }
                  />
                  {day}
                </label>
              ))}
            </div>
            <Button disabled={busy} onClick={() => void savePolicy(policy)}>
              Save {policy.location} policy
            </Button>
          </div>
        ))}
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Temporary assignment exceptions
        </h2>
        <p className="text-sm text-muted-foreground">
          Exceptions expire within 30 days. They cannot override an inactive
          student or closed hours.
        </p>
        <form
          onSubmit={addException}
          className="flex flex-wrap items-end gap-3"
        >
          <label>
            Student record ID
            <Input
              aria-label="Student record ID"
              type="number"
              min="1"
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </label>
          <label>
            Location
            <select
              className="block rounded border p-2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              {locations.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Expires at
            <Input
              aria-label="Exception expiry"
              type="datetime-local"
              required
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </label>
          <label>
            Reason
            <Input
              aria-label="Exception reason"
              required
              minLength={5}
              maxLength={255}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <Button disabled={busy} type="submit">
            Grant exception
          </Button>
        </form>
        <ul className="space-y-2">
          {exceptions.map((item) => (
            <li
              className="flex flex-wrap items-center gap-3 rounded border p-2"
              key={item.id}
            >
              Student {item.student_id} · {item.location} · until{" "}
              {new Date(item.expires_at).toLocaleString()} · {item.reason}
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void revokeException(item.id)}
              >
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Operations</h2>
        <Button variant="outline" onClick={() => void load()}>
          Refresh status
        </Button>
        <p>
          Student source last success:{" "}
          {operations?.source_sync.last_success_at
            ? new Date(operations.source_sync.last_success_at).toLocaleString()
            : "Never recorded"}
        </p>
        <p>
          Student source last failure:{" "}
          {operations?.source_sync.last_failure_at
            ? new Date(operations.source_sync.last_failure_at).toLocaleString()
            : "None recorded"}
        </p>
        <ul>
          {operations?.device_jobs.map((job) => (
            <li key={job.status}>
              {job.status}: {job.count} device deliveries
            </li>
          ))}
        </ul>
        <h3 className="font-semibold">Device delivery status</h3>
        <p className="text-sm text-muted-foreground">
          Out of sync counts reflect queued or failed deliveries. Reconcile
          reasserts the desired student state to a device.
        </p>
        <ul className="space-y-2">
          {operations?.device_status?.map((device) => (
            <li
              className="flex flex-wrap items-center gap-3 rounded border p-2"
              key={device.device_id}
            >
              <span>
                {device.name} ({device.location}): {device.out_of_sync} out of
                sync, {device.missing_jobs} missing jobs
              </span>
              <span>
                Last confirmed:{" "}
                {device.last_confirmed_at
                  ? new Date(device.last_confirmed_at).toLocaleString()
                  : "Never"}
              </span>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void reconcileDevice(device.device_id)}
              >
                Reconcile
              </Button>
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Recent student detail views</h2>
        <ul>
          {views.map((view) => (
            <li key={view.id}>
              Student {view.student_id} · user {view.actor_id} ·{" "}
              {new Date(view.viewed_at).toLocaleString()}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
