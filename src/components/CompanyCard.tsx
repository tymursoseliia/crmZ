"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileText } from "lucide-react";
import type { Company } from "@/lib/companyTypes";

interface CompanyCardProps {
  company: Company;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const handleDownload = async (fileName: string, documentName: string) => {
    try {
      // Check if file exists first
      const response = await fetch(`/company-docs/${fileName}`, { method: 'HEAD' });

      if (!response.ok) {
        alert(`Документ "${documentName}" пока не загружен. Пожалуйста, загрузите файл ${fileName} в папку public/company-docs/`);
        return;
      }

      const link = document.createElement("a");
      link.href = `/company-docs/${fileName}`;
      link.download = fileName;
      link.click();
    } catch (error) {
      alert(`Ошибка при скачивании документа "${documentName}". Убедитесь, что файл ${fileName} существует в папке public/company-docs/`);
    }
  };

  const handleContractDownload = async () => {
    if (!company.contractSample) return;

    try {
      const response = await fetch(company.contractSample, { method: 'HEAD' });

      if (!response.ok) {
        alert(`Образец договора пока не загружен. Пожалуйста, загрузите файл в ${company.contractSample}`);
        return;
      }

      const link = document.createElement("a");
      link.href = company.contractSample;
      link.download = company.contractSample.split('/').pop() || 'contract.pdf';
      link.click();
    } catch (error) {
      alert(`Ошибка при скачивании образца договора. Убедитесь, что файл существует.`);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl mb-2">{company.name}</CardTitle>
            {company.website && (
              <CardDescription className="flex items-center gap-2">
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                >
                  {company.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-600 mb-3">Документы:</h4>
          <div className="grid gap-2">
            {company.documents.map((doc) => (
              <Button
                key={doc.fileName}
                variant="outline"
                className="justify-between w-full"
                onClick={() => handleDownload(doc.fileName, doc.name)}
              >
                <span className="text-sm">{doc.name}</span>
                <Download className="h-4 w-4 ml-2" />
              </Button>
            ))}
          </div>
          {company.contractSample && (
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="default"
                className="w-full justify-between"
                onClick={handleContractDownload}
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Образец договора
                </span>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
