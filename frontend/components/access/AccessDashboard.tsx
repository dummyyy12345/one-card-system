"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import apiClient from "@/store/apiClient";
import { reportError } from "@/lib/errorReporter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AccessLocation = "gate" | "cafeteria" | "dormitory" | "library";

type AccessEvent = {
  id: number;
  created_at: string;
  student_id?: number;
  station: string;
  decision: "allowed" | "denied";
  reason: string;
};

type Decision = {
  decision: "allowed" | "denied";
  reason: string;
  student?: { name: string; student_id: string };
};

const labels: Record<AccessLocation, string> = {
  gate: "Gate",
  cafeteria: "Cafeteria",
  dormitory: "Dormitory",
  library: "Library",
};

export default function AccessDashboard({
  location,
  historyOnly = false,
}: {
  location: AccessLocation;
  historyOnly?: boolean;
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [station, setStation] = useState("");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [events, setEvents] = useState<AccessEvent[]>([]);
  const [summary, setSummary] = useState({ allowed: 0, denied: 0 });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [eventsResponse, summaryResponse] = await Promise.all([
        apiClient.get<{ data: AccessEvent[] }>("/api/v1/access/events", {
          params: { location },
        }),
        apiClient.get<{ data: { allowed: number; denied: number } }>(
          "/api/v1/access/summary",
          { params: { location } }
        ),
      ]);
      setEvents(eventsResponse.data.data);
      setSummary(summaryResponse.data.data);
      setError("");
    } catch (cause) {
      reportError("access.load", cause);
      setError("Could not load access activity. Try refreshing the page.");
    }
  }, [location]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function checkCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cardNumber.trim() || !station.trim()) return;
    setBusy(true);
    setError("");
    setDecision(null);
    try {
      const response = await apiClient.post<Decision>("/api/v1/access/check", {
        card_number: cardNumber.trim(),
        location,
        station: station.trim(),
      });
      setDecision(response.data);
      setCardNumber("");
      await refresh();
    } catch (cause) {
      reportError("access.check", cause);
      setError("Card check failed. No decision was recorded; try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">{labels[location]} access</h1>
        <p className="text-sm text-muted-foreground">
          Decisions below are stored in the access audit trail.
        </p>
      </header>

      {!historyOnly && (
        <form onSubmit={checkCard} className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="station">Station</Label>
            <Input
              id="station"
              value={station}
              onChange={(event) => setStation(event.target.value)}
              required
              maxLength={64}
              placeholder="e.g. North entrance"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="card-number">Card number</Label>
            <Input
              id="card-number"
              value={cardNumber}
              onChange={(event) => setCardNumber(event.target.value)}
              required
              maxLength={128}
              autoComplete="off"
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Checking…" : "Check card"}
          </Button>
        </form>
      )}

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      {decision && (
        <p
          role="status"
          className={
            decision.decision === "allowed" ? "text-green-700" : "text-red-700"
          }
        >
          {decision.decision === "allowed" ? "Access allowed" : "Access denied"}
          {decision.student
            ? ` · ${decision.student.name} (${decision.student.student_id})`
            : ` · ${decision.reason.replaceAll("_", " ")}`}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-sm">Allowed in last 24 hours</p>
          <strong className="text-2xl">{summary.allowed}</strong>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm">Denied in last 24 hours</p>
          <strong className="text-2xl">{summary.denied}</strong>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <caption className="p-3 text-left font-medium">
            Recent access decisions
          </caption>
          <thead className="border-b">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">Station</th>
              <th className="p-3">Decision</th>
              <th className="p-3">Reason</th>
            </tr>
          </thead>
          <tbody>
            {events.map((entry) => (
              <tr key={entry.id} className="border-b last:border-0">
                <td className="p-3">
                  {new Date(entry.created_at).toLocaleString()}
                </td>
                <td className="p-3">{entry.station}</td>
                <td className="p-3 capitalize">{entry.decision}</td>
                <td className="p-3">{entry.reason.replaceAll("_", " ")}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={4} className="p-3">
                  No decisions recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
