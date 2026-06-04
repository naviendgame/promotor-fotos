import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
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
};

export default function VerFotos() {
  const [fotos, setFotos] = useState<Foto[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'fotos'),
      orderBy('criadoEm', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Foto[];

      setFotos(lista);
    });

    return () => unsubscribe();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#121212',
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
          <Text
            style={{
              color: 'white',
              fontSize: 28,
              fontWeight: 'bold',
              marginBottom: 20,
            }}
          >
            Fotos Recebidas
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
                marginBottom: 10,
              }}
            >
              👤 {item.promotorEmail}
            </Text>

            <Image
              source={{
                uri: item.imagemBase64,
              }}
              style={{
                width: '100%',
                height: 250,
                borderRadius: 10,
              }}
              resizeMode="cover"
            />

            {item.observacao ? (
              <Text
                style={{
                  color: 'white',
                  marginTop: 10,
                }}
              >
                📝 {item.observacao}
              </Text>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}