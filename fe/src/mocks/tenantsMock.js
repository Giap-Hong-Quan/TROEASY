// Dữ liệu mẫu cho trang Khách thuê (chỉ dùng cho UI demo).
export const MOCK_TENANTS_DATA = {
  areas: [
    { id: "gv", name: "Khu Gò Vấp", city: "TP.HCM", rooms: 40, occupied: 33 },
    { id: "dn", name: "Khu Đồng Nai", city: "Đồng Nai", rooms: 30, occupied: 22 },
    { id: "bt", name: "Khu Bình Thạnh", city: "TP.HCM", rooms: 20, occupied: 18 },
  ],
  rooms: [
    // Gò Vấp — Tầng 1
    {
      id: "101", area: "gv", floor: 1, code: "101", status: "renting",
      price: 3500000, tenant: "Nguyễn Thị Hoa", phone: "0901234561",
      deposit: 3500000, elecPrev: 1204, elecCurr: 1260, waterPrev: 85, waterCurr: 92,
    },
    {
      id: "102", area: "gv", floor: 1, code: "102", status: "renting",
      price: 3200000, tenant: "Lê Văn Nam", phone: "0901234562",
      deposit: 3200000, elecPrev: 980, elecCurr: 1032, waterPrev: 64, waterCurr: 71,
    },
    {
      id: "103", area: "gv", floor: 1, code: "103", status: "repair",
      price: 3000000, tenant: null, phone: null,
      deposit: 0, elecPrev: 0, elecCurr: 0, waterPrev: 0, waterCurr: 0,
    },
    {
      id: "104", area: "gv", floor: 1, code: "104", status: "deposit",
      price: 3400000, tenant: "Phạm Văn Đức", phone: "0901234564",
      deposit: 3400000, elecPrev: 0, elecCurr: 0, waterPrev: 0, waterCurr: 0,
    },
    {
      id: "105", area: "gv", floor: 1, code: "105", status: "vacant",
      price: 3100000, tenant: null, phone: null,
      deposit: 0, elecPrev: 0, elecCurr: 0, waterPrev: 0, waterCurr: 0,
    },

    // Gò Vấp — Tầng 2
    {
      id: "201", area: "gv", floor: 2, code: "201", status: "renting",
      price: 3600000, tenant: "Trần Thị Mai", phone: "0901234571",
      deposit: 3600000, elecPrev: 1100, elecCurr: 1158, waterPrev: 78, waterCurr: 85,
    },
    {
      id: "202", area: "gv", floor: 2, code: "202", status: "renting",
      price: 3300000, tenant: "Võ Văn Hùng", phone: "0901234572",
      deposit: 3300000, elecPrev: 870, elecCurr: 920, waterPrev: 55, waterCurr: 62,
    },
    {
      id: "203", area: "gv", floor: 2, code: "203", status: "renting",
      price: 3450000, tenant: "Trần Bảo", phone: "0901234573",
      deposit: 3000000, elecPrev: 1050, elecCurr: 1098, waterPrev: 70, waterCurr: 78,
    },
    {
      id: "204", area: "gv", floor: 2, code: "204", status: "inter",
      price: 3200000, tenant: "[Trung gian: Công ty A]", phone: "0800000001",
      deposit: 0, elecPrev: 950, elecCurr: 998, waterPrev: 60, waterCurr: 67,
    },
    {
      id: "205", area: "gv", floor: 2, code: "205", status: "renting",
      price: 3500000, tenant: "Nguyễn Văn Bình", phone: "0901234575",
      deposit: 3500000, elecPrev: 1200, elecCurr: 1256, waterPrev: 82, waterCurr: 89,
    },

    // Đồng Nai — Tầng 1
    {
      id: "301", area: "dn", floor: 1, code: "301", status: "renting",
      price: 2800000, tenant: "Lý Thị Lan", phone: "0911234561",
      deposit: 2800000, elecPrev: 800, elecCurr: 845, waterPrev: 50, waterCurr: 57,
    },
    {
      id: "302", area: "dn", floor: 1, code: "302", status: "vacant",
      price: 2700000, tenant: null, phone: null,
      deposit: 0, elecPrev: 0, elecCurr: 0, waterPrev: 0, waterCurr: 0,
    },
    {
      id: "303", area: "dn", floor: 1, code: "303", status: "repair",
      price: 2600000, tenant: null, phone: null,
      deposit: 0, elecPrev: 0, elecCurr: 0, waterPrev: 0, waterCurr: 0,
    },
    {
      id: "304", area: "dn", floor: 1, code: "304", status: "renting",
      price: 2900000, tenant: "Đặng Văn Tuấn", phone: "0911234564",
      deposit: 2900000, elecPrev: 860, elecCurr: 910, waterPrev: 58, waterCurr: 65,
    },

    // Bình Thạnh — Tầng 1
    {
      id: "401", area: "bt", floor: 1, code: "401", status: "renting",
      price: 4200000, tenant: "Phan Thị Thu", phone: "0921234561",
      deposit: 4200000, elecPrev: 1400, elecCurr: 1460, waterPrev: 95, waterCurr: 103,
    },
    {
      id: "402", area: "bt", floor: 1, code: "402", status: "renting",
      price: 4000000, tenant: "Bùi Văn Khánh", phone: "0921234562",
      deposit: 4000000, elecPrev: 1350, elecCurr: 1408, waterPrev: 90, waterCurr: 98,
    },
    {
      id: "403", area: "bt", floor: 1, code: "403", status: "stop",
      price: 3800000, tenant: null, phone: null,
      deposit: 0, elecPrev: 0, elecCurr: 0, waterPrev: 0, waterCurr: 0,
    },
  ],
};
