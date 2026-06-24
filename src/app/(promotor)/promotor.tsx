import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";

import { ROTAS } from "@/constants/routes";
import { auth } from "@/services/firebaseConfig";
import { consultaFotosDoPromotor } from "@/services/fotos-service";
import { buscarLoja } from "@/services/lojas-service";
import { consultaNotificacoesNaoLidas } from "@/services/notificacoes-service";
import { buscarUsuario } from "@/services/usuarios-service";
import { useTheme } from "@/theme/theme-context";
import type { ThemeColors } from "@/theme/colors";
import type { Foto } from "@/types/foto";
import type { Loja } from "@/types/loja";
import { ehHoje } from "@/utils/datas";
import {
  filtrarFotosAtuais,
  filtrarFotosNaLixeira,
  ordenarFotosRecentes,
} from "@/utils/fotos";
import { textoStatusFoto } from "@/utils/status-foto";

function textoStatus(status: string) {
  return textoStatusFoto(status);
}

function corStatus(status: string, colors: ThemeColors) {
  if (status === "aprovada") return colors.success;
  if (status === "refazer") return colors.warning;
  if (status === "rejeitada") return colors.danger;
  return colors.info;
}

export default function Promotor() {
  const { colors } = useTheme();
  const [nome, setNome] = useState("");
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);

  useEffect(() => {
    let unsubscribeFotos = () => {};

    async function carregarDadosPromotor() {
      try {
        const usuarioAtual = auth.currentUser;

        if (!usuarioAtual) {
          router.replace(ROTAS.login);
          return;
        }

        const usuarioSnap = await buscarUsuario(usuarioAtual.uid);

        if (!usuarioSnap.exists()) {
          await signOut(auth);
          Alert.alert("Erro", "Usuario nao cadastrado no sistema.");
          router.replace(ROTAS.login);
          return;
        }

        const usuarioData = usuarioSnap.data();
        if (usuarioData.ativo === false) {
          await signOut(auth);
          Alert.alert("Acesso removido", "Seu acesso nao esta mais ativo.");
          router.replace(ROTAS.login);
          return;
        }

        setNome(usuarioData.nome || "");

        const lojasCarregadas = await Promise.all(
          (usuarioData.lojasIds || []).map(async (lojaId: string) => {
            const lojaSnap = await buscarLoja(lojaId);
            return lojaSnap.exists()
              ? ({ id: lojaSnap.id, ...lojaSnap.data() } as Loja)
              : null;
          }),
        );
        setLojas(lojasCarregadas.filter(Boolean) as Loja[]);

        unsubscribeFotos = onSnapshot(
          consultaFotosDoPromotor(usuarioAtual.uid),
          (snapshot) => {
            const lista = snapshot.docs.map((item) => ({
              id: item.id,
              ...item.data(),
            })) as Foto[];

            setFotos(ordenarFotosRecentes(lista));
          },
        );
      } catch (error) {
        console.log(error);
        Alert.alert("Erro", "Nao foi possivel carregar seus dados.");
      }
    }

    carregarDadosPromotor();
    return () => unsubscribeFotos();
  }, []);

  useEffect(() => {
    const usuarioAtual = auth.currentUser;
    if (!usuarioAtual) return;

    return onSnapshot(
      consultaNotificacoesNaoLidas(usuarioAtual.uid),
      (snapshot) => {
        setNotificacoesNaoLidas(snapshot.size);
      },
    );
  }, []);

  const resumo = useMemo(() => {
    const ativas = filtrarFotosAtuais(fotos);

    return {
      ativas,
      hoje: ativas.filter((foto) => ehHoje(foto.criadoEm)).length,
      pendentes: ativas.filter(
        (foto) => (foto.status || "pendente") === "pendente",
      ).length,
      aprovadas: ativas.filter((foto) => foto.status === "aprovada").length,
      refazer: ativas.filter((foto) => foto.status === "refazer").length,
      lixeira: filtrarFotosNaLixeira(fotos).length,
    };
  }, [fotos]);

  const avaliacoesRecentes = resumo.ativas
    .filter((foto) => (foto.status || "pendente") !== "pendente")
    .slice(0, 3);

  function abrirMinhasFotos(statusInicial?: string, modoInicial?: string) {
    router.push({
      pathname: ROTAS.minhasFotos,
      params: { statusInicial, modoInicial },
    });
  }

  const estiloTituloSecao = {
    color: colors.text,
    fontSize: 18,
    fontWeight: "bold" as const,
  };

  const estiloBotaoIcone = {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  const estiloEstadoVazio = {
    minHeight: 105,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    padding: 18,
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 34,
        gap: 22,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textSubtle, fontSize: 14 }}>
            Bom trabalho,
          </Text>
          <Text
            numberOfLines={1}
            style={{
              color: colors.text,
              fontSize: 27,
              fontWeight: "bold",
              paddingTop: 3,
            }}
          >
            {nome || "Promotor"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 9 }}>
          <Pressable
            onPress={() => router.push(ROTAS.notificacoes)}
            accessibilityLabel="Abrir notificações"
            style={estiloBotaoIcone}
          >
            <MaterialIcons
              name={
                notificacoesNaoLidas > 0
                  ? "notifications"
                  : "notifications-none"
              }
              size={24}
              color={colors.primary}
            />
            {notificacoesNaoLidas > 0 ? (
              <View
                style={{
                  position: "absolute",
                  top: -5,
                  right: -5,
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: colors.danger,
                  borderWidth: 2,
                  borderColor: colors.background,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 4,
                }}
              >
                <Text
                  style={{
                    color: colors.primaryText,
                    fontSize: 10,
                    fontWeight: "bold",
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {notificacoesNaoLidas > 9 ? "9+" : notificacoesNaoLidas}
                </Text>
              </View>
            ) : null}
          </Pressable>

          <Pressable
            onPress={() => router.push(ROTAS.perfilPromotor)}
            accessibilityLabel="Abrir perfil"
            style={estiloBotaoIcone}
          >
            <MaterialIcons
              name="person-outline"
              size={25}
              color={colors.primary}
            />
          </Pressable>
        </View>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Indicador
          colors={colors}
          titulo="Enviadas hoje"
          valor={resumo.hoje}
          icone="photo-camera"
          cor={colors.info}
        />
        <Indicador
          colors={colors}
          titulo="Pendentes"
          valor={resumo.pendentes}
          icone="schedule"
          cor={colors.primary}
        />
        <Indicador
          colors={colors}
          titulo="Aprovadas"
          valor={resumo.aprovadas}
          icone="check-circle-outline"
          cor={colors.success}
        />
        <Indicador
          colors={colors}
          titulo="Refazer"
          valor={resumo.refazer}
          icone="replay"
          cor={colors.warning}
          onPress={() => abrirMinhasFotos("refazer")}
        />
      </View>

      {resumo.refazer > 0 ? (
        <Pressable
          onPress={() => abrirMinhasFotos("refazer")}
          style={{
            backgroundColor: colors.warningSurface,
            borderWidth: 1,
            borderColor: colors.warning,
            borderRadius: 8,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 11,
          }}
        >
          <MaterialIcons name="warning-amber" size={25} color={colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.warningText, fontWeight: "bold" }}>
              {resumo.refazer} foto(s) precisam ser refeitas
            </Text>
            <Text style={{ color: colors.warningText, paddingTop: 3, opacity: 0.85 }}>
              Consulte os comentarios do responsavel.
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={23} color={colors.warning} />
        </Pressable>
      ) : null}

      <View style={{ gap: 11 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={estiloTituloSecao}>Acesso rapido</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Atalho
            colors={colors}
            titulo="Minhas fotos"
            subtitulo={`${resumo.ativas.length} envios`}
            icone="photo-library"
            onPress={() => abrirMinhasFotos()}
          />
          <Atalho
            colors={colors}
            titulo="Lixeira"
            subtitulo={`${resumo.lixeira} itens`}
            icone="delete-outline"
            onPress={() => abrirMinhasFotos(undefined, "lixeira")}
          />
        </View>
      </View>

      <View style={{ gap: 11 }}>
        <Text style={estiloTituloSecao}>Minhas lojas</Text>
        {lojas.length === 0 ? (
          <View style={estiloEstadoVazio}>
            <MaterialIcons name="store" size={32} color={colors.iconMuted} />
            <Text style={{ color: colors.textSubtle }}>
              Nenhuma loja vinculada ao seu usuario.
            </Text>
          </View>
        ) : (
          lojas.map((loja) => (
            <View
              key={loja.id}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 15,
                gap: 13,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 11,
                }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 8,
                    backgroundColor: colors.primarySurface,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialIcons
                    name="storefront"
                    size={23}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={2}
                    style={{
                      color: colors.text,
                      fontSize: 17,
                      fontWeight: "bold",
                    }}
                  >
                    {loja.nome}
                  </Text>
                  <Text style={{ color: colors.textSubtle, paddingTop: 3 }}>
                    {loja.cidade} - {loja.estado}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: ROTAS.enviarFoto,
                    params: { lojaId: loja.id, lojaNome: loja.nome },
                  })
                }
                style={{
                  minHeight: 44,
                  borderRadius: 7,
                  backgroundColor: colors.primary,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <MaterialIcons
                  name="add-a-photo"
                  size={20}
                  color={colors.primaryText}
                />
                <Text style={{ color: colors.primaryText, fontWeight: "bold" }}>
                  Registrar visita
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </View>

      <View style={{ gap: 11 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={estiloTituloSecao}>Ultimas avaliacoes</Text>
          <Pressable onPress={() => abrirMinhasFotos()}>
            <Text style={{ color: colors.primary, fontWeight: "bold" }}>
              Ver todas
            </Text>
          </Pressable>
        </View>

        {avaliacoesRecentes.length === 0 ? (
          <View style={estiloEstadoVazio}>
            <MaterialIcons name="fact-check" size={32} color={colors.iconMuted} />
            <Text style={{ color: colors.textSubtle, textAlign: "center" }}>
              Suas avaliacoes mais recentes aparecerao aqui.
            </Text>
          </View>
        ) : (
          avaliacoesRecentes.map((foto) => {
            const status = foto.status || "pendente";

            return (
              <Pressable
                key={foto.id}
                onPress={() => abrirMinhasFotos(status)}
                style={{
                  minHeight: 66,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 13,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 11,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{ color: colors.text, fontWeight: "bold" }}
                  >
                    {foto.lojaNome || "Loja nao informada"}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{ color: colors.textSubtle, paddingTop: 4 }}
                  >
                    {foto.categoria || "Sem categoria"}
                    {foto.comentarioAdmin ? " · possui comentario" : ""}
                  </Text>
                </View>
                <Text
                  style={{
                    color: corStatus(status, colors),
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                >
                  {textoStatus(status)}
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={22}
                  color={colors.iconMuted}
                />
              </Pressable>
            );
          })
        )}
      </View>

      <Pressable
        onPress={async () => {
          await signOut(auth);
          router.replace(ROTAS.login);
        }}
        style={{
          minHeight: 46,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 7,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <MaterialIcons name="logout" size={20} color={colors.textMuted} />
        <Text style={{ color: colors.textMuted, fontWeight: "bold" }}>
          Sair
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Indicador({
  colors,
  titulo,
  valor,
  icone,
  cor,
  onPress,
}: {
  colors: ThemeColors;
  titulo: string;
  valor: number;
  icone: keyof typeof MaterialIcons.glyphMap;
  cor: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{
        width: "48%",
        minHeight: 104,
        flexGrow: 1,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        padding: 14,
        justifyContent: "space-between",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: colors.textSubtle, fontSize: 13 }}>{titulo}</Text>
        <MaterialIcons name={icone} size={21} color={cor} />
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
    </Pressable>
  );
}

function Atalho({
  colors,
  titulo,
  subtitulo,
  icone,
  onPress,
}: {
  colors: ThemeColors;
  titulo: string;
  subtitulo: string;
  icone: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 94,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        padding: 13,
        justifyContent: "space-between",
      }}
    >
      <MaterialIcons name={icone} size={25} color={colors.primary} />
      <View>
        <Text style={{ color: colors.text, fontWeight: "bold" }}>{titulo}</Text>
        <Text style={{ color: colors.textSubtle, paddingTop: 3, fontSize: 12 }}>
          {subtitulo}
        </Text>
      </View>
    </Pressable>
  );
}
