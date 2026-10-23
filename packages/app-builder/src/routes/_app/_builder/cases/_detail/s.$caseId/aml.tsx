import { CaseDetail } from '@app-builder/models/cases';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Card } from 'ui-design-system';

export const Route = createFileRoute('/_app/_builder/cases/_detail/s/$caseId/aml')({
  component: AmlTab,
});

function flagText(value: unknown, yes: string, no: string): string {
  if (value === true || value === 'true') return yes;
  if (value === false || value === 'false') return no;
  return '—';
}

function textOf(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

function AmlTab() {
  const { t } = useTranslation(['cases']);
  const { caseDetail } = Route.useRouteContext() as { caseDetail: CaseDetail };
  const decision = [...(caseDetail.decisions || [])].sort((left, right) => right.score - left.score)[0];
  const data = (decision?.triggerObject || {}) as Record<string, unknown>;
  const yes = t('cases:manager.aml.yes');
  const no = t('cases:manager.aml.no');

  if (!decision) {
    return <Card className="p-md">{t('cases:manager.aml.empty')}</Card>;
  }

  return (
    <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
      <Card className="flex flex-col gap-sm p-md">
        <div className="font-medium">{t('cases:manager.aml.provided')}</div>
        <Flag label={t('cases:manager.aml.public_function')} value={flagText(data.pep_public_function, yes, no)} />
        <Flag label={t('cases:manager.aml.family')} value={flagText(data.pep_family_associate, yes, no)} />
        <Flag label={t('cases:manager.aml.financial')} value={flagText(data.pep_financial_involvement, yes, no)} />
      </Card>
      <Card className="flex flex-col gap-sm p-md">
        <div className="font-medium">{t('cases:manager.aml.system')}</div>
        <Flag label={t('cases:manager.aml.screening')} value={textOf(data, 'screening_tags') || '—'} />
        <Flag
          label={t('cases:manager.aml.score')}
          value={`${decision.score} · ${decision.outcome}${textOf(data, 'risk_level') ? ` · ${textOf(data, 'risk_level')}` : ''}`}
        />
      </Card>
    </div>
  );
}

function Flag({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-md border-b border-grey-border py-xs">
      <span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
