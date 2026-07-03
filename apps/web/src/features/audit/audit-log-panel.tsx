'use client';

import { useEffect, useState } from 'react';

import type { AuditLogRecord } from '@vms/shared';

import { EmptyState } from '@/components/ui/empty-state';
import { ApiClientError } from '@/lib/api/http';

import { listAuditLogs } from './api';

type AuditLogPanelProps = {
  readonly entityType: string;
  readonly entityId: string;
  readonly title?: string;
};

export function AuditLogPanel({
  entityType,
  entityId,
  title = 'Recent activity',
}: AuditLogPanelProps) {
  const [auditLogs, setAuditLogs] = useState<readonly AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAuditLogs() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await listAuditLogs({
          entityType,
          entityId,
          page: 1,
          pageSize: 5,
          sortDirection: 'desc',
        });

        if (isMounted) {
          setAuditLogs(result.data);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof ApiClientError
              ? caughtError.message
              : 'Unable to load audit activity.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadAuditLogs();

    return () => {
      isMounted = false;
    };
  }, [entityId, entityType]);

  return (
    <section className="rounded-lg border border-line bg-panel shadow-panel">
      <div className="border-b border-line px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-harbor">Audit trail</p>
        <h2 className="mt-1 text-lg font-semibold text-ink">{title}</h2>
      </div>

      {isLoading ? (
        <p className="px-5 py-6 text-sm text-steel">Loading recent activity...</p>
      ) : null}

      {!isLoading && error ? (
        <div className="m-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && auditLogs.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title="No audit activity yet"
            description="Changes to this record will appear here once users create, update, or remove linked operational data."
          />
        </div>
      ) : null}

      {!isLoading && !error && auditLogs.length > 0 ? (
        <ol className="divide-y divide-line">
          {auditLogs.map((auditLog) => (
            <li key={auditLog.id} className="px-5 py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">{formatAuditAction(auditLog)}</p>
                  <p className="mt-1 text-xs text-steel">{formatAuditSource(auditLog.metadata)}</p>
                </div>
                <time className="text-xs text-steel" dateTime={auditLog.createdAt}>
                  {formatDateTime(auditLog.createdAt)}
                </time>
              </div>
              {formatStatusChange(auditLog) ? (
                <p className="mt-2 rounded-md bg-surface px-3 py-2 text-xs text-steel">
                  {formatStatusChange(auditLog)}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

function formatAuditAction(auditLog: AuditLogRecord): string {
  const [, operation = auditLog.action] = auditLog.action.split('.');
  const entityName = auditLog.entityType.replaceAll('_', ' ');

  return `${capitalize(entityName)} ${operation.replaceAll('_', ' ')}`;
}

function formatAuditSource(metadata: unknown): string {
  if (!metadata || typeof metadata !== 'object' || !('source' in metadata)) {
    return 'Recorded by HarbourOS';
  }

  const source = (metadata as { source?: unknown }).source;

  return typeof source === 'string' ? `Recorded by ${source}` : 'Recorded by HarbourOS';
}

function formatStatusChange(auditLog: AuditLogRecord): string | null {
  const beforeStatus = readStatus(auditLog.beforeData);
  const afterStatus = readStatus(auditLog.afterData);

  if (!afterStatus || beforeStatus === afterStatus) {
    return null;
  }

  return beforeStatus
    ? `Status changed from ${beforeStatus} to ${afterStatus}`
    : `Status set to ${afterStatus}`;
}

function readStatus(value: unknown): string | null {
  if (!value || typeof value !== 'object' || !('status' in value)) {
    return null;
  }

  const status = (value as { status?: unknown }).status;

  return typeof status === 'string' ? status.replaceAll('_', ' ') : null;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
