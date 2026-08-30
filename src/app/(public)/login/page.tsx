import type { Metadata } from "next";
import { LoginView } from "./login-view";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse o painel do GeraFeed para gerenciar feeds RSS, automação com IA e publicações no WordPress.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginPage() {
  return <LoginView />;
}
