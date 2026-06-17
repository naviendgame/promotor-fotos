import { Slot } from "expo-router";

import { ROTAS } from "@/constants/routes";
import { TelaCarregandoAuth, useAuthGuard } from "@/hooks/use-auth-guard";

const PAPEIS_PROMOTOR = ["promotor"] as const;

export default function PromotorLayout() {
  const { carregando, perfil } = useAuthGuard({
    papeisPermitidos: PAPEIS_PROMOTOR,
    redirecionarSemPermissao: ROTAS.admin,
  });

  if (carregando || !perfil) {
    return <TelaCarregandoAuth backgroundColor="#0F1115" color="#8CB1FA" />;
  }

  return <Slot />;
}
