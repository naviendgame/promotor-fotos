import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";

import { ROTAS } from "@/constants/routes";
import { auth } from "@/services/firebaseConfig";
import { fotosCollection } from "@/services/fotos-service";
import { lojasCollection } from "@/services/lojas-service";
import { buscarUsuario } from "@/services/usuarios-service";
import type { Foto } from "@/types/foto";
import { ehHoje } from "@/utils/datas";
import { filtrarFotosAtuais } from "@/utils/fotos";

type BotaoPainelProps = {
  titulo: string;
  icone: keyof typeof MaterialIcons.glyphMap;
  cor?: string;
  onPress: () => void;
};

function BotaoPainel({
  titulo,
  icone,
  cor = "#2563EB",
  onPress,
}: BotaoPainelProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        minHeight: 52,
        backgroundColor: cor,
        borderRadius: 8,
        paddingHorizontal: 15,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <MaterialIcons name={icone} size={22} color="white" />
      <Text style={{ color: "white", fontWeight: "bold", fontSize: 15 }}>
        {titulo}
      </Text>
    </Pressable>
  );
}

export default function Admin() {
  const [totalLojas, setTotalLojas] = useState(0);
  const [fotosHoje, setFotosHoje] = useState(0);
  const [tipoUsuario, setTipoUsuario] = useState<"admin" | "super_admin">(
    "admin",
  );

  useEffect(() => {
    async function carregarPerfil() {
      const usuarioAtual = auth.currentUser;

      if (!usuarioAtual) {
        router.replace(ROTAS.login);
        return;
      }

      const usuarioSnap = await buscarUsuario(usuarioAtual.uid);
      const dados = usuarioSnap.data();

      if (!dados || dados.ativo === false) {
        await signOut(auth);
        router.replace(ROTAS.login);
        return;
      }

      if (dados.tipo !== "admin" && dados.tipo !== "super_admin") {
        router.replace(ROTAS.promotor);
        return;
      }

      setTipoUsuario(dados.tipo);
    }

    carregarPerfil().catch((error) => {
      console.log(error);
      Alert.alert("Erro", "Nao foi possivel carregar seu perfil.");
    });
  }, []);

  useEffect(() => {
    return onSnapshot(
      lojasCollection(),
      (snapshot) => setTotalLojas(snapshot.size),
      (error) => {
        console.log(error);
        Alert.alert("Erro", "Nao foi possivel carregar as lojas.");
      },
    );
  }, []);

  useEffect(() => {
    return onSnapshot(
      fotosCollection(),
      (snapshot) => {
        const lista = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Foto[];

        setFotosHoje(
          filtrarFotosAtuais(lista).filter((foto) => ehHoje(foto.criadoEm))
            .length,
        );
      },
      (error) => {
        console.log(error);
        Alert.alert("Erro", "Nao foi possivel carregar as fotos.");
      },
    );
  }, []);

  async function sair() {
    try {
      await signOut(auth);
      router.replace(ROTAS.login);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#121212" }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        padding: 20,
        paddingTop: 60,
        paddingBottom: 30,
        gap: 10,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          paddingBottom: 16,
        }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: "white", fontSize: 28, fontWeight: "bold" }}>
            Dashboard Admin
          </Text>
          {tipoUsuario === "super_admin" ? (
            <Text style={{ color: "#FBBF24" }}>Administrador principal</Text>
          ) : null}
        </View>

        <Pressable
          onPress={() => router.push(ROTAS.perfilAdmin)}
          accessibilityLabel="Abrir perfil"
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            backgroundColor: "#242424",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name="account-circle" size={34} color="#60A5FA" />
        </Pressable>
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: 10,
          paddingBottom: 8,
        }}
      >
        <View
          style={{
            flex: 1,
            minHeight: 112,
            backgroundColor: "#1E1E1E",
            borderRadius: 8,
            padding: 16,
            justifyContent: "space-between",
          }}
        >
          <Text style={{ color: "#ccc" }}>Fotos hoje</Text>
          <Text
            style={{
              color: "#60A5FA",
              fontSize: 32,
              fontWeight: "bold",
              fontVariant: ["tabular-nums"],
            }}
          >
            {fotosHoje}
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            minHeight: 112,
            backgroundColor: "#1E1E1E",
            borderRadius: 8,
            padding: 16,
            justifyContent: "space-between",
          }}
        >
          <Text style={{ color: "#ccc" }}>Lojas</Text>
          <Text
            style={{
              color: "#4ADE80",
              fontSize: 32,
              fontWeight: "bold",
              fontVariant: ["tabular-nums"],
            }}
          >
            {totalLojas}
          </Text>
        </View>
      </View>

      <BotaoPainel
        titulo="Ver fotos"
        icone="photo-library"
        onPress={() => router.push(ROTAS.verFotos)}
      />
      <BotaoPainel
        titulo="Gerenciar promotores"
        icone="groups"
        onPress={() => router.push(ROTAS.gerenciarPromotores)}
      />
      <BotaoPainel
        titulo="Cadastrar promotor"
        icone="person-add"
        onPress={() => router.push(ROTAS.cadastroPromotor)}
      />
      <BotaoPainel
        titulo="Ver lojas"
        icone="store"
        onPress={() => router.push(ROTAS.verLojas)}
      />
      <BotaoPainel
        titulo="Cadastrar loja"
        icone="add-business"
        onPress={() => router.push(ROTAS.cadastroLoja)}
      />

      {tipoUsuario === "super_admin" ? (
        <>
          <View
            style={{
              height: 1,
              backgroundColor: "#333",
              marginVertical: 6,
            }}
          />
          <BotaoPainel
            titulo="Gerenciar administradores"
            icone="admin-panel-settings"
            cor="#7C3AED"
            onPress={() => router.push(ROTAS.gerenciarAdmins)}
          />
          <BotaoPainel
            titulo="Cadastrar administrador"
            icone="person-add-alt-1"
            cor="#7C3AED"
            onPress={() => router.push(ROTAS.cadastroAdmin)}
          />
        </>
      ) : null}

      <BotaoPainel titulo="Sair" icone="logout" cor="#B91C1C" onPress={sair} />
    </ScrollView>
  );
}
