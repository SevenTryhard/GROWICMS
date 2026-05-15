export async function enviarCodigoVerificacion(telefono: string, codigo: string) {
  if (process.env.NODE_ENV === "development" || !process.env.TWILIO_CUENTA_SID) {
    console.log(`[DEV] Codigo de verificacion para ${telefono}: ${codigo}`);
    return { exitoso: true };
  }

  try {
    const { default: Twilio } = await import("twilio");
    const cliente = new Twilio.Twilio(
      process.env.TWILIO_CUENTA_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
    await cliente.messages.create({
      body: `GROWICMS - Tu codigo de verificacion es: ${codigo}`,
      from: process.env.TWILIO_NUMERO_ORIGEN!,
      to: telefono,
    });
    return { exitoso: true };
  } catch (error) {
    console.error("Error enviando SMS:", error);
    return { exitoso: false, error: "Error al enviar el SMS" };
  }
}
