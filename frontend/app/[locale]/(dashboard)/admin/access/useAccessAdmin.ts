"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import apiClient from "@/store/apiClient";
import { reportError } from "@/lib/errorReporter";

export type Policy = {
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

export function useAccessAdmin() {
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

  return {
    policies,
    exceptions,
    operations,
    views,
    studentId,
    setStudentId,
    location,
    setLocation,
    expiresAt,
    setExpiresAt,
    reason,
    setReason,
    error,
    notice,
    busy,
    load,
    editPolicy,
    savePolicy,
    addException,
    revokeException,
    reconcileDevice,
  };
}
