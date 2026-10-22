import { bankAmlRequestFn } from '@app-builder/server-fns/bank-aml';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Button, Typo } from 'ui-design-system';

type MatchView = {
  id: string;
  entityName: string;
  entityType: string;
  entityId: string;
  score: string;
  qualification: string;
};

type CaseView = {
  id: string;
  clientRef: string;
  status: string;
  priority: string;
  scenario: string;
};

function textField(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return value == null ? '' : String(value);
}

function readMatches(body: string): MatchView[] {
  if (!body) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return [];
  }
  if (!parsed || typeof parsed !== 'object') return [];
  const matches = (parsed as Record<string, unknown>)['matches'];
  if (!Array.isArray(matches)) return [];
  return matches.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const id = textField(record, 'id');
    if (!id) return [];
    return [
      {
        id,
        entityName: textField(record, 'entity_name'),
        entityType: textField(record, 'entity_type'),
        entityId: textField(record, 'entity_id'),
        score: textField(record, 'score') || 'n/a',
        qualification: textField(record, 'qualification'),
      },
    ];
  });
}

function readCases(body: string): CaseView[] {
  if (!body) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return [];
  }
  const rows = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)['cases']
      : [];
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const id = textField(record, 'id');
    if (!id) return [];
    return [
      {
        id,
        clientRef: textField(record, 'client_ref'),
        status: textField(record, 'status'),
        priority: textField(record, 'priority'),
        scenario: textField(record, 'scenario_code'),
      },
    ];
  });
}

function useBankAml() {
  const request = useServerFn(bankAmlRequestFn);
  const [output, setOutput] = useState('');
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [cases, setCases] = useState<CaseView[]>([]);

  async function call(path: string, method: 'GET' | 'POST', body?: unknown) {
    const result = await request({ data: { path, method, body } });
    const found = readMatches(result.body);
    if (found.length > 0) setMatches(found);
    const foundCases = readCases(result.body);
    if (foundCases.length > 0) setCases(foundCases);
    try {
      setOutput(result.body ? JSON.stringify(JSON.parse(result.body), null, 2) : '');
    } catch {
      setOutput(result.body);
    }
    return result;
  }

  return { call, output, matches, cases };
}

export function BankScreeningPanel({
  initial,
}: {
  initial?: {
    name?: string;
    entityType?: string;
    birthDate?: string;
    nationality?: string;
    country?: string;
    clientRef?: string;
  };
}) {
  const { call, output, matches } = useBankAml();
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    alias: '',
    entityType: initial?.entityType ?? 'Person',
    birthDate: initial?.birthDate ?? '',
    nationality: initial?.nationality ?? '',
    country: initial?.country ?? '',
    identifiers: '',
    clientRef: initial?.clientRef ?? '',
    reason: '',
  });

  return (
    <form
      className="grid max-w-xl gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void call('/searches', 'POST', {
          ...form,
          identifiers: form.identifiers ? form.identifiers.split(',').map((item) => item.trim()) : [],
        });
      }}
    >
      <input
        className="border rounded p-2"
        placeholder="Nom ou dénomination"
        value={form.name}
        onChange={(event) => setForm({ ...form, name: event.target.value })}
      />
      <input
        className="border rounded p-2"
        placeholder="Alias"
        value={form.alias}
        onChange={(event) => setForm({ ...form, alias: event.target.value })}
      />
      <input
        className="border rounded p-2"
        placeholder="Date de naissance ou de création"
        value={form.birthDate}
        onChange={(event) => setForm({ ...form, birthDate: event.target.value })}
      />
      <input
        className="border rounded p-2"
        placeholder="Nationalité"
        value={form.nationality}
        onChange={(event) => setForm({ ...form, nationality: event.target.value })}
      />
      <input
        className="border rounded p-2"
        placeholder="Pays"
        value={form.country}
        onChange={(event) => setForm({ ...form, country: event.target.value })}
      />
      <input
        className="border rounded p-2"
        placeholder="Identifiants, séparés par des virgules"
        value={form.identifiers}
        onChange={(event) => setForm({ ...form, identifiers: event.target.value })}
      />
      <input
        className="border rounded p-2"
        placeholder="Référence client"
        value={form.clientRef}
        onChange={(event) => setForm({ ...form, clientRef: event.target.value })}
      />
      <input
        className="border rounded p-2"
        placeholder="Motif de qualification"
        value={form.reason}
        onChange={(event) => setForm({ ...form, reason: event.target.value })}
      />
      <select
        className="border rounded p-2"
        value={form.entityType}
        onChange={(event) => setForm({ ...form, entityType: event.target.value })}
      >
        <option>Person</option>
        <option>Organization</option>
        <option>Thing</option>
      </select>
      <div className="flex gap-2">
        <Button type="submit">Rechercher</Button>
        <Button type="button" variant="secondary" onClick={() => void call('/searches', 'GET')}>
          Historique
        </Button>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {matches.map((match) => (
          <article key={match.id} className="rounded border p-3">
            <div className="font-medium">{match.entityName}</div>
            <div className="text-sm">
              {match.entityType} · {match.entityId} · score {match.score} · {match.qualification}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                ['to_review', 'À examiner'],
                ['in_analysis', 'En cours'],
                ['dismissed', 'Écarter'],
                ['confirmed', 'Confirmer'],
                ['escalate', 'Escalader'],
              ].map(([status, label]) => (
                <Button
                  key={status}
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    void call(`/matches/${match.id}/qualification`, 'POST', {
                      status,
                      reason: form.reason,
                    })
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
          </article>
        ))}
      </div>
      {output ? (
        <pre className="mt-4 overflow-auto rounded border p-3 text-xs whitespace-pre-wrap">{output}</pre>
      ) : null}
    </form>
  );
}

export function BankCasesPanel() {
  const { call, cases } = useBankAml();

  return (
    <div className="flex flex-col gap-md">
      <div>
        <Button onClick={() => void call('/cases', 'GET')}>Charger les dossiers</Button>
      </div>
      {cases.length > 0 ? (
        cases.map((item) => (
          <article key={item.id} className="rounded border p-3">
            <div className="font-medium">{item.clientRef}</div>
            <div className="text-sm">
              {item.status} · {item.priority} · {item.scenario}
            </div>
          </article>
        ))
      ) : (
        <Typo variant="text">Aucun dossier chargé.</Typo>
      )}
    </div>
  );
}

export function BankBatchPanel() {
  const { call, output } = useBankAml();
  return (
    <div className="flex flex-col gap-md">
      <Button
        onClick={() =>
          void call('/batches', 'POST', {
            mode: 'initial',
            chunk_size: 25,
            clients: [],
          })
        }
      >
        Lancer un batch initial
      </Button>
      {output ? <pre className="overflow-auto rounded border p-3 text-xs whitespace-pre-wrap">{output}</pre> : null}
    </div>
  );
}

export function BankScorePanel() {
  const { call, output } = useBankAml();
  const [clientRef, setClientRef] = useState('');
  return (
    <div className="flex max-w-xl flex-col gap-md">
      <input
        className="border rounded p-2"
        placeholder="Référence client"
        value={clientRef}
        onChange={(event) => setClientRef(event.target.value)}
      />
      <Button
        onClick={() =>
          void call('/scores', 'POST', {
            reason: 'manual',
            client: { client_ref: clientRef, name: clientRef, profile: {} },
            matches: [],
          })
        }
      >
        Calculer le score
      </Button>
      {output ? <pre className="overflow-auto rounded border p-3 text-xs whitespace-pre-wrap">{output}</pre> : null}
    </div>
  );
}
