import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { transliterate } from "@/lib/transliterate";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { format = "word", templateFile = "Talon.docx" } = data;

    // Собираем данные талона
    const ticketData = {
      ticket_number: data.ticket_number || "",
      form_date: data.form_date || "",
      appointment_datetime: data.appointment_datetime || "",
      car_info: data.car_info || "",
      vin: data.vin || "",
      payer_name: data.payer_name || "",
      doc_number: data.doc_number || "",
      phone: data.phone || "",
    };

    // Загружаем шаблон (QR-код уже встроен в шаблон как статичное изображение)
    const templatePath = join(process.cwd(), "public/templates", templateFile);
    const templateContent = readFileSync(templatePath);

    // Создаём документ без image module (QR статичный в шаблоне)
    const zip = new PizZip(templateContent);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Подготавливаем данные для шаблона БЕЗ транслитерации (кириллица в документе)
    const templateDataForDoc = {
      ticket_number: ticketData.ticket_number,
      form_date: ticketData.form_date,
      appointment_datetime: ticketData.appointment_datetime,
      car_info: ticketData.car_info,
      vin: ticketData.vin,
      payer_name: ticketData.payer_name,
      doc_number: ticketData.doc_number,
      phone: ticketData.phone,
    };

    // Рендерим документ
    doc.render(templateDataForDoc);

    // Генерируем DOCX буфер
    const docxBuffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    // Возвращаем Word документ
    if (format === "word") {
      return new NextResponse(new Uint8Array(docxBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="Talon_${transliterate(data.ticket_number) || "draft"}.docx"`,
        },
      });
    }

    // Конвертируем в PDF через ConvertAPI
    const base64Docx = docxBuffer.toString("base64");
    const convertApiSecret = process.env.CONVERTAPI_SECRET;

    if (!convertApiSecret) {
      throw new Error("CONVERTAPI_SECRET not configured");
    }

    const convertResponse = await fetch(
      `https://v2.convertapi.com/convert/docx/to/pdf?Secret=${convertApiSecret}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Parameters: [{
            Name: "File",
            FileValue: {
              Name: "document.docx",
              Data: base64Docx,
            },
          }],
        }),
      }
    );

    if (!convertResponse.ok) {
      const errorText = await convertResponse.text();
      throw new Error(`ConvertAPI error: ${errorText}`);
    }

    const convertResult = await convertResponse.json();
    const pdfBase64 = convertResult.Files[0].FileData;
    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Talon_${transliterate(data.ticket_number) || "draft"}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating ticket:", error);
    return NextResponse.json(
      { error: `Ошибка генерации: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
