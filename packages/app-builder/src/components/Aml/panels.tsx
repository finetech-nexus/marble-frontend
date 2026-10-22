import { bankAmlRequestFn } from '@app-builder/server-fns/bank-aml';
import { useServerFn } from '@tanstack/react-start';
import { useEffect, useState } from 'react';
import { Button, Input, Tag, Typo } from 'ui-design-system';

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
    <div className="flex h-full flex-col gap-lg lg:flex-row">
      <form
        className="bg-surface-card border-grey-border flex w-full shrink-0 flex-col gap-sm overflow-y-auto rounded-lg border p-md lg:w-1/4"
        onSubmit={(event) => {
          event.preventDefault();
          void call('/searches', 'POST', {
            ...form,
            identifiers: form.identifiers ? form.identifiers.split(',').map((item) => item.trim()) : [],
          });
        }}
      >
        <Input
          placeholder="Nom ou dénomination"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <Input
          placeholder="Alias"
          value={form.alias}
          onChange={(event) => setForm({ ...form, alias: event.target.value })}
        />
        <Input
          placeholder="Date de naissance ou de création"
          value={form.birthDate}
          onChange={(event) => setForm({ ...form, birthDate: event.target.value })}
        />
        <Input
          placeholder="Nationalité"
          value={form.nationality}
          onChange={(event) => setForm({ ...form, nationality: event.target.value })}
        />
        <Input
          placeholder="Pays"
          value={form.country}
          onChange={(event) => setForm({ ...form, country: event.target.value })}
        />
        <Input
          placeholder="Identifiants, séparés par des virgules"
          value={form.identifiers}
          onChange={(event) => setForm({ ...form, identifiers: event.target.value })}
        />
        <Input
          placeholder="Référence client"
          value={form.clientRef}
          onChange={(event) => setForm({ ...form, clientRef: event.target.value })}
        />
        <Input
          placeholder="Motif de qualification"
          value={form.reason}
          onChange={(event) => setForm({ ...form, reason: event.target.value })}
        />
        <select
          className="border-grey-border bg-surface-card rounded-sm border p-2"
          value={form.entityType}
          onChange={(event) => setForm({ ...form, entityType: event.target.value })}
        >
          <option>Person</option>
          <option>Organization</option>
          <option>Thing</option>
        </select>
        <div className="flex gap-sm">
          <Button type="submit">Rechercher</Button>
          <Button type="button" variant="secondary" onClick={() => void call('/searches', 'GET')}>
            Historique
          </Button>
        </div>
      </form>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-md">
          {matches.map((match) => (
            <article key={match.id} className="bg-surface-card border-grey-border rounded-lg border p-md">
              <div className="flex items-center justify-between gap-sm">
                <Typo variant="text">{match.entityName}</Typo>
                <Tag size="small" color="purple">
                  {match.qualification || 'to_review'}
                </Tag>
              </div>
              <Typo variant="text">
                {match.entityType} · {match.entityId} · score {match.score}
              </Typo>
              <div className="mt-sm flex flex-wrap gap-sm">
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
          <pre className="bg-surface-card border-grey-border mt-md overflow-auto rounded-lg border p-md text-xs whitespace-pre-wrap">
            {output}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

export function BankCasesPanel() {
  const { call, cases } = useBankAml();

  useEffect(() => {
    void call('/cases', 'GET');
  }, []);

  return (
    <div className="bg-surface-card border-grey-border overflow-auto rounded-lg border">
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="p-sm">Client</th>
            <th className="p-sm">Statut</th>
            <th className="p-sm">Priorité</th>
            <th className="p-sm">Scénario</th>
          </tr>
        </thead>
        <tbody>
          {cases.length === 0 ? (
            <tr>
              <td className="p-md" colSpan={4}>
                <Typo variant="text">Aucun dossier AML.</Typo>
              </td>
            </tr>
          ) : (
            cases.map((item) => (
              <tr key={item.id} className="border-grey-border border-t">
                <td className="p-sm">{item.clientRef}</td>
                <td className="p-sm">
                  <Tag size="small" color="purple">
                    {item.status}
                  </Tag>
                </td>
                <td className="p-sm">{item.priority}</td>
                <td className="p-sm">{item.scenario}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
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
