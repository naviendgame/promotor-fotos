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
  const compacto = width < 900;

  async function sair() {
    await signOut(auth);
    router.replace(ROTAS.login);
  }

  const menuVisivel = itensMenu.filter(
    (item) => !item.apenasSuperAdmin || tipoUsuario === "super_admin",
  );

  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: "#F3F5F8" }}>
      <View
        style={{
          width: compacto ? 76 : 238,
          backgroundColor: "#172033",
          borderRightWidth: 1,
          borderRightColor: "#243149",
          paddingHorizontal: compacto ? 10 : 16,
          paddingVertical: 20,
        }}
      >
        <View
          style={{
            minHeight: 58,
            justifyContent: "center",
            paddingHorizontal: compacto ? 4 : 8,
            paddingBottom: 18,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: compacto ? "center" : "flex-start",
              gap: 10,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: "#2F6FED",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="photo-camera" size={21} color="white" />
            </View>
            {!compacto ? (
              <View>
                <Text style={{ color: "white", fontSize: 17, fontWeight: "bold" }}>
                  Promotor Fotos
                </Text>
                <Text style={{ color: "#8FA1BF", fontSize: 12, paddingTop: 2 }}>
                  Painel de gestao
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={{ flex: 1, gap: 5 }}>
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
                    minHeight: 46,
                    borderRadius: 7,
                    paddingHorizontal: compacto ? 0 : 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: compacto ? "center" : "flex-start",
                    gap: 11,
                    backgroundColor: ativo ? "#2F6FED" : "transparent",
                  }}
                >
                  <MaterialIcons
                    name={item.icone}
                    size={21}
                    color={ativo ? "white" : "#AEBBD0"}
                  />
                  {!compacto ? (
                    <Text
                      style={{
                        color: ativo ? "white" : "#D6DEEA",
                        fontWeight: ativo ? "bold" : "normal",
                      }}
                    >
                      {item.titulo}
                    </Text>
                  ) : null}
                </Pressable>
              </Link>
            );
          })}
        </View>

        <Pressable
          onPress={sair}
          accessibilityLabel="Sair"
          style={{
            minHeight: 46,
            borderRadius: 7,
            paddingHorizontal: compacto ? 0 : 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: compacto ? "center" : "flex-start",
            gap: 11,
          }}
        >
          <MaterialIcons name="logout" size={21} color="#F39AA2" />
          {!compacto ? (
            <Text style={{ color: "#F4B0B6", fontWeight: "bold" }}>Sair</Text>
          ) : null}
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        <View
          style={{
            height: 68,
            backgroundColor: "white",
            borderBottomWidth: 1,
            borderBottomColor: "#DDE2EA",
            paddingHorizontal: compacto ? 18 : 28,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <Text style={{ color: "#657189", fontSize: 14 }}>
            Operacao e acompanhamento
          </Text>

          <Link href={ROTAS.painelPerfil} asChild>
            <Pressable
              accessibilityLabel="Abrir perfil"
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              {!compacto ? (
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    selectable
                    style={{ color: "#172033", fontWeight: "bold" }}
                  >
                    {nomeUsuario || "Administrador"}
                  </Text>
                  <Text style={{ color: "#7A879D", fontSize: 12, paddingTop: 2 }}>
                    {tipoUsuario === "super_admin"
                      ? "Administrador principal"
                      : "Administrador"}
                  </Text>
                </View>
              ) : null}
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: "#E8EFFD",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons name="person" size={23} color="#2F6FED" />
              </View>
            </Pressable>
          </Link>
        </View>

        <View
          style={{
            flex: 1,
            padding: compacto ? 18 : 28,
          }}
        >
          {children}
        </View>
      </View>
    </View>
  );
}
