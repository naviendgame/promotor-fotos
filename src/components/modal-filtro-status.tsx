import { Modal, Pressable, Text, View } from "react-native";

import { MaterialIcons } from "@expo/vector-icons";

import { useTheme } from "../theme/theme-context";

export type FiltroStatus = "todos" | "ativos" | "inativos";
export type Ordenacao = "az" | "za" | "recentes" | "antigos";

const OPCOES_STATUS: {
  valor: FiltroStatus;
  rotulo: string;
  descricao: string;
}[] = [
  { valor: "todos", rotulo: "Todos", descricao: "Mostrar tudo" },
  {
    valor: "ativos",
    rotulo: "Apenas ativos",
    descricao: "Esconder os inativos",
  },
  {
    valor: "inativos",
    rotulo: "Apenas inativos",
    descricao: "Mostrar só desativados",
  },
];

const OPCOES_ORDENACAO: { valor: Ordenacao; rotulo: string }[] = [
  { valor: "az", rotulo: "Nome (A → Z)" },
  { valor: "za", rotulo: "Nome (Z → A)" },
  { valor: "recentes", rotulo: "Mais recentes" },
  { valor: "antigos", rotulo: "Mais antigos" },
];

type Props = {
  visivel: boolean;
  valor: FiltroStatus;
  ordenacao?: Ordenacao;
  corPrincipal: string;
  onSelecionar: (v: FiltroStatus) => void;
  onSelecionarOrdenacao?: (o: Ordenacao) => void;
  onFechar: () => void;
};

export default function ModalFiltroStatus({
  visivel,
  valor,
  ordenacao,
  corPrincipal,
  onSelecionar,
  onSelecionarOrdenacao,
  onFechar,
}: Props) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="fade"
      onRequestClose={onFechar}
    >
      <Pressable
        onPress={onFechar}
        style={{
          flex: 1,
          backgroundColor: "rgba(15,23,42,0.45)",
          justifyContent: "center",
          padding: 22,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "rgba(15,23,42,0.06)",
            paddingVertical: 8,
          }}
        >
          {/* Seção: Filtrar por status */}
          <Text
            style={{
              color: colors.text,
              fontSize: 16,
              fontWeight: "bold",
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 6,
            }}
          >
            Filtrar por status
          </Text>

          {OPCOES_STATUS.map((opcao) => {
            const selecionado = opcao.valor === valor;
            return (
              <Pressable
                key={opcao.valor}
                onPress={() => onSelecionar(opcao.valor)}
                style={{
                  minHeight: 56,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  backgroundColor: selecionado
                    ? colors.surfaceHighlight
                    : "transparent",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: selecionado ? corPrincipal : colors.text,
                      fontWeight: selecionado ? "bold" : "500",
                      fontSize: 15,
                    }}
                  >
                    {opcao.rotulo}
                  </Text>
                  <Text
                    style={{
                      color: colors.textSubtle,
                      fontSize: 12,
                      paddingTop: 2,
                    }}
                  >
                    {opcao.descricao}
                  </Text>
                </View>
                {selecionado ? (
                  <MaterialIcons
                    name="check"
                    size={20}
                    color={corPrincipal}
                  />
                ) : null}
              </Pressable>
            );
          })}

          {/* Divisória */}
          {ordenacao !== undefined && onSelecionarOrdenacao ? (
            <>
              <View
                style={{
                  height: 1,
                  backgroundColor: "rgba(15,23,42,0.06)",
                  marginVertical: 8,
                }}
              />

              {/* Seção: Ordenar por */}
              <Text
                style={{
                  color: colors.text,
                  fontSize: 16,
                  fontWeight: "bold",
                  paddingHorizontal: 16,
                  paddingTop: 4,
                  paddingBottom: 6,
                }}
              >
                Ordenar por
              </Text>

              {OPCOES_ORDENACAO.map((opcao) => {
                const selecionado = opcao.valor === ordenacao;
                return (
                  <Pressable
                    key={opcao.valor}
                    onPress={() => onSelecionarOrdenacao(opcao.valor)}
                    style={{
                      minHeight: 48,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      backgroundColor: selecionado
                        ? colors.surfaceHighlight
                        : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        color: selecionado ? corPrincipal : colors.text,
                        fontWeight: selecionado ? "bold" : "500",
                        fontSize: 15,
                      }}
                    >
                      {opcao.rotulo}
                    </Text>
                    {selecionado ? (
                      <MaterialIcons
                        name="check"
                        size={20}
                        color={corPrincipal}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
