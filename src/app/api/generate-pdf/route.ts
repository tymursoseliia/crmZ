import { NextRequest, NextResponse } from 'next/server';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Get template file and format from request
    const templateFile = data.templateFile || 'АКТ ОСМОТРА НОВЫЙ.docx';
    const format = data.format || 'pdf';
    const isDekraTemplate = templateFile.includes('inspection_template');

    // Read the template file
    const templatePath = join(process.cwd(), 'public/templates', templateFile);
    const templateContent = readFileSync(templatePath);

    // Load the template with docxtemplater
    const zip = new PizZip(templateContent);

    // Configure delimiters based on template
    const delimiterConfig = isDekraTemplate
      ? { delimiters: { start: '{{', end: '}}' } }
      : {};

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      ...delimiterConfig,
      nullGetter: () => '',
    });

    // Prepare the data based on template type
    let templateData: Record<string, string>;

    if (isDekraTemplate) {
      // DEKRA template uses different field names with {{}} syntax
      templateData = {
        // Car info
        Model: data.car.carModel || '',
        VIN: data.car.vin || '',
        Year: data.car.year || '',
        Mileage: data.car.mileage || '',
        Color: data.car.color || '',
        Engine: data.car.fuelType || '',
        Volume: data.car.engineVolume || '',
        Power: data.car.power || '',
        Transmission: data.car.transmission || '',
        Drive: data.car.drive || '',
        ReportNumber: data.car.reportNumber || '',
        Date: data.report.date || '',
        Expert: data.report.expertName || '',
        // Paint thickness - DEKRA format
        Door_FL: data.paint.doorFrontLeft || '',
        Door_FR: data.paint.doorFrontRight || '',
        Door_RL: data.paint.doorRearLeft || '',
        Door_RR: data.paint.doorRearRight || '',
        Fender_FL: data.paint.fenderFrontLeft || '',
        Fender_FR: data.paint.fenderFrontRight || '',
        Fender_RL: data.paint.fenderRearLeft || '',
        Fender_RR: data.paint.fenderRearRight || '',
        Hood: data.paint.hood || '',
        Roof: data.paint.roof || '',
        Trunk: data.paint.trunk || '',
        Sill_FL: data.paint.sillFrontLeft || '',
        Sill_FR: data.paint.sillFrontRight || '',
        Sill_RL: data.paint.sillRearLeft || '',
        Sill_RR: data.paint.sillRearRight || '',
        // Additional DEKRA fields
        Pillar_FL: data.paint.doorFrontLeft || '',
        Pillar_FR: data.paint.doorFrontRight || '',
        CenterPillar_RL: data.paint.doorRearLeft || '',
        CenterPillar_RR: data.paint.doorRearRight || '',
        RearPillar_RR: data.paint.trunk || '',
      };
    } else {
      // TÜV template uses {singleBraces}
      templateData = {
        carModel: data.car.carModel || '',
        vin: data.car.vin || '',
        year: data.car.year || '',
        mileage: data.car.mileage || '',
        color: data.car.color || '',
        fuelType: data.car.fuelType || '',
        engineVolume: data.car.engineVolume || '',
        power: data.car.power || '',
        transmission: data.car.transmission || '',
        drive: data.car.drive || '',
        reportNumber: data.car.reportNumber || '',
        date: data.report.date || '',
        expertName: data.report.expertName || '',
        doorFrontLeft: data.paint.doorFrontLeft || '',
        doorFrontRight: data.paint.doorFrontRight || '',
        doorRearLeft: data.paint.doorRearLeft || '',
        doorRearRight: data.paint.doorRearRight || '',
        fenderFrontLeft: data.paint.fenderFrontLeft || '',
        fenderFrontRight: data.paint.fenderFrontRight || '',
        fenderRearLeft: data.paint.fenderRearLeft || '',
        fenderRearRight: data.paint.fenderRearRight || '',
        hood: data.paint.hood || '',
        roof: data.paint.roof || '',
        trunk: data.paint.trunk || '',
        sillFrontLeft: data.paint.sillFrontLeft || '',
        sillFrontRight: data.paint.sillFrontRight || '',
        sillRearLeft: data.paint.sillRearLeft || '',
        sillRearRight: data.paint.sillRearRight || '',
      };
    }

    // Render the document
    doc.render(templateData);

    // Generate the docx buffer with proper encoding for Cyrillic support
    const docxBuffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    // If Word format requested, return DOCX directly
    if (format === 'word') {
      return new NextResponse(new Uint8Array(docxBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="TUV_Report_${data.car.reportNumber || 'draft'}.docx"`,
        },
      });
    }

    // For PDF, convert using ConvertAPI
    // Use Buffer.from to properly handle binary data with Cyrillic characters
    const base64Docx = Buffer.from(docxBuffer).toString('base64');

    const convertApiSecret = process.env.CONVERTAPI_SECRET;

    if (!convertApiSecret) {
      throw new Error('CONVERTAPI_SECRET not configured');
    }

    // Call ConvertAPI REST endpoint
    const convertResponse = await fetch(
      `https://v2.convertapi.com/convert/docx/to/pdf?Secret=${convertApiSecret}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Parameters: [
            {
              Name: 'File',
              FileValue: {
                Name: 'document.docx',
                Data: base64Docx,
              },
            },
          ],
        }),
      }
    );

    if (!convertResponse.ok) {
      const errorText = await convertResponse.text();
      throw new Error(`ConvertAPI error: ${errorText}`);
    }

    const convertResult = await convertResponse.json();

    // Get PDF from response
    const pdfBase64 = convertResult.Files[0].FileData;
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Return the PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="TUV_Report_${data.car.reportNumber || 'draft'}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating document:', error);
    return NextResponse.json(
      { error: 'Failed to generate document', details: String(error) },
      { status: 500 }
    );
  }
}
