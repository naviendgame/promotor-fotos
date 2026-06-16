import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { onSnapshot, serverTimestamp } from "firebase/firestore";

import { lojasCollection } from "@/services/lojas-service";
import {
  atualizarUsuario,
  consultaPromotores,
  excluirUsuario,
} from "@/services/usuarios-service";
import type { Loja } from "@/types/loja";
import type { Promotor } from "@/types/usuario";

type PromotorGerenciado = Promotor & {
  nome: string;
  email: string;
};

export default function GerenciarPromotores() {
  const [promotores, setPromotores] = useState<PromotorGerenciado[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [busca, setBusca] = useState("");
  const [promotorEditado, setPromotorEditado] =
    useState<PromotorGerenciado | null>(null);
  const [lojasSelecionadas, setLojasSelecionadas] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      consultaPromotores(),
      (snapshot) => {
        const lista = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as PromotorGerenciado[];

        lista.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
        setPromotores(lista);
      },
      (error) => {
        console.log(error);
        Alert.alert("Erro", "Nao foi possivel carregar os promotores.");
      },
    );
  }, []);

  useEffect(() => {
    return onSnapshot(
      lojasCollection(),
      (snapshot) => {
        const lista = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Loja[];

        lista.sort((a, b) => a.nome.localeCompare(b.nome));
        setLojas(lista);
      },
      (error) => {
        console.log(error);
        Alert.alert("Erro", "Nao foi possivel carregar as lojas.");
      },
    );
  }, []);

  const promotoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    if (!termo) return promotores;

    return promotores.filter(
      (promotor) =>
        promotor.nome?.toLocaleLowerCase("pt-BR").includes(termo) ||
        promotor.email?.toLocaleLowerCase("pt-BR").includes(termo),
    );
  }, [busca, promotores]);

  function abrirEdicao(promotor: PromotorGerenciado) {
    setPromotorEditado(promotor);
    setLojasSelecionadas(promotor.lojasIds || []);
  }

  function alternarLoja(lojaId: string) {
    setLojasSelecionadas((atuais) =>
      atuais.includes(lojaId)
        ? atuais.filter((id) => id !== lojaId)
        : [...atuais, lojaId],
    );
  }

  async function salvarLojas() {
    if (!promotorEditado || salvando) return;

    if (lojasSelecionadas.length === 0) {
      Alert.alert("Atencao", "Selecione pelo menos uma loja.");
      return;
    }

    try {
      setSalvando(true);
      await atualizarUsuario(promotorEditado.id, {
        lojasIds: lojasSelecionadas,
        atualizadoEm: serverTimestamp(),
      });
      setPromotorEditado(null);
      Alert.alert("Sucesso", "Lojas do promotor atualizadas.");
    } catch (error: any) {
      console.log(error);
      Alert.alert("Erro", error.message || "Nao foi possivel salvar.");
    } finally {
      setSalvando(false);
    }
  }

  function alterarAcesso(promotor: PromotorGerenciado) {
    const estaAtivo = promotor.ativo !== false;
    const acao = estaAtivo ? "desativar" : "reativar";

    Alert.alert(
      estaAtivo ? "Desativar acesso" : "Reativar acesso",
      `Deseja ${acao} o acesso de ${promotor.nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: estaAtivo ? "Desativar" : "Reativar",
          style: estaAtivo ? "destructive" : "default",
          onPress: async () => {
            try {
              await atualizarUsuario(promotor.id, {
                ativo: !estaAtivo,
                atualizadoEm: serverTimestamp(),
              });
            } catch (error: any) {
              console.log(error);
              Alert.alert(
                "Erro",
                error.message || "Nao foi possivel alterar o acesso.",
              );
            }
          },
        },
      ],
    );
  }

  function excluirPromotor(promotor: PromotorGerenciado) {
    Alert.alert(
      "Excluir cadastro",
      `Deseja excluir permanentemente o cadastro de ${promotor.nome}? As fotos enviadas por esse promotor serao preservadas.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir permanentemente",
          style: "destructive",
          onPress: async () => {
            try {
              setExcluindoId(promotor.id);
              await excluirUsuario(promotor.id);
              Alert.alert(
                "Cadastro removido",
                `O acesso ao aplicativo foi removido e as fotos foram preservadas.\n\nPara concluir a exclusao da credencial, remova manualmente no Firebase Authentication:\n${promotor.email}`,
              );
            } catch (error: any) {
              console.log(error);
              Alert.alert(
                "Erro",
                error.message || "Nao foi possivel excluir o cadastro.",
              );
            } finally {
              setExcluindoId(null);
            }
          },
        },
      ],
    );
  }

  function nomesLojas(promotor: PromotorGerenciado) {
    const nomes = lojas
      .filter((loja) => promotor.lojasIds?.includes(loja.id))
      .map((loja) => loja.nome);

    return nomes.length > 0 ? nomes.join(", ") : "Nenhuma loja vinculada";
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      <FlatList
        data={promotoresFiltrados}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          padding: 20,
          paddingTop: 60,
          paddingBottom: 30,
        }}
        ListHeaderComponent={
          <View style={{ gap: 14, paddingBottom: 18 }}>
            <Pressable
              onPress={() => router.back()}
              accessibilityLabel="Voltar"
              style={{
                alignSelf: "flex-start",
                width: 42,
                height: 42,
                borderRadius: 8,
                backgroundColor: "#242424",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="arrow-back" size={24} color="white" />
            </Pressable>

            <Text style={{ color: "white", fontSize: 28, fontWeight: "bold" }}>
              Promotores
            </Text>

            <TextInput
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar por nome ou email"
              placeholderTextColor="#777"
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: "#444",
                borderRadius: 8,
                padding: 13,
                color: "white",
              }}
            />
          </View>
        }
        ListEmptyComponent={
          <Text style={{ color: "#888" }}>Nenhum promotor encontrado.</Text>
        }
        renderItem={({ item }) => {
          const estaAtivo = item.ativo !== false;

          return (
            <View
              style={{
                backgroundColor: "#1E1E1E",
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
                gap: 8,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    selectable
                    style={{ color: "white", fontSize: 18, fontWeight: "bold" }}
                  >
                    {item.nome || "Sem nome"}
                  </Text>
                  <Text selectable style={{ color: "#aaa" }}>
                    {item.email}
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: estaAtivo ? "#14532D" : "#7F1D1D",
                    borderRadius: 6,
                    paddingVertical: 5,
                    paddingHorizontal: 8,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    {estaAtivo ? "Ativo" : "Inativo"}
                  </Text>
                </View>
              </View>

              <Text style={{ color: "#ccc", lineHeight: 20 }}>
                Lojas: {nomesLojas(item)}
              </Text>

              <View style={{ flexDirection: "row", gap: 10, paddingTop: 4 }}>
                <Pressable
                  onPress={() => abrirEdicao(item)}
                  style={{
                    flex: 1,
                    backgroundColor: "#2563EB",
                    borderRadius: 8,
                    padding: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    Alterar lojas
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => alterarAcesso(item)}
                  style={{
                    flex: 1,
                    backgroundColor: estaAtivo ? "#7F1D1D" : "#166534",
                    borderRadius: 8,
                    padding: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    {estaAtivo ? "Desativar" : "Reativar"}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => excluirPromotor(item)}
                disabled={excluindoId === item.id}
                style={{
                  minHeight: 42,
                  borderWidth: 1,
                  borderColor: "#DC2626",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: excluindoId === item.id ? 0.6 : 1,
                }}
              >
                <MaterialIcons
                  name="delete-outline"
                  size={21}
                  color="#F87171"
                />
                <Text style={{ color: "#F87171", fontWeight: "bold" }}>
                  {excluindoId === item.id
                    ? "Excluindo..."
                    : "Excluir cadastro"}
                </Text>
              </Pressable>
            </View>
          );
        }}
      />

      <Modal
        visible={!!promotorEditado}
        transparent
        animationType="fade"
        onRequestClose={() => setPromotorEditado(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.75)",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              maxHeight: "80%",
              backgroundColor: "#1E1E1E",
              borderRadius: 8,
              padding: 18,
              gap: 14,
            }}
          >
            <Text style={{ color: "white", fontSize: 21, fontWeight: "bold" }}>
              Lojas de {promotorEditado?.nome}
            </Text>

            <ScrollView contentInsetAdjustmentBehavior="automatic">
              <View style={{ gap: 8 }}>
                {lojas.map((loja) => {
                  const selecionada = lojasSelecionadas.includes(loja.id);

                  return (
                    <Pressable
                      key={loja.id}
                      onPress={() => alternarLoja(loja.id)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        backgroundColor: selecionada ? "#1D4ED8" : "#292929",
                        borderRadius: 8,
                        padding: 13,
                      }}
                    >
                      <MaterialIcons
                        name={
                          selecionada ? "check-box" : "check-box-outline-blank"
                        }
                        size={22}
                        color="white"
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: "white", fontWeight: "bold" }}>
                          {loja.nome}
                        </Text>
                        {loja.cidade ? (
                          <Text style={{ color: "#ccc", paddingTop: 2 }}>
                            {loja.cidade}
                            {loja.estado ? ` - ${loja.estado}` : ""}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => setPromotorEditado(null)}
                disabled={salvando}
                style={{
                  flex: 1,
                  backgroundColor: "#444",
                  borderRadius: 8,
                  padding: 13,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  Cancelar
                </Text>
              </Pressable>
              <Pressable
                onPress={salvarLojas}
                disabled={salvando}
                style={{
                  flex: 1,
                  backgroundColor: salvando ? "#475569" : "#16A34A",
                  borderRadius: 8,
                  padding: 13,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  {salvando ? "Salvando..." : "Salvar"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
