import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { onSnapshot } from "firebase/firestore";
import Animated, {
  FadeInUp,
  LinearTransition,
} from "react-native-reanimated";

import { consultaOcorrenciasEstoqueOrdenadas } from "@/services/ocorrencias-estoque-service";
import type {
  OcorrenciaEstoque,
  TipoOcorrenciaEstoque,
} from "@/types/ocorrencia-estoque";
import { obterData } from "@/utils/datas";

import {
  Cabecalho,
  CampoBusca,
  Vazio,
  cabecalhoTabela,
  celula,
  celulaCabecalho,
  linhaTabela,
  tabela,
} from "./lojas";

type FiltroTipo = "todos" | TipoOcorrenciaEstoque | "ruptura";

export default function EstoquePainel() {
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaEstoque[]>([]);
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<FiltroTipo>("todos");

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
        <Resumo titulo="Relatorios" valor={resumo.estoque} icone="inventory" />
        <Resumo titulo="Rupturas" valor={resumo.ruptura} icone="report" />
        <Resumo titulo="Devolucoes" valor={resumo.avaria} icone="assignment-return" />
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
        ].map((opcao) => (
          <Pressable
            key={opcao.valor}
            onPress={() => setTipo(opcao.valor as FiltroTipo)}
            style={{
              minHeight: 42,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: tipo === opcao.valor ? "#2563EB" : "#D6E0F0",
              backgroundColor: tipo === opcao.valor ? "#2563EB" : "white",
              paddingHorizontal: 13,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: tipo === opcao.valor ? "white" : "#526076",
                fontWeight: "bold",
              }}
            >
              {opcao.texto}
            </Text>
          </Pressable>
        ))}
      </View>

      <Animated.View
        entering={FadeInUp.duration(260)}
        layout={LinearTransition.duration(180)}
        style={tabela}
      >
        <View style={cabecalhoTabela}>
          <Text style={[celulaCabecalho, { flex: 0.75 }]}>DATA</Text>
          <Text style={celulaCabecalho}>LOJA</Text>
          <Text style={[celulaCabecalho, { flex: 1.4 }]}>PRODUTO</Text>
          <Text style={[celulaCabecalho, { flex: 0.8 }]}>ESTOQUE</Text>
          <Text style={[celulaCabecalho, { flex: 0.8 }]}>OCORRENCIA</Text>
          <Text style={celulaCabecalho}>PROMOTOR</Text>
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
                linhaTabela,
                { borderBottomWidth: indice < linhas.length - 1 ? 1 : 0 },
              ]}
            >
              <Text style={[celula, { flex: 0.75 }]}>
                {data ? data.toLocaleDateString("pt-BR") : "-"}
              </Text>
              <Text numberOfLines={2} style={celula}>
                {ocorrencia.lojaNome}
              </Text>
              <View style={{ flex: 1.4 }}>
                <Text style={{ color: "#263247", fontWeight: "bold" }}>
                  {item.codigo ? `${item.codigo} - ` : ""}
                  {item.nome}
                </Text>
                <Text style={{ color: "#7A879D", fontSize: 12, paddingTop: 3 }}>
                  {item.complemento || item.observacao || "Sem detalhe"}
                </Text>
              </View>
              <Text style={[celula, { flex: 0.8 }]}>{textoEstoque}</Text>
              <View style={{ flex: 0.8, gap: 4 }}>
                <Badge
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
                  <Text style={{ color: "#7A879D", fontSize: 12 }}>
                    {item.motivoAvaria}
                  </Text>
                ) : null}
              </View>
              <Text numberOfLines={2} style={celula}>
                {ocorrencia.promotorNome || ocorrencia.promotorEmail || "-"}
              </Text>
            </Animated.View>
          );
        })}

        {linhas.length === 0 ? (
          <Vazio texto="Nenhuma ocorrencia encontrada." />
        ) : null}
      </Animated.View>
    </ScrollView>
  );
}

function Resumo({
  titulo,
  valor,
  icone,
}: {
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
        borderColor: "#DDE6F3",
        backgroundColor: "white",
        borderRadius: 8,
        padding: 16,
        gap: 10,
        boxShadow: "0 8px 18px rgba(37, 99, 235, 0.06)",
      }}
    >
      <MaterialIcons name={icone} size={22} color="#2563EB" />
      <Text style={{ color: "#66758A" }}>{titulo}</Text>
      <Text
        style={{
          color: "#172033",
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

function Badge({ texto, alerta }: { texto: string; alerta?: boolean }) {
  return (
    <Text
      style={{
        alignSelf: "flex-start",
        color: alerta ? "#A8660B" : "#247946",
        backgroundColor: alerta ? "#FFF2DD" : "#E4F4EA",
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
