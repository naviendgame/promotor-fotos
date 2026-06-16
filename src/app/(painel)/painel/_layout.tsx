import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { Slot, router } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";

import PainelWebLayout from "../../../components/painel-web-layout";
import { auth } from "../../../services/firebaseConfig";
import { buscarUsuario } from "../../../services/usuarios-service";

type TipoUsuario = "admin" | "super_admin";

export default function PainelLayout() {
  const [carregando, setCarregando] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>("admin");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usuarioAtual) => {
      if (!usuarioAtual) {
        router.replace("/(auth)/index");
        setCarregando(false);
        return;
      }

      try {
        const usuarioSnap = await buscarUsuario(usuarioAtual.uid);
        const dados = usuarioSnap.data();

        if (
          !dados ||
          dados.ativo === false ||
          (dados.tipo !== "admin" && dados.tipo !== "super_admin")
        ) {
          await signOut(auth);
          router.replace("/(auth)/index");
          return;
        }

        setNomeUsuario(dados.nome || usuarioAtual.displayName || "");
        setTipoUsuario(dados.tipo);
      } catch (error) {
        console.log(error);
        router.replace("/(auth)/index");
      } finally {
        setCarregando(false);
      }
    });

    return unsubscribe;
  }, []);

  if (carregando) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#F3F5F8",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="#2F6FED" />
      </View>
    );
  }

  return (
    <PainelWebLayout nomeUsuario={nomeUsuario} tipoUsuario={tipoUsuario}>
      <Slot />
    </PainelWebLayout>
  );
}
