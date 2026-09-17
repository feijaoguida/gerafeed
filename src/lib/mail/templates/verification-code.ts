interface VerificationEmailProps {
  code: string;
  expiresInMinutes?: number;
}

export function renderVerificationCodeEmail({ code, expiresInMinutes = 15 }: VerificationEmailProps) {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Código de Confirmação - GeraFeed</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0B1120;
      color: #F1F5F9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 520px;
      margin: 40px auto;
      background: #111F38;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 40px 32px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .brand {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #FFFFFF;
    }
    .logo-gradient {
      background: linear-gradient(135deg, #38BDF8 0%, #818CF8 50%, #C084FC 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      color: #FFFFFF;
      text-align: center;
      margin: 0 0 12px 0;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #94A3B8;
      text-align: center;
      margin: 0 0 28px 0;
    }
    .code-box {
      background: #0A1224;
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      margin: 0 0 28px 0;
    }
    .code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 900;
      letter-spacing: 10px;
      color: #38BDF8;
      margin-left: 10px;
    }
    .notice {
      font-size: 12px;
      color: #64748B;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 20px;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">
      <div class="logo-text">Gera<span class="logo-gradient">Feed</span></div>
    </div>
    <h1>Confirme seu e-mail</h1>
    <p>Use o código de segurança abaixo para confirmar seu cadastro no GeraFeed e começar a transformar pautas em matérias de alta autoridade.</p>
    
    <div class="code-box">
      <div class="code">${code}</div>
    </div>
    
    <p class="notice">
      Este código é de uso único e expira em <strong>${expiresInMinutes} minutos</strong>.<br>
      Se você não solicitou este cadastro, pode ignorar este e-mail com segurança.
    </p>
  </div>
</body>
</html>
  `.trim();

  const text = `
GeraFeed — Código de Confirmação

Seu código de verificação é: ${code}

Este código expira em ${expiresInMinutes} minutos.
Se você não solicitou esta confirmação, por favor ignore esta mensagem.
  `.trim();

  return { html, text };
}
