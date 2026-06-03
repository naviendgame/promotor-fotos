import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export default function Admin() {
  const [totalLojas, setTotalLojas] = useState(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'lojas'), (snapshot) => {
      setTotalLojas(snapshot.size);
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#121212', padding: 20 }}>
      <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold', marginTop: 60, marginBottom: 30 }}>
        Dashboard Admin
      </Text>

      <View style={{ backgroundColor: '#1E1E1E', padding: 20, borderRadius: 12, marginBottom: 15 }}>
        <Text style={{ color: 'white', fontSize: 18 }}>📷 Fotos Recebidas Hoje</Text>
        <Text style={{ color: '#2563EB', fontSize: 32, fontWeight: 'bold', marginTop: 10 }}>0</Text>
      </View>

      <View style={{ backgroundColor: '#1E1E1E', padding: 20, borderRadius: 12, marginBottom: 15 }}>
        <Text style={{ color: 'white', fontSize: 18 }}>🏪 Lojas Cadastradas</Text>
        <Text style={{ color: '#22C55E', fontSize: 32, fontWeight: 'bold', marginTop: 10 }}>
          {totalLojas}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => router.push('/cadastro_loja' as any)}
        style={{ backgroundColor: '#2563EB', padding: 15, borderRadius: 10, marginTop: 10 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Cadastrar Loja
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ backgroundColor: '#16A34A', padding: 15, borderRadius: 10, marginTop: 10 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Ver Fotos
        </Text>
      </TouchableOpacity>
    </View>
  );
}