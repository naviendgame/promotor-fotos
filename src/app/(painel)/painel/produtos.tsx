import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import Animated, {
  FadeInUp,
  LinearTransition,
} from "react-native-reanimated";

import {
  atualizarProduto,
  consultaProdutosOrdenados,
  criarProduto,
} from "@/services/produtos-service";
import type { ThemeColors } from "@/theme/colors";
import type { Produto } from "@/types/produto";
import { prepararImagemBase64 } from "@/utils/imagem";

import {
  Cabecalho,
  Campo,
  CampoBusca,
  FormularioModal,
  Vazio,
  useEstilosPainel,
} from "./lojas";

type ProdutoForm = {
  codigo: string;
  nome: string;
  marca: string;
  imagemBase64: string;
};

const FORMULARIO_VAZIO: ProdutoForm = {
  codigo: "",
  nome: "",
  marca: "",
  imagemBase64: "",
};

export default function ProdutosPainel() {
  const estilos = useEstilosPainel();
  const { colors } = estilos;
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editado, setEditado] = useState<Produto | null>(null);
  const [formulario, setFormulario] = useState<ProdutoForm>(FORMULARIO_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [processandoFoto, setProcessandoFoto] = useState(false);
  const [mensagemModal, setMensagemModal] = useState("");

  useEffect(() => {
    return onSnapshot(consultaProdutosOrdenados(), (snapshot) => {
      setProdutos(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Produto[],
      );
    });
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    if (!termo) return produtos;

    return produtos.filter((produto) =>
      [produto.codigo, produto.nome, produto.marca]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(termo),
    );
  }, [busca, produtos]);

  function atualizarCampo(campo: keyof ProdutoForm, valor: string) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function abrirCadastro() {
    setEditado(null);
    setFormulario(FORMULARIO_VAZIO);
    setMensagemModal("");
    setModalAberto(true);
  }

  function abrirEdicao(produto: Produto) {
    setEditado(produto);
    setFormulario({
      codigo: produto.codigo || "",
      nome: produto.nome || "",
      marca: produto.marca || "",
      imagemBase64: produto.imagemBase64 || "",
    });
    setMensagemModal("");
    setModalAberto(true);
  }

  async function escolherFoto() {
    try {
      setProcessandoFoto(true);
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        allowsEditing: false,
      });

      if (!resultado.canceled) {
        const imagemBase64 = await prepararImagemBase64(resultado.assets[0].uri);
        atualizarCampo("imagemBase64", imagemBase64);
      }
    } catch (error: any) {
      Alert.alert(
        "Foto do produto",
        error.message || "Nao foi possivel anexar a foto.",
      );
    } finally {
      setProcessandoFoto(false);
    }
  }

  async function salvarProduto() {
    const codigo = formulario.codigo.trim();
    const nome = formulario.nome.trim();
    const marca = formulario.marca.trim();

    if (!codigo || !nome || !marca) {
      setMensagemModal("Preencha codigo, nome e marca antes de salvar.");
      return;
    }

    const dados = {
      codigo,
      nome,
      marca,
      imagemBase64: formulario.imagemBase64,
      ativo: editado?.ativo === false ? false : true,
      atualizadoEm: serverTimestamp(),
    };

    try {
      setSalvando(true);
      setMensagemModal("Salvando produto...");

      if (editado) {
        await atualizarProduto(editado.id, dados);
      } else {
        await criarProduto({
          ...dados,
          criadoEm: serverTimestamp(),
        });
      }

      setModalAberto(false);
      setEditado(null);
      setFormulario(FORMULARIO_VAZIO);
      setMensagemModal("");
    } catch (error: any) {
      console.log(error);
      const mensagem =
        error?.code === "permission-denied"
          ? "Sem permissao para salvar produtos. Atualize as regras do Firestore no Firebase Console."
          : error?.message || "Nao foi possivel salvar o produto.";
      setMensagemModal(mensagem);
      Alert.alert("Erro", mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(produto: Produto) {
    await atualizarProduto(produto.id, {
      ativo: produto.ativo === false,
      atualizadoEm: serverTimestamp(),
    });
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: 18, paddingBottom: 28 }}
    >
      <Cabecalho
        titulo="Produtos"
        subtitulo={`${produtos.length} itens cadastrados`}
        botao="Novo produto"
        icone="add-box"
        onPress={abrirCadastro}
      />

      <CampoBusca
        valor={busca}
        onChange={setBusca}
        placeholder="Buscar por codigo, produto ou marca"
      />

      <Animated.View
        entering={FadeInUp.duration(260)}
        layout={LinearTransition.duration(180)}
        style={estilos.tabela}
      >
        <View style={estilos.cabecalhoTabela}>
          <Text style={[estilos.celulaCabecalho, { flex: 1.6 }]}>PRODUTO</Text>
          <Text style={[estilos.celulaCabecalho, { flex: 0.7 }]}>CODIGO</Text>
          <Text style={estilos.celulaCabecalho}>MARCA</Text>
          <Text style={[estilos.celulaCabecalho, { flex: 0.6 }]}>STATUS</Text>
          <Text style={[estilos.celulaCabecalho, { flex: 0.8 }]}>ACOES</Text>
        </View>

        {filtrados.map((produto, indice) => {
          const ativo = produto.ativo !== false;

          return (
            <Animated.View
              key={produto.id}
              entering={FadeInUp.duration(220).delay(indice * 30)}
              layout={LinearTransition.duration(160)}
              style={[
                estilos.linhaTabela,
                { borderBottomWidth: indice < filtrados.length - 1 ? 1 : 0 },
              ]}
            >
              <View
                style={{
                  flex: 1.6,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <MiniaturaProduto produto={produto} colors={colors} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "bold" }}>
                    {produto.nome}
                  </Text>
                  <Text
                    style={{
                      color: colors.textSubtle,
                      fontSize: 12,
                      paddingTop: 3,
                    }}
                  >
                    {produto.imagemBase64 ? "Com foto" : "Sem foto"}
                  </Text>
                </View>
              </View>
              <Text selectable style={[estilos.celula, { flex: 0.7 }]}>
                {produto.codigo || "-"}
              </Text>
              <Text numberOfLines={2} style={estilos.celula}>
                {produto.marca || "-"}
              </Text>
              <View style={{ flex: 0.6 }}>
                <Text style={ativo ? estilos.badgeAtivo : estilos.badgeInativo}>
                  {ativo ? "Ativo" : "Inativo"}
                </Text>
              </View>
              <View style={{ flex: 0.8, flexDirection: "row", gap: 6 }}>
                <IconeAcao
                  colors={colors}
                  icone="edit"
                  titulo="Editar produto"
                  onPress={() => abrirEdicao(produto)}
                />
                <IconeAcao
                  colors={colors}
                  icone={ativo ? "block" : "check-circle"}
                  titulo={ativo ? "Desativar" : "Reativar"}
                  onPress={() => alternarAtivo(produto)}
                />
              </View>
            </Animated.View>
          );
        })}

        {filtrados.length === 0 ? (
          <Vazio texto="Nenhum produto encontrado." />
        ) : null}
      </Animated.View>

      <FormularioModal
        visivel={modalAberto}
        titulo={editado ? "Editar produto" : "Cadastrar produto"}
        onClose={() => setModalAberto(false)}
        onSave={salvarProduto}
        salvando={salvando || processandoFoto}
      >
        <Campo
          rotulo="Codigo"
          valor={formulario.codigo}
          onChange={(valor) => atualizarCampo("codigo", valor)}
        />
        <Campo
          rotulo="Nome do produto"
          valor={formulario.nome}
          onChange={(valor) => atualizarCampo("nome", valor)}
        />
        <Campo
          rotulo="Marca"
          valor={formulario.marca}
          onChange={(valor) => atualizarCampo("marca", valor)}
        />

        {mensagemModal ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: mensagemModal.includes("Salvando")
                ? colors.border
                : colors.danger,
              backgroundColor: mensagemModal.includes("Salvando")
                ? colors.surfaceElevated
                : colors.dangerSurface,
              borderRadius: 8,
              padding: 11,
            }}
          >
            <Text
              style={{
                color: mensagemModal.includes("Salvando")
                  ? colors.textMuted
                  : colors.dangerText,
                fontWeight: "bold",
              }}
            >
              {mensagemModal}
            </Text>
          </View>
        ) : null}

        <FotoProduto
          colors={colors}
          imagemBase64={formulario.imagemBase64}
          processando={processandoFoto}
          onEscolher={escolherFoto}
          onRemover={() => atualizarCampo("imagemBase64", "")}
        />
      </FormularioModal>
    </ScrollView>
  );
}

function MiniaturaProduto({
  produto,
  colors,
}: {
  produto: Produto;
  colors: ThemeColors;
}) {
  if (produto.imagemBase64) {
    return (
      <Image
        source={{ uri: produto.imagemBase64 }}
        contentFit="cover"
        style={{
          width: 42,
          height: 42,
          borderRadius: 8,
          backgroundColor: colors.surfaceElevated,
        }}
      />
    );
  }

  return (
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
      <MaterialIcons name="inventory-2" size={20} color={colors.primary} />
    </View>
  );
}

function FotoProduto({
  colors,
  imagemBase64,
  processando,
  onEscolher,
  onRemover,
}: {
  colors: ThemeColors;
  imagemBase64: string;
  processando: boolean;
  onEscolher: () => void;
  onRemover: () => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.textMuted, fontWeight: "bold" }}>
        Foto do produto
      </Text>

      <View
        style={{
          minHeight: 132,
          borderRadius: 8,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: colors.border,
          backgroundColor: colors.backgroundAlt,
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 13,
        }}
      >
        {imagemBase64 ? (
          <Image
            source={{ uri: imagemBase64 }}
            contentFit="cover"
            style={{
              width: 108,
              height: 108,
              borderRadius: 8,
              backgroundColor: colors.surfaceElevated,
            }}
          />
        ) : (
          <View
            style={{
              width: 108,
              height: 108,
              borderRadius: 8,
              backgroundColor: colors.primarySurface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons
              name="add-photo-alternate"
              size={34}
              color={colors.primary}
            />
          </View>
        )}

        <View style={{ flex: 1, gap: 9 }}>
          <Text style={{ color: colors.textSubtle, lineHeight: 19 }}>
            Opcional. A foto ajuda o promotor a identificar o produto na hora
            de registrar estoque, ruptura ou devolucao.
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Pressable
              onPress={onEscolher}
              disabled={processando}
              style={{
                minHeight: 38,
                borderRadius: 7,
                backgroundColor: colors.primary,
                paddingHorizontal: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                opacity: processando ? 0.65 : 1,
              }}
            >
              <MaterialIcons
                name="photo-library"
                size={18}
                color={colors.primaryText}
              />
              <Text style={{ color: colors.primaryText, fontWeight: "bold" }}>
                {processando ? "Carregando..." : "Adicionar foto"}
              </Text>
            </Pressable>

            {imagemBase64 ? (
              <Pressable
                onPress={onRemover}
                disabled={processando}
                style={{
                  minHeight: 38,
                  borderRadius: 7,
                  borderWidth: 1,
                  borderColor: colors.danger,
                  paddingHorizontal: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                }}
              >
                <MaterialIcons
                  name="delete-outline"
                  size={18}
                  color={colors.danger}
                />
                <Text style={{ color: colors.danger, fontWeight: "bold" }}>
                  Remover
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

function IconeAcao({
  colors,
  icone,
  titulo,
  onPress,
  perigo,
}: {
  colors: ThemeColors;
  icone: keyof typeof MaterialIcons.glyphMap;
  titulo: string;
  onPress: () => void;
  perigo?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={titulo}
      style={{
        width: 34,
        height: 34,
        borderRadius: 7,
        borderWidth: 1,
        borderColor: perigo ? colors.danger : colors.border,
        backgroundColor: perigo
          ? colors.dangerSurface
          : colors.surfaceElevated,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <MaterialIcons
        name={icone}
        size={18}
        color={perigo ? colors.danger : colors.textMuted}
      />
    </Pressable>
  );
}
