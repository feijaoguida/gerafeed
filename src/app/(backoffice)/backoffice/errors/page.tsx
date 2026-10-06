import { redirect } from "next/navigation";

export default function BackofficeErrorsRedirect() {
  redirect("/backoffice/audit/errors");
}
