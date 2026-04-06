"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { type ReportFormData, defaultFormData, generatePaintThickness, getRandomReportNumber, getRandomExpert } from "@/lib/types";
import { generateReport } from "@/lib/generateDocument";
import { FileDown, Car, FileText, AlertCircle } from "lucide-react";

interface ReportFormProps {
  templateFile: string;
  themeColor: "blue" | "green";
}

interface ValidationErrors {
  date?: string;
  carModel?: string;
  vin?: string;
  year?: string;
  mileage?: string;
  color?: string;
}

export function ReportForm({ templateFile, themeColor }: ReportFormProps) {
  const [formData, setFormData] = useState<ReportFormData>(() => ({
    ...defaultFormData,
    car: {
      ...defaultFormData.car,
      reportNumber: getRandomReportNumber(),
      carModel: "",
      vin: "",
      year: "",
      mileage: "",
      color: "",
      fuelType: "Бензин",
      engineVolume: "",
      power: "",
      transmission: "Автоматическая",
      drive: "Полный",
    },
    paint: generatePaintThickness(),
    report: {
      date: "",
      expertName: getRandomExpert(),
    },
  }));
  const [isGenerating, setIsGenerating] = useState<"pdf" | "word" | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showErrors, setShowErrors] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Theme colors
  const isBlue = themeColor === "blue";
  const themeClasses = {
    headerGradient: isBlue
      ? "bg-gradient-to-r from-blue-600 to-blue-500"
      : "bg-gradient-to-r from-green-600 to-green-500",
    focusBorder: isBlue
      ? "focus:border-blue-500 focus:ring-blue-500"
      : "focus:border-green-500 focus:ring-green-500",
    selectFocus: isBlue
      ? "focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      : "focus:border-green-500 focus:ring-1 focus:ring-green-500",
    pdfButton: "bg-red-500 hover:bg-red-600",
    wordButton: isBlue
      ? "bg-blue-500 hover:bg-blue-600"
      : "bg-green-500 hover:bg-green-600",
  };

  const updateCar = (field: keyof ReportFormData["car"], value: string) => {
    setFormData((prev) => ({
      ...prev,
      car: { ...prev.car, [field]: value },
    }));
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const updateReport = (field: keyof ReportFormData["report"], value: string) => {
    setFormData((prev) => ({
      ...prev,
      report: { ...prev.report, [field]: value },
    }));
    if (field === "date" && errors.date) {
      setErrors((prev) => ({ ...prev, date: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.report.date.trim()) {
      newErrors.date = "Введите дату осмотра";
    } else if (!/^\d{2}\.\d{2}\.\d{4}$/.test(formData.report.date)) {
      newErrors.date = "Формат: ДД.ММ.ГГГГ";
    }

    if (!formData.car.carModel.trim()) {
      newErrors.carModel = "Введите модель автомобиля";
    }

    if (!formData.car.vin.trim()) {
      newErrors.vin = "Введите VIN номер";
    } else if (formData.car.vin.length !== 17) {
      newErrors.vin = "VIN должен содержать 17 символов";
    }

    if (!formData.car.year.trim()) {
      newErrors.year = "Введите год выпуска";
    } else {
      const year = parseInt(formData.car.year);
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
        newErrors.year = "Некорректный год";
      }
    }

    if (!formData.car.mileage.trim()) {
      newErrors.mileage = "Введите пробег";
    }

    if (!formData.car.color.trim()) {
      newErrors.color = "Введите цвет";
    }

    setErrors(newErrors);
    setShowErrors(true);
    return Object.keys(newErrors).length === 0;
  };

  // Generate unique report number for each document generation
  const generateUniqueReportNumber = (): string => {
    const randomNum = Math.floor(Math.random() * (600 - 300 + 1)) + 300;
    return randomNum.toString();
  };

  const handleGenerate = async (format: "pdf" | "word") => {
    if (!validateForm()) {
      return;
    }

    setDownloadError(null);
    setIsGenerating(format);
    try {
      // Generate fresh paint thickness values for each report generation
      const freshPaintData = generatePaintThickness();
      // Generate fresh unique report number for each report generation
      const freshReportNumber = generateUniqueReportNumber();
      const dataWithFreshValues = {
        ...formData,
        car: {
          ...formData.car,
          reportNumber: freshReportNumber,
        },
        paint: freshPaintData,
      };
      await generateReport(dataWithFreshValues, templateFile, format);
    } catch (error) {
      console.error("Error generating report:", error);
      setDownloadError(`Ошибка при скачивании: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsGenerating(null);
    }
  };

  const getInputClassName = (fieldError?: string) => {
    const base = `border-gray-300 ${themeClasses.focusBorder} h-11`;
    if (fieldError && showErrors) {
      return `${base} border-red-500 focus:border-red-500 focus:ring-red-500`;
    }
    return base;
  };

  const selectClassName = `w-full h-11 px-3 rounded-md border border-gray-300 ${themeClasses.selectFocus} bg-white text-gray-800`;

  const renderError = (error?: string) => {
    if (!error || !showErrors) return null;
    return (
      <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Заполните данные автомобиля
          </h2>
          <p className="text-gray-500">
            Все поля обязательны для заполнения
          </p>
        </div>

        <Card className="border-gray-200 shadow-lg overflow-hidden">
          <CardHeader className={`${themeClasses.headerGradient} text-white`}>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Данные автомобиля
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            {/* Row 1: Model and VIN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div className="space-y-2">
                <Label htmlFor="carModel" className="text-gray-700 font-medium">
                  Модель автомобиля <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="carModel"
                  placeholder="Volkswagen Tiguan 2.0 TSI"
                  value={formData.car.carModel}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCar("carModel", e.target.value)}
                  className={getInputClassName(errors.carModel)}
                />
                {renderError(errors.carModel)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="vin" className="text-gray-700 font-medium">
                  VIN номер <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="vin"
                  placeholder="WVGZZZ5NZBW000001"
                  value={formData.car.vin}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCar("vin", e.target.value.toUpperCase())}
                  className={`${getInputClassName(errors.vin)} font-mono tracking-wide`}
                />
                {renderError(errors.vin)}
              </div>
            </div>

            {/* Row 2: Date, Year, Mileage, Color */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-gray-700 font-medium">
                  Дата осмотра <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  placeholder="ДД.ММ.ГГГГ"
                  value={formData.report.date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateReport("date", e.target.value)}
                  className={getInputClassName(errors.date)}
                />
                {renderError(errors.date)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="year" className="text-gray-700 font-medium">
                  Год выпуска <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="year"
                  placeholder="2021"
                  value={formData.car.year}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCar("year", e.target.value)}
                  className={getInputClassName(errors.year)}
                />
                {renderError(errors.year)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mileage" className="text-gray-700 font-medium">
                  Пробег (км) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="mileage"
                  placeholder="45000"
                  value={formData.car.mileage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCar("mileage", e.target.value)}
                  className={getInputClassName(errors.mileage)}
                />
                {renderError(errors.mileage)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="color" className="text-gray-700 font-medium">
                  Цвет <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="color"
                  placeholder="Белый"
                  value={formData.car.color}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCar("color", e.target.value)}
                  className={getInputClassName(errors.color)}
                />
                {renderError(errors.color)}
              </div>
            </div>

            {/* Row 3: Fuel, Engine, Power, Transmission */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
              <div className="space-y-2">
                <Label htmlFor="fuelType" className="text-gray-700 font-medium">Вид топлива</Label>
                <select
                  id="fuelType"
                  value={formData.car.fuelType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateCar("fuelType", e.target.value)}
                  className={selectClassName}
                >
                  <option value="Бензин">Бензин</option>
                  <option value="Дизель">Дизель</option>
                  <option value="Гибрид">Гибрид</option>
                  <option value="Электро">Электро</option>
                  <option value="Газ">Газ</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="engineVolume" className="text-gray-700 font-medium">Объём (см³)</Label>
                <Input
                  id="engineVolume"
                  placeholder="1984"
                  value={formData.car.engineVolume}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCar("engineVolume", e.target.value)}
                  className={`border-gray-300 ${themeClasses.focusBorder} h-11`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="power" className="text-gray-700 font-medium">Мощность (л.с.)</Label>
                <Input
                  id="power"
                  placeholder="180"
                  value={formData.car.power}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCar("power", e.target.value)}
                  className={`border-gray-300 ${themeClasses.focusBorder} h-11`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transmission" className="text-gray-700 font-medium">КПП</Label>
                <select
                  id="transmission"
                  value={formData.car.transmission}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateCar("transmission", e.target.value)}
                  className={selectClassName}
                >
                  <option value="Автоматическая">Автомат</option>
                  <option value="Механическая">Механика</option>
                  <option value="Робот">Робот</option>
                  <option value="Вариатор">Вариатор</option>
                </select>
              </div>
            </div>

            {/* Row 4: Drive (single field, but in grid for alignment) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div className="space-y-2">
                <Label htmlFor="drive" className="text-gray-700 font-medium">Привод</Label>
                <select
                  id="drive"
                  value={formData.car.drive}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateCar("drive", e.target.value)}
                  className={selectClassName}
                >
                  <option value="Полный">Полный</option>
                  <option value="Передний">Передний</option>
                  <option value="Задний">Задний</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validation message */}
        {showErrors && Object.keys(errors).length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Пожалуйста, заполните все обязательные поля корректно
            </p>
          </div>
        )}

        {/* Download error message */}
        {downloadError && (
          <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {downloadError}
            </p>
          </div>
        )}

        {/* Download Buttons */}
        <div className="mt-8">
          <p className="text-center text-gray-600 mb-4 font-medium">Выберите формат для скачивания:</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              onClick={() => handleGenerate("pdf")}
              disabled={isGenerating !== null}
              size="lg"
              className={`${themeClasses.pdfButton} text-white gap-2 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-shadow`}
            >
              <FileDown className="w-6 h-6" />
              {isGenerating === "pdf" ? "Генерация..." : "Скачать PDF"}
            </Button>
            <Button
              onClick={() => handleGenerate("word")}
              disabled={isGenerating !== null}
              size="lg"
              className={`${themeClasses.wordButton} text-white gap-2 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-shadow`}
            >
              <FileText className="w-6 h-6" />
              {isGenerating === "word" ? "Генерация..." : "Скачать Word"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
