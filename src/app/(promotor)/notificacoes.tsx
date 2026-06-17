import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { onSnapshot } from "firebase/firestore";

import { ROTAS } from "@/constants/routes";
import { auth } from "@/services/firebaseConfig";
import {
  consultaNotificacoesDoUsuario,
  marcarNotificacaoComoLida,
  marcarNotificacoesComoLidas,
} from "@/services/notificacoes-service";
import type { Notificacao } from "@/types/notificacao";
import { obterData } from "@/utils/datas";

function visualNotificacao(tipo?: string) {
  if (tipo === "foto_aprovada") {
    return {
      icone: "check-circle-outline" as const,
      cor: "#65D391",
      fundo: "#153C28",
    };
  }

  if (tipo === "foto_refazer") {
    return {
      icone: "replay" as const,
      cor: "#F4B740",
      fundo: "#49310B",
    };
  }

  return {
    icone: "cancel" as const,
    cor: "#F38A95",
    fundo: "#481A20",
  };
}

export default function Notificacoes() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  useEffect(() => {
    const usuarioAtual = auth.currentUser;
    if (!usuarioAtual) {
      router.replace(ROTAS.login);
      return;
    }

    return onSnapshot(consultaNotificacoesDoUsuario(usuarioAtual.uid), (snapshot) => {
      const lista = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Notificacao[];

      lista.sort(
        (a, b) =>
          (obterData(b.criadoEm)?.getTime() || 0) -
          (obterData(a.criadoEm)?.getTime() || 0),
      );
      setNotificacoes(lista);
    });
  }, []);

  const naoLidas = useMemo(
    () => notificacoes.filter((item) => item.lida !== true),
    [notificacoes],
  );

  async function abrirNotificacao(notificacao: Notificacao) {
    if (!notificacao.lida) {
      await marcarNotificacaoComoLida(notificacao.id);
    }

    router.push({
      pathname: ROTAS.minhasFotos,
      params: {
        fotoInicialId: notificacao.fotoId,
        statusInicial: notificacao.status,
      },
    });
  }

  async function marcarTodasComoLidas() {
    if (naoLidas.length === 0) return;

    await marcarNotificacoesComoLidas(naoLidas.map((item) => item.id));
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0F1115" }}>
      <FlatList
        data={notificacoes}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 18,
          paddingBottom: 34,
        }}
        ListHeaderComponent={
          <View style={{ gap: 18, paddingBottom: 18 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <Pressable
                onPress={() => router.back()}
                accessibilityLabel="Voltar"
                style={estiloBotaoIcone}
              >
                <MaterialIcons name="arrow-back" size={23} color="white" />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: "white", fontSize: 27, fontWeight: "bold" }}
                >
                  Notificações
                </Text>
                <Text style={{ color: "#8E9AAF", paddingTop: 3 }}>
                  {naoLidas.length} aviso(s) não lido(s)
                </Text>
              </View>
            </View>

            {naoLidas.length > 0 ? (
              <Pressable
                onPress={marcarTodasComoLidas}
                style={{
                  alignSelf: "flex-start",
                  minHeight: 38,
                  borderRadius: 7,
                  borderWidth: 1,
                  borderColor: "#3A4352",
                  paddingHorizontal: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <MaterialIcons name="done-all" size={19} color="#AFC5F5" />
                <Text style={{ color: "#DDE7FB", fontWeight: "bold" }}>
                  Marcar todas como lidas
                </Text>
              </Pressable>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={estiloEstadoVazio}>
            <MaterialIcons
              name="notifications-none"
              size={38}
              color="#687386"
            />
            <Text style={{ color: "#D7DDE6", fontWeight: "bold" }}>
              Nenhuma notificação
            </Text>
            <Text style={{ color: "#8994A6", textAlign: "center" }}>
              As avaliações das suas fotos aparecerão aqui.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const visual = visualNotificacao(item.tipo);
          const data = obterData(item.criadoEm);

          return (
            <Pressable
              onPress={() => abrirNotificacao(item)}
              style={{
                minHeight: 98,
                backgroundColor:
                  item.lida === true ? "#171A20" : "#1D232D",
                borderWidth: 1,
                borderColor:
                  item.lida === true ? "#292E37" : "#3D5274",
                borderRadius: 8,
                padding: 14,
                marginBottom: 10,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 8,
                  backgroundColor: visual.fundo,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons
                  name={visual.icone}
                  size={23}
                  color={visual.cor}
                />
              </View>
              <View style={{ flex: 1, gap: 5 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      color: "white",
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  >
                    {item.titulo || "Avaliação atualizada"}
                  </Text>
                  {item.lida !== true ? (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#73A3FF",
                      }}
                    />
                  ) : null}
                </View>
                <Text style={{ color: "#AAB3C1", lineHeight: 19 }}>
                  {item.mensagem || "Sua foto recebeu uma nova avaliação."}
                </Text>
                <Text style={{ color: "#707B8D", fontSize: 12 }}>
                  {data ? data.toLocaleString("pt-BR") : "Agora"}
                </Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={22}
                color="#667286"
              />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const estiloBotaoIcone = {
  width: 42,
  height: 42,
  borderRadius: 8,
  backgroundColor: "#1B1F26",
  borderWidth: 1,
  borderColor: "#303640",
  alignItems: "center" as const,
  justifyContent: "center" as const,
};

const estiloEstadoVazio = {
  minHeight: 180,
  borderWidth: 1,
  borderColor: "#2B3039",
  borderRadius: 8,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  gap: 8,
  padding: 22,
};
