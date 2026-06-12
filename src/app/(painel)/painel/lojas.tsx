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
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../../services/firebaseConfig";

type Loja = {
  id: string;
  nome: string;
  cidade?: string;
  estado?: string;
};

export default function LojasWeb() {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    return onSnapshot(collection(db, "lojas"), (snapshot) => {
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
      await addDoc(collection(db, "lojas"), {
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

      <CampoBusca valor={busca} onChange={setBusca} placeholder="Buscar loja, cidade ou estado" />

      <View style={tabela}>
        <View style={cabecalhoTabela}>
          <Text style={[celulaCabecalho, { flex: 1.5 }]}>LOJA</Text>
          <Text style={celulaCabecalho}>CIDADE</Text>
          <Text style={celulaCabecalho}>ESTADO</Text>
        </View>
        {filtradas.map((loja, indice) => (
          <View
            key={loja.id}
            style={[
              linhaTabela,
              { borderBottomWidth: indice < filtradas.length - 1 ? 1 : 0 },
            ]}
          >
            <View style={{ flex: 1.5, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={iconeLinha}>
                <MaterialIcons name="store" size={19} color="#2F6FED" />
              </View>
              <Text style={{ color: "#263247", fontWeight: "bold" }}>{loja.nome}</Text>
            </View>
            <Text style={celula}>{loja.cidade || "-"}</Text>
            <Text style={celula}>{loja.estado || "-"}</Text>
          </View>
        ))}
        {filtradas.length === 0 ? <Vazio texto="Nenhuma loja encontrada." /> : null}
      </View>

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
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <View>
        <Text style={{ color: "#172033", fontSize: 27, fontWeight: "bold" }}>{titulo}</Text>
        <Text style={{ color: "#68758A", paddingTop: 5 }}>{subtitulo}</Text>
      </View>
      {botao && onPress ? (
        <Pressable onPress={onPress} style={botaoPrimario}>
          <MaterialIcons name={icone || "add"} size={20} color="white" />
          <Text style={{ color: "white", fontWeight: "bold" }}>{botao}</Text>
        </Pressable>
      ) : null}
    </View>
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
  return (
    <View
      style={{
        maxWidth: 430,
        minHeight: 44,
        borderWidth: 1,
        borderColor: "#D8DEE8",
        borderRadius: 7,
        backgroundColor: "white",
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
      }}
    >
      <MaterialIcons name="search" size={20} color="#8B97A9" />
      <TextInput
        value={valor}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9AA5B5"
        style={{ flex: 1, color: "#263247", paddingVertical: 11 }}
      />
    </View>
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
  return (
    <View style={{ gap: 7 }}>
      <Text style={{ color: "#4B586D", fontWeight: "bold" }}>{rotulo}</Text>
      <TextInput
        value={valor}
        onChangeText={onChange}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        style={{
          minHeight: 44,
          borderWidth: 1,
          borderColor: "#D5DBE5",
          borderRadius: 7,
          paddingHorizontal: 11,
          color: "#172033",
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
  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={onClose}>
      <View style={fundoModal}>
        <View style={{ width: "100%", maxWidth: 520, maxHeight: "88%", backgroundColor: "white", borderRadius: 8 }}>
          <View style={tituloModal}>
            <Text style={{ color: "#172033", fontSize: 20, fontWeight: "bold" }}>{titulo}</Text>
            <Pressable onPress={onClose} style={botaoFechar}>
              <MaterialIcons name="close" size={21} color="#526076" />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 15 }}>{children}</ScrollView>
          <View style={rodapeModal}>
            <Pressable onPress={onClose} style={botaoSecundario}>
              <Text style={{ color: "#526076", fontWeight: "bold" }}>Cancelar</Text>
            </Pressable>
            <Pressable onPress={onSave} disabled={salvando} style={botaoPrimario}>
              <Text style={{ color: "white", fontWeight: "bold" }}>
                {salvando ? "Salvando..." : "Salvar"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function Vazio({ texto }: { texto: string }) {
  return <Text style={{ color: "#7A879D", padding: 22, textAlign: "center" }}>{texto}</Text>;
}

export const tabela = {
  backgroundColor: "white",
  borderWidth: 1,
  borderColor: "#E0E5ED",
  borderRadius: 8,
  overflow: "hidden" as const,
};
export const cabecalhoTabela = {
  minHeight: 42,
  backgroundColor: "#F7F8FA",
  borderBottomWidth: 1,
  borderBottomColor: "#E3E7EE",
  paddingHorizontal: 17,
  flexDirection: "row" as const,
  alignItems: "center" as const,
  gap: 14,
};
export const linhaTabela = {
  minHeight: 66,
  borderBottomColor: "#EDF0F4",
  paddingHorizontal: 17,
  paddingVertical: 11,
  flexDirection: "row" as const,
  alignItems: "center" as const,
  gap: 14,
};
export const celulaCabecalho = { flex: 1, color: "#7B879A", fontSize: 11, fontWeight: "bold" as const };
export const celula = { flex: 1, color: "#59677D" };
export const iconeLinha = { width: 34, height: 34, borderRadius: 7, backgroundColor: "#E9F0FE", alignItems: "center" as const, justifyContent: "center" as const };
export const botaoPrimario = { minHeight: 42, borderRadius: 7, backgroundColor: "#2F6FED", paddingHorizontal: 15, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8 };
const fundoModal = { flex: 1, backgroundColor: "rgba(20,28,42,0.62)", justifyContent: "center" as const, alignItems: "center" as const, padding: 22 };
const tituloModal = { minHeight: 62, borderBottomWidth: 1, borderBottomColor: "#E5E9EF", paddingHorizontal: 20, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const };
const rodapeModal = { minHeight: 68, borderTopWidth: 1, borderTopColor: "#E5E9EF", paddingHorizontal: 20, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "flex-end" as const, gap: 9 };
const botaoFechar = { width: 36, height: 36, borderRadius: 7, backgroundColor: "#F0F2F6", alignItems: "center" as const, justifyContent: "center" as const };
const botaoSecundario = { minHeight: 42, borderRadius: 7, borderWidth: 1, borderColor: "#D7DDE7", paddingHorizontal: 15, justifyContent: "center" as const };
