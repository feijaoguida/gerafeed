/**
 * Validates CPF or CNPJ format and check digits.
 */
export function validateCpfCnpj(rawDoc: string): {
  valid: boolean;
  clean?: string;
  formatted?: string;
  type?: "CPF" | "CNPJ";
  error?: string;
} {
  if (!rawDoc || typeof rawDoc !== "string") {
    return { valid: false, error: "CPF ou CNPJ é obrigatório." };
  }

  const clean = rawDoc.replace(/\D/g, "");

  if (clean.length === 11) {
    if (/^(\d)\1{10}$/.test(clean)) {
      return { valid: false, error: "CPF inválido (dígitos repetidos)." };
    }

    // CPF Check Digits
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(clean.charAt(i), 10) * (10 - i);
    }
    let rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(clean.charAt(9), 10)) {
      return { valid: false, error: "CPF inválido (dígito verificador 1)." };
    }

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(clean.charAt(i), 10) * (11 - i);
    }
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(clean.charAt(10), 10)) {
      return { valid: false, error: "CPF inválido (dígito verificador 2)." };
    }

    const formatted = clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    return { valid: true, clean, formatted, type: "CPF" };
  }

  if (clean.length === 14) {
    if (/^(\d)\1{13}$/.test(clean)) {
      return { valid: false, error: "CNPJ inválido (dígitos repetidos)." };
    }

    // CNPJ Check Digits
    const calcCnpjDigit = (str: string, weights: number[]) => {
      let sum = 0;
      for (let i = 0; i < weights.length; i++) {
        sum += parseInt(str.charAt(i), 10) * weights[i];
      }
      const rem = sum % 11;
      return rem < 2 ? 0 : 11 - rem;
    };

    const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const d1 = calcCnpjDigit(clean, w1);
    if (d1 !== parseInt(clean.charAt(12), 10)) {
      return { valid: false, error: "CNPJ inválido (dígito verificador 1)." };
    }

    const d2 = calcCnpjDigit(clean, w2);
    if (d2 !== parseInt(clean.charAt(13), 10)) {
      return { valid: false, error: "CNPJ inválido (dígito verificador 2)." };
    }

    const formatted = clean.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
    return { valid: true, clean, formatted, type: "CNPJ" };
  }

  return { valid: false, error: "O documento deve conter 11 (CPF) ou 14 (CNPJ) dígitos." };
}

/**
 * Masks CPF or CNPJ for safe display (PII Protection).
 */
export function maskCpfCnpj(doc: string): string {
  if (!doc) return "";
  const validation = validateCpfCnpj(doc);
  const clean = validation.clean || doc.replace(/\D/g, "");

  if (clean.length === 11) {
    return clean.replace(/(\d{3})\d{6}(\d{2})/, "$1.***.***-$2");
  }
  if (clean.length === 14) {
    return clean.replace(/(\d{2})\d{6}(\d{4}\d{2})/, "$1.***.*** / $2");
  }
  return doc;
}
