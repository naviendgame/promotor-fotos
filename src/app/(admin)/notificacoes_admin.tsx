import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { onSnapshot } from "firebase/firestore";

import { ROTAS } from "@/constants/routes";
import { fotosCollection } from "@/services/fotos-service";
import { useTheme } from "@/theme/theme-context";
import type { ThemeColors } from "@/theme/colors";
import type { Foto } from "@/types/foto";
import { ehHoje, obterData } from "@/utils/datas";
import { filtrarFotosAtuais } from "@/utils/fotos";

type Notificacao = {
  id: string;
  tipo: "resumo" | "pendente" | "refacao";
  titulo: string;
  detalhe: string;
  data: Date | null;
  icone: keyof typeof MaterialIcons.glyphMap;
  cor: string;
  rota?: any;
};

export default function NotificacoesAdmin() {
  const { colors } = useTheme();
  const [fotos, setFotos] = useState<Foto[]>([]);

  useEffect(() => {
    return onSnapshot(fotosCollection(), (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Foto[];
      setFotos(filtrarFotosAtuais(lista));
    });
  }, []);

  const notificacoes = useMemo<Notificacao[]>(() => {
    const itens: Notificacao[] = [];
    const agora = new Date();

    // 1. Resumo do dia
    const fotosHoje = fotos.filter((f) => ehHoje(f.criadoEm));
    const aprovadasHoje = fotosHoje.filter((f) => f.status === "aprovada").length;
    const pendentesHoje = fotosHoje.filter(
      (f) => (f.status || "pendente") === "pendente",
    ).length;

    itens.push({
      id: "resumo-dia",
      tipo: "resumo",
      titulo: "Resumo do dia",
      detalhe: `${fotosHoje.length} foto(s) enviada(s) · ${aprovadasHoje} aprovada(s) · ${pendentesHoje} pendente(s)`,
      data: agora,
      icone: "today",
      cor: "#2563EB",
      rota: ROTAS.admin,
    });

    // 2. Fotos pendentes de avaliação
    const pendentes = fotos
      .filter((f) => (f.status || "pendente") === "pendente")
      .sort(
        (a, b) =>
          (obterData(b.criadoEm)?.getTime() || 0) -
          (obterData(a.criadoEm)?.getTime() || 0),
      );

    pendentes.forEach((foto) => {
      itens.push({
        id: `pendente-${foto.id}`,
        tipo: "pendente",
        titulo: "Foto aguardando avaliação",
        detalhe: `${foto.promotorNome || foto.promotorEmail || "Promotor"} · ${foto.lojaNome || "Loja"}`,
        data: obterData(foto.criadoEm),
        icone: "rate-review",
        cor: "#EA580C",
        rota: ROTAS.verFotos,
      });
    });

    // 3. Refações não atendidas há mais de 2 dias
    const limiteRefacao = 2 * 24 * 60 * 60 * 1000;
    const idsRefeitas = new Set(
      fotos
        .filter((f) => f.refacaoDeId)
        .map((f) => f.refacaoDeId as string),
    );

    const refacoesPendentes = fotos.filter((f) => {
      if (f.status !== "refazer") return false;
      if (idsRefeitas.has(f.id)) return false; // promotor já reenviou
      const dataAvaliada = obterData(f.avaliadaEm) || obterData(f.criadoEm);
      if (!dataAvaliada) return false;
      return agora.getTime() - dataAvaliada.getTime() >= limiteRefacao;
    });

    refacoesPendentes.forEach((foto) => {
      const dias = Math.floor(
        (agora.getTime() -
          (obterData(foto.avaliadaEm) || obterData(foto.criadoEm) || agora).getTime()) /
          (24 * 60 * 60 * 1000),
      );

      itens.push({
        id: `refacao-${foto.id}`,
        tipo: "refacao",
        titulo: "Refação não atendida",
        detalhe: `${foto.promotorNome || foto.promotorEmail || "Promotor"} · ${foto.lojaNome || "Loja"} · há ${dias}d`,
        data: obterData(foto.avaliadaEm) || obterData(foto.criadoEm),
        icone: "replay",
        cor: "#7C3AED",
        rota: ROTAS.verFotos,
      });
    });

    // Ordena por data (resumo fica sempre no topo)
    const [resumo, ...resto] = itens;
    resto.sort((a, b) => (b.data?.getTime() || 0) - (a.data?.getTime() || 0));
    return [resumo, ...resto];
  }, [fotos]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={notificacoes}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 18,
          paddingBottom: 34,
        }}
        ListHeaderComponent={
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingBottom: 18,
            }}
          >
            <Pressable
              onPress={() => router.back()}
              accessibilityLabel="Voltar"
              style={{
                width: 42,
                height: 42,
                borderRadius: 8,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: "rgba(15,23,42,0.06)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="arrow-back" size={23} color={colors.text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: colors.text, fontSize: 27, fontWeight: "bold" }}
              >
                Notificações
              </Text>
              <Text style={{ color: colors.textSubtle, paddingTop: 3 }}>
                {notificacoes.length - 1 > 0
                  ? `${notificacoes.length - 1} aviso(s) ativos`
                  : "Nenhuma pendência"}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View
            style={{
              minHeight: 180,
              borderWidth: 1,
              borderColor: "rgba(15,23,42,0.06)",
              borderRadius: 12,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: 22,
            }}
          >
            <MaterialIcons
              name="notifications-none"
              size={38}
              color={colors.iconMuted}
            />
            <Text style={{ color: colors.text, fontWeight: "bold" }}>
              Sem notificações
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ItemNotificacao colors={colors} item={item} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

function ItemNotificacao({
  colors,
  item,
}: {
  colors: ThemeColors;
  item: Notificacao;
}) {
  return (
    <Pressable
      onPress={() => item.rota && router.push(item.rota)}
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: "rgba(15,23,42,0.06)",
        borderRadius: 12,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 2px 10px rgba(15,23,42,0.04)",
      }}
    >
      <MaterialIcons name={item.icone} size={26} color={item.cor} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: "bold" }}>
          {item.titulo}
        </Text>
        <Text
          numberOfLines={2}
          style={{
            color: colors.textSubtle,
            fontSize: 13,
            paddingTop: 3,
            lineHeight: 18,
          }}
        >
          {item.detalhe}
        </Text>
      </View>
      <MaterialIcons
        name="chevron-right"
        size={22}
        color={colors.iconMuted}
      />
    </Pressable>
  );
}
