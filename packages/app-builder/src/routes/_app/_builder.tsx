import { OrganizationSwitcher, SidebarLink } from '@app-builder/components';
import { HeaderLogo } from '@app-builder/components/HeaderLogo';
import { LeftSidebar } from '@app-builder/components/Layout/LeftSidebar';
import { OrganizationChangeProvider } from '@app-builder/components/OrganizationChange';
import { UnavailableBanner } from '@app-builder/components/Settings/UnavailableBanner';
import { VersionUpdateModalContainer } from '@app-builder/components/VersionUpdate';
import { useRefreshToken } from '@app-builder/hooks/useRefreshToken';
import { authMiddleware } from '@app-builder/middlewares/auth-middleware';
import { isAnalyst } from '@app-builder/models';
import {
  isAnalyticsAvailable,
  isAutoAssignmentAvailable,
  isScreeningSearchAvailable,
} from '@app-builder/services/feature-access';
import { OrganizationDetailsContextProvider } from '@app-builder/services/organization/organization-detail';
import { OrganizationObjectTagsContextProvider } from '@app-builder/services/organization/organization-object-tags';
import { OrganizationTagsContextProvider } from '@app-builder/services/organization/organization-tags';
import { OrganizationUsersContextProvider } from '@app-builder/services/organization/organization-users';
import { useSegmentIdentification } from '@app-builder/services/segment';
import { useSentryIdentification, useSentryReplay } from '@app-builder/services/sentry';
import { getSettingsAccess } from '@app-builder/services/settings-access';
import { ClientOnly, createFileRoute, Outlet } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Icon } from 'ui-icons';

const appBuilderLayoutLoader = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async function appBuilderLayout({ context }) {
    const { user, inbox, organization, entitlements } = context.authInfo;
    const [organizationDetail, organizations, orgUsers, orgTags, orgObjectTags, inboxes] = await Promise.all([
      organization.getCurrentOrganization(),
      organization.listMyOrganizations(),
      organization.listUsers(),
      organization.listTags(),
      organization.listTags({ target: 'object' }),
      inbox.listInboxes(),
    ]);

    const settingsSections = getSettingsAccess(user, context.appConfig, inboxes);
    const firstSetting = Object.values(settingsSections).find((s) => s.settings.length > 0)?.settings[0];
    return {
      user,
      orgUsers,
      organization: organizationDetail,
      organizations,
      orgTags,
      orgObjectTags,
      featuresAccess: {
        isAnalyticsAvailable: isAnalyticsAvailable(user, entitlements),
        analytics: entitlements.analytics,
        settings:
          !isAnalyst(user) && firstSetting !== undefined
            ? { isAvailable: true as const, to: firstSetting.to }
            : { isAvailable: false as const },
        isAutoAssignmentAvailable: isAutoAssignmentAvailable(entitlements),
        continuousScreening: entitlements.continuousScreening,
        isScreeningSearchAvailable: isScreeningSearchAvailable(entitlements),
        userScoring: isAnalyst(user) ? ('restricted' as const) : entitlements.userScoring,
      },
      authProvider: context.appConfig.auth.provider,
      sentryReplayEnabled: organizationDetail.sentryReplayEnabled,
    };
  });

export const Route = createFileRoute('/_app/_builder')({
  loader: () => appBuilderLayoutLoader(),
  component: Builder,
});

const TokenRefresher = () => {
  useRefreshToken();
  return null;
};

function Builder() {
  const {
    user,
    orgUsers,
    organization,
    organizations,
    orgTags,
    orgObjectTags,
    featuresAccess,
    authProvider,
    sentryReplayEnabled,
  } = Route.useLoaderData();
  useSegmentIdentification(user);
  useSentryIdentification(user);
  useSentryReplay(sentryReplayEnabled);

  return (
    <>
      <ClientOnly>{authProvider === 'firebase' ? <TokenRefresher /> : null}</ClientOnly>
      <ClientOnly>
        <VersionUpdateModalContainer />
      </ClientOnly>
      <OrganizationChangeProvider
        currentOrganization={organization}
        organizations={organizations}
        currentUserEmail={user.actorIdentity.email}
      >
        <OrganizationDetailsContextProvider org={organization} currentUser={user} organizations={organizations}>
          <OrganizationUsersContextProvider orgUsers={orgUsers}>
            <OrganizationTagsContextProvider orgTags={orgTags}>
              <OrganizationObjectTagsContextProvider tags={orgObjectTags}>
                <div className="flex min-h-screen flex-col">
                  {/* <DatasetFreshnessBanner /> */}
                  <div className="relative flex min-h-0 flex-1">
                    <LeftSidebar>
                      <div className="h-24 px-xs pt-md">
                        <HeaderLogo />
                      </div>
                      <nav className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden p-sm">
                        <ul className="flex w-full min-w-0 flex-col gap-sm">
                          {/* Organization Switcher */}
                          {organizations.length > 1 && (
                            <li>
                              <OrganizationSwitcher />
                            </li>
                          )}
                          {/* Detection - flat link (tabs are inside the page) */}
                          {!isAnalyst(user) && (
                            <li>
                              <SidebarLink
                                labelTKey="navigation:detection"
                                to="/detection"
                                Icon={(props) => <Icon icon="scenarios" {...props} />}
                              />
                            </li>
                          )}
                          {!isAnalyst(user) && (
                            <li>
                              <SidebarLink
                                labelTKey="navigation:user_scoring"
                                to="/user-scoring"
                                Icon={(props) => <Icon icon="123" {...props} />}
                              />
                            </li>
                          )}
                          {!isAnalyst(user) && (
                            <li>
                              <SidebarLink
                                labelTKey="navigation:continuous_screening"
                                to="/continuous-screening"
                                Icon={(props) => <Icon icon="scan-eye" {...props} />}
                              />
                            </li>
                          )}
                          {/* Investigations (Cases) */}
                          <li>
                            <SidebarLink
                              labelTKey="navigation:case_manager"
                              to="/cases"
                              Icon={(props) => <Icon icon="case-manager" {...props} />}
                            />
                          </li>
                          <li>
                            <SidebarLink
                              labelTKey="navigation:screening_search"
                              to="/screening-search"
                              Icon={(props) => <Icon icon="search" {...props} />}
                            />
                          </li>
                          {/* Client detail */}
                          <li>
                            <SidebarLink
                              labelTKey="navigation:client_detail"
                              to="/client-detail"
                              Icon={(props) => <Icon icon="users" {...props} />}
                            />
                          </li>
                        </ul>
                      </nav>
                      {/* Secondary Navigation - Bottom */}
                      <nav className="p-sm pb-md">
                        <ul className="flex w-full min-w-0 flex-col gap-sm">
                          {/* Your Data */}
                          {!isAnalyst(user) && (
                            <li>
                              <SidebarLink
                                labelTKey="navigation:data"
                                to="/data"
                                Icon={(props) => <Icon icon="harddrive" {...props} />}
                              />
                            </li>
                          )}
                          {/* Settings */}
                          {featuresAccess.settings.isAvailable ? (
                            <li>
                              <SidebarLink
                                labelTKey="navigation:settings"
                                to={featuresAccess.settings.to}
                                Icon={(props) => <Icon icon="settings" {...props} />}
                              />
                            </li>
                          ) : null}
                          {/* My Account */}
                          <li>
                            <SidebarLink
                              labelTKey="navigation:my_account"
                              to="/account"
                              Icon={(props) => <Icon icon="user" {...props} />}
                            />
                          </li>
                        </ul>
                      </nav>
                    </LeftSidebar>

                    <Outlet />
                    {featuresAccess.isAutoAssignmentAvailable ? <UnavailableBanner /> : null}
                  </div>
                </div>
              </OrganizationObjectTagsContextProvider>
            </OrganizationTagsContextProvider>
          </OrganizationUsersContextProvider>
        </OrganizationDetailsContextProvider>
      </OrganizationChangeProvider>
    </>
  );
}
