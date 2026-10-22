import { ErrorComponent, Page } from '@app-builder/components';
import { BankScreeningPanel } from '@app-builder/components/Aml/panels';
import * as Sentry from '@sentry/react';
import { createFileRoute, getRouteApi } from '@tanstack/react-router';
import { type Namespace } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Typo } from 'ui-design-system';

export const Route = createFileRoute('/_app/_builder/screening-search/')({
  staticData: {
    i18n: ['common', 'screenings', 'navigation'] satisfies Namespace,
  },
  loader: () => null,
  errorComponent: ({ error }) => {
    Sentry.captureException(error);
    return <ErrorComponent error={error} />;
  },
  component: ScreeningSearchIndexPage,
});

const screeningSearchLayout = getRouteApi('/_app/_builder/screening-search');

function ScreeningSearchIndexPage() {
  const { t } = useTranslation(['navigation']);
  const { name, entityType, birthDate, nationality, country } = screeningSearchLayout.useSearch();

  return (
    <Page.Main>
      <Page.Content className="h-full">
        <Typo variant="title1">{t('navigation:screening_search')}</Typo>
        <BankScreeningPanel
          initial={{
            name,
            entityType,
            birthDate,
            nationality,
            country,
          }}
        />
      </Page.Content>
    </Page.Main>
  );
}
