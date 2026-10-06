import { Metadata } from "next";
import { ForgotPasswordView } from "./forgot-password-view";

export const metadata: Metadata = {
  title: "Recuperar Senha - GeraFeed",
  description: "Recupere o acesso à sua conta no GeraFeed com segurança através de código de verificação por e-mail.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
