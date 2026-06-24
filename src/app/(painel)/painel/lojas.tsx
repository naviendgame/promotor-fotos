import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import {
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import Animated, {
  FadeInUp,
  LinearTransition,
  ZoomIn,
} from "react-native-reanimated";

import {
  criarLoja,
  lojasCollection,
} from "@/services/lojas-service";
import { useTheme } from "@/theme/theme-context";
import type { Loja } from "@/types/loja";

/**
 * Hook que devolve todos os estilos compartilhados das telas do painel web,
 * respondendo automaticamente ao tema atual.
 */
export function useEstilosPainel() {
  const { colors, scheme } = useTheme();

  const sombraSuave =
    scheme === "light"
      ? "0 10px 24px rgba(37, 99, 235, 0.07)"
      : "0 10px 24px rgba(0, 0, 0, 0.35)";
  const sombraBotao =
    scheme === "light"
      ? "0 8px 18px rgba(37, 99, 235, 0.22)"
      : "0 8px 18px rgba(47, 111, 237, 0.45)";

  return {
    colors,
    scheme,
    tabela: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      overflow: "hidden" as const,
      boxShadow: sombraSuave,
    },
    cabecalhoTabela: {
      minHeight: 44,
      backgroundColor: colors.surfaceElevated,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 17,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 14,
    },
    linhaTabela: {
      minHeight: 68,
      borderBottomColor: colors.border,
      paddingHorizontal: 17,
      paddingVertical: 11,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 14,
    },
    celulaCabecalho: {
      flex: 1,
      color: colors.textSubtle,
      fontSize: 11,
      fontWeight: "bold" as const,
    },
    celula: { flex: 1, color: colors.textMuted },
    iconeLinha: {
      width: 34,
      height: 34,
      borderRadius: 7,
      backgroundColor: colors.primarySurface,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    botaoPrimario: {
      minHeight: 42,
      borderRadius: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 15,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 8,
      boxShadow: sombraBotao,
    },
    fundoModal: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      padding: 22,
    },
    tituloModal: {
      minHeight: 62,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 20,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
    },
    rodapeModal: {
      minHeight: 68,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 20,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "flex-end" as const,
      gap: 9,
    },
    botaoFechar: {
      width: 36,
      height: 36,
      borderRadius: 7,
      backgroundColor: colors.surfaceElevated,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    botaoSecundario: {
      minHeight: 42,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 15,
      justifyContent: "center" as const,
    },
    badgeAtivo: {
      alignSelf: "flex-start" as const,
      color: colors.successText,
      backgroundColor: colors.successSurface,
      borderRadius: 5,
      paddingVertical: 5,
      paddingHorizontal: 8,
      fontSize: 12,
      fontWeight: "bold" as const,
    },
    badgeInativo: {
      alignSelf: "flex-start" as const,
      color: colors.dangerText,
      backgroundColor: colors.dangerSurface,
      borderRadius: 5,
      paddingVertical: 5,
      paddingHorizontal: 8,
      fontSize: 12,
      fontWeight: "bold" as const,
    },
  };
}

export default function LojasWeb() {
  const estilos = useEstilosPainel();
  const { colors } = estilos;
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    return onSnapshot(lojasCollection(), (snapshot) => {
      const lista = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Loja[];
      lista.sort((a, b) => a.nome.localeCompare(b.nome));
      setLojas(lista);
    });
  }, []);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    if (!termo) return lojas;
    return lojas.filter((loja) =>
      `${loja.nome} ${loja.cidade || ""} ${loja.estado || ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(termo),
    );
  }, [busca, lojas]);

  async function cadastrar() {
    if (!nome.trim() || !cidade.trim() || !estado.trim()) {
      Alert.alert("Atencao", "Preencha todos os campos.");
      return;
    }

    try {
      setSalvando(true);
      await criarLoja({
        nome: nome.trim(),
        cidade: cidade.trim(),
        estado: estado.trim().toUpperCase(),
        criadoEm: serverTimestamp(),
      });
      setNome("");
      setCidade("");
      setEstado("");
      setModalAberto(false);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Nao foi possivel cadastrar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 18, paddingBottom: 28 }}
    >
      <Cabecalho
        titulo="Lojas"
        subtitulo={`${lojas.length} estabelecimentos cadastrados`}
        botao="Nova loja"
        icone="add-business"
        onPress={() => setModalAberto(true)}
      />

      <CampoBusca
        valor={busca}
        onChange={setBusca}
        placeholder="Buscar loja, cidade ou estado"
      />

      <Animated.View
        entering={FadeInUp.duration(260)}
        layout={LinearTransition.duration(180)}
        style={estilos.tabela}
      >
        <View style={estilos.cabecalhoTabela}>
          <Text style={[estilos.celulaCabecalho, { flex: 1.5 }]}>LOJA</Text>
          <Text style={estilos.celulaCabecalho}>CIDADE</Text>
          <Text style={estilos.celulaCabecalho}>ESTADO</Text>
        </View>
        {filtradas.map((loja, indice) => (
          <Animated.View
            entering={FadeInUp.duration(220).delay(indice * 35)}
            layout={LinearTransition.duration(160)}
            key={loja.id}
            style={[
              estilos.linhaTabela,
              { borderBottomWidth: indice < filtradas.length - 1 ? 1 : 0 },
            ]}
          >
            <View
              style={{
                flex: 1.5,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <View style={estilos.iconeLinha}>
                <MaterialIcons name="store" size={19} color={colors.primary} />
              </View>
              <Text style={{ color: colors.text, fontWeight: "bold" }}>
                {loja.nome}
              </Text>
            </View>
            <Text style={estilos.celula}>{loja.cidade || "-"}</Text>
            <Text style={estilos.celula}>{loja.estado || "-"}</Text>
          </Animated.View>
        ))}
        {filtradas.length === 0 ? (
          <Vazio texto="Nenhuma loja encontrada." />
        ) : null}
      </Animated.View>

      <FormularioModal
        visivel={modalAberto}
        titulo="Cadastrar loja"
        onClose={() => setModalAberto(false)}
        onSave={cadastrar}
        salvando={salvando}
      >
        <Campo rotulo="Nome da loja" valor={nome} onChange={setNome} />
        <Campo rotulo="Cidade" valor={cidade} onChange={setCidade} />
        <Campo rotulo="Estado" valor={estado} onChange={setEstado} maxLength={2} />
      </FormularioModal>
    </ScrollView>
  );
}

export function Cabecalho({
  titulo,
  subtitulo,
  botao,
  icone,
  onPress,
}: {
  titulo: string;
  subtitulo: string;
  botao?: string;
  icone?: keyof typeof MaterialIcons.glyphMap;
  onPress?: () => void;
}) {
  const estilos = useEstilosPainel();
  const { colors } = estilos;

  return (
    <Animated.View
      entering={FadeInUp.duration(240)}
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <View>
        <Text style={{ color: colors.text, fontSize: 27, fontWeight: "bold" }}>
          {titulo}
        </Text>
        <Text style={{ color: colors.textSubtle, paddingTop: 5 }}>
          {subtitulo}
        </Text>
      </View>
      {botao && onPress ? (
        <Pressable onPress={onPress} style={estilos.botaoPrimario}>
          <MaterialIcons
            name={icone || "add"}
            size={20}
            color={colors.primaryText}
          />
          <Text style={{ color: colors.primaryText, fontWeight: "bold" }}>
            {botao}
          </Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

export function CampoBusca({
  valor,
  onChange,
  placeholder,
}: {
  valor: string;
  onChange: (valor: string) => void;
  placeholder: string;
}) {
  const { colors, scheme } = useTheme();
  const sombra =
    scheme === "light"
      ? "0 8px 18px rgba(37, 99, 235, 0.06)"
      : "0 8px 18px rgba(0, 0, 0, 0.25)";

  return (
    <Animated.View
      entering={FadeInUp.duration(240).delay(40)}
      style={{
        maxWidth: 430,
        minHeight: 44,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        backgroundColor: colors.surface,
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
        boxShadow: sombra,
      }}
    >
      <MaterialIcons name="search" size={20} color={colors.iconMuted} />
      <TextInput
        value={valor}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        style={{ flex: 1, color: colors.text, paddingVertical: 11 }}
      />
    </Animated.View>
  );
}

export function Campo({
  rotulo,
  valor,
  onChange,
  secureTextEntry,
  maxLength,
}: {
  rotulo: string;
  valor: string;
  onChange: (valor: string) => void;
  secureTextEntry?: boolean;
  maxLength?: number;
}) {
  const { colors } = useTheme();

  return (
    <View style={{ gap: 7 }}>
      <Text style={{ color: colors.textMuted, fontWeight: "bold" }}>
        {rotulo}
      </Text>
      <TextInput
        value={valor}
        onChangeText={onChange}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        placeholderTextColor={colors.placeholder}
        style={{
          minHeight: 44,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 7,
          paddingHorizontal: 11,
          color: colors.text,
          backgroundColor: colors.backgroundAlt,
        }}
      />
    </View>
  );
}

export function FormularioModal({
  visivel,
  titulo,
  onClose,
  onSave,
  salvando,
  children,
}: {
  visivel: boolean;
  titulo: string;
  onClose: () => void;
  onSave: () => void;
  salvando: boolean;
  children: React.ReactNode;
}) {
  const estilos = useEstilosPainel();
  const { colors, scheme } = estilos;
  const sombraModal =
    scheme === "light"
      ? "0 18px 50px rgba(15, 23, 42, 0.22)"
      : "0 18px 50px rgba(0, 0, 0, 0.65)";

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={estilos.fundoModal}>
        <Animated.View
          entering={ZoomIn.duration(180)}
          style={{
            width: "100%",
            maxWidth: 520,
            maxHeight: "88%",
            backgroundColor: colors.surface,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            boxShadow: sombraModal,
          }}
        >
          <View style={estilos.tituloModal}>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}>
              {titulo}
            </Text>
            <Pressable onPress={onClose} style={estilos.botaoFechar}>
              <MaterialIcons name="close" size={21} color={colors.textMuted} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 15 }}>
            {children}
          </ScrollView>
          <View style={estilos.rodapeModal}>
            <Pressable onPress={onClose} style={estilos.botaoSecundario}>
              <Text style={{ color: colors.textMuted, fontWeight: "bold" }}>
                Cancelar
              </Text>
            </Pressable>
            <Pressable
              onPress={onSave}
              disabled={salvando}
              style={estilos.botaoPrimario}
            >
              <Text style={{ color: colors.primaryText, fontWeight: "bold" }}>
                {salvando ? "Salvando..." : "Salvar"}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function Vazio({ texto }: { texto: string }) {
  const { colors } = useTheme();
  return (
    <Text
      style={{ color: colors.textSubtle, padding: 22, textAlign: "center" }}
    >
      {texto}
    </Text>
  );
}

/**
 * @deprecated Mantido por compatibilidade temporária — use `useEstilosPainel()`.
 * Esses objetos ficaram congelados no tema escuro e não respondem a alterações.
 */
export const tabela = {};
export const cabecalhoTabela = {};
export const linhaTabela = {};
export const celulaCabecalho = {};
export const celula = {};
export const iconeLinha = {};
export const botaoPrimario = {};
