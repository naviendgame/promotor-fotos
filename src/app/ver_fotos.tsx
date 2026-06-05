import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
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
  updateDoc,
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
  categoria?: string;
  status?: string;
  comentarioAdmin?: string;
  criadoEm: any;
};

const categoriasFoto = [
  "Todas",
  "Gondola",
  "Ponta",
  "Ilha",
  "Ruptura",
  "Preco",
  "Validade",
  "Concorrente",
  "Antes/depois",
  "Sem categoria",
];

const statusFotos = ["Todos", "pendente", "aprovada", "refazer", "rejeitada"];

export default function VerFotos() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [lojaFiltro, setLojaFiltro] = useState("Todas");
  const [promotorFiltro, setPromotorFiltro] = useState("Todos");
  const [filtroHoje, setFiltroHoje] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [statusFiltro, setStatusFiltro] = useState("Todos");

  const [fotoSelecionada, setFotoSelecionada] = useState<Foto | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [salvandoFoto, setSalvandoFoto] = useState(false);
  const [modalComentarioAberto, setModalComentarioAberto] = useState(false);
  const [statusComComentario, setStatusComComentario] = useState("");
  const [comentarioAdmin, setComentarioAdmin] = useState("");

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

  async function atualizarStatusFoto(status: string) {
    if (!fotoSelecionada) return;

    try {
      await updateDoc(doc(db, "fotos", fotoSelecionada.id), {
        status,
        comentarioAdmin:
          status === "aprovada" ? "" : fotoSelecionada.comentarioAdmin || "",
      });

      setFotoSelecionada({
        ...fotoSelecionada,
        status,
        comentarioAdmin:
          status === "aprovada" ? "" : fotoSelecionada.comentarioAdmin || "",
      });
      setMenuAberto(false);

      Alert.alert("Sucesso", `Foto marcada como ${textoStatus(status)}.`);
    } catch (error: any) {
      console.log(error);
      Alert.alert("Erro", error.message || "Nao foi possivel atualizar a foto.");
    }
  }

  function abrirComentarioStatus(status: string) {
    if (!fotoSelecionada) return;

    setStatusComComentario(status);
    setComentarioAdmin(fotoSelecionada.comentarioAdmin || "");
    setMenuAberto(false);
    setModalComentarioAberto(true);
  }

  function cancelarComentarioStatus() {
    setModalComentarioAberto(false);
    setStatusComComentario("");
    setComentarioAdmin("");
  }

  async function salvarComentarioStatus() {
    if (!fotoSelecionada || !statusComComentario) return;

    const comentario = comentarioAdmin.trim();

    if (!comentario) {
      Alert.alert("Atencao", "Informe o motivo para o promotor.");
      return;
    }

    try {
      await updateDoc(doc(db, "fotos", fotoSelecionada.id), {
        status: statusComComentario,
        comentarioAdmin: comentario,
      });

      setFotoSelecionada({
        ...fotoSelecionada,
        status: statusComComentario,
        comentarioAdmin: comentario,
      });

      cancelarComentarioStatus();
      Alert.alert(
        "Sucesso",
        `Foto marcada como ${textoStatus(statusComComentario)}.`,
      );
    } catch (error: any) {
      console.log(error);
      Alert.alert("Erro", error.message || "Nao foi possivel atualizar a foto.");
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
    const filtroCategoriaOk =
      categoriaFiltro === "Todas" || obterCategoria(foto) === categoriaFiltro;
    const filtroStatusOk =
      statusFiltro === "Todos" || obterStatus(foto) === statusFiltro;

    return (
      filtroLojaOk &&
      filtroPromotorOk &&
      filtroDataOk &&
      filtroCategoriaOk &&
      filtroStatusOk
    );
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

            <Text
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: "bold",
                marginBottom: 8,
              }}
            >
              Filtrar por categoria
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 15 }}
            >
              {categoriasFoto.map((categoria) => (
                <TouchableOpacity
                  key={categoria}
                  onPress={() => setCategoriaFiltro(categoria)}
                  style={{
                    backgroundColor:
                      categoriaFiltro === categoria ? "#F59E0B" : "#1E1E1E",
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 20,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    {categoria}
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
              Filtrar por status
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 20 }}
            >
              {statusFotos.map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => setStatusFiltro(status)}
                  style={{
                    backgroundColor:
                      statusFiltro === status ? "#0EA5E9" : "#1E1E1E",
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 20,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    {status === "Todos" ? "Todos" : textoStatus(status)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
                onPress={() => atualizarStatusFoto("aprovada")}
                style={{ padding: 12 }}
              >
                <Text style={{ color: "#16A34A", fontWeight: "bold" }}>
                  Aprovar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => abrirComentarioStatus("refazer")}
                style={{ padding: 12 }}
              >
                <Text style={{ color: "#F59E0B", fontWeight: "bold" }}>
                  Pedir refazer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => abrirComentarioStatus("rejeitada")}
                style={{ padding: 12 }}
              >
                <Text style={{ color: "#EF4444", fontWeight: "bold" }}>
                  Rejeitar
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
              <Text style={{ color: "#aaa", marginTop: 4 }}>
                Categoria: {obterCategoria(fotoSelecionada)}
              </Text>
              <Text
                style={{
                  color: corStatus(obterStatus(fotoSelecionada)),
                  marginTop: 4,
                  fontWeight: "bold",
                }}
              >
                Status: {textoStatus(obterStatus(fotoSelecionada))}
              </Text>
              {fotoSelecionada.comentarioAdmin ? (
                <Text style={{ color: "white", marginTop: 4, lineHeight: 20 }}>
                  Comentario: {fotoSelecionada.comentarioAdmin}
                </Text>
              ) : null}
            </View>
          )}
        </View>
      </Modal>

      <Modal
        visible={modalComentarioAberto}
        transparent
        animationType="fade"
        onRequestClose={cancelarComentarioStatus}
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
              backgroundColor: "#1E1E1E",
              borderRadius: 12,
              padding: 18,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 8,
              }}
            >
              Motivo para {textoStatus(statusComComentario)}
            </Text>

            <Text style={{ color: "#aaa", marginBottom: 12 }}>
              Esse comentario sera exibido para o promotor.
            </Text>

            <TextInput
              value={comentarioAdmin}
              onChangeText={setComentarioAdmin}
              placeholder="Ex: Foto sem preco visivel"
              placeholderTextColor="#777"
              multiline
              textAlignVertical="top"
              style={{
                minHeight: 110,
                borderWidth: 1,
                borderColor: "#444",
                borderRadius: 10,
                padding: 12,
                color: "white",
                marginBottom: 14,
              }}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={cancelarComentarioStatus}
                style={{
                  flex: 1,
                  backgroundColor: "#444",
                  padding: 14,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    color: "white",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={salvarComentarioStatus}
                style={{
                  flex: 1,
                  backgroundColor: "#2563EB",
                  padding: 14,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    color: "white",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  Salvar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
