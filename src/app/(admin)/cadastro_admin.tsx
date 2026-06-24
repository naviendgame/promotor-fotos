import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { serverTimestamp } from "firebase/firestore";

import { ROTAS } from "@/constants/routes";
import { useUsuarioAtual } from "@/contexts/usuario-context";
import { criarUsuarioAuth } from "@/services/criarUsuarioAuth";
import { criarUsuario } from "@/services/usuarios-service";
import { useTheme } from "@/theme/theme-context";
import type { ThemeColors } from "@/theme/colors";

const COR_LARANJA = "#EA580C";

export default function CadastroAdmin() {
  const { colors, scheme } = useTheme();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const { perfil } = useUsuarioAtual();
  const autorizado = perfil?.tipo === "super_admin";

  useEffect(() => {
    if (!perfil) return;
    if (perfil.tipo !== "super_admin") {
      Alert.alert(
        "Acesso negado",
        "Somente o administrador principal pode cadastrar admins.",
      );
      router.replace(ROTAS.admin);
    }
  }, [perfil]);

  async function salvarAdmin() {
    if (salvando) return;

    if (!nome.trim() || !email.trim()) {
      Alert.alert("Atenção", "Preencha nome e email.");
      return;
    }
    if (senha.length < 6) {
      Alert.alert("Atenção", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert("Atenção", "As senhas não coincidem.");
      return;
    }

    try {
      setSalvando(true);
      const uid = await criarUsuarioAuth(email, senha);
      await criarUsuario(uid, {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        tipo: "admin",
        ativo: true,
        primeiroAcesso: true,
        criadoEm: serverTimestamp(),
      });
      Alert.alert("Sucesso", "Administrador cadastrado com sucesso!");
      router.back();
    } catch (error: any) {
      console.log(error);
      Alert.alert("Erro", error.message || "Não foi possível cadastrar.");
    } finally {
      setSalvando(false);
    }
  }

  if (!autorizado) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  const corBorda =
    scheme === "light" ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.06)";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 60,
          gap: 16,
        }}
      >
        {/* Botão voltar — só ícone */}
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Voltar"
          style={{
            alignSelf: "flex-start",
            width: 42,
            height: 42,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 6,
          }}
        >
          <MaterialIcons name="arrow-back" size={26} color={colors.text} />
        </Pressable>

        {/* Título + subtítulo */}
        <View style={{ gap: 8, paddingBottom: 8 }}>
          <Text
            style={{ color: colors.text, fontSize: 28, fontWeight: "bold" }}
          >
            Cadastro de Administrador
          </Text>
          <Text style={{ color: colors.textSubtle, lineHeight: 21 }}>
            Preencha os dados do administrador para realizar o cadastro.
          </Text>
        </View>

        {/* Nome */}
        <CampoEntrada
          colors={colors}
          corBorda={corBorda}
          icone="person-outline"
          placeholder="Nome completo"
          valor={nome}
          onChange={setNome}
        />

        {/* Email */}
        <CampoEntrada
          colors={colors}
          corBorda={corBorda}
          icone="mail-outline"
          placeholder="E-mail"
          valor={email}
          onChange={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* Senha */}
        <CampoEntrada
          colors={colors}
          corBorda={corBorda}
          icone="lock-outline"
          placeholder="Senha"
          valor={senha}
          onChange={setSenha}
          secureTextEntry={!mostrarSenha}
          autoCapitalize="none"
          iconeDireita={mostrarSenha ? "visibility-off" : "visibility"}
          onIconeDireita={() => setMostrarSenha((v) => !v)}
        />

        {/* Confirmar senha */}
        <CampoEntrada
          colors={colors}
          corBorda={corBorda}
          icone="lock-outline"
          placeholder="Confirmar senha"
          valor={confirmarSenha}
          onChange={setConfirmarSenha}
          secureTextEntry={!mostrarConfirmar}
          autoCapitalize="none"
          iconeDireita={mostrarConfirmar ? "visibility-off" : "visibility"}
          onIconeDireita={() => setMostrarConfirmar((v) => !v)}
        />

        {/* Botão Salvar */}
        <Pressable
          onPress={salvarAdmin}
          disabled={salvando}
          style={{
            marginTop: 14,
            minHeight: 54,
            borderRadius: 12,
            backgroundColor: salvando ? "#FBA774" : COR_LARANJA,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
            {salvando ? "Salvando..." : "Salvar Administrador"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ---------- Componentes ---------- */

function CampoEntrada({
  colors,
  corBorda,
  icone,
  placeholder,
  valor,
  onChange,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
  iconeDireita,
  onIconeDireita,
}: {
  colors: ThemeColors;
  corBorda: string;
  icone: keyof typeof MaterialIcons.glyphMap;
  placeholder: string;
  valor: string;
  onChange: (v: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "numeric";
  iconeDireita?: keyof typeof MaterialIcons.glyphMap;
  onIconeDireita?: () => void;
}) {
  return (
    <View
      style={{
        minHeight: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: corBorda,
        backgroundColor: colors.surface,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <MaterialIcons name={icone} size={22} color={COR_LARANJA} />
      <TextInput
        value={valor}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        style={{
          flex: 1,
          color: colors.text,
          fontSize: 15,
          paddingVertical: 14,
        }}
      />
      {iconeDireita && onIconeDireita ? (
        <Pressable
          onPress={onIconeDireita}
          accessibilityLabel="Alternar visibilidade"
          style={{ padding: 4 }}
        >
          <MaterialIcons
            name={iconeDireita}
            size={22}
            color={colors.iconMuted}
          />
        </Pressable>
      ) : null}
    </View>
  );
}
