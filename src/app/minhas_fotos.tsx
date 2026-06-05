import { useEffect, useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";

import { router } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import { auth, db } from "../services/firebaseConfig";

type Foto = {
  id: string;
  lojaNome: string;
  promotorEmail: string;
  observacao: string;
  imagemBase64: string;
  categoria?: string;
  status?: string;
  comentarioAdmin?: string;
  criadoEm: any;
};

function obterCategoria(foto: Foto) {
  return foto.categoria || "Sem categoria";
}

function obterStatus(foto: Foto) {
  return foto.status || "pendente";
}

function textoStatus(status: string) {
  if (status === "aprovada") return "Aprovada";
  if (status === "refazer") return "Refazer";
  if (status === "rejeitada") return "Rejeitada";
  return "Pendente";
}

function corStatus(status: string) {
  if (status === "aprovada") return "#16A34A";
  if (status === "refazer") return "#F59E0B";
  if (status === "rejeitada") return "#EF4444";
  return "#2563EB";
}

export default function MinhasFotos() {
  const [fotos, setFotos] = useState<Foto[]>([]);

  useEffect(() => {
    const usuarioAtual = auth.currentUser;

    if (!usuarioAtual) {
      router.replace("/" as any);
      return;
    }

    const q = query(
      collection(db, "fotos"),
      where("promotorId", "==", usuarioAtual.uid),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Foto[];

      lista.sort((a, b) => {
        const dataA = a.criadoEm?.toDate?.()?.getTime?.() || 0;

        const dataB = b.criadoEm?.toDate?.()?.getTime?.() || 0;

        return dataB - dataA;
      });

      setFotos(lista);
    });

    return () => unsubscribe();
  }, []);

  function formatarData(dataFirebase: any) {
    const data = dataFirebase?.toDate?.();

    if (!data) return "Data não disponível";

    return data.toLocaleString("pt-BR");
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#121212",
      }}
    >
      <FlatList
        data={fotos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 20,
          paddingTop: 60,
        }}
        ListHeaderComponent={
          <View>
            <Text
              style={{
                color: "white",
                fontSize: 28,
                fontWeight: "bold",
                marginBottom: 10,
              }}
            >
              Minhas Fotos
            </Text>

            <Text
              style={{
                color: "#aaa",
                marginBottom: 20,
              }}
            >
              Total enviadas: {fotos.length}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text
            style={{
              color: "#888",
              marginTop: 20,
            }}
          >
            Você ainda não enviou nenhuma foto.
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#1E1E1E",
              borderRadius: 12,
              padding: 15,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              🏪 {item.lojaNome}
            </Text>

            <Text
              style={{
                color: "#aaa",
                marginTop: 5,
                marginBottom: 10,
              }}
            >
              🕒 {formatarData(item.criadoEm)}
            </Text>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <View
                style={{
                  backgroundColor: "#312E81",
                  borderRadius: 20,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  {obterCategoria(item)}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: corStatus(obterStatus(item)),
                  borderRadius: 20,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  {textoStatus(obterStatus(item))}
                </Text>
              </View>
            </View>

            <Image
              source={{
                uri: item.imagemBase64,
              }}
              style={{
                width: "100%",
                height: 260,
                borderRadius: 10,
                backgroundColor: "#333",
              }}
              resizeMode="cover"
            />

            {item.observacao ? (
              <Text
                style={{
                  color: "white",
                  marginTop: 10,
                }}
              >
                📝 {item.observacao}
              </Text>
            ) : (
              <Text
                style={{
                  color: "#777",
                  marginTop: 10,
                  fontStyle: "italic",
                }}
              >
                Sem observação.
              </Text>
            )}
          </View>
        )}
      />

      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          backgroundColor: "#444",
          padding: 15,
          borderRadius: 10,
          margin: 20,
        }}
      >
        <Text
          style={{
            color: "white",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          Voltar
        </Text>
      </TouchableOpacity>
    </View>
  );
}
