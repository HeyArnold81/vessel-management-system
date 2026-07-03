import { VesselCallsPage } from '@/features/vessel-calls/vessel-calls-page';

type PageProps = {
  readonly searchParams?: Promise<{
    readonly search?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  return <VesselCallsPage initialSearch={params?.search ?? ''} />;
}
