import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";

import { auth, db } from "../../../services/firebaseConfig";
import { Cabecalho } from "./lojas";

export default function PerfilWeb() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [emailOriginal, setEmailOriginal] = useState("");
  const [tipo, setTipo] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  useEffect(() => {
    async function carregar() {
      const atual = auth.currentUser;
      if (!atual) return;
      const perfil = await getDoc(doc(db, "usuarios", atual.uid));
      const dados = perfil.data();
      const emailAtual = atual.email || dados?.email || "";
      setNome(dados?.nome || atual.displayName || "");
      setEmail(emailAtual);
      setEmailOriginal(emailAtual);
      setTipo(dados?.tipo || "admin");
    }
    carregar();
  }, []);

  async function reautenticar() {
    const atual = auth.currentUser;
    if (!atual?.email || !senhaAtual) throw new Error("Informe sua senha atual.");
    await reauthenticateWithCredential(atual, EmailAuthProvider.credential(atual.email, senhaAtual));
  }

  async function salvarDados() {
    const atual = auth.currentUser;
    if (!atual || !nome.trim() || !email.trim()) return;
    try {
      setSalvandoDados(true);
      const novoEmail = email.trim().toLowerCase();
      if (novoEmail !== emailOriginal.toLowerCase()) {
        await reautenticar();
        await updateEmail(atual, novoEmail);
      }
      await updateProfile(atual, { displayName: nome.trim() });
      await updateDoc(doc(db, "usuarios", atual.uid), {
        nome: nome.trim(), email: novoEmail, atualizadoEm: serverTimestamp(),
      });
      setEmailOriginal(novoEmail);
      setSenhaAtual("");
      Alert.alert("Sucesso", "Dados atualizados.");
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Nao foi possivel atualizar.");
    } finally {
      setSalvandoDados(false);
    }
  }

  async function salvarSenha() {
    const atual = auth.currentUser;
    if (!atual || novaSenha.length < 6 || novaSenha !== confirmar) {
      Alert.alert("Atencao", "Confira a senha atual e a confirmacao da nova senha.");
      return;
    }
    try {
      setSalvandoSenha(true);
      await reautenticar();
      await updatePassword(atual, novaSenha);
      setSenhaAtual(""); setNovaSenha(""); setConfirmar("");
      Alert.alert("Sucesso", "Senha alterada.");
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Nao foi possivel alterar a senha.");
    } finally {
      setSalvandoSenha(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 18, paddingBottom: 28 }}>
      <Cabecalho titulo="Meu perfil" subtitulo={tipo === "super_admin" ? "Administrador principal" : "Administrador"} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
        <View style={secao}>
          <TituloSecao icone="person-outline" titulo="Dados pessoais" />
          <CampoPerfil rotulo="Nome" valor={nome} onChange={setNome} />
          <CampoPerfil rotulo="Email" valor={email} onChange={setEmail} />
          {email.trim().toLowerCase() !== emailOriginal.toLowerCase() ? (
            <CampoPerfil rotulo="Senha atual para confirmar o email" valor={senhaAtual} onChange={setSenhaAtual} secure />
          ) : null}
          <Botao titulo={salvandoDados ? "Salvando..." : "Salvar dados"} icone="save" onPress={salvarDados} />
        </View>
        <View style={secao}>
          <TituloSecao icone="lock-outline" titulo="Alterar senha" />
          <CampoPerfil rotulo="Senha atual" valor={senhaAtual} onChange={setSenhaAtual} secure />
          <CampoPerfil rotulo="Nova senha" valor={novaSenha} onChange={setNovaSenha} secure />
          <CampoPerfil rotulo="Confirmar nova senha" valor={confirmar} onChange={setConfirmar} secure />
          <Botao titulo={salvandoSenha ? "Alterando..." : "Alterar senha"} icone="lock-reset" onPress={salvarSenha} />
        </View>
      </View>
    </ScrollView>
  );
}

function TituloSecao({ icone, titulo }: { icone: keyof typeof MaterialIcons.glyphMap; titulo: string }) {
  return <View style={{ flexDirection: "row", alignItems: "center", gap: 9, paddingBottom: 5 }}><MaterialIcons name={icone} size={22} color="#2F6FED" /><Text style={{ color: "#172033", fontSize: 18, fontWeight: "bold" }}>{titulo}</Text></View>;
}
function CampoPerfil({ rotulo, valor, onChange, secure }: { rotulo: string; valor: string; onChange: (v: string) => void; secure?: boolean }) {
  return <View style={{ gap: 7 }}><Text style={{ color: "#4B586D", fontWeight: "bold" }}>{rotulo}</Text><TextInput value={valor} onChangeText={onChange} secureTextEntry={secure} style={{ minHeight: 44, borderWidth: 1, borderColor: "#D5DBE5", borderRadius: 7, paddingHorizontal: 11, color: "#172033" }} /></View>;
}
function Botao({ titulo, icone, onPress }: { titulo: string; icone: keyof typeof MaterialIcons.glyphMap; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ minHeight: 44, alignSelf: "flex-start", borderRadius: 7, backgroundColor: "#2F6FED", paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 8 }}><MaterialIcons name={icone} size={20} color="white" /><Text style={{ color: "white", fontWeight: "bold" }}>{titulo}</Text></Pressable>;
}
const secao = { flex: 1, minWidth: 330, maxWidth: 620, backgroundColor: "white", borderWidth: 1, borderColor: "#E0E5ED", borderRadius: 8, padding: 20, gap: 14 };
