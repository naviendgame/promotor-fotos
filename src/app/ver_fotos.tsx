import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

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
  const [lojaFiltro, setLojaFiltro] = useState('Todas');
  const [promotorFiltro, setPromotorFiltro] = useState('Todos');
  const [filtroHoje, setFiltroHoje] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'fotos'), orderBy('criadoEm', 'desc'));

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

    if (!data) return 'Data não disponível';

    return data.toLocaleString('pt-BR');
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

  const lojasUnicas = ['Todas', ...new Set(fotos.map((foto) => foto.lojaNome))];

  const promotoresUnicos = [
    'Todos',
    ...new Set(fotos.map((foto) => foto.promotorEmail)),
  ];

  const fotosFiltradas = fotos.filter((foto) => {
    const filtroLojaOk =
      lojaFiltro === 'Todas' || foto.lojaNome === lojaFiltro;

    const filtroPromotorOk =
      promotorFiltro === 'Todos' || foto.promotorEmail === promotorFiltro;

    const filtroDataOk = !filtroHoje || ehHoje(foto.criadoEm);

    return filtroLojaOk && filtroPromotorOk && filtroDataOk;
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
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
                color: 'white',
                fontSize: 28,
                fontWeight: 'bold',
                marginBottom: 10,
              }}
            >
              Fotos Recebidas
            </Text>

            <Text
              style={{
                color: '#aaa',
                marginBottom: 20,
              }}
            >
              Total exibido: {fotosFiltradas.length}
            </Text>

            <Text
              style={{
                color: 'white',
                fontSize: 16,
                fontWeight: 'bold',
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
                      lojaFiltro === loja ? '#2563EB' : '#1E1E1E',
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 20,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>
                    {loja}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text
              style={{
                color: 'white',
                fontSize: 16,
                fontWeight: 'bold',
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
                      promotorFiltro === promotor ? '#9333EA' : '#1E1E1E',
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 20,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>
                    {promotor}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text
              style={{
                color: 'white',
                fontSize: 16,
                fontWeight: 'bold',
                marginBottom: 8,
              }}
            >
              Filtrar por data
            </Text>

            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
              <TouchableOpacity
                onPress={() => setFiltroHoje(false)}
                style={{
                  backgroundColor: !filtroHoje ? '#16A34A' : '#1E1E1E',
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 20,
                  marginRight: 8,
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                  Todas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFiltroHoje(true)}
                style={{
                  backgroundColor: filtroHoje ? '#16A34A' : '#1E1E1E',
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 20,
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                  Hoje
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={{ color: '#888', marginTop: 20 }}>
            Nenhuma foto encontrada com os filtros selecionados.
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: '#1E1E1E',
              borderRadius: 12,
              padding: 15,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 18,
                fontWeight: 'bold',
              }}
            >
              🏪 {item.lojaNome}
            </Text>

            <Text
              style={{
                color: '#aaa',
                marginTop: 5,
              }}
            >
              👤 {item.promotorEmail}
            </Text>

            <Text
              style={{
                color: '#aaa',
                marginTop: 5,
                marginBottom: 10,
              }}
            >
              🕒 {formatarData(item.criadoEm)}
            </Text>

            <Image
              source={{
                uri: item.imagemBase64,
              }}
              style={{
                width: '100%',
                height: 280,
                borderRadius: 10,
                backgroundColor: '#333',
              }}
              resizeMode="cover"
            />

            {item.observacao ? (
              <Text
                style={{
                  color: 'white',
                  marginTop: 10,
                  lineHeight: 20,
                }}
              >
                📝 {item.observacao}
              </Text>
            ) : (
              <Text
                style={{
                  color: '#777',
                  marginTop: 10,
                  fontStyle: 'italic',
                }}
              >
                Sem observação.
              </Text>
            )}
          </View>
        )}
      />
    </View>
  );
}