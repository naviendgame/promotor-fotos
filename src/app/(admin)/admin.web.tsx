import { Redirect } from "expo-router";

import { ROTAS } from "@/constants/routes";

export default function AdminWeb() {
  return <Redirect href={ROTAS.painel} />;
}
