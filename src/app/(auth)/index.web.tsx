import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { ROTAS } from "@/constants/routes";
import { auth } from "@/services/firebaseConfig";
import { buscarUsuario } from "@/services/usuarios-service";

export default function LoginWeb() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const { width } = useWindowDimensions();
  const compacto = width < 860;

  async function entrar() {
    if (!email.trim() || !senha) {
      setMensagem("Preencha email e senha.");
      return;
    }

    try {
      setCarregando(true);
      setMensagem("");
      const credencial = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        senha,
      );
      const perfilSnap = await buscarUsuario(credencial.user.uid);

      if (!perfilSnap.exists() || perfilSnap.data().ativo === false) {
        await signOut(auth);
        setMensagem("Este acesso nao esta ativo no sistema.");
        return;
      }

      const perfil = perfilSnap.data();

      if (perfil.primeiroAcesso === true) {
        router.replace(ROTAS.alterarSenha);
      } else if (perfil.tipo === "admin" || perfil.tipo === "super_admin") {
        router.replace(ROTAS.painel);
      } else if (perfil.tipo === "promotor") {
        router.replace(ROTAS.promotor);
      } else {
        await signOut(auth);
        setMensagem("Tipo de usuario invalido.");
      }
    } catch (error: any) {
      console.log(error);
      setMensagem(
        error?.code === "auth/invalid-credential"
          ? "Email ou senha incorretos."
          : "Nao foi possivel entrar. Tente novamente.",
      );
    } finally {
      setCarregando(false);
    }
  }

  async function recuperarSenha() {
    if (!email.trim()) {
      setMensagem("Digite seu email para recuperar a senha.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMensagem("Enviamos as instrucoes de recuperacao para seu email.");
    } catch (error) {
      console.log(error);
      setMensagem("Nao foi possivel enviar o email de recuperacao.");
    }
  }

  return (
    <View
      style={{
        flex: 1,
        minHeight: 620,
        flexDirection: compacto ? "column" : "row",
        backgroundColor: "#F4F6F9",
      }}
    >
      {!compacto ? (
        <View
          style={{
            flex: 1.05,
            backgroundColor: "#172033",
            padding: 64,
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 8,
                backgroundColor: "#2F6FED",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="photo-camera" size={24} color="white" />
            </View>
            <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
              Promotor Fotos
            </Text>
          </View>

          <View style={{ maxWidth: 560 }}>
            <Text
              style={{
                color: "white",
                fontSize: 42,
                fontWeight: "bold",
                lineHeight: 50,
              }}
            >
              A operacao das lojas em um unico lugar.
            </Text>
            <Text
              style={{
                color: "#AEBBD0",
                fontSize: 17,
                lineHeight: 27,
                paddingTop: 18,
                maxWidth: 500,
              }}
            >
              Acompanhe fotos, promotores, lojas e avaliacoes com uma visao
              organizada para a equipe de gestao.
            </Text>

            <View style={{ flexDirection: "row", gap: 28, paddingTop: 34 }}>
              {[
                ["photo-library", "Fotos organizadas"],
                ["groups", "Equipe centralizada"],
                ["assessment", "Indicadores claros"],
              ].map(([icone, texto]) => (
                <View
                  key={texto}
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <MaterialIcons
                    name={icone as keyof typeof MaterialIcons.glyphMap}
                    size={20}
                    color="#79A2FF"
                  />
                  <Text style={{ color: "#D6DEEA" }}>{texto}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={{ color: "#7F90AA", fontSize: 12 }}>
            Painel administrativo
          </Text>
        </View>
      ) : null}

      <View
        style={{
          flex: 0.95,
          alignItems: "center",
          justifyContent: "center",
          padding: compacto ? 24 : 56,
        }}
      >
        <View style={{ width: "100%", maxWidth: 430 }}>
          {compacto ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingBottom: 34,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  backgroundColor: "#2F6FED",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons name="photo-camera" size={22} color="white" />
              </View>
              <Text
                style={{ color: "#172033", fontSize: 19, fontWeight: "bold" }}
              >
                Promotor Fotos
              </Text>
            </View>
          ) : null}

          <Text style={{ color: "#172033", fontSize: 30, fontWeight: "bold" }}>
            Acesse sua conta
          </Text>
          <Text style={{ color: "#6F7C91", fontSize: 15, paddingTop: 8 }}>
            Entre com as credenciais cadastradas no sistema.
          </Text>

          <View style={{ gap: 9, paddingTop: 30 }}>
            <Text style={{ color: "#34415A", fontWeight: "bold" }}>Email</Text>
            <View style={campoContainer}>
              <MaterialIcons name="mail-outline" size={20} color="#8995A8" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor="#9AA5B5"
                autoCapitalize="none"
                keyboardType="email-address"
                style={campo}
                onSubmitEditing={entrar}
              />
            </View>
          </View>

          <View style={{ gap: 9, paddingTop: 18 }}>
            <Text style={{ color: "#34415A", fontWeight: "bold" }}>Senha</Text>
            <View style={campoContainer}>
              <MaterialIcons name="lock-outline" size={20} color="#8995A8" />
              <TextInput
                value={senha}
                onChangeText={setSenha}
                placeholder="Digite sua senha"
                placeholderTextColor="#9AA5B5"
                secureTextEntry={!mostrarSenha}
                style={campo}
                onSubmitEditing={entrar}
              />
              <Pressable
                onPress={() => setMostrarSenha((atual) => !atual)}
                accessibilityLabel={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                <MaterialIcons
                  name={mostrarSenha ? "visibility-off" : "visibility"}
                  size={20}
                  color="#8995A8"
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={recuperarSenha}
            style={{ alignSelf: "flex-end", paddingVertical: 13 }}
          >
            <Text style={{ color: "#2F6FED", fontWeight: "bold" }}>
              Esqueci minha senha
            </Text>
          </Pressable>

          {mensagem ? (
            <View
              style={{
                backgroundColor: "#EEF3FD",
                borderRadius: 7,
                padding: 12,
                marginBottom: 14,
              }}
            >
              <Text style={{ color: "#385884" }}>{mensagem}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={entrar}
            disabled={carregando}
            style={{
              minHeight: 50,
              borderRadius: 8,
              backgroundColor: carregando ? "#779BE8" : "#2F6FED",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {carregando ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 15 }}>
                Entrar
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const campoContainer = {
  minHeight: 50,
  borderWidth: 1,
  borderColor: "#D5DBE5",
  borderRadius: 8,
  backgroundColor: "white",
  paddingHorizontal: 13,
  flexDirection: "row" as const,
  alignItems: "center" as const,
  gap: 9,
};

const campo = {
  flex: 1,
  color: "#172033",
  paddingVertical: 13,
};
