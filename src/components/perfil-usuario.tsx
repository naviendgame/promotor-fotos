import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  updateEmail,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";

import { auth, db } from "../services/firebaseConfig";

type PerfilUsuarioProps = {
  tipoEsperado: "promotor" | "admin";
  totalFotos?: number;
  totalLojas?: number;
};

function mensagemErro(error: any) {
  if (error?.code === "auth/wrong-password") return "A senha atual esta incorreta.";
  if (error?.code === "auth/invalid-credential") {
    return "A senha atual esta incorreta.";
  }
  if (error?.code === "auth/email-already-in-use") {
    return "Este email ja esta sendo utilizado.";
  }
  if (error?.code === "auth/invalid-email") return "Digite um email valido.";
  if (error?.code === "auth/weak-password") {
    return "A nova senha deve ter pelo menos 6 caracteres.";
  }
  if (error?.code === "auth/requires-recent-login") {
    return "Confirme sua senha atual e tente novamente.";
  }

  return error?.message || "Nao foi possivel concluir a alteracao.";
}

export default function PerfilUsuario({
  tipoEsperado,
  totalFotos,
  totalLojas,
}: PerfilUsuarioProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [emailOriginal, setEmailOriginal] = useState("");
  const [tipo, setTipo] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  useEffect(() => {
    async function carregarPerfil() {
      const usuarioAtual = auth.currentUser;

      if (!usuarioAtual) {
        router.replace("/");
        return;
      }

      const usuarioSnap = await getDoc(doc(db, "usuarios", usuarioAtual.uid));

      if (!usuarioSnap.exists() || usuarioSnap.data().ativo === false) {
        await signOut(auth);
        router.replace("/");
        return;
      }

      const dados = usuarioSnap.data();
      const ehAdmin = dados.tipo === "admin" || dados.tipo === "super_admin";

      if (
        (tipoEsperado === "admin" && !ehAdmin) ||
        (tipoEsperado === "promotor" && dados.tipo !== "promotor")
      ) {
        router.replace(ehAdmin ? "/admin" : "/promotor");
        return;
      }

      const emailAtual = usuarioAtual.email || dados.email || "";
      setNome(dados.nome || usuarioAtual.displayName || "");
      setEmail(emailAtual);
      setEmailOriginal(emailAtual);
      setTipo(dados.tipo || "");
    }

    carregarPerfil().catch((error) => {
      console.log(error);
      Alert.alert("Erro", "Nao foi possivel carregar o perfil.");
    });
  }, [tipoEsperado]);

  async function reautenticar(senha: string) {
    const usuarioAtual = auth.currentUser;

    if (!usuarioAtual?.email) {
      throw new Error("Usuario nao encontrado.");
    }

    const credencial = EmailAuthProvider.credential(
      usuarioAtual.email,
      senha,
    );
    await reauthenticateWithCredential(usuarioAtual, credencial);
  }

  async function salvarDados() {
    const usuarioAtual = auth.currentUser;
    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();
    const emailMudou = emailLimpo !== emailOriginal.toLowerCase();

    if (!usuarioAtual) return;

    if (!nomeLimpo || !emailLimpo) {
      Alert.alert("Atencao", "Preencha nome e email.");
      return;
    }

    if (emailMudou && !senhaAtual) {
      Alert.alert(
        "Senha atual",
        "Informe sua senha atual para alterar o email.",
      );
      return;
    }

    try {
      setSalvandoDados(true);

      if (emailMudou) {
        await reautenticar(senhaAtual);
        await updateEmail(usuarioAtual, emailLimpo);
      }

      await updateProfile(usuarioAtual, { displayName: nomeLimpo });
      await updateDoc(doc(db, "usuarios", usuarioAtual.uid), {
        nome: nomeLimpo,
        email: emailLimpo,
        atualizadoEm: serverTimestamp(),
      });

      setNome(nomeLimpo);
      setEmail(emailLimpo);
      setEmailOriginal(emailLimpo);
      setSenhaAtual("");
      Alert.alert("Sucesso", "Dados atualizados.");
    } catch (error: any) {
      console.log(error);
      Alert.alert("Erro", mensagemErro(error));
    } finally {
      setSalvandoDados(false);
    }
  }

  async function salvarNovaSenha() {
    const usuarioAtual = auth.currentUser;

    if (!usuarioAtual) return;

    if (!senhaAtual) {
      Alert.alert("Atencao", "Informe sua senha atual.");
      return;
    }

    if (novaSenha.length < 6) {
      Alert.alert("Atencao", "A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      Alert.alert("Atencao", "As novas senhas nao coincidem.");
      return;
    }

    try {
      setSalvandoSenha(true);
      await reautenticar(senhaAtual);
      await updatePassword(usuarioAtual, novaSenha);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      Alert.alert("Sucesso", "Senha alterada.");
    } catch (error: any) {
      console.log(error);
      Alert.alert("Erro", mensagemErro(error));
    } finally {
      setSalvandoSenha(false);
    }
  }

  async function sair() {
    await signOut(auth);
    router.replace("/");
  }

  const tituloTipo =
    tipo === "super_admin"
      ? "Administrador principal"
      : tipo === "admin"
        ? "Administrador"
        : "Promotor";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#121212" }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        padding: 20,
        paddingTop: 60,
        paddingBottom: 30,
        gap: 14,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Voltar"
          style={{
            width: 42,
            height: 42,
            borderRadius: 8,
            backgroundColor: "#242424",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ color: "white", fontSize: 28, fontWeight: "bold" }}>
            Meu Perfil
          </Text>
          <Text style={{ color: "#aaa", paddingTop: 3 }}>{tituloTipo}</Text>
        </View>
      </View>

      {tipoEsperado === "promotor" ? (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={resumo}>
            <MaterialIcons name="store" size={22} color="#4ADE80" />
            <Text style={rotuloResumo}>Lojas</Text>
            <Text style={[valorResumo, { color: "#4ADE80" }]}>
              {totalLojas || 0}
            </Text>
          </View>
          <View style={resumo}>
            <MaterialIcons name="photo-library" size={22} color="#60A5FA" />
            <Text style={rotuloResumo}>Fotos</Text>
            <Text style={[valorResumo, { color: "#60A5FA" }]}>
              {totalFotos || 0}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={secao}>
        <Text style={tituloSecao}>Dados pessoais</Text>

        <Text style={rotuloCampo}>Nome</Text>
        <TextInput
          value={nome}
          onChangeText={setNome}
          placeholder="Nome completo"
          placeholderTextColor="#777"
          style={campo}
        />

        <Text style={rotuloCampo}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#777"
          autoCapitalize="none"
          keyboardType="email-address"
          style={campo}
        />

        {email.trim().toLowerCase() !== emailOriginal.toLowerCase() ? (
          <>
            <Text style={rotuloCampo}>Senha atual</Text>
            <TextInput
              value={senhaAtual}
              onChangeText={setSenhaAtual}
              placeholder="Confirme sua senha"
              placeholderTextColor="#777"
              secureTextEntry
              style={campo}
            />
          </>
        ) : null}

        <Pressable
          onPress={salvarDados}
          disabled={salvandoDados}
          style={[
            botao,
            { backgroundColor: salvandoDados ? "#475569" : "#2563EB" },
          ]}
        >
          <MaterialIcons name="save" size={21} color="white" />
          <Text style={textoBotao}>
            {salvandoDados ? "Salvando..." : "Salvar dados"}
          </Text>
        </Pressable>
      </View>

      <View style={secao}>
        <Text style={tituloSecao}>Alterar senha</Text>

        <Text style={rotuloCampo}>Senha atual</Text>
        <TextInput
          value={senhaAtual}
          onChangeText={setSenhaAtual}
          placeholder="Senha atual"
          placeholderTextColor="#777"
          secureTextEntry
          style={campo}
        />

        <Text style={rotuloCampo}>Nova senha</Text>
        <TextInput
          value={novaSenha}
          onChangeText={setNovaSenha}
          placeholder="Minimo de 6 caracteres"
          placeholderTextColor="#777"
          secureTextEntry
          style={campo}
        />

        <Text style={rotuloCampo}>Confirmar nova senha</Text>
        <TextInput
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
          placeholder="Repita a nova senha"
          placeholderTextColor="#777"
          secureTextEntry
          style={campo}
        />

        <Pressable
          onPress={salvarNovaSenha}
          disabled={salvandoSenha}
          style={[
            botao,
            { backgroundColor: salvandoSenha ? "#475569" : "#7C3AED" },
          ]}
        >
          <MaterialIcons name="lock-reset" size={22} color="white" />
          <Text style={textoBotao}>
            {salvandoSenha ? "Alterando..." : "Alterar senha"}
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={sair}
        style={[botao, { backgroundColor: "#B91C1C" }]}
      >
        <MaterialIcons name="logout" size={21} color="white" />
        <Text style={textoBotao}>Sair</Text>
      </Pressable>
    </ScrollView>
  );
}

const secao = {
  backgroundColor: "#1E1E1E",
  borderRadius: 8,
  padding: 16,
  gap: 8,
};

const tituloSecao = {
  color: "white",
  fontSize: 19,
  fontWeight: "bold" as const,
  paddingBottom: 4,
};

const rotuloCampo = {
  color: "#bbb",
  fontSize: 14,
};

const campo = {
  borderWidth: 1,
  borderColor: "#444",
  borderRadius: 8,
  padding: 13,
  color: "white",
  marginBottom: 4,
};

const botao = {
  minHeight: 48,
  borderRadius: 8,
  paddingHorizontal: 14,
  flexDirection: "row" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  gap: 8,
};

const textoBotao = {
  color: "white",
  fontWeight: "bold" as const,
};

const resumo = {
  flex: 1,
  minHeight: 108,
  backgroundColor: "#1E1E1E",
  borderRadius: 8,
  padding: 14,
  gap: 5,
};

const rotuloResumo = {
  color: "#ccc",
};

const valorResumo = {
  fontSize: 28,
  fontWeight: "bold" as const,
  fontVariant: ["tabular-nums"] as ("tabular-nums")[],
};
