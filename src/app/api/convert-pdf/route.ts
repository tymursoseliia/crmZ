import { NextRequest, NextResponse } from "next/server";
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Docx = Buffer.from(arrayBuffer).toString("base64");
    const convertApiSecret = process.env.CONVERTAPI_SECRET;
    if (!convertApiSecret) {
      return NextResponse.json(
        { error: "CONVERTAPI_SECRET not configured" },
        { status: 500 }
      );
    }
    // Call ConvertAPI REST endpoint
    const convertResponse = await fetch(
      `https://v2.convertapi.com/convert/docx/to/pdf?Secret=${convertApiSecret}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Parameters: [
            {
              Name: "File",
              FileValue: {
                Name: file.name || "document.docx",
                Data: base64Docx,
              },
            },
          ],
        }),
      }
    );
    if (!convertResponse.ok) {
      const errorText = await convertResponse.text();
      console.error("ConvertAPI error:", errorText);
      return NextResponse.json(
        { error: `Ошибка конвертации: ${errorText}` },
        { status: 500 }
      );
    }
    const convertResult = await convertResponse.json();
    // Get PDF from response
    const pdfBase64 = convertResult.Files[0].FileData;
    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    // Return the PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="document.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error converting to PDF:", error);
    return NextResponse.json(
      { error: `Ошибка: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
