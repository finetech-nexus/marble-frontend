import { Page } from '@app-builder/components';
import { bankAmlRequestFn } from '@app-builder/server-fns/bank-aml';
import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useEffect, useState } from 'react';
import { Button } from 'ui-design-system';
import { z } from 'zod/v4';

const searchSchema = z.object({
  name: z.string().optional(),
  entityType: z.string().optional(),
  birthDate: z.string().optional(),
  nationality: z.string().optional(),
  country: z.string().optional(),
  clientRef: z.string().optional(),
  section: z.string().optional(),
});

export const Route = createFileRoute('/_app/_builder/aml')({
  validateSearch: searchSchema,
  component: AmlPage,
});

const sections = ['screening', 'cases', 'batch', 'score', 'settings', 'scenarios', 'audit'] as const;

function AmlPage() {
  const initial = Route.useSearch();
  const request = useServerFn(bankAmlRequestFn);
  const [section, setSection] = useState<(typeof sections)[number]>('screening');
  const [output, setOutput] = useState('Les fonctions AML de cette page sont indépendantes de la licence Marble.');
  const [matches, setMatches] = useState<Array<Record<string, unknown>>>([]);
  const [form, setForm] = useState({
    name: initial.name ?? '',
    alias: '',
    entityType: initial.entityType ?? 'Person',
    birthDate: initial.birthDate ?? '',
    nationality: initial.nationality ?? '',
    country: initial.country ?? '',
    identifiers: '',
    clientRef: initial.clientRef ?? '',
    reason: '',
  });

  useEffect(() => {
    if (initial.section && sections.includes(initial.section as (typeof sections)[number])) {
      setSection(initial.section as (typeof sections)[number]);
    }
  }, [initial.section]);

  async function call(path: string, method: 'GET' | 'POST', body?: unknown) {
    const result = await request({ data: { path, method, body } });
    const payload = result.body as { matches?: Array<Record<string, unknown>> } | null;
    if (payload?.matches) setMatches(payload.matches);
    setOutput(JSON.stringify(result.body, null, 2));
    return result;
  }

  return (
    <Page.Main>
      <Page.Header>
        <h1 className="text-2xl font-semibold">AML / LCB-FT</h1>
      </Page.Header>
      <Page.Content>
        <div className="flex flex-wrap gap-2 mb-4">
          {sections.map((item) => (
            <Button key={item} variant={item === section ? 'primary' : 'secondary'} onClick={() => setSection(item)}>
              {item}
            </Button>
          ))}
        </div>
        {section === 'screening' ? (
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
            <input className="border rounded p-2" placeholder="Nom ou dénomination" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <input className="border rounded p-2" placeholder="Alias" value={form.alias} onChange={(event) => setForm({ ...form, alias: event.target.value })} />
            <input className="border rounded p-2" placeholder="Date de naissance ou de création" value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} />
            <input className="border rounded p-2" placeholder="Nationalité" value={form.nationality} onChange={(event) => setForm({ ...form, nationality: event.target.value })} />
            <input className="border rounded p-2" placeholder="Pays" value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
            <input className="border rounded p-2" placeholder="Identifiants, séparés par des virgules" value={form.identifiers} onChange={(event) => setForm({ ...form, identifiers: event.target.value })} />
            <input className="border rounded p-2" placeholder="Référence client" value={form.clientRef} onChange={(event) => setForm({ ...form, clientRef: event.target.value })} />
            <input className="border rounded p-2" placeholder="Motif de qualification" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
            <select className="border rounded p-2" value={form.entityType} onChange={(event) => setForm({ ...form, entityType: event.target.value })}>
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
                <article key={String(match.id)} className="rounded border p-3">
                  <div className="font-medium">{String(match.entity_name ?? '')}</div>
                  <div className="text-sm">
                    {String(match.entity_type ?? '')} · {String(match.entity_id ?? '')} · score {String(match.score ?? 'n/a')} ·{' '}
                    {String(match.qualification ?? '')}
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
                          void call(`/matches/${String(match.id)}/qualification`, 'POST', {
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
          </form>
        ) : null}
        {section === 'cases' ? (
          <Button onClick={() => void call('/cases', 'GET')}>Charger les dossiers</Button>
        ) : null}
        {section === 'batch' ? (
          <Button
            onClick={() =>
              void call('/batches', 'POST', {
                mode: 'initial',
                chunk_size: 25,
                clients: form.clientRef ? [{ client_ref: form.clientRef, entity_type: form.entityType, name: form.name }] : [],
              })
            }
          >
            Lancer un batch initial
          </Button>
        ) : null}
        {section === 'score' ? (
          <Button
            onClick={() =>
              void call('/scores', 'POST', {
                reason: 'manual',
                client: { client_ref: form.clientRef || form.name, name: form.name, profile: { country: form.country } },
                matches: [],
              })
            }
          >
            Calculer le score
          </Button>
        ) : null}
        {section === 'settings' ? <Button onClick={() => void call('/settings', 'GET')}>Paramètres</Button> : null}
        {section === 'scenarios' ? <Button onClick={() => void call('/scenarios', 'GET')}>Scénarios UC01–UC12</Button> : null}
        {section === 'audit' ? <Button onClick={() => void call('/audit', 'GET')}>Journal</Button> : null}
        <pre className="mt-4 overflow-auto rounded border p-3 text-xs whitespace-pre-wrap">{output}</pre>
      </Page.Content>
    </Page.Main>
  );
}
