import { Page } from '@app-builder/components';
import { BankBatchPanel } from '@app-builder/components/Aml/panels';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Typo } from 'ui-design-system';

export const Route = createFileRoute('/_app/_builder/continuous-screening/')({
  component: ContinuousScreeningIndexPage,
});

function ContinuousScreeningIndexPage() {
  const { t } = useTranslation(['navigation']);
  return (
    <Page.Main>
      <Page.Content>
        <Typo variant="title1">{t('navigation:continuous_screening')}</Typo>
        <BankBatchPanel />
      </Page.Content>
    </Page.Main>
  );
}
