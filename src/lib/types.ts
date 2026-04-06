export interface CarData {
  reportNumber: string;
  carModel: string;
  vin: string;
  year: string;
  mileage: string;
  color: string;
  fuelType: string;
  engineVolume: string;
  power: string;
  transmission: string;
  drive: string;
}

export interface PaintThickness {
  // Двери
  doorFrontLeft: string;
  doorFrontRight: string;
  doorRearLeft: string;
  doorRearRight: string;
  // Крылья
  fenderFrontLeft: string;
  fenderFrontRight: string;
  fenderRearLeft: string;
  fenderRearRight: string;
  // Передняя часть
  hood: string;
  roof: string;
  // Задняя часть
  trunk: string;
  // Пороги
  sillFrontLeft: string;
  sillFrontRight: string;
  sillRearLeft: string;
  sillRearRight: string;
}

export interface ReportInfo {
  date: string;
  expertName: string;
}

export interface ReportFormData {
  car: CarData;
  paint: PaintThickness;
  report: ReportInfo;
}

// Generate random report number between 100 and 300
const getRandomReportNumber = () => {
  return String(Math.floor(Math.random() * 201) + 100);
};

// Generate random paint thickness in normal range (90-130 mkm)
const getRandomPaintThickness = () => {
  return String(Math.floor(Math.random() * 41) + 90);
};

// 5 German expert names
const EXPERT_NAMES = [
  "Andreas Krause",
  "Michael Weber",
  "Thomas Müller",
  "Stefan Hoffmann",
  "Markus Schneider",
];

// Get random expert name
const getRandomExpert = () => {
  return EXPERT_NAMES[Math.floor(Math.random() * EXPERT_NAMES.length)];
};

// Generate all paint thickness values
const generatePaintThickness = (): PaintThickness => ({
  doorFrontLeft: getRandomPaintThickness(),
  doorFrontRight: getRandomPaintThickness(),
  doorRearLeft: getRandomPaintThickness(),
  doorRearRight: getRandomPaintThickness(),
  fenderFrontLeft: getRandomPaintThickness(),
  fenderFrontRight: getRandomPaintThickness(),
  fenderRearLeft: getRandomPaintThickness(),
  fenderRearRight: getRandomPaintThickness(),
  hood: getRandomPaintThickness(),
  roof: getRandomPaintThickness(),
  trunk: getRandomPaintThickness(),
  sillFrontLeft: getRandomPaintThickness(),
  sillFrontRight: getRandomPaintThickness(),
  sillRearLeft: getRandomPaintThickness(),
  sillRearRight: getRandomPaintThickness(),
});

export const defaultFormData: ReportFormData = {
  car: {
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
};

export { generatePaintThickness, getRandomReportNumber, getRandomExpert };
