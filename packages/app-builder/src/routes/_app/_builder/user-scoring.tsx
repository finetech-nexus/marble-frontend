import { ScoringSectionLayout } from '@app-builder/components/UserScoring/ScoringSectionLayout';
import { authMiddleware } from '@app-builder/middlewares/auth-middleware';
import { isAnalyst } from '@app-builder/models';
import { isUserScoringAvailable } from '@app-builder/services/feature-access';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { type Namespace } from 'i18next';

const userScoringLayoutLoader = createServerFn()
  .middleware([authMiddleware])
  .handler(async function userScoringLayout({ context }) {
    const { user, entitlements, userScoring } = context.authInfo;

    if (isAnalyst(user)) {
      throw redirect({ to: '/cases' });
    }

    if (!isUserScoringAvailable(entitlements)) {
      return {
        custom: true as const,
        settings: null,
        canUpdateScoringSettings: false,
        canUpdateScoringRulesets: false,
      };
    }

    const settings = await userScoring.getSettings();

    return {
      custom: false as const,
      settings,
      canUpdateScoringSettings: user.permissions.canUpdateScoringSettings,
      canUpdateScoringRulesets: user.permissions.canUpdateScoringRulesets,
    };
  });

export const Route = createFileRoute('/_app/_builder/user-scoring')({
  staticData: {
    i18n: ['common', 'user-scoring'] satisfies Namespace,
  },
  loader: () => userScoringLayoutLoader(),
  component: UserScoringSectionLayout,
});

function UserScoringSectionLayout() {
  const { custom, settings, canUpdateScoringRulesets } = Route.useLoaderData();
  if (custom) return <Outlet />;
  return (
    <ScoringSectionLayout maxRiskLevel={settings?.maxRiskLevel} canUpdateScoringRulesets={canUpdateScoringRulesets} />
  );
}
