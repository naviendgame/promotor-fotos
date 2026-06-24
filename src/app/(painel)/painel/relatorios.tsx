import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { onSnapshot } from "firebase/firestore";

import { fotosCollection } from "@/services/fotos-service";
import { useTheme } from "@/theme/theme-context";
import type { ThemeColors } from "@/theme/colors";
import type { Foto } from "@/types/foto";
import { filtrarFotosAtuais } from "@/utils/fotos";

type LinhaResumoProps = {
  colors: ThemeColors;
  nome: string;
  valor: number;
  total: number;
  cor: string;
};

function LinhaResumo({ colors, nome, valor, total, cor }: LinhaResumoProps) {
  const percentual = total > 0 ? (valor / total) * 100 : 0;

  return (
    <View style={{ gap: 7 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: colors.textMuted }}>{nome}</Text>
        <Text
          style={{
            color: colors.text,
            fontWeight: "bold",
            fontVariant: ["tabular-nums"],
          }}
        >
          {valor}
        </Text>
      </View>
      <View
        style={{
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.surfaceElevated,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${percentual}%`,
            height: "100%",
            backgroundColor: cor,
          }}
        />
      </View>
    </View>
  );
}

export default function RelatoriosPainel() {
  const { colors } = useTheme();
  const [fotos, setFotos] = useState<Foto[]>([]);

  useEffect(() => {
    return onSnapshot(fotosCollection(), (snapshot) => {
      const lista = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Foto[];

      setFotos(filtrarFotosAtuais(lista));
    });
  }, []);

  const relatorio = useMemo(() => {
    const contar = (obterChave: (foto: Foto) => string) => {
      const mapa = new Map<string, number>();

      fotos.forEach((foto) => {
        const chave = obterChave(foto);
        mapa.set(chave, (mapa.get(chave) || 0) + 1);
      });

      return Array.from(mapa.entries())
        .map(([nome, valor]) => ({ nome, valor }))
        .sort((a, b) => b.valor - a.valor);
    };

    return {
      status: contar((foto) => foto.status || "pendente"),
      categorias: contar((foto) => foto.categoria || "Sem categoria"),
      lojas: contar((foto) => foto.lojaNome || "Loja nao informada"),
      promotores: contar(
        (foto) =>
          foto.promotorNome ||
          foto.promotorEmail ||
          "Promotor nao identificado",
      ),
    };
  }, [fotos]);

  const cores = [
    colors.primary,
    colors.success,
    colors.warning,
    "#7C3AED",
    colors.danger,
  ];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: 18, paddingBottom: 28 }}
    >
      <View>
        <Text style={{ color: colors.text, fontSize: 27, fontWeight: "bold" }}>
          Relatorios
        </Text>
        <Text style={{ color: colors.textSubtle, paddingTop: 5 }}>
          Consolidado das {fotos.length} fotos registradas
        </Text>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        {[
          { titulo: "Fotos por status", dados: relatorio.status },
          { titulo: "Fotos por categoria", dados: relatorio.categorias },
          { titulo: "Fotos por loja", dados: relatorio.lojas },
          { titulo: "Fotos por promotor", dados: relatorio.promotores },
        ].map((grupo) => (
          <View
            key={grupo.titulo}
            style={{
              flex: 1,
              minWidth: 330,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              padding: 18,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 17,
                fontWeight: "bold",
                paddingBottom: 18,
              }}
            >
              {grupo.titulo}
            </Text>
            <View style={{ gap: 15 }}>
              {grupo.dados.slice(0, 8).map((item, indice) => (
                <LinhaResumo
                  colors={colors}
                  key={item.nome}
                  nome={item.nome}
                  valor={item.valor}
                  total={fotos.length}
                  cor={cores[indice % cores.length]}
                />
              ))}
              {grupo.dados.length === 0 ? (
                <Text style={{ color: colors.textSubtle }}>
                  Nenhum dado disponivel.
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
