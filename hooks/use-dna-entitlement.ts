import { useQuery } from "@tanstack/react-query";

type EntitlementRes = { entitled: boolean; signedIn: boolean };

async function fetchEntitlement(): Promise<EntitlementRes> {
  const res = await fetch("/api/entitlement", { credentials: "include" });
  const data = await res.json();
  return {
    entitled: Boolean(data?.entitled),
    signedIn: Boolean(data?.signedIn),
  };
}

export function useDnaEntitlement(options?: { enabled?: boolean }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dna-entitlement"],
    queryFn: fetchEntitlement,
    staleTime: 60_000,
    enabled: options?.enabled !== false,
  });

  return {
    entitled: data?.entitled ?? false,
    signedIn: data?.signedIn ?? false,
    isLoading,
    refetch,
  };
}
