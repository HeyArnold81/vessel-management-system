import { BillingEventsPage } from '@/features/billing-events/billing-events-page';

type PageProps = {
  readonly searchParams?: Promise<{
    readonly search?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  return <BillingEventsPage initialSearch={params?.search ?? ''} />;
}
