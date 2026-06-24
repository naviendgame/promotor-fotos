import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { onSnapshot } from "firebase/firestore";
import Animated, {
  FadeInDown,
  FadeInUp,
  LinearTransition,
} from "react-native-reanimated";

import { ROTAS } from "@/constants/routes";
import { fotosCollection } from "@/services/fotos-service";
import { lojasCollection } from "@/services/lojas-service";
import { consultaPromotores } from "@/services/usuarios-service";
import { useTheme } from "@/theme/theme-context";
import type { ThemeColors } from "@/theme/colors";
import type { Foto } from "@/types/foto";
import { obterData } from "@/utils/datas";
import {
  filtrarFotosAtuais,
  ordenarFotosRecentes,
} from "@/utils/fotos";
import { visualStatusPorTema } from "@/utils/status-foto";

type IndicadorProps = {
  colors: ThemeColors;
  titulo: string;
  valor: number;
  icone: keyof typeof MaterialIcons.glyphMap;
  cor: string;
};

function Indicador({ colors, titulo, valor, icone, cor }: IndicadorProps) {
  return (
    <View
      style={{
        minWidth: 155,
        flexGrow: 1,
        borderLeftWidth: 1,
        borderLeftColor: colors.border,
        paddingLeft: 16,
        gap: 8,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <MaterialIcons name={icone} size={18} color={cor} />
        <Text style={{ color: colors.textSubtle, fontSize: 13 }}>{titulo}</Text>
      </View>
      <Text
        style={{
          color: colors.text,
          fontSize: 28,
          fontWeight: "bold",
          fontVariant: ["tabular-nums"],
        }}
      >
        {valor}
      </Text>
    </View>
  );
}

export default function PainelDashboard() {
  const { colors, scheme } = useTheme();
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [totalLojas, setTotalLojas] = useState(0);
  const [totalPromotores, setTotalPromotores] = useState(0);
  const { width } = useWindowDimensions();

  useEffect(() => {
    const unsubscribeFotos = onSnapshot(fotosCollection(), (snapshot) => {
      const lista = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Foto[];

      setFotos(filtrarFotosAtuais(ordenarFotosRecentes(lista)));
    });

    const unsubscribeLojas = onSnapshot(lojasCollection(), (snapshot) => {
      setTotalLojas(snapshot.size);
    });

    const unsubscribeUsuarios = onSnapshot(consultaPromotores(), (snapshot) => {
      setTotalPromotores(
        snapshot.docs.filter((item) => item.data().ativo !== false).length,
      );
    });

    return () => {
      unsubscribeFotos();
      unsubscribeLojas();
      unsubscribeUsuarios();
    };
  }, []);

  const resumo = useMemo(() => {
    const hoje = new Date();
    const fotosHoje = fotos.filter((foto) => {
      const data = obterData(foto.criadoEm);

      return (
        data &&
        data.getDate() === hoje.getDate() &&
        data.getMonth() === hoje.getMonth() &&
        data.getFullYear() === hoje.getFullYear()
      );
    }).length;

    return {
      fotosHoje,
      pendentes: fotos.filter(
        (foto) => (foto.status || "pendente") === "pendente",
      ).length,
      aprovadas: fotos.filter((foto) => foto.status === "aprovada").length,
      refazer: fotos.filter((foto) => foto.status === "refazer").length,
      rejeitadas: fotos.filter((foto) => foto.status === "rejeitada").length,
    };
  }, [fotos]);

  const colunasCompactas = width < 1120;
  const totalAvaliadas = resumo.aprovadas + resumo.refazer + resumo.rejeitadas;
  const totalFotos = fotos.length;
  const percentualAprovadas =
    totalAvaliadas > 0
      ? Math.round((resumo.aprovadas / totalAvaliadas) * 100)
      : 0;
  const status = [
    { nome: "Aprovadas", valor: resumo.aprovadas, cor: colors.success },
    { nome: "Refazer", valor: resumo.refazer, cor: colors.warning },
    { nome: "Rejeitadas", valor: resumo.rejeitadas, cor: colors.danger },
  ];

  const sombraCard =
    scheme === "light"
      ? "0 14px 34px rgba(37, 99, 235, 0.10)"
      : "0 14px 34px rgba(0, 0, 0, 0.4)";

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: 20, paddingBottom: 28 }}
    >
      <Animated.View
        entering={FadeInDown.duration(280)}
        layout={LinearTransition.duration(200)}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          padding: width < 760 ? 18 : 24,
          gap: 22,
          boxShadow: sombraCard,
        }}
      >
        <View
          style={{
            flexDirection: width < 980 ? "column" : "row",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <View style={{ flex: 1.1, gap: 8 }}>
            <View
              style={{
                alignSelf: "flex-start",
                borderRadius: 8,
                backgroundColor: colors.primarySurface,
                paddingHorizontal: 10,
                paddingVertical: 6,
                flexDirection: "row",
                alignItems: "center",
                gap: 7,
              }}
            >
              <MaterialIcons name="bolt" size={17} color={colors.primary} />
              <Text
                style={{
                  color: colors.primary,
                  fontWeight: "bold",
                  fontSize: 12,
                }}
              >
                Ao vivo
              </Text>
            </View>
            <Text
              style={{ color: colors.text, fontSize: 28, fontWeight: "bold" }}
            >
              Operacao em andamento
            </Text>
            <Text style={{ color: colors.textSubtle, lineHeight: 21 }}>
              Acompanhe recebimento, pendencias e qualidade das analises sem
              perder o contexto da rotina de campo.
            </Text>
          </View>

          <View
            style={{
              minWidth: width < 980 ? undefined : 330,
              borderRadius: 8,
              backgroundColor: "#123A7A",
              padding: 18,
              gap: 8,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                position: "absolute",
                right: -34,
                top: -42,
                width: 128,
                height: 128,
                borderRadius: 64,
                backgroundColor: "rgba(255,255,255,0.10)",
              }}
            />
            <Text style={{ color: "#BBD0F7", fontSize: 13 }}>
              Fotos no fluxo atual
            </Text>
            <Text
              style={{
                color: "white",
                fontSize: 42,
                fontWeight: "bold",
                fontVariant: ["tabular-nums"],
              }}
            >
              {totalFotos}
            </Text>
            <Text style={{ color: "#BFDBFE", fontWeight: "bold" }}>
              {resumo.pendentes} pendentes para revisao
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <Indicador
            colors={colors}
            titulo="Recebidas hoje"
            valor={resumo.fotosHoje}
            icone="photo-camera"
            cor={colors.primary}
          />
          <Indicador
            colors={colors}
            titulo="Pendentes"
            valor={resumo.pendentes}
            icone="schedule"
            cor="#7C3AED"
          />
          <Indicador
            colors={colors}
            titulo="Promotores ativos"
            valor={totalPromotores}
            icone="groups"
            cor={colors.success}
          />
          <Indicador
            colors={colors}
            titulo="Lojas"
            valor={totalLojas}
            icone="store"
            cor={colors.warning}
          />
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(260).delay(90)}
        style={{
          flexDirection: colunasCompactas ? "column" : "row",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        <View
          style={{
            flex: 1.2,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 18,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <View>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 17,
                  fontWeight: "bold",
                }}
              >
                Qualidade das avaliacoes
              </Text>
              <Text
                style={{
                  color: colors.textSubtle,
                  fontSize: 13,
                  paddingTop: 3,
                }}
              >
                Distribuicao das fotos ja analisadas
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={{
                  color: colors.success,
                  fontSize: 24,
                  fontWeight: "bold",
                  fontVariant: ["tabular-nums"],
                }}
              >
                {percentualAprovadas}%
              </Text>
              <Text style={{ color: colors.textSubtle, fontSize: 12 }}>
                aprovadas
              </Text>
            </View>
          </View>

          <View style={{ gap: 16, paddingTop: 22 }}>
            {status.map((item) => {
              const percentual =
                totalAvaliadas > 0 ? (item.valor / totalAvaliadas) * 100 : 0;

              return (
                <View key={item.nome} style={{ gap: 7 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ color: colors.textMuted }}>{item.nome}</Text>
                    <Text
                      style={{
                        color: colors.text,
                        fontWeight: "bold",
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      {item.valor}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.surfaceElevated,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: `${percentual}%`,
                        height: "100%",
                        backgroundColor: item.cor,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 18,
          }}
        >
          <Text
            style={{ color: colors.text, fontSize: 17, fontWeight: "bold" }}
          >
            Proximas acoes
          </Text>
          <View style={{ gap: 9, paddingTop: 16 }}>
            {[
              {
                titulo: "Analisar fotos pendentes",
                icone: "rate-review" as const,
                rota: ROTAS.painelFotos,
              },
              {
                titulo: "Gerenciar promotores",
                icone: "manage-accounts" as const,
                rota: ROTAS.painelPromotores,
              },
              {
                titulo: "Consultar relatorios",
                icone: "assessment" as const,
                rota: ROTAS.painelRelatorios,
              },
            ].map((acao) => (
              <Pressable
                key={acao.rota}
                onPress={() => router.push(acao.rota)}
                style={{
                  minHeight: 48,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 7,
                  paddingHorizontal: 13,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  backgroundColor: colors.surfaceElevated,
                }}
              >
                <MaterialIcons
                  name={acao.icone}
                  size={21}
                  color={colors.primary}
                />
                <Text style={{ color: colors.text, fontWeight: "bold" }}>
                  {acao.titulo}
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={colors.iconMuted}
                  style={{ marginLeft: "auto" }}
                />
              </Pressable>
            ))}
          </View>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(260).delay(140)}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            padding: 18,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text
              style={{ color: colors.text, fontSize: 17, fontWeight: "bold" }}
            >
              Envios recentes
            </Text>
            <Text
              style={{
                color: colors.textSubtle,
                fontSize: 13,
                paddingTop: 3,
              }}
            >
              Ultimas fotos recebidas
            </Text>
          </View>
          <Pressable onPress={() => router.push(ROTAS.painelFotos)}>
            <Text style={{ color: colors.primary, fontWeight: "bold" }}>
              Ver todas
            </Text>
          </Pressable>
        </View>

        {fotos.slice(0, 5).map((foto, indice) => {
          const data = obterData(foto.criadoEm);
          const statusFoto = foto.status || "pendente";
          const visual = visualStatusPorTema(statusFoto, scheme);

          return (
            <View
              key={foto.id}
              style={{
                minHeight: 62,
                paddingHorizontal: 18,
                paddingVertical: 12,
                borderBottomWidth:
                  indice < Math.min(fotos.length, 5) - 1 ? 1 : 0,
                borderBottomColor: colors.border,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
              }}
            >
              <View style={{ flex: 1.2 }}>
                <Text style={{ color: colors.text, fontWeight: "bold" }}>
                  {foto.lojaNome || "Loja nao informada"}
                </Text>
                <Text
                  style={{
                    color: colors.textSubtle,
                    fontSize: 12,
                    paddingTop: 3,
                  }}
                >
                  {foto.promotorNome || foto.promotorEmail || "Promotor"}
                </Text>
              </View>
              <Text style={{ flex: 0.8, color: colors.textMuted }}>
                {foto.categoria || "Sem categoria"}
              </Text>
              <View
                style={{
                  minWidth: 82,
                  borderRadius: 5,
                  paddingVertical: 5,
                  paddingHorizontal: 8,
                  backgroundColor: visual.fundo,
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: "bold",
                    color: visual.texto,
                  }}
                >
                  {statusFoto}
                </Text>
              </View>
              <Text
                style={{
                  width: 118,
                  color: colors.textSubtle,
                  fontSize: 12,
                  textAlign: "right",
                }}
              >
                {data ? data.toLocaleString("pt-BR") : "Sem data"}
              </Text>
            </View>
          );
        })}

        {fotos.length === 0 ? (
          <Text style={{ color: colors.textSubtle, padding: 18 }}>
            Nenhuma foto recebida.
          </Text>
        ) : null}
      </Animated.View>
    </ScrollView>
  );
}
