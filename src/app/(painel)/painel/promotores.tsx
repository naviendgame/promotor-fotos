import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import {
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import Animated, {
  FadeInUp,
  LinearTransition,
} from "react-native-reanimated";

import { criarUsuarioAuth } from "@/services/criarUsuarioAuth";
import { lojasCollection } from "@/services/lojas-service";
import {
  atualizarUsuario,
  consultaPromotores,
  criarUsuario,
  excluirUsuario,
} from "@/services/usuarios-service";
import type { Loja } from "@/types/loja";
import type { Promotor } from "@/types/usuario";
import {
  Cabecalho,
  Campo,
  CampoBusca,
  FormularioModal,
  Vazio,
  cabecalhoTabela,
  celula,
  celulaCabecalho,
  iconeLinha,
  linhaTabela,
  tabela,
} from "./lojas";

type PromotorWebItem = Promotor & {
  nome: string;
  email: string;
};

export default function PromotoresWeb() {
  const [promotores, setPromotores] = useState<PromotorWebItem[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [busca, setBusca] = useState("");
  const [editado, setEditado] = useState<PromotorWebItem | null>(null);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [novoAberto, setNovoAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const unsubUsuarios = onSnapshot(consultaPromotores(), (snapshot) => {
      const lista = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as PromotorWebItem[];
      lista.sort((a, b) => a.nome.localeCompare(b.nome));
      setPromotores(lista);
    });
    const unsubLojas = onSnapshot(lojasCollection(), (snapshot) => {
      setLojas(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Loja[]);
    });
    return () => { unsubUsuarios(); unsubLojas(); };
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    if (!termo) return promotores;
    return promotores.filter((item) =>
      `${item.nome} ${item.email}`.toLocaleLowerCase("pt-BR").includes(termo),
    );
  }, [busca, promotores]);

  function alternarLoja(id: string) {
    setSelecionadas((atuais) =>
      atuais.includes(id) ? atuais.filter((item) => item !== id) : [...atuais, id],
    );
  }

  function abrirEdicao(promotor: PromotorWebItem) {
    setEditado(promotor);
    setSelecionadas(promotor.lojasIds || []);
  }

  async function salvarLojas() {
    if (!editado || selecionadas.length === 0) {
      Alert.alert("Atencao", "Selecione pelo menos uma loja.");
      return;
    }
    setSalvando(true);
    try {
      await atualizarUsuario(editado.id, {
        lojasIds: selecionadas,
        atualizadoEm: serverTimestamp(),
      });
      setEditado(null);
    } finally {
      setSalvando(false);
    }
  }

  async function cadastrar() {
    if (!nome.trim() || !email.trim() || senha.length < 6 || selecionadas.length === 0) {
      Alert.alert("Atencao", "Preencha os dados, uma senha de 6 caracteres e selecione uma loja.");
      return;
    }
    setSalvando(true);
    try {
      const uid = await criarUsuarioAuth(email, senha);
      await criarUsuario(uid, {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        tipo: "promotor",
        ativo: true,
        primeiroAcesso: true,
        lojasIds: selecionadas,
        criadoEm: serverTimestamp(),
      });
      setNome(""); setEmail(""); setSenha(""); setSelecionadas([]); setNovoAberto(false);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Nao foi possivel cadastrar.");
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAcesso(item: PromotorWebItem) {
    await atualizarUsuario(item.id, {
      ativo: item.ativo === false,
      atualizadoEm: serverTimestamp(),
    });
  }

  async function excluir(item: PromotorWebItem) {
    if (!globalThis.confirm(`Excluir o cadastro de ${item.nome}? As fotos serao preservadas.`)) return;
    await excluirUsuario(item.id);
    globalThis.alert(`Cadastro removido. Exclua tambem a credencial de ${item.email} no Firebase Authentication.`);
  }

  function nomesLojas(item: PromotorWebItem) {
    return lojas.filter((loja) => item.lojasIds?.includes(loja.id)).map((loja) => loja.nome).join(", ") || "Nenhuma loja";
  }

  const seletorLojas = (
    <View style={{ gap: 8 }}>
      <Text style={{ color: "#4B586D", fontWeight: "bold" }}>Lojas permitidas</Text>
      {lojas.map((loja) => {
        const ativa = selecionadas.includes(loja.id);
        return (
          <Pressable
            key={loja.id}
            onPress={() => alternarLoja(loja.id)}
            style={{
              minHeight: 44, borderWidth: 1, borderColor: ativa ? "#2563EB" : "#D6E0F0",
              borderRadius: 8, backgroundColor: ativa ? "#EAF1FF" : "white",
              paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 9,
            }}
          >
            <MaterialIcons name={ativa ? "check-box" : "check-box-outline-blank"} size={21} color={ativa ? "#2563EB" : "#8A96A9"} />
            <Text style={{ color: "#34415A", fontWeight: ativa ? "bold" : "normal" }}>{loja.nome}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 18, paddingBottom: 28 }}>
      <Cabecalho titulo="Promotores" subtitulo={`${promotores.length} profissionais cadastrados`} botao="Novo promotor" icone="person-add" onPress={() => { setSelecionadas([]); setNovoAberto(true); }} />
      <CampoBusca valor={busca} onChange={setBusca} placeholder="Buscar por nome ou email" />
      <Animated.View
        entering={FadeInUp.duration(260)}
        layout={LinearTransition.duration(180)}
        style={tabela}
      >
        <View style={cabecalhoTabela}>
          <Text style={[celulaCabecalho, { flex: 1.4 }]}>PROMOTOR</Text>
          <Text style={[celulaCabecalho, { flex: 1.5 }]}>LOJAS</Text>
          <Text style={[celulaCabecalho, { flex: 0.55 }]}>STATUS</Text>
          <Text style={[celulaCabecalho, { flex: 0.8 }]}>ACOES</Text>
        </View>
        {filtrados.map((item, indice) => {
          const ativo = item.ativo !== false;
          return (
            <Animated.View
              key={item.id}
              entering={FadeInUp.duration(220).delay(indice * 35)}
              layout={LinearTransition.duration(160)}
              style={[
                linhaTabela,
                { borderBottomWidth: indice < filtrados.length - 1 ? 1 : 0 },
              ]}
            >
              <View style={{ flex: 1.4, flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={iconeLinha}><MaterialIcons name="person" size={19} color="#2F6FED" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#263247", fontWeight: "bold" }}>{item.nome}</Text>
                  <Text style={{ color: "#7A879D", fontSize: 12, paddingTop: 3 }}>{item.email}</Text>
                </View>
              </View>
              <Text numberOfLines={2} style={[celula, { flex: 1.5 }]}>{nomesLojas(item)}</Text>
              <View style={{ flex: 0.55 }}>
                <Text style={{ alignSelf: "flex-start", color: ativo ? "#247946" : "#B5323E", backgroundColor: ativo ? "#E4F4EA" : "#FBE7E9", borderRadius: 5, paddingVertical: 5, paddingHorizontal: 8, fontSize: 12, fontWeight: "bold" }}>{ativo ? "Ativo" : "Inativo"}</Text>
              </View>
              <View style={{ flex: 0.8, flexDirection: "row", gap: 6 }}>
                <IconeAcao icone="store" titulo="Alterar lojas" onPress={() => abrirEdicao(item)} />
                <IconeAcao icone={ativo ? "block" : "check-circle"} titulo={ativo ? "Desativar" : "Reativar"} onPress={() => alternarAcesso(item)} />
                <IconeAcao icone="delete-outline" titulo="Excluir" perigo onPress={() => excluir(item)} />
              </View>
            </Animated.View>
          );
        })}
        {filtrados.length === 0 ? <Vazio texto="Nenhum promotor encontrado." /> : null}
      </Animated.View>

      <FormularioModal visivel={novoAberto} titulo="Cadastrar promotor" onClose={() => setNovoAberto(false)} onSave={cadastrar} salvando={salvando}>
        <Campo rotulo="Nome completo" valor={nome} onChange={setNome} />
        <Campo rotulo="Email" valor={email} onChange={setEmail} />
        <Campo rotulo="Senha provisoria" valor={senha} onChange={setSenha} secureTextEntry />
        {seletorLojas}
      </FormularioModal>
      <FormularioModal visivel={!!editado} titulo={`Lojas de ${editado?.nome || ""}`} onClose={() => setEditado(null)} onSave={salvarLojas} salvando={salvando}>
        {seletorLojas}
      </FormularioModal>
    </ScrollView>
  );
}

function IconeAcao({ icone, titulo, onPress, perigo }: { icone: keyof typeof MaterialIcons.glyphMap; titulo: string; onPress: () => void; perigo?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={titulo} style={{ width: 34, height: 34, borderRadius: 7, borderWidth: 1, borderColor: perigo ? "#F0C8CC" : "#D6E0F0", backgroundColor: perigo ? "#FFF5F6" : "#F8FAFF", alignItems: "center", justifyContent: "center" }}>
      <MaterialIcons name={icone} size={18} color={perigo ? "#B5323E" : "#526076"} />
    </Pressable>
  );
}
