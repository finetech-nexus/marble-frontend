import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/_builder/aml')({
  beforeLoad: () => {
    throw redirect({ to: '/cases' });
  },
});
