import { Page } from '@app-builder/components';
import { BankScorePanel } from '@app-builder/components/Aml/panels';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Typo } from 'ui-design-system';

export const Route = createFileRoute('/_app/_builder/user-scoring/')({
  component: UserScoringIndexPage,
});

function UserScoringIndexPage() {
  const { t } = useTranslation(['navigation']);
  return (
    <Page.Main>
      <Page.Content>
        <Typo variant="title1">{t('navigation:user_scoring')}</Typo>
        <BankScorePanel />
      </Page.Content>
    </Page.Main>
  );
}
