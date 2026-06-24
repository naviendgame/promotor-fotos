import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { signOut } from "firebase/auth";
import {
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import {
  CATEGORIAS_FOTO,
  nomeCategoriaFoto,
} from "@/constants/categorias-foto";
import {
  DESTINOS_AVARIA,
  MOTIVOS_AVARIA,
  categoriaExigeOcorrenciaEstoque,
  tipoOcorrenciaPorCategoria,
} from "@/constants/estoque";
import { ROTAS } from "@/constants/routes";
import { auth } from "@/services/firebaseConfig";
import { criarFoto } from "@/services/fotos-service";
import { criarOcorrenciaEstoque } from "@/services/ocorrencias-estoque-service";
import { consultaProdutosAtivos } from "@/services/produtos-service";
import { buscarUsuario } from "@/services/usuarios-service";
import { useTheme } from "@/theme/theme-context";
import type { ThemeColors } from "@/theme/colors";
import type { ItemOcorrenciaEstoque } from "@/types/ocorrencia-estoque";
import type { Produto } from "@/types/produto";
import { prepararImagemBase64 } from "@/utils/imagem";
import { primeiroParametro } from "@/utils/params";

const LIMITE_OBSERVACAO = 300;

type EtapaEnvio = "preparando" | "enviando" | null;

export default function EnviarFoto() {
  const { colors } = useTheme();
  const parametros = useLocalSearchParams<{
    lojaId?: string | string[];
    lojaNome?: string | string[];
    categoriaInicial?: string | string[];
    refacaoDeId?: string | string[];
    numeroRefacao?: string | string[];
    motivoRefacao?: string | string[];
  }>();
  const lojaId = primeiroParametro(parametros.lojaId);
  const lojaNome = primeiroParametro(parametros.lojaNome) || "Loja";
  const categoriaInicial = primeiroParametro(parametros.categoriaInicial);
  const refacaoDeId = primeiroParametro(parametros.refacaoDeId);
  const motivoRefacao = primeiroParametro(parametros.motivoRefacao) || "";
  const numeroRefacao =
    Number(primeiroParametro(parametros.numeroRefacao)) || 1;
  const ehRefacao = !!refacaoDeId;

  const [imagem, setImagem] = useState<string | null>(null);
  const [observacao, setObservacao] = useState("");
  const [categoria, setCategoria] = useState<string | null>(
    categoriaInicial || null,
  );
  const [etapaEnvio, setEtapaEnvio] = useState<EtapaEnvio>(null);
  const [envioConcluido, setEnvioConcluido] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [buscaProduto, setBuscaProduto] = useState("");
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState("");
  const [estoqueLoja, setEstoqueLoja] = useState("");
  const [estoqueDisponivel, setEstoqueDisponivel] = useState("");
  const [ruptura, setRuptura] = useState(false);
  const [quantidadeRuptura, setQuantidadeRuptura] = useState("");
  const [quantidadeAvaria, setQuantidadeAvaria] = useState("");
  const [motivoAvaria, setMotivoAvaria] = useState(MOTIVOS_AVARIA[0]);
  const [destinoAvaria, setDestinoAvaria] = useState(DESTINOS_AVARIA[0]);
  const [observacaoItem, setObservacaoItem] = useState("");
  const [itensOcorrencia, setItensOcorrencia] = useState<
    ItemOcorrenciaEstoque[]
  >([]);

  const enviando = etapaEnvio !== null;
  const tipoOcorrencia = tipoOcorrenciaPorCategoria(categoria);
  const exigeOcorrencia = categoriaExigeOcorrenciaEstoque(categoria);
  const formularioValido =
    !!imagem &&
    !!categoria &&
    (!exigeOcorrencia || itensOcorrencia.length > 0) &&
    !enviando;
  const categoriaExibicao = nomeCategoriaFoto(categoria);
  const produtoSelecionado = produtos.find(
    (produto) => produto.id === produtoSelecionadoId,
  );

  const produtosFiltrados = useMemo(() => {
    const termo = buscaProduto.trim().toLocaleLowerCase("pt-BR");
    const ativos = produtos.filter((produto) => produto.ativo !== false);

    if (!termo) return ativos.slice(0, 8);

    return ativos
      .filter((produto) =>
        [
          produto.codigo,
          produto.nome,
          produto.complemento,
          produto.marca,
          produto.fornecedor,
        ]
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(termo),
      )
      .slice(0, 8);
  }, [buscaProduto, produtos]);

  useEffect(() => {
    return onSnapshot(consultaProdutosAtivos(), (snapshot) => {
      setProdutos(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Produto[],
      );
    });
  }, []);

  useEffect(() => {
    setProdutoSelecionadoId("");
    setBuscaProduto("");
    setEstoqueLoja("");
    setEstoqueDisponivel("");
    setRuptura(false);
    setQuantidadeRuptura("");
    setQuantidadeAvaria("");
    setMotivoAvaria(MOTIVOS_AVARIA[0]);
    setDestinoAvaria(DESTINOS_AVARIA[0]);
    setObservacaoItem("");
    setItensOcorrencia([]);
  }, [tipoOcorrencia]);

  function removerImagem() {
    if (enviando) return;
    setImagem(null);
    setCategoria(null);
    setItensOcorrencia([]);
  }

  async function tirarFoto() {
    if (enviando) return;

    const permissao = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissao.granted) {
      Alert.alert(
        "Permissão necessária",
        "Permita o acesso à câmera para tirar a foto.",
      );
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: false,
    });

    if (!resultado.canceled) {
      setImagem(resultado.assets[0].uri);
    }
  }

  async function escolherFoto() {
    if (enviando) return;

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: false,
    });

    if (!resultado.canceled) {
      setImagem(resultado.assets[0].uri);
    }
  }

  function numeroOuZero(valor: string) {
    const numero = Number(valor.replace(",", "."));
    return Number.isFinite(numero) && numero >= 0 ? numero : 0;
  }

  function limparFormularioItem() {
    setProdutoSelecionadoId("");
    setBuscaProduto("");
    setEstoqueLoja("");
    setEstoqueDisponivel("");
    setRuptura(false);
    setQuantidadeRuptura("");
    setQuantidadeAvaria("");
    setMotivoAvaria(MOTIVOS_AVARIA[0]);
    setDestinoAvaria(DESTINOS_AVARIA[0]);
    setObservacaoItem("");
  }

  function adicionarItemOcorrencia() {
    if (!produtoSelecionado || !tipoOcorrencia) {
      Alert.alert("Produto", "Selecione um produto para adicionar.");
      return;
    }

    const itemBase = {
      produtoId: produtoSelecionado.id,
      codigo: produtoSelecionado.codigo || "",
      nome: produtoSelecionado.nome,
      complemento: produtoSelecionado.complemento || "",
      observacao: observacaoItem.trim(),
    };

    const item: ItemOcorrenciaEstoque =
      tipoOcorrencia === "avaria"
        ? {
            ...itemBase,
            quantidadeAvaria: numeroOuZero(quantidadeAvaria),
            motivoAvaria,
            destinoAvaria,
          }
        : {
            ...itemBase,
            estoqueLoja: numeroOuZero(estoqueLoja),
            estoqueDisponivel: numeroOuZero(estoqueDisponivel),
            ruptura,
            quantidadeRuptura: ruptura ? numeroOuZero(quantidadeRuptura) : 0,
          };

    setItensOcorrencia((atuais) => [...atuais, item]);
    limparFormularioItem();
  }

  function removerItemOcorrencia(indice: number) {
    if (enviando) return;
    setItensOcorrencia((atuais) =>
      atuais.filter((_, itemIndice) => itemIndice !== indice),
    );
  }

  async function enviarFoto() {
    const categoriaSelecionada = categoria;

    if (!formularioValido || !imagem || !categoriaSelecionada) return;
    const tipoOcorrenciaSelecionada =
      tipoOcorrenciaPorCategoria(categoriaSelecionada);

    try {
      const usuarioAtual = auth.currentUser;

      if (!usuarioAtual) {
        Alert.alert("Erro", "Usuário não encontrado.");
        return;
      }

      if (!lojaId) {
        Alert.alert("Erro", "A loja deste envio não foi identificada.");
        return;
      }

      setEtapaEnvio("preparando");
      const imagemBase64 = await prepararImagemBase64(imagem);
      const usuarioSnap = await buscarUsuario(usuarioAtual.uid);

      if (!usuarioSnap.exists() || usuarioSnap.data().ativo === false) {
        await signOut(auth);
        Alert.alert(
          "Acesso removido",
          "Seu cadastro não está mais ativo no sistema.",
        );
        router.replace(ROTAS.login);
        return;
      }

      const promotorNome =
        usuarioSnap.data()?.nome ||
        usuarioAtual.displayName ||
        usuarioAtual.email ||
        "";

      setEtapaEnvio("enviando");
      const fotoRef = await criarFoto({
        lojaId,
        lojaNome,
        promotorId: usuarioAtual.uid,
        promotorNome,
        promotorEmail: usuarioAtual.email || "",
        imagemBase64,
        categoria: categoriaSelecionada,
        status: "pendente",
        comentarioAdmin: "",
        observacao: observacao.trim(),
        criadoEm: serverTimestamp(),
        naLixeira: false,
        refacaoDeId: refacaoDeId || null,
        numeroRefacao: ehRefacao ? numeroRefacao : 0,
        motivoRefacao: ehRefacao ? motivoRefacao : "",
      });

      if (tipoOcorrenciaSelecionada && itensOcorrencia.length > 0) {
        await criarOcorrenciaEstoque({
          tipo: tipoOcorrenciaSelecionada,
          fotoId: fotoRef.id,
          lojaId,
          lojaNome,
          promotorId: usuarioAtual.uid,
          promotorNome,
          promotorEmail: usuarioAtual.email || "",
          categoriaFoto: categoriaSelecionada,
          observacao: observacao.trim(),
          itens: itensOcorrencia,
          status: "pendente",
          criadoEm: serverTimestamp(),
        });
      }

      setEnvioConcluido(true);
    } catch (error: any) {
      console.log(error);
      Alert.alert(
        "Não foi possível enviar",
        error.message || "Verifique sua conexão e tente novamente.",
      );
    } finally {
      setEtapaEnvio(null);
    }
  }

  function prepararNovoEnvio() {
    setImagem(null);
    setCategoria(ehRefacao ? categoriaInicial || null : null);
    setObservacao("");
    setItensOcorrencia([]);
    limparFormularioItem();
    setEnvioConcluido(false);
  }

  const estilos = criarEstilos(colors);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 36,
        gap: 22,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Pressable
          onPress={() => router.back()}
          disabled={enviando}
          accessibilityLabel="Voltar"
          style={estilos.botaoIcone}
        >
          <MaterialIcons name="arrow-back" size={23} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 27, fontWeight: "bold" }}>
            {ehRefacao ? "Refazer foto" : "Enviar foto"}
          </Text>
          <Text style={{ color: colors.textSubtle, paddingTop: 3 }}>
            {ehRefacao
              ? `Nova versão do envio · Refação ${numeroRefacao}`
              : "Novo registro de execução"}
          </Text>
        </View>
      </View>

      <View
        style={{
          minHeight: 62,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          paddingHorizontal: 13,
          flexDirection: "row",
          alignItems: "center",
          gap: 11,
          backgroundColor: colors.surface,
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 7,
            backgroundColor: colors.primarySurface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name="storefront" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textSubtle, fontSize: 12 }}>
            Loja do envio
          </Text>
          <Text
            numberOfLines={2}
            style={{ color: colors.text, fontWeight: "bold", paddingTop: 2 }}
          >
            {lojaNome}
          </Text>
        </View>
      </View>

      {ehRefacao ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.warning,
            borderRadius: 8,
            padding: 14,
            backgroundColor: colors.warningSurface,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 11,
          }}
        >
          <MaterialIcons name="rate-review" size={24} color={colors.warning} />
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={{ color: colors.warningText, fontWeight: "bold" }}>
              Correção solicitada pelo responsável
            </Text>
            <Text style={{ color: colors.warningText, lineHeight: 20, opacity: 0.85 }}>
              {motivoRefacao ||
                "Confira a execução e envie uma nova foto para análise."}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={{ gap: 11 }}>
        <TituloSecao colors={colors} numero="1" titulo="Foto" />

        {!imagem ? (
          <View
            style={{
              minHeight: 236,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: colors.borderStrong,
              borderRadius: 8,
              backgroundColor: colors.surface,
              padding: 20,
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
            }}
          >
            <View
              style={{
                width: 58,
                height: 58,
                borderRadius: 8,
                backgroundColor: colors.primarySurface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="add-a-photo" size={30} color={colors.primary} />
            </View>

            <View style={{ alignItems: "center", gap: 5 }}>
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: "bold" }}>
                Adicione a foto da execução
              </Text>
              <Text style={{ color: colors.textSubtle, textAlign: "center" }}>
                Use a câmera ou escolha uma imagem já salva.
              </Text>
            </View>

            <View style={{ width: "100%", flexDirection: "row", gap: 9 }}>
              <Pressable onPress={tirarFoto} style={estilos.botaoPrimario}>
                <MaterialIcons name="photo-camera" size={20} color={colors.primaryText} />
                <Text style={{ color: colors.primaryText, fontWeight: "bold" }}>
                  Câmera
                </Text>
              </Pressable>
              <Pressable onPress={escolherFoto} style={estilos.botaoSecundario}>
                <MaterialIcons
                  name="photo-library"
                  size={20}
                  color={colors.textMuted}
                />
                <Text style={{ color: colors.text, fontWeight: "bold" }}>
                  Galeria
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View
            style={{
              width: "100%",
              aspectRatio: 4 / 3,
              borderRadius: 8,
              overflow: "hidden",
              backgroundColor: colors.surfaceHighlight,
            }}
          >
            <Image
              source={{ uri: imagem }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={180}
            />

            <View
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                flexDirection: "row",
                gap: 8,
              }}
            >
              <Pressable
                onPress={escolherFoto}
                disabled={enviando}
                accessibilityLabel="Trocar foto"
                style={estilos.acaoImagem}
              >
                <MaterialIcons name="sync" size={21} color="white" />
              </Pressable>
              <Pressable
                onPress={removerImagem}
                disabled={enviando}
                accessibilityLabel="Remover foto"
                style={{
                  ...estilos.acaoImagem,
                  backgroundColor: "rgba(127,29,45,0.94)",
                }}
              >
                <MaterialIcons name="delete-outline" size={22} color="white" />
              </Pressable>
            </View>

            <View
              style={{
                position: "absolute",
                left: 10,
                bottom: 10,
                backgroundColor: "rgba(15,17,21,0.86)",
                borderRadius: 6,
                paddingVertical: 7,
                paddingHorizontal: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <MaterialIcons name="check-circle" size={17} color="#65D391" />
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 12 }}>
                Foto anexada
              </Text>
            </View>
          </View>
        )}

        <View style={{ gap: 8 }}>
          <ItemChecklist colors={colors} texto="Imagem nítida e bem iluminada" />
          <ItemChecklist colors={colors} texto="Produto, preço ou execução visível" />
          <ItemChecklist colors={colors} texto="Enquadramento suficiente para conferência" />
        </View>
      </View>

      {imagem ? (
        <>
          <View style={{ gap: 12 }}>
            <TituloSecao colors={colors} numero="2" titulo="Categoria e observação" />

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9 }}>
              {CATEGORIAS_FOTO.map((item) => {
                const selecionada = categoria === item.valor;

                return (
                  <Pressable
                    key={item.valor}
                    onPress={() => setCategoria(item.valor)}
                    disabled={enviando}
                    style={{
                      width: "47%",
                      minHeight: 78,
                      flexGrow: 1,
                      maxWidth: "49%",
                      borderWidth: 1,
                      borderColor: selecionada ? colors.primary : colors.border,
                      borderRadius: 8,
                      backgroundColor: selecionada
                        ? colors.primarySurface
                        : colors.surface,
                      padding: 12,
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <MaterialIcons
                      name={item.icone}
                      size={23}
                      color={selecionada ? colors.primary : colors.iconMuted}
                    />
                    <Text
                      style={{
                        color: selecionada ? colors.primary : colors.textMuted,
                        fontWeight: "bold",
                        lineHeight: 18,
                      }}
                    >
                      {item.nome}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {!categoria ? (
              <Text style={{ color: colors.warning, fontSize: 13 }}>
                Selecione a categoria correspondente à foto.
              </Text>
            ) : null}

            <View style={{ gap: 8, paddingTop: 5 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <Text style={{ color: colors.textMuted, fontWeight: "bold" }}>
                  Observação
                </Text>
                <Text
                  style={{
                    color: colors.textSubtle,
                    fontSize: 12,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  Opcional · {observacao.length}/{LIMITE_OBSERVACAO}
                </Text>
              </View>
              <TextInput
                placeholder="Ex.: produto em falta, preço divergente..."
                placeholderTextColor={colors.placeholder}
                value={observacao}
                onChangeText={setObservacao}
                editable={!enviando}
                maxLength={LIMITE_OBSERVACAO}
                multiline
                textAlignVertical="top"
                style={{
                  minHeight: 112,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 13,
                  backgroundColor: colors.surface,
                  color: colors.text,
                  lineHeight: 20,
                }}
              />
            </View>

            {tipoOcorrencia ? (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  backgroundColor: colors.surface,
                  padding: 13,
                  gap: 13,
                }}
              >
                <View style={{ gap: 4 }}>
                  <Text style={{ color: colors.text, fontWeight: "bold" }}>
                    {tipoOcorrencia === "avaria"
                      ? "Produtos para avaria / devolucao"
                      : "Produtos do relatorio de estoque"}
                  </Text>
                  <Text style={{ color: colors.textSubtle, lineHeight: 19 }}>
                    Adicione um ou mais produtos. Esses dados vao aparecer no
                    painel em estoque e devolucoes.
                  </Text>
                </View>

                <TextInput
                  value={buscaProduto}
                  onChangeText={setBuscaProduto}
                  placeholder="Buscar produto cadastrado"
                  placeholderTextColor={colors.placeholder}
                  editable={!enviando}
                  style={{
                    minHeight: 44,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    color: colors.text,
                    backgroundColor: colors.backgroundAlt,
                  }}
                />

                <View style={{ gap: 8 }}>
                  {produtosFiltrados.map((produto) => {
                    const selecionado = produtoSelecionadoId === produto.id;

                    return (
                      <Pressable
                        key={produto.id}
                        onPress={() => setProdutoSelecionadoId(produto.id)}
                        disabled={enviando}
                        style={{
                          minHeight: 48,
                          borderWidth: 1,
                          borderColor: selecionado
                            ? colors.primary
                            : colors.border,
                          borderRadius: 8,
                          backgroundColor: selecionado
                            ? colors.primarySurface
                            : colors.backgroundAlt,
                          paddingHorizontal: 11,
                          paddingVertical: 8,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <MaterialIcons
                          name={selecionado ? "check-circle" : "inventory-2"}
                          size={21}
                          color={selecionado ? colors.primary : colors.iconMuted}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            numberOfLines={1}
                            style={{
                              color: colors.text,
                              fontWeight: "bold",
                            }}
                          >
                            {produto.codigo ? `${produto.codigo} - ` : ""}
                            {produto.nome}
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={{
                              color: colors.textSubtle,
                              fontSize: 12,
                              paddingTop: 2,
                            }}
                          >
                            {produto.complemento ||
                              produto.fornecedor ||
                              "Produto cadastrado"}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}

                  {produtos.length === 0 ? (
                    <Text style={{ color: colors.warning, lineHeight: 19 }}>
                      Nenhum produto ativo cadastrado. Cadastre produtos no
                      painel web antes de enviar este tipo de relatorio.
                    </Text>
                  ) : null}
                </View>

                {produtoSelecionado ? (
                  <View style={{ gap: 10 }}>
                    {tipoOcorrencia === "estoque" ? (
                      <>
                        <View style={{ flexDirection: "row", gap: 9 }}>
                          <CampoNumero
                            colors={colors}
                            rotulo="Estoque loja"
                            valor={estoqueLoja}
                            onChange={setEstoqueLoja}
                          />
                          <CampoNumero
                            colors={colors}
                            rotulo="Estoque disponivel"
                            valor={estoqueDisponivel}
                            onChange={setEstoqueDisponivel}
                          />
                        </View>

                        <Pressable
                          onPress={() => setRuptura((atual) => !atual)}
                          disabled={enviando}
                          style={{
                            minHeight: 44,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: ruptura
                              ? colors.warning
                              : colors.border,
                            backgroundColor: ruptura
                              ? colors.warningSurface
                              : colors.backgroundAlt,
                            paddingHorizontal: 11,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 9,
                          }}
                        >
                          <MaterialIcons
                            name={
                              ruptura
                                ? "check-box"
                                : "check-box-outline-blank"
                            }
                            size={22}
                            color={ruptura ? colors.warning : colors.iconMuted}
                          />
                          <Text
                            style={{
                              color: ruptura ? colors.warningText : colors.textMuted,
                              fontWeight: "bold",
                            }}
                          >
                            Produto em ruptura/falta
                          </Text>
                        </Pressable>

                        {ruptura ? (
                          <CampoNumero
                            colors={colors}
                            rotulo="Quantidade em ruptura"
                            valor={quantidadeRuptura}
                            onChange={setQuantidadeRuptura}
                          />
                        ) : null}
                      </>
                    ) : (
                      <>
                        <CampoNumero
                          colors={colors}
                          rotulo="Quantidade avariada/devolvida"
                          valor={quantidadeAvaria}
                          onChange={setQuantidadeAvaria}
                        />
                        <GrupoOpcoes
                          colors={colors}
                          titulo="Motivo"
                          opcoes={MOTIVOS_AVARIA}
                          valor={motivoAvaria}
                          onChange={setMotivoAvaria}
                        />
                        <GrupoOpcoes
                          colors={colors}
                          titulo="Destino"
                          opcoes={DESTINOS_AVARIA}
                          valor={destinoAvaria}
                          onChange={setDestinoAvaria}
                        />
                      </>
                    )}

                    <TextInput
                      value={observacaoItem}
                      onChangeText={setObservacaoItem}
                      placeholder="Observacao deste produto"
                      placeholderTextColor={colors.placeholder}
                      editable={!enviando}
                      style={{
                        minHeight: 44,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        color: colors.text,
                        backgroundColor: colors.backgroundAlt,
                      }}
                    />

                    <Pressable
                      onPress={adicionarItemOcorrencia}
                      disabled={enviando}
                      style={{
                        minHeight: 46,
                        borderRadius: 8,
                        backgroundColor: colors.primary,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <MaterialIcons name="add" size={22} color={colors.primaryText} />
                      <Text style={{ color: colors.primaryText, fontWeight: "bold" }}>
                        Adicionar produto
                      </Text>
                    </Pressable>
                  </View>
                ) : null}

                {itensOcorrencia.length > 0 ? (
                  <View style={{ gap: 8 }}>
                    <Text style={{ color: colors.textMuted, fontWeight: "bold" }}>
                      Produtos adicionados
                    </Text>
                    {itensOcorrencia.map((item, indice) => (
                      <View
                        key={`${item.produtoId}-${indice}`}
                        style={{
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: 8,
                          backgroundColor: colors.backgroundAlt,
                          padding: 11,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.text, fontWeight: "bold" }}>
                            {item.codigo ? `${item.codigo} - ` : ""}
                            {item.nome}
                          </Text>
                          <Text
                            style={{
                              color: colors.textSubtle,
                              fontSize: 12,
                              paddingTop: 3,
                            }}
                          >
                            {tipoOcorrencia === "avaria"
                              ? `${item.quantidadeAvaria || 0} un. - ${
                                  item.destinoAvaria
                                }`
                              : `Loja: ${item.estoqueLoja || 0} / Disp.: ${
                                  item.estoqueDisponivel || 0
                                }${item.ruptura ? " / Ruptura" : ""}`}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => removerItemOcorrencia(indice)}
                          accessibilityLabel="Remover produto"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 7,
                            backgroundColor: colors.dangerSurface,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <MaterialIcons
                            name="close"
                            size={20}
                            color={colors.danger}
                          />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={{ color: colors.warning, fontSize: 13 }}>
                    Adicione pelo menos um produto para enviar esta categoria.
                  </Text>
                )}
              </View>
            ) : null}
          </View>

          <View style={{ gap: 12 }}>
            <TituloSecao colors={colors} numero="3" titulo="Revisão" />

            <View
              style={{
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: colors.border,
              }}
            >
              <LinhaResumo
                colors={colors}
                icone="storefront"
                titulo="Loja"
                valor={lojaNome}
              />
              <LinhaResumo
                colors={colors}
                icone="category"
                titulo="Categoria"
                valor={categoriaExibicao || "Não selecionada"}
                separador
                alerta={!categoria}
              />
              <LinhaResumo
                colors={colors}
                icone="notes"
                titulo="Observação"
                valor={
                  observacao.trim()
                    ? observacao.trim()
                    : "Nenhuma observação adicionada"
                }
                separador
              />
            </View>

            <Pressable
              onPress={enviarFoto}
              disabled={!formularioValido}
              style={{
                minHeight: 52,
                borderRadius: 8,
                backgroundColor: formularioValido ? colors.success : colors.borderStrong,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                paddingHorizontal: 16,
              }}
            >
              {enviando ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <MaterialIcons
                  name="cloud-upload"
                  size={22}
                  color={formularioValido ? colors.primaryText : colors.textSubtle}
                />
              )}
              <Text
                style={{
                  color: formularioValido ? colors.primaryText : colors.textSubtle,
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                {etapaEnvio === "preparando"
                  ? "Preparando imagem..."
                  : etapaEnvio === "enviando"
                    ? "Enviando foto..."
                    : "Enviar foto"}
              </Text>
            </Pressable>
          </View>
        </>
      ) : null}

      <Modal
        visible={envioConcluido}
        transparent
        animationType="fade"
        onRequestClose={() => router.replace(ROTAS.promotor)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.overlay,
            justifyContent: "center",
            padding: 22,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              padding: 21,
              gap: 18,
            }}
          >
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 8,
                backgroundColor: colors.successSurface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="check" size={31} color={colors.success} />
            </View>

            <View style={{ gap: 7 }}>
              <Text style={{ color: colors.text, fontSize: 21, fontWeight: "bold" }}>
                {ehRefacao
                  ? "Nova foto enviada para análise"
                  : "Foto enviada para análise"}
              </Text>
              <Text style={{ color: colors.textSubtle, lineHeight: 21 }}>
                {ehRefacao
                  ? "A versão anterior foi preservada no histórico e esta nova foto está pendente de avaliação."
                  : "O responsável poderá aprovar, rejeitar ou solicitar uma nova foto."}
              </Text>
            </View>

            <View style={{ gap: 9 }}>
              <Pressable
                onPress={prepararNovoEnvio}
                style={{
                  minHeight: 48,
                  borderRadius: 7,
                  backgroundColor: colors.primary,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <MaterialIcons name="add-a-photo" size={20} color={colors.primaryText} />
                <Text style={{ color: colors.primaryText, fontWeight: "bold" }}>
                  {ehRefacao
                    ? "Enviar outra foto para esta loja"
                    : "Enviar outra para esta loja"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.replace(ROTAS.promotor)}
                style={{
                  minHeight: 48,
                  borderRadius: 7,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceElevated,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <MaterialIcons name="dashboard" size={20} color={colors.textMuted} />
                <Text style={{ color: colors.text, fontWeight: "bold" }}>
                  Voltar ao painel
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function TituloSecao({
  colors,
  numero,
  titulo,
}: {
  colors: ThemeColors;
  numero: string;
  titulo: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
      <View
        style={{
          width: 27,
          height: 27,
          borderRadius: 14,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: colors.primaryText, fontWeight: "bold" }}>
          {numero}
        </Text>
      </View>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>
        {titulo}
      </Text>
    </View>
  );
}

function ItemChecklist({
  colors,
  texto,
}: {
  colors: ThemeColors;
  texto: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <MaterialIcons
        name="check-circle-outline"
        size={18}
        color={colors.success}
      />
      <Text style={{ flex: 1, color: colors.textSubtle, fontSize: 13 }}>
        {texto}
      </Text>
    </View>
  );
}

function LinhaResumo({
  colors,
  icone,
  titulo,
  valor,
  separador,
  alerta,
}: {
  colors: ThemeColors;
  icone: keyof typeof MaterialIcons.glyphMap;
  titulo: string;
  valor: string;
  separador?: boolean;
  alerta?: boolean;
}) {
  return (
    <View
      style={{
        minHeight: 64,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 11,
        borderTopWidth: separador ? 1 : 0,
        borderTopColor: colors.border,
      }}
    >
      <MaterialIcons
        name={icone}
        size={21}
        color={alerta ? colors.warning : colors.iconMuted}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textSubtle, fontSize: 12 }}>{titulo}</Text>
        <Text
          style={{
            color: alerta ? colors.warning : colors.text,
            fontWeight: "bold",
            paddingTop: 3,
            lineHeight: 19,
          }}
        >
          {valor}
        </Text>
      </View>
    </View>
  );
}

function CampoNumero({
  colors,
  rotulo,
  valor,
  onChange,
}: {
  colors: ThemeColors;
  rotulo: string;
  valor: string;
  onChange: (valor: string) => void;
}) {
  return (
    <View style={{ flex: 1, gap: 7 }}>
      <Text style={{ color: colors.textMuted, fontWeight: "bold", fontSize: 13 }}>
        {rotulo}
      </Text>
      <TextInput
        value={valor}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={colors.placeholder}
        style={{
          minHeight: 44,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          paddingHorizontal: 12,
          color: colors.text,
          backgroundColor: colors.backgroundAlt,
        }}
      />
    </View>
  );
}

function GrupoOpcoes({
  colors,
  titulo,
  opcoes,
  valor,
  onChange,
}: {
  colors: ThemeColors;
  titulo: string;
  opcoes: string[];
  valor: string;
  onChange: (valor: string) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.textMuted, fontWeight: "bold", fontSize: 13 }}>
        {titulo}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {opcoes.map((opcao) => {
          const ativo = valor === opcao;

          return (
            <Pressable
              key={opcao}
              onPress={() => onChange(opcao)}
              style={{
                minHeight: 38,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: ativo ? colors.primary : colors.border,
                backgroundColor: ativo
                  ? colors.primarySurface
                  : colors.backgroundAlt,
                paddingHorizontal: 11,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: ativo ? colors.primary : colors.textMuted,
                  fontWeight: ativo ? "bold" : "normal",
                }}
              >
                {opcao}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function criarEstilos(colors: ThemeColors) {
  return {
    botaoIcone: {
      width: 42,
      height: 42,
      borderRadius: 8,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    botaoPrimario: {
      flex: 1,
      minHeight: 46,
      borderRadius: 7,
      backgroundColor: colors.primary,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 8,
    },
    botaoSecundario: {
      flex: 1,
      minHeight: 46,
      borderRadius: 7,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 8,
    },
    acaoImagem: {
      width: 42,
      height: 42,
      borderRadius: 7,
      backgroundColor: "rgba(20,24,31,0.92)",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
  };
}
