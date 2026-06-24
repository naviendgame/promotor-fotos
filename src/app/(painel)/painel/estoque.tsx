import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { getDoc, onSnapshot } from "firebase/firestore";
import Animated, {
  FadeInUp,
  LinearTransition,
} from "react-native-reanimated";

import { fotoDoc } from "@/services/fotos-service";
import { consultaOcorrenciasEstoqueOrdenadas } from "@/services/ocorrencias-estoque-service";
import type { ThemeColors } from "@/theme/colors";
import type { Foto } from "@/types/foto";
import type {
  ItemOcorrenciaEstoque,
  OcorrenciaEstoque,
  TipoOcorrenciaEstoque,
} from "@/types/ocorrencia-estoque";
import { obterData } from "@/utils/datas";

import {
  Cabecalho,
  CampoBusca,
  Vazio,
  useEstilosPainel,
} from "./lojas";

type FiltroTipo = "todos" | TipoOcorrenciaEstoque | "ruptura";
type LinhaOcorrencia = {
  ocorrencia: OcorrenciaEstoque;
  item: ItemOcorrenciaEstoque;
};

export default function EstoquePainel() {
  const estilos = useEstilosPainel();
  const { colors } = estilos;
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaEstoque[]>([]);
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<FiltroTipo>("todos");
  const [linhaSelecionada, setLinhaSelecionada] =
    useState<LinhaOcorrencia | null>(null);
  const [fotoSelecionada, setFotoSelecionada] = useState<Foto | null>(null);
  const [carregandoFoto, setCarregandoFoto] = useState(false);

  useEffect(() => {
    return onSnapshot(consultaOcorrenciasEstoqueOrdenadas(), (snapshot) => {
      setOcorrencias(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as OcorrenciaEstoque[],
      );
    });
  }, []);

  async function abrirOcorrencia(linha: LinhaOcorrencia) {
    setLinhaSelecionada(linha);
    setFotoSelecionada(null);

    if (!linha.ocorrencia.fotoId) {
      return;
    }

    try {
      setCarregandoFoto(true);
      const snapshot = await getDoc(fotoDoc(linha.ocorrencia.fotoId));

      if (snapshot.exists()) {
        setFotoSelecionada({
          id: snapshot.id,
          ...snapshot.data(),
        } as Foto);
      }
    } finally {
      setCarregandoFoto(false);
    }
  }

  function fecharOcorrencia() {
    setLinhaSelecionada(null);
    setFotoSelecionada(null);
    setCarregandoFoto(false);
  }

  const linhas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    const lista = ocorrencias.flatMap((ocorrencia) =>
      ocorrencia.itens.map((item) => ({ ocorrencia, item })),
    );

    return lista.filter(({ ocorrencia, item }) => {
      const passaTipo =
        tipo === "todos" ||
        ocorrencia.tipo === tipo ||
        (tipo === "ruptura" && item.ruptura);

      const passaBusca =
        !termo ||
        [
          ocorrencia.lojaNome,
          ocorrencia.promotorNome,
          item.codigo,
          item.nome,
          item.complemento,
          item.motivoAvaria,
          item.destinoAvaria,
        ]
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(termo);

      return passaTipo && passaBusca;
    });
  }, [busca, ocorrencias, tipo]);

  const resumo = useMemo(() => {
    const todasLinhas = ocorrencias.flatMap((ocorrencia) => ocorrencia.itens);

    return {
      estoque: ocorrencias.filter((item) => item.tipo === "estoque").length,
      avaria: ocorrencias.filter((item) => item.tipo === "avaria").length,
      ruptura: todasLinhas.filter((item) => item.ruptura).length,
      itens: todasLinhas.length,
    };
  }, [ocorrencias]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: 18, paddingBottom: 28 }}
    >
      <Cabecalho
        titulo="Estoque e devolucoes"
        subtitulo={`${resumo.itens} itens reportados pelos promotores`}
      />

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        <Resumo
          colors={colors}
          titulo="Relatorios"
          valor={resumo.estoque}
          icone="inventory"
        />
        <Resumo
          colors={colors}
          titulo="Rupturas"
          valor={resumo.ruptura}
          icone="report"
        />
        <Resumo
          colors={colors}
          titulo="Devolucoes"
          valor={resumo.avaria}
          icone="assignment-return"
        />
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <CampoBusca
          valor={busca}
          onChange={setBusca}
          placeholder="Buscar loja, produto ou promotor"
        />
        {[
          { valor: "todos", texto: "Todos" },
          { valor: "estoque", texto: "Estoque" },
          { valor: "ruptura", texto: "Ruptura" },
          { valor: "avaria", texto: "Avaria / devolucao" },
        ].map((opcao) => {
          const ativo = tipo === opcao.valor;
          return (
            <Pressable
              key={opcao.valor}
              onPress={() => setTipo(opcao.valor as FiltroTipo)}
              style={{
                minHeight: 42,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: ativo ? colors.primary : colors.border,
                backgroundColor: ativo ? colors.primary : colors.surface,
                paddingHorizontal: 13,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: ativo ? colors.primaryText : colors.textMuted,
                  fontWeight: "bold",
                }}
              >
                {opcao.texto}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Animated.View
        entering={FadeInUp.duration(260)}
        layout={LinearTransition.duration(180)}
        style={estilos.tabela}
      >
        <View style={estilos.cabecalhoTabela}>
          <Text style={[estilos.celulaCabecalho, { flex: 0.75 }]}>DATA</Text>
          <Text style={estilos.celulaCabecalho}>LOJA</Text>
          <Text style={[estilos.celulaCabecalho, { flex: 1.4 }]}>PRODUTO</Text>
          <Text style={[estilos.celulaCabecalho, { flex: 0.8 }]}>ESTOQUE</Text>
          <Text style={[estilos.celulaCabecalho, { flex: 0.8 }]}>
            OCORRENCIA
          </Text>
          <Text style={estilos.celulaCabecalho}>PROMOTOR</Text>
        </View>

        {linhas.map(({ ocorrencia, item }, indice) => {
          const data = obterData(ocorrencia.criadoEm);
          const textoEstoque =
            ocorrencia.tipo === "avaria"
              ? `${item.quantidadeAvaria || 0} un.`
              : `Loja: ${item.estoqueLoja ?? "-"} / Disp.: ${
                  item.estoqueDisponivel ?? "-"
                }`;

          return (
            <Animated.View
              key={`${ocorrencia.id}-${item.produtoId}-${indice}`}
              entering={FadeInUp.duration(220).delay(indice * 25)}
              layout={LinearTransition.duration(160)}
              style={[
                estilos.linhaTabela,
                { borderBottomWidth: indice < linhas.length - 1 ? 1 : 0 },
              ]}
            >
              <Pressable
                onPress={() => abrirOcorrencia({ ocorrencia, item })}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Text style={[estilos.celula, { flex: 0.75 }]}>
                  {data ? data.toLocaleDateString("pt-BR") : "-"}
                </Text>
                <Text numberOfLines={2} style={estilos.celula}>
                  {ocorrencia.lojaNome}
                </Text>
                <View style={{ flex: 1.4 }}>
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
                    {item.complemento || item.observacao || "Sem detalhe"}
                  </Text>
                </View>
                <Text style={[estilos.celula, { flex: 0.8 }]}>
                  {textoEstoque}
                </Text>
                <View style={{ flex: 0.8, gap: 4 }}>
                  <Badge
                    colors={colors}
                    texto={
                      ocorrencia.tipo === "avaria"
                        ? item.destinoAvaria || "Devolucao"
                        : item.ruptura
                          ? "Ruptura"
                          : "Estoque"
                    }
                    alerta={ocorrencia.tipo === "avaria" || item.ruptura}
                  />
                  {item.motivoAvaria ? (
                    <Text style={{ color: colors.textSubtle, fontSize: 12 }}>
                      {item.motivoAvaria}
                    </Text>
                  ) : null}
                </View>
                <Text numberOfLines={2} style={estilos.celula}>
                  {ocorrencia.promotorNome || ocorrencia.promotorEmail || "-"}
                </Text>
                <MaterialIcons
                  name="photo"
                  size={20}
                  color={colors.primary}
                />
              </Pressable>
            </Animated.View>
          );
        })}

        {linhas.length === 0 ? (
          <Vazio texto="Nenhuma ocorrencia encontrada." />
        ) : null}
      </Animated.View>

      <ModalDetalheOcorrencia
        visivel={!!linhaSelecionada}
        linha={linhaSelecionada}
        foto={fotoSelecionada}
        carregandoFoto={carregandoFoto}
        colors={colors}
        onClose={fecharOcorrencia}
      />
    </ScrollView>
  );
}

function ModalDetalheOcorrencia({
  visivel,
  linha,
  foto,
  carregandoFoto,
  colors,
  onClose,
}: {
  visivel: boolean;
  linha: LinhaOcorrencia | null;
  foto: Foto | null;
  carregandoFoto: boolean;
  colors: ThemeColors;
  onClose: () => void;
}) {
  if (!linha) return null;

  const { ocorrencia, item } = linha;
  const data = obterData(ocorrencia.criadoEm);
  const imagem = foto?.imagemBase64 || foto?.imagemUrl || "";
  const tipoAvaria = ocorrencia.tipo === "avaria";

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(3,7,18,0.72)",
          justifyContent: "center",
          padding: 22,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 1080,
            alignSelf: "center",
            maxHeight: "92%",
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            overflow: "hidden",
            backgroundColor: colors.surface,
            boxShadow: "0 24px 80px rgba(0,0,0,0.38)",
          }}
        >
          <View
            style={{
              minHeight: 58,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              paddingHorizontal: 18,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>
                {tipoAvaria ? "Ocorrencia de devolucao" : "Relatorio de estoque"}
              </Text>
              <Text style={{ color: colors.textSubtle, paddingTop: 2 }}>
                {ocorrencia.lojaNome} - {ocorrencia.promotorNome || "Promotor"}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityLabel="Fechar detalhes da ocorrencia"
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                backgroundColor: colors.surfaceElevated,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{
              padding: 18,
              gap: 18,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 18,
              }}
            >
              <View
                style={{
                  minWidth: 320,
                  flex: 1.4,
                  minHeight: 420,
                  borderRadius: 8,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {carregandoFoto ? (
                  <View style={{ alignItems: "center", gap: 10 }}>
                    <ActivityIndicator color={colors.primary} />
                    <Text style={{ color: colors.textSubtle }}>
                      Carregando foto...
                    </Text>
                  </View>
                ) : imagem ? (
                  <Image
                    source={{ uri: imagem }}
                    style={{ width: "100%", height: 520 }}
                    contentFit="contain"
                    transition={180}
                  />
                ) : (
                  <View style={{ alignItems: "center", gap: 10, padding: 24 }}>
                    <MaterialIcons
                      name="hide-image"
                      size={44}
                      color={colors.iconMuted}
                    />
                    <Text style={{ color: colors.textSubtle, textAlign: "center" }}>
                      Foto nao encontrada para esta ocorrencia.
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ minWidth: 280, flex: 1, gap: 14 }}>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    backgroundColor: colors.backgroundAlt,
                    padding: 14,
                    gap: 12,
                  }}
                >
                  <Badge
                    colors={colors}
                    texto={
                      tipoAvaria
                        ? item.destinoAvaria || "Devolucao"
                        : item.ruptura
                          ? "Ruptura"
                          : "Estoque"
                    }
                    alerta={tipoAvaria || item.ruptura}
                  />
                  <Text style={{ color: colors.text, fontSize: 19, fontWeight: "bold" }}>
                    {item.codigo ? `${item.codigo} - ` : ""}
                    {item.nome}
                  </Text>
                  <Text style={{ color: colors.textSubtle }}>
                    {item.complemento || "Sem marca/detalhe"}
                  </Text>
                </View>

                <View
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    backgroundColor: colors.backgroundAlt,
                    overflow: "hidden",
                  }}
                >
                  <LinhaDetalhe colors={colors} titulo="Loja" valor={ocorrencia.lojaNome} />
                  <LinhaDetalhe
                    colors={colors}
                    titulo="Promotor"
                    valor={ocorrencia.promotorNome || ocorrencia.promotorEmail || "-"}
                  />
                  <LinhaDetalhe
                    colors={colors}
                    titulo="Data"
                    valor={data ? data.toLocaleString("pt-BR") : "-"}
                  />
                  {tipoAvaria ? (
                    <>
                      <LinhaDetalhe
                        colors={colors}
                        titulo="Quantidade"
                        valor={`${item.quantidadeAvaria || 0} un.`}
                      />
                      <LinhaDetalhe
                        colors={colors}
                        titulo="Motivo"
                        valor={item.motivoAvaria || "-"}
                      />
                      <LinhaDetalhe
                        colors={colors}
                        titulo="Destino"
                        valor={item.destinoAvaria || "-"}
                      />
                    </>
                  ) : (
                    <>
                      <LinhaDetalhe
                        colors={colors}
                        titulo="Estoque loja"
                        valor={`${item.estoqueLoja ?? "-"} un.`}
                      />
                      <LinhaDetalhe
                        colors={colors}
                        titulo="Estoque disponivel"
                        valor={`${item.estoqueDisponivel ?? "-"} un.`}
                      />
                      <LinhaDetalhe
                        colors={colors}
                        titulo="Ruptura"
                        valor={
                          item.ruptura
                            ? `Sim, ${item.quantidadeRuptura || 0} un.`
                            : "Nao"
                        }
                      />
                    </>
                  )}
                  <LinhaDetalhe
                    colors={colors}
                    titulo="Observacao"
                    valor={item.observacao || ocorrencia.observacao || "-"}
                    ultimo
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function LinhaDetalhe({
  colors,
  titulo,
  valor,
  ultimo,
}: {
  colors: ThemeColors;
  titulo: string;
  valor: string;
  ultimo?: boolean;
}) {
  return (
    <View
      style={{
        padding: 12,
        borderBottomWidth: ultimo ? 0 : 1,
        borderBottomColor: colors.border,
        gap: 4,
      }}
    >
      <Text style={{ color: colors.textSubtle, fontSize: 12, fontWeight: "bold" }}>
        {titulo}
      </Text>
      <Text style={{ color: colors.text, lineHeight: 20 }}>{valor}</Text>
    </View>
  );
}

function Resumo({
  colors,
  titulo,
  valor,
  icone,
}: {
  colors: ThemeColors;
  titulo: string;
  valor: number;
  icone: keyof typeof MaterialIcons.glyphMap;
}) {
  return (
    <View
      style={{
        minWidth: 190,
        flexGrow: 1,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        borderRadius: 8,
        padding: 16,
        gap: 10,
      }}
    >
      <MaterialIcons name={icone} size={22} color={colors.primary} />
      <Text style={{ color: colors.textSubtle }}>{titulo}</Text>
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

function Badge({
  colors,
  texto,
  alerta,
}: {
  colors: ThemeColors;
  texto: string;
  alerta?: boolean;
}) {
  return (
    <Text
      style={{
        alignSelf: "flex-start",
        color: alerta ? colors.warningText : colors.successText,
        backgroundColor: alerta ? colors.warningSurface : colors.successSurface,
        borderRadius: 5,
        paddingVertical: 5,
        paddingHorizontal: 8,
        fontSize: 12,
        fontWeight: "bold",
      }}
    >
      {texto}
    </Text>
  );
}
