import { BreadCrumbLink, type BreadCrumbProps } from '@app-builder/components/Breadcrumbs';
import { authMiddleware } from '@app-builder/middlewares/auth-middleware';
import { isScreeningSearchAvailable } from '@app-builder/services/feature-access';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useTranslation } from 'react-i18next';
import { Icon } from 'ui-icons';
import { z } from 'zod/v4';

export const screeningSearchParams = z.object({
  name: z.string().optional(),
  entityType: z.enum(['Thing', 'Person', 'Organization', 'Vehicle']).optional(),
  birthDate: z.string().optional(),
  nationality: z.string().optional(),
  country: z.string().optional(),
});

const screeningSearchLayoutLoader = createServerFn()
  .middleware([authMiddleware])
  .handler(async function screeningSearchLayout({ context }) {
    const { entitlements } = context.authInfo;

    if (!isScreeningSearchAvailable(entitlements)) {
      throw redirect({ to: '/' });
    }

    return null;
  });

export const Route = createFileRoute('/_app/_builder/screening-search')({
  validateSearch: screeningSearchParams,
  loader: () => screeningSearchLayoutLoader(),
  staticData: {
    BreadCrumbs: [
      ({ isLast }: BreadCrumbProps) => {
        const { t } = useTranslation(['navigation']);

        return (
          <BreadCrumbLink to="/screening-search" isLast={isLast}>
            <Icon icon="search" className="me-sm size-6" />
            <span>{t('navigation:screening_search')}</span>
          </BreadCrumbLink>
        );
      },
    ],
  },
  component: () => <Outlet />,
});
