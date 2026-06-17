import { Slot } from "expo-router";

import { TelaCarregandoAuth, useAuthGuard } from "@/hooks/use-auth-guard";

const PAPEIS_ADMIN = ["admin", "super_admin"] as const;

export default function AdminLayout() {
  const { carregando, perfil } = useAuthGuard({
    papeisPermitidos: PAPEIS_ADMIN,
  });

  if (carregando || !perfil) {
    return <TelaCarregandoAuth />;
  }

  return <Slot />;
}
