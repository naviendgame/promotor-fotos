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

import {
  atualizarProduto,
  consultaProdutosOrdenados,
  criarProduto,
} from "@/services/produtos-service";
import { useTheme } from "@/theme/theme-context";
import type { ThemeColors } from "@/theme/colors";
import type { Produto } from "@/types/produto";

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
  complemento: string;
  marca: string;
  fornecedor: string;
  categoria: string;
};

const FORMULARIO_VAZIO: ProdutoForm = {
  codigo: "",
  nome: "",
  complemento: "",
  marca: "",
  fornecedor: "",
  categoria: "",
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
      [
        produto.codigo,
        produto.nome,
        produto.complemento,
        produto.marca,
        produto.fornecedor,
        produto.categoria,
      ]
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
    setModalAberto(true);
  }

  function abrirEdicao(produto: Produto) {
    setEditado(produto);
    setFormulario({
      codigo: produto.codigo || "",
      nome: produto.nome || "",
      complemento: produto.complemento || "",
      marca: produto.marca || "",
      fornecedor: produto.fornecedor || "",
      categoria: produto.categoria || "",
    });
    setModalAberto(true);
  }

  async function salvarProduto() {
    const nome = formulario.nome.trim();

    if (!nome) {
      Alert.alert("Atencao", "Informe o nome do produto.");
      return;
    }

    const dados = {
      codigo: formulario.codigo.trim(),
      nome,
      complemento: formulario.complemento.trim(),
      marca: formulario.marca.trim(),
      fornecedor: formulario.fornecedor.trim(),
      categoria: formulario.categoria.trim(),
      ativo: editado?.ativo === false ? false : true,
      atualizadoEm: serverTimestamp(),
    };

    try {
      setSalvando(true);

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
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Nao foi possivel salvar.");
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
        placeholder="Buscar por codigo, produto ou fornecedor"
      />

      <Animated.View
        entering={FadeInUp.duration(260)}
        layout={LinearTransition.duration(180)}
        style={estilos.tabela}
      >
        <View style={estilos.cabecalhoTabela}>
          <Text style={[estilos.celulaCabecalho, { flex: 0.7 }]}>CODIGO</Text>
          <Text style={[estilos.celulaCabecalho, { flex: 1.5 }]}>PRODUTO</Text>
          <Text style={estilos.celulaCabecalho}>FORNECEDOR</Text>
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
              <Text selectable style={[estilos.celula, { flex: 0.7 }]}>
                {produto.codigo || "-"}
              </Text>
              <View
                style={{
                  flex: 1.5,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <View style={estilos.iconeLinha}>
                  <MaterialIcons
                    name="inventory-2"
                    size={19}
                    color={colors.primary}
                  />
                </View>
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
                    {produto.complemento || produto.marca || "Sem complemento"}
                  </Text>
                </View>
              </View>
              <Text numberOfLines={2} style={estilos.celula}>
                {produto.fornecedor || "-"}
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
        salvando={salvando}
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
          rotulo="Complemento / variacao"
          valor={formulario.complemento}
          onChange={(valor) => atualizarCampo("complemento", valor)}
        />
        <Campo
          rotulo="Marca"
          valor={formulario.marca}
          onChange={(valor) => atualizarCampo("marca", valor)}
        />
        <Campo
          rotulo="Fornecedor"
          valor={formulario.fornecedor}
          onChange={(valor) => atualizarCampo("fornecedor", valor)}
        />
        <Campo
          rotulo="Categoria / setor"
          valor={formulario.categoria}
          onChange={(valor) => atualizarCampo("categoria", valor)}
        />
      </FormularioModal>
    </ScrollView>
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
