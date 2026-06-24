import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { serverTimestamp } from "firebase/firestore";

import { criarLoja } from "@/services/lojas-service";
import {
  normalizarTexto,
  useCidadesBrasil,
  type CidadeBR,
} from "@/hooks/use-cidades-brasil";
import { useTheme } from "@/theme/theme-context";
import type { ThemeColors } from "@/theme/colors";

const COR_VERDE = "#16A34A";
const LIMITE_SUGESTOES = 60;

export default function CadastroLoja() {
  const { colors, scheme } = useTheme();
  const [nome, setNome] = useState("");
  const [cidadeSelecionada, setCidadeSelecionada] = useState<CidadeBR | null>(
    null,
  );
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function salvarLoja() {
    if (salvando) return;

    if (!nome.trim()) {
      Alert.alert("Atenção", "Informe o nome da loja.");
      return;
    }

    if (!cidadeSelecionada) {
      Alert.alert(
        "Atenção",
        "Selecione uma cidade da lista (o estado será preenchido automaticamente).",
      );
      return;
    }

    try {
      setSalvando(true);
      await criarLoja({
        nome: nome.trim(),
        cidade: cidadeSelecionada.nome,
        estado: cidadeSelecionada.uf,
        ativo: true,
        criadoEm: serverTimestamp(),
      });
      Alert.alert("Sucesso", "Loja cadastrada com sucesso!");
      router.back();
    } catch (error: any) {
      console.log(error);
      Alert.alert("Erro", error.message || "Não foi possível cadastrar a loja.");
    } finally {
      setSalvando(false);
    }
  }

  const corBorda =
    scheme === "light" ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.06)";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 60,
          gap: 16,
        }}
      >
        {/* Botão voltar — só ícone */}
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Voltar"
          style={{
            alignSelf: "flex-start",
            width: 42,
            height: 42,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 6,
          }}
        >
          <MaterialIcons name="arrow-back" size={26} color={colors.text} />
        </Pressable>

        {/* Título + subtítulo */}
        <View style={{ gap: 8, paddingBottom: 8 }}>
          <Text
            style={{ color: colors.text, fontSize: 28, fontWeight: "bold" }}
          >
            Cadastro de Loja
          </Text>
          <Text style={{ color: colors.textSubtle, lineHeight: 21 }}>
            Preencha os dados da loja para realizar o cadastro.
          </Text>
        </View>

        {/* Nome */}
        <CampoEntrada
          colors={colors}
          corBorda={corBorda}
          icone="storefront"
          placeholder="Nome da loja"
          valor={nome}
          onChange={setNome}
        />

        {/* Cidade — abre seletor */}
        <SeletorCidadeCampo
          colors={colors}
          corBorda={corBorda}
          cidadeSelecionada={cidadeSelecionada}
          onAbrir={() => setSeletorAberto(true)}
          onLimpar={() => setCidadeSelecionada(null)}
        />

        {/* Estado — readonly, vazio enquanto não tiver cidade */}
        <CampoEstadoReadonly
          colors={colors}
          corBorda={corBorda}
          uf={cidadeSelecionada?.uf || ""}
          estadoNome={cidadeSelecionada?.estadoNome || ""}
        />

        {/* Botão Salvar */}
        <Pressable
          onPress={salvarLoja}
          disabled={salvando}
          style={{
            marginTop: 14,
            minHeight: 54,
            borderRadius: 12,
            backgroundColor: salvando ? "#86EFAC" : COR_VERDE,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
            {salvando ? "Salvando..." : "Salvar Loja"}
          </Text>
        </Pressable>
      </ScrollView>

      <SeletorCidadeModal
        colors={colors}
        corBorda={corBorda}
        visivel={seletorAberto}
        cidadeAtual={cidadeSelecionada}
        onSelecionar={(cidade) => {
          setCidadeSelecionada(cidade);
          setSeletorAberto(false);
        }}
        onFechar={() => setSeletorAberto(false)}
      />
    </KeyboardAvoidingView>
  );
}

/* ---------- Componentes ---------- */

function CampoEntrada({
  colors,
  corBorda,
  icone,
  placeholder,
  valor,
  onChange,
}: {
  colors: ThemeColors;
  corBorda: string;
  icone: keyof typeof MaterialIcons.glyphMap;
  placeholder: string;
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <View
      style={{
        minHeight: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: corBorda,
        backgroundColor: colors.surface,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <MaterialIcons name={icone} size={22} color={COR_VERDE} />
      <TextInput
        value={valor}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        style={{
          flex: 1,
          color: colors.text,
          fontSize: 15,
          paddingVertical: 14,
        }}
      />
    </View>
  );
}

function SeletorCidadeCampo({
  colors,
  corBorda,
  cidadeSelecionada,
  onAbrir,
  onLimpar,
}: {
  colors: ThemeColors;
  corBorda: string;
  cidadeSelecionada: CidadeBR | null;
  onAbrir: () => void;
  onLimpar: () => void;
}) {
  return (
    <Pressable
      onPress={onAbrir}
      accessibilityLabel="Selecionar cidade"
      style={{
        minHeight: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: corBorda,
        backgroundColor: colors.surface,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <MaterialIcons name="location-city" size={22} color={COR_VERDE} />
      <Text
        style={{
          flex: 1,
          color: cidadeSelecionada ? colors.text : colors.placeholder,
          fontSize: 15,
          paddingVertical: 14,
        }}
        numberOfLines={1}
      >
        {cidadeSelecionada
          ? `${cidadeSelecionada.nome} - ${cidadeSelecionada.uf}`
          : "Selecionar cidade"}
      </Text>
      {cidadeSelecionada ? (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onLimpar();
          }}
          accessibilityLabel="Limpar cidade"
          hitSlop={6}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.surfaceHighlight,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name="close" size={16} color={colors.iconMuted} />
        </Pressable>
      ) : (
        <MaterialIcons
          name="keyboard-arrow-down"
          size={22}
          color={colors.iconMuted}
        />
      )}
    </Pressable>
  );
}

function CampoEstadoReadonly({
  colors,
  corBorda,
  uf,
  estadoNome,
}: {
  colors: ThemeColors;
  corBorda: string;
  uf: string;
  estadoNome: string;
}) {
  const preenchido = !!uf;
  return (
    <View
      style={{
        minHeight: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: corBorda,
        backgroundColor: colors.surface,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        opacity: preenchido ? 1 : 0.55,
      }}
    >
      <MaterialIcons name="map" size={22} color={colors.iconMuted} />
      <Text
        style={{
          flex: 1,
          color: preenchido ? colors.text : colors.placeholder,
          fontSize: 15,
          fontWeight: preenchido ? "bold" : "normal",
          paddingVertical: 14,
        }}
        numberOfLines={1}
      >
        {preenchido ? `${estadoNome || uf} - ${uf}` : "Estado"}
      </Text>
      <MaterialIcons name="lock-outline" size={18} color={colors.iconMuted} />
    </View>
  );
}

function SeletorCidadeModal({
  colors,
  corBorda,
  visivel,
  cidadeAtual,
  onSelecionar,
  onFechar,
}: {
  colors: ThemeColors;
  corBorda: string;
  visivel: boolean;
  cidadeAtual: CidadeBR | null;
  onSelecionar: (c: CidadeBR) => void;
  onFechar: () => void;
}) {
  const { cidades, carregando, erro } = useCidadesBrasil();
  const [busca, setBusca] = useState("");

  const sugestoes = useMemo(() => {
    const termo = normalizarTexto(busca.trim());
    if (!termo) {
      // Sem busca: mostra todas em ordem alfabética (FlatList vira render lazy)
      return cidades;
    }
    return cidades
      .filter((c) => normalizarTexto(c.nome).includes(termo))
      .slice(0, LIMITE_SUGESTOES);
  }, [busca, cidades]);

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="slide"
      onRequestClose={onFechar}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable
          onPress={onFechar}
          style={{
            flex: 1,
            backgroundColor: "rgba(15,23,42,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              paddingTop: 10,
              paddingBottom: 28,
              maxHeight: "82%",
            }}
          >
          {/* Pegador */}
          <View
            style={{
              alignSelf: "center",
              width: 42,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.border,
              marginBottom: 12,
            }}
          />

          {/* Header */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingBottom: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: "bold",
                }}
              >
                Selecionar cidade
              </Text>
              <Text style={{ color: colors.textSubtle, paddingTop: 3 }}>
                Comece a digitar o nome da cidade
              </Text>
            </View>
            <Pressable
              onPress={onFechar}
              accessibilityLabel="Fechar"
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.surfaceHighlight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="close" size={20} color={colors.iconMuted} />
            </Pressable>
          </View>

          {/* Busca */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
            <View
              style={{
                minHeight: 50,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: corBorda,
                backgroundColor: colors.surfaceElevated,
                paddingHorizontal: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <MaterialIcons
                name="search"
                size={20}
                color={colors.iconMuted}
              />
              <TextInput
                value={busca}
                onChangeText={setBusca}
                placeholder="Buscar cidade..."
                placeholderTextColor={colors.placeholder}
                autoCapitalize="none"
                autoFocus
                style={{
                  flex: 1,
                  color: colors.text,
                  paddingVertical: 12,
                }}
              />
              {busca ? (
                <Pressable onPress={() => setBusca("")} hitSlop={6}>
                  <MaterialIcons
                    name="close"
                    size={18}
                    color={colors.iconMuted}
                  />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Estado da lista */}
          {carregando ? (
            <View
              style={{
                paddingVertical: 30,
                alignItems: "center",
                gap: 10,
              }}
            >
              <ActivityIndicator size="small" color={COR_VERDE} />
              <Text style={{ color: colors.textSubtle }}>
                Carregando cidades do Brasil...
              </Text>
            </View>
          ) : erro ? (
            <View style={{ paddingHorizontal: 20, paddingVertical: 24 }}>
              <Text style={{ color: "#DC2626", textAlign: "center" }}>
                {erro}
              </Text>
              <Text
                style={{
                  color: colors.textSubtle,
                  textAlign: "center",
                  paddingTop: 6,
                }}
              >
                Verifique sua conexão e tente novamente.
              </Text>
            </View>
          ) : (
            <FlatList
              data={sugestoes}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 6,
              }}
              ListEmptyComponent={
                <View
                  style={{
                    paddingVertical: 30,
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <MaterialIcons
                    name={busca ? "search-off" : "location-city"}
                    size={36}
                    color={colors.iconMuted}
                  />
                  <Text
                    style={{
                      color: colors.textSubtle,
                      textAlign: "center",
                    }}
                  >
                    {busca
                      ? "Nenhuma cidade encontrada."
                      : `Pesquise entre ${cidades.length.toLocaleString("pt-BR")} cidades brasileiras.`}
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const selecionada = cidadeAtual?.id === item.id;
                return (
                  <Pressable
                    onPress={() => onSelecionar(item)}
                    style={{
                      minHeight: 54,
                      paddingHorizontal: 14,
                      borderRadius: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: selecionada
                        ? "#DCFCE7"
                        : "transparent",
                      marginBottom: 4,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: selecionada ? COR_VERDE : colors.text,
                          fontWeight: selecionada ? "bold" : "500",
                          fontSize: 15,
                        }}
                      >
                        {item.nome}
                      </Text>
                      <Text
                        style={{
                          color: colors.textSubtle,
                          fontSize: 12,
                          paddingTop: 2,
                        }}
                      >
                        {item.uf}
                      </Text>
                    </View>
                    {selecionada ? (
                      <MaterialIcons
                        name="check"
                        size={20}
                        color={COR_VERDE}
                      />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
