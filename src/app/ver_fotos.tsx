import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ImageViewer from "react-native-image-zoom-viewer";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library/legacy";

import { db } from "../services/firebaseConfig";

type Foto = {
  id: string;
  lojaNome: string;
  promotorEmail: string;
  observacao: string;
  imagemBase64: string;
  criadoEm: any;
};

export default function VerFotos() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [lojaFiltro, setLojaFiltro] = useState("Todas");
  const [promotorFiltro, setPromotorFiltro] = useState("Todos");
  const [filtroHoje, setFiltroHoje] = useState(false);

  const [fotoSelecionada, setFotoSelecionada] = useState<Foto | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [salvandoFoto, setSalvandoFoto] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "fotos"), orderBy("criadoEm", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Foto[];

      setFotos(lista);
    });

    return () => unsubscribe();
  }, []);

  function formatarData(dataFirebase: any) {
    const data = dataFirebase?.toDate?.();

    if (!data) return "Data não disponível";

    return data.toLocaleString("pt-BR");
  }

  function ehHoje(dataFirebase: any) {
    const data = dataFirebase?.toDate?.();

    if (!data) return false;

    const hoje = new Date();

    return (
      data.getDate() === hoje.getDate() &&
      data.getMonth() === hoje.getMonth() &&
      data.getFullYear() === hoje.getFullYear()
    );
  }

  function abrirFoto(foto: Foto) {
    setFotoSelecionada(foto);
    setMenuAberto(false);
  }

  function fecharFoto() {
    setFotoSelecionada(null);
    setMenuAberto(false);
  }

  async function excluirFoto(id: string) {
    try {
      await deleteDoc(doc(db, "fotos", id));
      Alert.alert("Sucesso", "Foto excluída com sucesso.");
      fecharFoto();
    } catch (error: any) {
      console.log(error);
      Alert.alert("Erro", error.message);
    }
  }

  async function baixarFoto() {
    if (!fotoSelecionada || salvandoFoto) return;

    try {
      setSalvandoFoto(true);
      setMenuAberto(false);

      const dadosImagem = fotoSelecionada.imagemBase64.match(
        /^data:(image\/([a-zA-Z0-9.+-]+));base64,(.*)$/,
      );

      if (!dadosImagem) {
        Alert.alert("Erro", "Não foi possível preparar esta foto para baixar.");
        return;
      }

      const extensaoOriginal = dadosImagem[2].toLowerCase();
      const extensao = extensaoOriginal === "jpeg" ? "jpg" : extensaoOriginal;
      const base64 = dadosImagem[3];
      const nomeArquivo = `foto-${fotoSelecionada.id}.${extensao}`;
      const uriArquivo = `${FileSystem.cacheDirectory}${nomeArquivo}`;

      await FileSystem.writeAsStringAsync(uriArquivo, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await MediaLibrary.saveToLibraryAsync(uriArquivo);

      Alert.alert("Sucesso", "Foto baixada na galeria.");
    } catch (error: any) {
      console.log(error);
      Alert.alert("Erro", error.message || "Não foi possível baixar a foto.");
    } finally {
      setSalvandoFoto(false);
    }
  }

  function confirmarExcluirFoto() {
    if (!fotoSelecionada) return;

    Alert.alert(
      "Excluir foto",
      "Tem certeza que deseja excluir esta foto? Essa ação não pode ser desfeita.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => excluirFoto(fotoSelecionada.id),
        },
      ],
    );
  }

  const lojasUnicas = ["Todas", ...new Set(fotos.map((foto) => foto.lojaNome))];

  const promotoresUnicos = [
    "Todos",
    ...new Set(fotos.map((foto) => foto.promotorEmail)),
  ];

  const fotosFiltradas = fotos.filter((foto) => {
    const filtroLojaOk = lojaFiltro === "Todas" || foto.lojaNome === lojaFiltro;

    const filtroPromotorOk =
      promotorFiltro === "Todos" || foto.promotorEmail === promotorFiltro;

    const filtroDataOk = !filtroHoje || ehHoje(foto.criadoEm);

    return filtroLojaOk && filtroPromotorOk && filtroDataOk;
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      <FlatList
        data={fotosFiltradas}
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
              Fotos Recebidas
            </Text>

            <Text style={{ color: "#aaa", marginBottom: 20 }}>
              Total exibido: {fotosFiltradas.length}
            </Text>

            <Text
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: "bold",
                marginBottom: 8,
              }}
            >
              Filtrar por loja
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 15 }}
            >
              {lojasUnicas.map((loja) => (
                <TouchableOpacity
                  key={loja}
                  onPress={() => setLojaFiltro(loja)}
                  style={{
                    backgroundColor:
                      lojaFiltro === loja ? "#2563EB" : "#1E1E1E",
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 20,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    {loja}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: "bold",
                marginBottom: 8,
              }}
            >
              Filtrar por promotor
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 15 }}
            >
              {promotoresUnicos.map((promotor) => (
                <TouchableOpacity
                  key={promotor}
                  onPress={() => setPromotorFiltro(promotor)}
                  style={{
                    backgroundColor:
                      promotorFiltro === promotor ? "#9333EA" : "#1E1E1E",
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 20,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    {promotor}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: "bold",
                marginBottom: 8,
              }}
            >
              Filtrar por data
            </Text>

            <View style={{ flexDirection: "row", marginBottom: 20 }}>
              <TouchableOpacity
                onPress={() => setFiltroHoje(false)}
                style={{
                  backgroundColor: !filtroHoje ? "#16A34A" : "#1E1E1E",
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 20,
                  marginRight: 8,
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  Todas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFiltroHoje(true)}
                style={{
                  backgroundColor: filtroHoje ? "#16A34A" : "#1E1E1E",
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 20,
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>Hoje</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={{ color: "#888", marginTop: 20 }}>
            Nenhuma foto encontrada com os filtros selecionados.
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

            <Text style={{ color: "#aaa", marginTop: 5 }}>
              👤 {item.promotorEmail}
            </Text>

            <Text style={{ color: "#aaa", marginTop: 5, marginBottom: 10 }}>
              🕒 {formatarData(item.criadoEm)}
            </Text>

            <TouchableOpacity onPress={() => abrirFoto(item)}>
              <Image
                source={{ uri: item.imagemBase64 }}
                style={{
                  width: "100%",
                  height: 280,
                  borderRadius: 10,
                  backgroundColor: "#333",
                }}
                resizeMode="cover"
              />
            </TouchableOpacity>

            {item.observacao ? (
              <Text style={{ color: "white", marginTop: 10, lineHeight: 20 }}>
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

      <Modal visible={!!fotoSelecionada} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.95)",
            justifyContent: "center",
            alignItems: "center",
            padding: 15,
          }}
        >
          <View
            style={{
              position: "absolute",
              top: 45,
              left: 20,
              right: 20,
              zIndex: 10,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <TouchableOpacity onPress={fecharFoto}>
              <Text style={{ color: "white", fontSize: 32 }}>×</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMenuAberto(!menuAberto)}
              style={{
                backgroundColor: "#1E1E1E",
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "white", fontSize: 26 }}>⋮</Text>
            </TouchableOpacity>
          </View>

          {menuAberto && (
            <View
              style={{
                position: "absolute",
                top: 95,
                right: 20,
                backgroundColor: "#1E1E1E",
                borderRadius: 10,
                padding: 10,
                zIndex: 20,
                width: 180,
              }}
            >
              <TouchableOpacity
                onPress={baixarFoto}
                disabled={salvandoFoto}
                style={{ padding: 12 }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  {salvandoFoto ? "Baixando..." : "Baixar foto"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmarExcluirFoto}
                style={{ padding: 12 }}
              >
                <Text style={{ color: "#EF4444", fontWeight: "bold" }}>
                  Excluir foto
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {fotoSelecionada && (
            <ImageViewer
              imageUrls={[{ url: fotoSelecionada.imagemBase64 }]}
              backgroundColor="rgba(0,0,0,0)"
              enableImageZoom
              enableSwipeDown
              maxScale={4}
              minScale={1}
              onSwipeDown={fecharFoto}
              renderIndicator={() => <View />}
              saveToLocalByLongPress={false}
              style={{
                flex: 1,
                width: "100%",
              }}
              useNativeDriver={false}
            />
          )}

          {fotoSelecionada && (
            <View
              style={{
                position: "absolute",
                bottom: 30,
                left: 20,
                right: 20,
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                🏪 {fotoSelecionada.lojaNome}
              </Text>
              <Text style={{ color: "#aaa", marginTop: 4 }}>
                👤 {fotoSelecionada.promotorEmail}
              </Text>
              <Text style={{ color: "#aaa", marginTop: 4 }}>
                🕒 {formatarData(fotoSelecionada.criadoEm)}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
