import { ReactNode } from "react";
import {
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import { Link, router, usePathname } from "expo-router";
import { signOut } from "firebase/auth";
import Animated, {
  FadeInDown,
} from "react-native-reanimated";

import { ROTAS } from "../constants/routes";
import { auth } from "../services/firebaseConfig";

type TipoUsuario = "admin" | "super_admin";

type PainelWebLayoutProps = {
  children: ReactNode;
  nomeUsuario: string;
  tipoUsuario: TipoUsuario;
};

type ItemMenu = {
  titulo: string;
  href: Extract<Href, string>;
  icone: keyof typeof MaterialIcons.glyphMap;
  apenasSuperAdmin?: boolean;
};

const itensMenu: ItemMenu[] = [
  { titulo: "Dashboard", href: ROTAS.painel, icone: "dashboard" },
  { titulo: "Fotos", href: ROTAS.painelFotos, icone: "photo-library" },
  { titulo: "Promotores", href: ROTAS.painelPromotores, icone: "groups" },
  { titulo: "Lojas", href: ROTAS.painelLojas, icone: "store" },
  { titulo: "Produtos", href: ROTAS.painelProdutos, icone: "inventory" },
  { titulo: "Estoque", href: ROTAS.painelEstoque, icone: "fact-check" },
  { titulo: "Relatorios", href: ROTAS.painelRelatorios, icone: "assessment" },
  {
    titulo: "Administradores",
    href: ROTAS.painelAdministradores,
    icone: "admin-panel-settings",
    apenasSuperAdmin: true,
  },
];

export default function PainelWebLayout({
  children,
  nomeUsuario,
  tipoUsuario,
}: PainelWebLayoutProps) {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const compacto = width < 760;

  async function sair() {
    await signOut(auth);
    router.replace(ROTAS.login);
  }

  const menuVisivel = itensMenu.filter(
    (item) => !item.apenasSuperAdmin || tipoUsuario === "super_admin",
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F4F7FB" }}>
      <Animated.View
        entering={FadeInDown.duration(240)}
        style={{
          backgroundColor: "white",
          borderBottomWidth: 1,
          borderBottomColor: "#DDE6F3",
          paddingHorizontal: compacto ? 16 : 28,
          paddingTop: 16,
          paddingBottom: 12,
          gap: 14,
          boxShadow: "0 8px 24px rgba(37, 99, 235, 0.08)",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              minWidth: 240,
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 8,
                backgroundColor: "#2563EB",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="photo-camera" size={22} color="white" />
            </View>
            <View>
              <Text style={{ color: "#172033", fontSize: 18, fontWeight: "bold" }}>
                Promotor Fotos
              </Text>
              <Text style={{ color: "#64748B", fontSize: 12, paddingTop: 2 }}>
                Operacao e acompanhamento
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <Link href={ROTAS.painelPerfil} asChild>
              <Pressable
                accessibilityLabel="Abrir perfil"
                style={{
                  minHeight: 40,
                  borderWidth: 1,
                  borderColor: "#D6E0F0",
                  borderRadius: 8,
                  paddingHorizontal: 11,
                  backgroundColor: "#F8FAFF",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 9,
                }}
              >
                <MaterialIcons name="person" size={20} color="#2563EB" />
                {!compacto ? (
                  <View>
                    <Text selectable style={{ color: "#172033", fontWeight: "bold" }}>
                      {nomeUsuario || "Administrador"}
                    </Text>
                    <Text style={{ color: "#64748B", fontSize: 12 }}>
                      {tipoUsuario === "super_admin"
                        ? "Administrador principal"
                        : "Administrador"}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            </Link>

            <Pressable
              onPress={sair}
              accessibilityLabel="Sair"
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#F0C8CC",
                backgroundColor: "#FFF5F6",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="logout" size={20} color="#A33A34" />
            </Pressable>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {menuVisivel.map((item) => {
            const ativo =
              item.href === "/painel"
                ? pathname === "/painel"
                : pathname.startsWith(item.href);

            return (
              <Link key={item.href} href={item.href} asChild>
                <Pressable
                  accessibilityLabel={item.titulo}
                  style={{
                    minHeight: 38,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: ativo ? "#2563EB" : "#D6E0F0",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: ativo ? "#2563EB" : "#F8FAFF",
                    boxShadow: ativo
                      ? "0 8px 18px rgba(37, 99, 235, 0.22)"
                    : "none",
                  }}
                >
                  <MaterialIcons
                    name={item.icone}
                    size={18}
                    color={ativo ? "white" : "#5B6B83"}
                  />
                  <Text
                    style={{
                      color: ativo ? "white" : "#334155",
                      fontWeight: ativo ? "bold" : "600",
                      fontSize: 13,
                    }}
                  >
                    {item.titulo}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(260).delay(70)}
        style={{
          flex: 1,
          padding: compacto ? 16 : 28,
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
}
