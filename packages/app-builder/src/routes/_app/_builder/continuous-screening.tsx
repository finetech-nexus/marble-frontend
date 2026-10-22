import { authMiddleware } from '@app-builder/middlewares/auth-middleware';
import { isAnalyst } from '@app-builder/models';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

const continuousScreeningLayoutLoader = createServerFn()
  .middleware([authMiddleware])
  .handler(async function continuousScreeningLayout({ context }) {
    const { user } = context.authInfo;

    if (isAnalyst(user)) {
      throw redirect({ to: '/cases' });
    }

    return null;
  });

export const Route = createFileRoute('/_app/_builder/continuous-screening')({
  loader: () => continuousScreeningLayoutLoader(),
  component: () => <Outlet />,
});
