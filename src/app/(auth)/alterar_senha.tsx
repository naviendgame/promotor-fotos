import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

import { router } from "expo-router";
import { updatePassword } from "firebase/auth";

import { ROTAS } from "@/constants/routes";
import { auth } from "@/services/firebaseConfig";
import {
  atualizarUsuario,
  buscarUsuario,
} from "@/services/usuarios-service";
import { useTheme } from "@/theme/theme-context";

export default function AlterarSenha() {
  const { colors } = useTheme();
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

  async function salvarNovaSenha() {
    try {
      const usuarioAtual = auth.currentUser;

      if (!usuarioAtual) {
        Alert.alert("Erro", "Usuário não encontrado.");
        return;
      }

      if (novaSenha.length < 6) {
        Alert.alert("Atenção", "A senha deve ter pelo menos 6 caracteres.");
        return;
      }

      if (novaSenha !== confirmarSenha) {
        Alert.alert("Atenção", "As senhas não coincidem.");
        return;
      }

      await updatePassword(usuarioAtual, novaSenha);

      await atualizarUsuario(usuarioAtual.uid, {
        primeiroAcesso: false,
      });

      Alert.alert("Sucesso", "Senha alterada com sucesso!");

      const usuarioSnap = await buscarUsuario(usuarioAtual.uid);
      const tipo = usuarioSnap.data()?.tipo;

      router.replace(
        tipo === "admin" || tipo === "super_admin"
          ? process.env.EXPO_OS === "web"
            ? ROTAS.painel
            : ROTAS.admin
          : ROTAS.promotor,
      );
    } catch (error: any) {
      console.log(error);
      Alert.alert("Erro", error.message);
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: "center",
        padding: 20,
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: 28,
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        Primeiro Acesso
      </Text>

      <Text
        style={{
          color: colors.textSubtle,
          textAlign: "center",
          marginBottom: 30,
        }}
      >
        Crie uma nova senha para continuar.
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          marginBottom: 15,
          paddingHorizontal: 12,
          backgroundColor: colors.surface,
        }}
      >
        <TextInput
          placeholder="Nova senha"
          placeholderTextColor={colors.placeholder}
          value={novaSenha}
          onChangeText={setNovaSenha}
          secureTextEntry={!mostrarSenha}
          style={{
            flex: 1,
            paddingVertical: 12,
            color: colors.text,
          }}
        />

        <TouchableOpacity onPress={() => setMostrarSenha(!mostrarSenha)}>
          <Text
            style={{
              color: colors.info,
              fontSize: 18,
            }}
          >
            {mostrarSenha ? "🙈" : "👁️"}
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          marginBottom: 20,
          paddingHorizontal: 12,
          backgroundColor: colors.surface,
        }}
      >
        <TextInput
          placeholder="Confirmar senha"
          placeholderTextColor={colors.placeholder}
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
          secureTextEntry={!mostrarConfirmacao}
          style={{
            flex: 1,
            paddingVertical: 12,
            color: colors.text,
          }}
        />

        <TouchableOpacity
          onPress={() => setMostrarConfirmacao(!mostrarConfirmacao)}
        >
          <Text
            style={{
              color: colors.info,
              fontSize: 18,
            }}
          >
            {mostrarConfirmacao ? "🙈" : "👁️"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={salvarNovaSenha}
        style={{
          backgroundColor: colors.primary,
          padding: 15,
          borderRadius: 10,
        }}
      >
        <Text
          style={{
            color: colors.primaryText,
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          Salvar Nova Senha
        </Text>
      </TouchableOpacity>
    </View>
  );
}
