import type { Metadata } from "next";
import { RegisterView } from "./register-view";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie sua conta no GeraFeed e comece a automatizar sua curadoria de conteúdo e publicação no WordPress.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function RegisterPage() {
  return <RegisterView />;
}
