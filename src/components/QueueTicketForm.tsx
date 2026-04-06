"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileDown, Ticket, FileText, AlertCircle, Calendar, Clock, User, Phone, Car, Hash } from "lucide-react";

interface QueueTicketFormProps {
  templateFile: string;
  themeColor: "orange";
}

interface TicketFormData {
  form_date: string;
  ticket_number: string;
  appointment_date: string;
  appointment_time: string;
  car_info: string;
  vin: string;
  payer_name: string;
  doc_number: string;
  phone: string;
}

interface ValidationErrors {
  form_date?: string;
  ticket_number?: string;
  appointment_date?: string;
  appointment_time?: string;
  car_info?: string;
  vin?: string;
  payer_name?: string;
  doc_number?: string;
  phone?: string;
}

// Helper function to generate random ticket number
const generateTicketNumber = (): string => {
  const letters = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ";
  const randomLetter = letters[Math.floor(Math.random() * letters.length)];
  const randomNumber = Math.floor(Math.random() * 900) + 100; // 100-999
  return `${randomLetter}-${randomNumber}`;
};

// Helper function to format today's date
const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

export function QueueTicketForm({ templateFile, themeColor }: QueueTicketFormProps) {
  const [formData, setFormData] = useState<TicketFormData>({
    form_date: formatDate(new Date()),
    ticket_number: generateTicketNumber(),
    appointment_date: "",
    appointment_time: "",
    car_info: "",
    vin: "",
    payer_name: "",
    doc_number: "",
    phone: "",
  });
  const [isGenerating, setIsGenerating] = useState<"pdf" | "word" | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showErrors, setShowErrors] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const themeClasses = {
    headerGradient: "bg-gradient-to-r from-orange-500 to-amber-500",
    focusBorder: "focus:border-orange-500 focus:ring-orange-500",
    selectFocus: "focus:border-orange-500 focus:ring-1 focus:ring-orange-500",
    pdfButton: "bg-red-500 hover:bg-red-600",
    wordButton: "bg-orange-500 hover:bg-orange-600",
  };

  const updateField = (field: keyof TicketFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateDate = (dateStr: string): boolean => {
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) return false;
    const [day, month, year] = dateStr.split(".").map(Number);
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
  };

  const validateTime = (timeStr: string): boolean => {
    if (!/^\d{2}:\d{2}$/.test(timeStr)) return false;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  };

  const validatePhone = (phone: string): boolean => {
    // Allow formats: +7XXXXXXXXXX, 8XXXXXXXXXX, or just numbers
    const cleaned = phone.replace(/[\s\-\(\)]/g, "");
    return /^(\+7|8)?[0-9]{10}$/.test(cleaned) || /^[0-9]{10,11}$/.test(cleaned);
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.form_date.trim()) {
      newErrors.form_date = "Введите дату создания талона";
    } else if (!validateDate(formData.form_date)) {
      newErrors.form_date = "Формат: ДД.ММ.ГГГГ";
    }

    if (!formData.ticket_number.trim()) {
      newErrors.ticket_number = "Введите номер талона";
    }

    if (!formData.appointment_date.trim()) {
      newErrors.appointment_date = "Введите дату очереди";
    } else if (!validateDate(formData.appointment_date)) {
      newErrors.appointment_date = "Формат: ДД.ММ.ГГГГ";
    }

    if (!formData.appointment_time.trim()) {
      newErrors.appointment_time = "Введите время очереди";
    } else if (!validateTime(formData.appointment_time)) {
      newErrors.appointment_time = "Формат: ЧЧ:ММ";
    }

    if (!formData.car_info.trim()) {
      newErrors.car_info = "Введите информацию об автомобиле";
    }

    if (!formData.vin.trim()) {
      newErrors.vin = "Введите VIN номер";
    } else if (formData.vin.length !== 17) {
      newErrors.vin = "VIN должен содержать 17 символов";
    }

    if (!formData.payer_name.trim()) {
      newErrors.payer_name = "Введите ФИО плательщика";
    }

    if (!formData.doc_number.trim()) {
      newErrors.doc_number = "Введите номер документа";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Введите номер телефона";
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Некорректный номер телефона";
    }

    setErrors(newErrors);
    setShowErrors(true);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = async (format: "pdf" | "word") => {
    if (!validateForm()) {
      return;
    }

    setDownloadError(null);
    setIsGenerating(format);

    try {
      const appointment_datetime = `${formData.appointment_date} ${formData.appointment_time}`;

      const requestData = {
        format,
        templateFile: "Talon.docx",
        ticket_number: formData.ticket_number,
        form_date: formData.form_date,
        appointment_datetime: appointment_datetime,
        car_info: formData.car_info,
        vin: formData.vin,
        payer_name: formData.payer_name,
        doc_number: formData.doc_number,
        phone: formData.phone,
      };

      const response = await fetch("/api/generate-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка генерации документа");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Талон_${formData.ticket_number}_${formData.payer_name.split(" ")[0]}.${
        format === "pdf" ? "pdf" : "docx"
      }`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating document:", error);
      setDownloadError(`Ошибка: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`);
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

  const renderError = (error?: string) => {
    if (!error || !showErrors) return null;
    return (
      <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    );
  };

  const regenerateTicketNumber = () => {
    setFormData((prev) => ({ ...prev, ticket_number: generateTicketNumber() }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Талон электронной очереди</h2>
          <p className="text-gray-500">Заполните данные для генерации талона</p>
        </div>

        {/* Ticket Info Card */}
        <Card className="border-gray-200 shadow-lg overflow-hidden mb-6">
          <CardHeader className={`${themeClasses.headerGradient} text-white`}>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Данные талона
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Form Date */}
              <div className="space-y-2">
                <Label
                  htmlFor="form_date"
                  className="text-gray-700 font-medium flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-orange-500" />
                  Дата создания талона <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="form_date"
                  placeholder="ДД.ММ.ГГГГ"
                  value={formData.form_date}
                  onChange={(e) => updateField("form_date", e.target.value)}
                  className={getInputClassName(errors.form_date)}
                />
                {renderError(errors.form_date)}
              </div>

              {/* Ticket Number */}
              <div className="space-y-2">
                <Label
                  htmlFor="ticket_number"
                  className="text-gray-700 font-medium flex items-center gap-2"
                >
                  <Hash className="w-4 h-4 text-orange-500" />
                  Номер талона <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="ticket_number"
                    placeholder="А-123"
                    value={formData.ticket_number}
                    onChange={(e) => updateField("ticket_number", e.target.value)}
                    className={`${getInputClassName(errors.ticket_number)} flex-1`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={regenerateTicketNumber}
                    className="px-3 border-orange-300 text-orange-600 hover:bg-orange-50"
                    title="Сгенерировать новый номер"
                  >
                    <Hash className="w-4 h-4" />
                  </Button>
                </div>
                {renderError(errors.ticket_number)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointment Card */}
        <Card className="border-gray-200 shadow-lg overflow-hidden mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Дата и время очереди
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Appointment Date */}
              <div className="space-y-2">
                <Label
                  htmlFor="appointment_date"
                  className="text-gray-700 font-medium flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Дата очереди <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="appointment_date"
                  placeholder="ДД.ММ.ГГГГ"
                  value={formData.appointment_date}
                  onChange={(e) => updateField("appointment_date", e.target.value)}
                  className={`${getInputClassName(errors.appointment_date)} focus:border-blue-500 focus:ring-blue-500`}
                />
                {renderError(errors.appointment_date)}
                <p className="text-xs text-gray-400">Например: 15.01.2026</p>
              </div>

              {/* Appointment Time */}
              <div className="space-y-2">
                <Label
                  htmlFor="appointment_time"
                  className="text-gray-700 font-medium flex items-center gap-2"
                >
                  <Clock className="w-4 h-4 text-blue-500" />
                  Время очереди <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="appointment_time"
                  placeholder="ЧЧ:ММ"
                  value={formData.appointment_time}
                  onChange={(e) => updateField("appointment_time", e.target.value)}
                  className={`${getInputClassName(errors.appointment_time)} focus:border-blue-500 focus:ring-blue-500`}
                />
                {renderError(errors.appointment_time)}
                <p className="text-xs text-gray-400">Например: 14:30</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Car Info Card */}
        <Card className="border-gray-200 shadow-lg overflow-hidden mb-6">
          <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Данные автомобиля
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Car Info */}
              <div className="space-y-2">
                <Label
                  htmlFor="car_info"
                  className="text-gray-700 font-medium flex items-center gap-2"
                >
                  <Car className="w-4 h-4 text-green-500" />
                  Автомобиль <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="car_info"
                  placeholder="BMW X5 2021"
                  value={formData.car_info}
                  onChange={(e) => updateField("car_info", e.target.value)}
                  className={`${getInputClassName(errors.car_info)} focus:border-green-500 focus:ring-green-500`}
                />
                {renderError(errors.car_info)}
                <p className="text-xs text-gray-400">Марка, модель, год выпуска</p>
              </div>

              {/* VIN */}
              <div className="space-y-2">
                <Label
                  htmlFor="vin"
                  className="text-gray-700 font-medium flex items-center gap-2"
                >
                  <Hash className="w-4 h-4 text-green-500" />
                  VIN номер <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="vin"
                  placeholder="WVGZZZ5NZBW000001"
                  value={formData.vin}
                  onChange={(e) => updateField("vin", e.target.value.toUpperCase())}
                  className={`${getInputClassName(errors.vin)} focus:border-green-500 focus:ring-green-500 font-mono tracking-wide`}
                />
                {renderError(errors.vin)}
                <p className="text-xs text-gray-400">17 символов</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payer Info Card */}
        <Card className="border-gray-200 shadow-lg overflow-hidden mb-6">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Данные плательщика (лида)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Payer Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="payer_name"
                  className="text-gray-700 font-medium flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-purple-500" />
                  ФИО плательщика <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="payer_name"
                  placeholder="Иванов Иван Иванович"
                  value={formData.payer_name}
                  onChange={(e) => updateField("payer_name", e.target.value)}
                  className={`${getInputClassName(errors.payer_name)} focus:border-purple-500 focus:ring-purple-500`}
                />
                {renderError(errors.payer_name)}
              </div>

              {/* Passport Number */}
              <div className="space-y-2">
                <Label
                  htmlFor="doc_number"
                  className="text-gray-700 font-medium flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-purple-500" />
                  Номер паспорта лида <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="doc_number"
                  placeholder="1234 567890"
                  value={formData.doc_number}
                  onChange={(e) => updateField("doc_number", e.target.value)}
                  className={`${getInputClassName(errors.doc_number)} focus:border-purple-500 focus:ring-purple-500`}
                />
                {renderError(errors.doc_number)}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-gray-700 font-medium flex items-center gap-2"
                >
                  <Phone className="w-4 h-4 text-purple-500" />
                  Номер телефона <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  placeholder="+7 (999) 123-45-67"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className={`${getInputClassName(errors.phone)} focus:border-purple-500 focus:ring-purple-500`}
                />
                {renderError(errors.phone)}
                <p className="text-xs text-gray-400">Формат: +7XXXXXXXXXX или 8XXXXXXXXXX</p>
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
