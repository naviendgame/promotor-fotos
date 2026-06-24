import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import type { Href } from "expo-router";
import { router } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { ROTAS } from "@/constants/routes";
import { auth } from "@/services/firebaseConfig";
import { buscarUsuario } from "@/services/usuarios-service";
import { useTheme } from "@/theme/theme-context";
import type { Usuario } from "@/types/usuario";

type PapelPermitido = "promotor" | "admin" | "super_admin";

type AuthGuardOptions = {
  papeisPermitidos: readonly PapelPermitido[];
  redirecionarSemPermissao?: Href;
};

type AuthGuardState = {
  carregando: boolean;
  usuario: typeof auth.currentUser | null;
  perfil: Usuario | null;
};

function destinoPadrao(perfil: Usuario | null) {
  if (perfil?.tipo === "admin" || perfil?.tipo === "super_admin") {
    return process.env.EXPO_OS === "web" ? ROTAS.painel : ROTAS.admin;
  }

  if (perfil?.tipo === "promotor") {
    return ROTAS.promotor;
  }

  return ROTAS.login;
}

export function TelaCarregandoAuth({
  backgroundColor,
  color,
}: {
  backgroundColor?: string;
  color?: string;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: backgroundColor ?? colors.background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator size="large" color={color ?? colors.primary} />
    </View>
  );
}

export function useAuthGuard({
  papeisPermitidos,
  redirecionarSemPermissao,
}: AuthGuardOptions) {
  const [estado, setEstado] = useState<AuthGuardState>({
    carregando: true,
    usuario: null,
    perfil: null,
  });

  useEffect(() => {
    let ativo = true;

    const unsubscribe = onAuthStateChanged(auth, async (usuarioAtual) => {
      if (!usuarioAtual) {
        if (ativo) {
          setEstado({ carregando: false, usuario: null, perfil: null });
        }
        router.replace(ROTAS.login);
        return;
      }

      try {
        const usuarioSnap = await buscarUsuario(usuarioAtual.uid);
        const dados = usuarioSnap.exists()
          ? ({ id: usuarioSnap.id, ...usuarioSnap.data() } as Usuario)
          : null;

        if (!dados || dados.ativo === false) {
          await signOut(auth);
          if (ativo) {
            setEstado({ carregando: false, usuario: null, perfil: null });
          }
          router.replace(ROTAS.login);
          return;
        }

        const papelPermitido = papeisPermitidos.includes(
          dados.tipo as PapelPermitido,
        );

        if (!papelPermitido) {
          if (ativo) {
            setEstado({
              carregando: false,
              usuario: usuarioAtual,
              perfil: dados,
            });
          }
          router.replace(redirecionarSemPermissao || destinoPadrao(dados));
          return;
        }

        if (ativo) {
          setEstado({
            carregando: false,
            usuario: usuarioAtual,
            perfil: dados,
          });
        }
      } catch (error) {
        console.log(error);
        await signOut(auth).catch(() => undefined);
        if (ativo) {
          setEstado({ carregando: false, usuario: null, perfil: null });
        }
        router.replace(ROTAS.login);
      }
    });

    return () => {
      ativo = false;
      unsubscribe();
    };
  }, [papeisPermitidos, redirecionarSemPermissao]);

  return estado;
}
