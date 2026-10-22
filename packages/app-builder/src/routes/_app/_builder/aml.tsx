import { Page } from '@app-builder/components';
import { BankCasesPanel } from '@app-builder/components/Aml/panels';
import { CasesNavigationTabs } from '@app-builder/components/Cases/Navigation/Tabs';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/_builder/aml')({
  component: AmlCasesPage,
});

function AmlCasesPage() {
  return (
    <Page.Main>
      <Page.Content>
        <CasesNavigationTabs />
        <BankCasesPanel />
      </Page.Content>
    </Page.Main>
  );
}
