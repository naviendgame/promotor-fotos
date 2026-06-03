import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { router } from 'expo-router';

export default function Home() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  async function fazerLogin() {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      senha
    );

    console.log('Usuário logado:', userCredential.user.email);

    router.replace('/admin' as any);
  } catch (error: any) {
    Alert.alert('Erro', error.message);
  }
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#121212',
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: 'bold',
          marginBottom: 30,
          textAlign: 'center',
          color: 'white',
        }}
      >
        Promotor Fotos
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          borderWidth: 1,
          borderColor: '#444',
          borderRadius: 8,
          padding: 12,
          marginBottom: 15,
          color: 'white',
        }}
      />

      <TextInput
        placeholder="Senha"
        placeholderTextColor="#888"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: '#444',
          borderRadius: 8,
          padding: 12,
          marginBottom: 20,
          color: 'white',
        }}
      />

      <TouchableOpacity
        onPress={fazerLogin}
        style={{
          backgroundColor: '#2563EB',
          padding: 15,
          borderRadius: 8,
        }}
      >
        <Text
          style={{
            color: 'white',
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          Entrar
        </Text>
      </TouchableOpacity>
    </View>
  );
}