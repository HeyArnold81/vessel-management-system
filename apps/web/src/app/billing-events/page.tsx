import { BillingEventsPage } from '@/features/billing-events/billing-events-page';

type PageProps = {
  readonly searchParams?: Promise<{
    readonly id?: string;
    readonly search?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  return <BillingEventsPage initialId={params?.id ?? ''} initialSearch={params?.search ?? ''} />;
}
