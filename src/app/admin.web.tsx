import { Redirect } from "expo-router";

export default function AdminWeb() {
  return <Redirect href={"/painel" as any} />;
}
