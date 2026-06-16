import { useEffect, useState } from "react";

import { onSnapshot } from "firebase/firestore";

import PerfilUsuario from "@/components/perfil-usuario";
import { auth } from "@/services/firebaseConfig";
import { consultaFotosDoPromotor } from "@/services/fotos-service";
import { usuarioDoc } from "@/services/usuarios-service";
import type { Foto } from "@/types/foto";
import { filtrarFotosAtuais } from "@/utils/fotos";

export default function PerfilPromotor() {
  const [totalLojas, setTotalLojas] = useState(0);
  const [totalFotos, setTotalFotos] = useState(0);

  useEffect(() => {
    const usuarioAtual = auth.currentUser;

    if (!usuarioAtual) return;

    const unsubscribeUsuario = onSnapshot(
      usuarioDoc(usuarioAtual.uid),
      (snapshot) => setTotalLojas(snapshot.data()?.lojasIds?.length || 0),
    );

    const unsubscribeFotos = onSnapshot(
      consultaFotosDoPromotor(usuarioAtual.uid),
      (snapshot) => {
        const lista = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Foto[];

        setTotalFotos(filtrarFotosAtuais(lista).length);
      },
    );

    return () => {
      unsubscribeUsuario();
      unsubscribeFotos();
    };
  }, []);

  return (
    <PerfilUsuario
      tipoEsperado="promotor"
      totalLojas={totalLojas}
      totalFotos={totalFotos}
    />
  );
}
