"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function TicketContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token || token !== "authenticated") {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-lg font-medium">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Decode data from URL
  const encodedData = searchParams.get("d");

  let ticketData = {
    ticket_number: "",
    form_date: "",
    appointment_datetime: "",
    car_info: "",
    vin: "",
    payer_name: "",
    doc_number: "",
    phone: "",
  };

  if (encodedData) {
    try {
      const decoded = atob(encodedData);
      ticketData = JSON.parse(decoded);
    } catch (e) {
      console.error("Failed to decode ticket data:", e);
    }
  }

  const currentDate = new Date().toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      {/* Header */}
      <header className="bg-[#29645e] text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <div className="text-lg font-bold">Система электронной очереди</div>
                <div className="text-sm text-white/80">Информационный портал</div>
              </div>
            </div>
            <div className="text-sm text-white/80">
              {currentDate}
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-[#29645e]">
            <span>Главная</span>
            <span className="text-gray-400">→</span>
            <span>Электронная очередь</span>
            <span className="text-gray-400">→</span>
            <span className="text-gray-600">Талон {ticketData.ticket_number}</span>
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative h-48 bg-gradient-to-r from-[#29645e] to-[#3a7d75] overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-6xl mx-auto px-4 h-full flex items-center">
          <div className="text-white">
            <h1 className="text-3xl font-bold mb-2">Талон электронной очереди</h1>
            <p className="text-white/80">Подтверждение записи в систему электронной очереди</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="bg-[#44cc9e] text-white px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-bold">Запись подтверждена</div>
                <div className="text-sm text-white/80">Талон успешно зарегистрирован в системе</div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Ticket Info */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Информация о записи
                </h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-start py-2 border-b border-gray-100">
                    <span className="text-gray-600">Номер талона:</span>
                    <span className="font-bold text-[#29645e] text-xl">{ticketData.ticket_number || "—"}</span>
                  </div>

                  <div className="flex justify-between items-start py-2 border-b border-gray-100">
                    <span className="text-gray-600">Дата создания талона:</span>
                    <span className="font-medium text-gray-800">{ticketData.form_date || "—"}</span>
                  </div>

                  <div className="flex justify-between items-start py-2 border-b border-gray-100">
                    <span className="text-gray-600">Дата и время очереди:</span>
                    <span className="font-bold text-[#b82f46]">{ticketData.appointment_datetime || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Car & Payer Info */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Данные транспортного средства
                </h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-start py-2 border-b border-gray-100">
                    <span className="text-gray-600">Автомобиль:</span>
                    <span className="font-medium text-gray-800">{ticketData.car_info || "—"}</span>
                  </div>

                  <div className="flex justify-between items-start py-2 border-b border-gray-100">
                    <span className="text-gray-600">VIN номер:</span>
                    <span className="font-mono font-medium text-gray-800 tracking-wider">{ticketData.vin || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payer Info Section */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                Данные плательщика
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">ФИО</div>
                  <div className="font-medium text-gray-800">{ticketData.payer_name || "—"}</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Номер паспорта</div>
                  <div className="font-medium text-gray-800">{ticketData.doc_number || "—"}</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Телефон</div>
                  <div className="font-medium text-gray-800">{ticketData.phone || "—"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-[#fff8e6] border border-[#f0d78c] rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#f0d78c] rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-[#8b6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-[#8b6914] mb-2">Важная информация</h3>
              <ul className="text-sm text-[#6b5210] space-y-1">
                <li>• Сохраните данный талон или сделайте скриншот экрана</li>
                <li>• Прибудьте к месту назначения за 15 минут до указанного времени</li>
                <li>• При себе необходимо иметь документ, удостоверяющий личность</li>
                <li>• В случае опоздания более чем на 30 минут талон аннулируется</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 mb-4">Контактная информация</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Телефон горячей линии:</span>
              <span className="ml-2 text-[#29645e] font-medium">+375 (17) 123-45-67</span>
            </div>
            <div>
              <span className="text-gray-500">Режим работы:</span>
              <span className="ml-2 text-gray-800">Круглосуточно</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#29645e] text-white mt-8">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="font-bold mb-2">Система электронной очереди</div>
              <div className="text-sm text-white/70">
                Информационный портал для записи и управления очередями
              </div>
            </div>
            <div>
              <div className="font-bold mb-2">Режим работы</div>
              <div className="text-sm text-white/70">
                Понедельник - Пятница<br />
                с 09:00 до 18:00
              </div>
            </div>
            <div>
              <div className="font-bold mb-2">Контакты</div>
              <div className="text-sm text-white/70">
                Телефон: +375 (17) 123-45-67<br />
                Email: info@queue.gov.by
              </div>
            </div>
          </div>
          <div className="border-t border-white/20 mt-6 pt-6 text-center text-sm text-white/50">
            © 2026 Система электронной очереди. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function TicketPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    }>
      <TicketContent />
    </Suspense>
  );
}
