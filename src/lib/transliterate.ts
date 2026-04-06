/**
 * Транслитерация текста с кириллицы на латиницу
 * Используется для генерации QR-кодов и других целей, где нужен латинский алфавит
 */

const cyrillicToLatinMap: { [key: string]: string } = {
  // Uppercase
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
  'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
  'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
  'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
  'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
  // Lowercase
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  // Ukrainian letters
  'І': 'I', 'і': 'i', 'Ї': 'Yi', 'ї': 'yi', 'Є': 'Ye', 'є': 'ye',
  'Ґ': 'G', 'ґ': 'g',
  // Belarusian letters
  'Ў': 'U', 'ў': 'u',
};

/**
 * Транслитерирует текст с кириллицы на латиницу
 * @param text - Исходный текст с кириллическими символами
 * @returns Транслитерированный текст с латинскими символами
 */
export function transliterate(text: string): string {
  if (!text) return '';

  return text
    .split('')
    .map(char => cyrillicToLatinMap[char] ?? char)
    .join('');
}

/**
 * Форматирует данные для QR-кода талона
 * @param data - Данные талона
 * @returns Форматированная строка для QR-кода с транслитерацией
 */
export function formatTicketQRData(data: {
  ticket_number: string;
  form_date: string;
  appointment_datetime: string;
  car_info: string;
  vin: string;
  payer_name: string;
  doc_number: string;
  phone: string;
}): string {
  return `Talon elektronnoy ocheredi
========================
No talona: ${transliterate(data.ticket_number)}
Data sozdaniya: ${data.form_date}
Data i vremya ocheredi: ${data.appointment_datetime}

Avtomobil: ${transliterate(data.car_info)}
VIN: ${data.vin}

Platelshchik: ${transliterate(data.payer_name)}
Pasport: ${data.doc_number}
Telefon: ${data.phone}`;
}

export default transliterate;
