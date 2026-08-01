// ─── Envio de e-mail via Resend (API HTTP compatível com Workers) ───────────
// Nenhum segredo é impresso em logs; o token da URL só trafega no corpo do
// e-mail e nunca na resposta HTTP de produção.

export async function sendPasswordResetEmail(env, toEmail, resetUrl) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: 'no-key' };

  const from = env.MAIL_FROM || 'AgroVisão <noreply@agrovisaopara.com.br>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [toEmail],
      subject: 'Recuperação de senha — Painel AgroVisão',
      html:
        `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1a1a18;">` +
        `<div style="text-align:center;padding:24px 0;"><strong style="color:#315B2C;font-size:20px;">AgroVisão</strong></div>` +
        `<div style="border:1px solid rgba(49,91,44,0.15);border-radius:12px;padding:28px;">` +
        `<h1 style="font-size:18px;color:#1a1a18;margin:0 0 12px;">Recuperação de senha</h1>` +
        `<p style="font-size:14px;line-height:1.7;color:#555550;margin:0 0 20px;">` +
        `Recebemos uma solicitação para redefinir a senha do painel administrativo da AgroVisão. ` +
        `O link abaixo é válido por 1 hora e só pode ser usado uma vez.</p>` +
        `<p style="margin:0 0 20px;"><a href="${resetUrl}" ` +
        `style="display:inline-block;background:#315B2C;color:#F6F4EF;text-decoration:none;` +
        `font-size:13px;font-weight:600;padding:12px 24px;border-radius:8px;">Redefinir senha</a></p>` +
        `<p style="font-size:12px;line-height:1.6;color:#999994;margin:0;">` +
        `Se você não solicitou esta redefinição, ignore este e-mail.</p>` +
        `</div></div>`,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend error: status ${res.status}`);
  }
  return { sent: true };
}
