import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";

import { UsuarioProvider } from "@/contexts/usuario-context";
import { ThemeProvider, useTheme } from "@/theme/theme-context";

function ConteudoComTema() {
  const { colors, scheme } = useTheme();

  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <UsuarioProvider>
          <ConteudoComTema />
        </UsuarioProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
