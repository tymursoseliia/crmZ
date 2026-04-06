import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { transliterate, formatTicketQRData } from "@/lib/transliterate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Если передан URL - генерируем QR для URL
    if (body.url) {
      const qrCodeDataUrl = await QRCode.toDataURL(body.url, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      return NextResponse.json({ qrCode: qrCodeDataUrl });
    }

    // Если переданы данные талона - генерируем QR с транслитерацией
    if (body.ticket_number || body.payer_name) {
      const ticketData = {
        ticket_number: body.ticket_number || "",
        form_date: body.form_date || "",
        appointment_datetime: body.appointment_datetime || "",
        car_info: body.car_info || "",
        vin: body.vin || "",
        payer_name: body.payer_name || "",
        doc_number: body.doc_number || "",
        phone: body.phone || "",
      };

      // Форматируем данные с транслитерацией
      const qrText = formatTicketQRData(ticketData);

      const qrCodeDataUrl = await QRCode.toDataURL(qrText, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      return NextResponse.json({
        qrCode: qrCodeDataUrl,
        qrContent: qrText // Возвращаем также текст для отладки
      });
    }

    // Если передан просто текст - транслитерируем и генерируем QR
    if (body.text) {
      const transliteratedText = transliterate(body.text);

      const qrCodeDataUrl = await QRCode.toDataURL(transliteratedText, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      return NextResponse.json({
        qrCode: qrCodeDataUrl,
        originalText: body.text,
        transliteratedText: transliteratedText
      });
    }

    return NextResponse.json(
      { error: "URL, text, or ticket data is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      { error: `Ошибка генерации QR: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
