export type Tier = {
  qty: number;
  price: number;
  percent: number;
  expiry: string
};

export type ProductDiscount = {
  itemCode: string;
  itemName: string;
  groupCode: number;
  groupName: string;
  inStock: number;
  committed: number;
  ordered: number;
  price: number;
  hasDiscount: boolean;
  barCode: string | null;
  salesUnit: string | null;
  salesItemsPerUnit: number;
  imageUrl: string | null;
  taxType: "EXE" | "INA";
  tiers: Tier[];
  quantity: number;
  unitPrice: number;
  originalPrice: number;
};

export type CreateOrder = {
  cardCode: string,
  docDate: string,
  docDueDate: string,
  comments: string,
  lines: [
    {
      itemCode: string,
      quantity: number,
      lineTotal: number,
      priceList: number,
      priceAfterVAT: number,
      taxCode: string,
    }
  ]
}

export interface Customer {
  cardCode: string;
  cardName: string;
  federalTaxID: string;
  priceListNum: string;
}

export interface CustomersResponse {
  items: Customer[];
  page: number;
  pageSize: number;
  total: number;
}

export interface OrderLineType {
  itemCode: string;
  itemDescription: string;
  barCode: string;
  quantity: number;
  priceAfterVAT: number;
  taxCode: string;
  lineTotal: number;
}

export interface OrderDataType {
  docEntry: number;
  docNum: number;
  cardCode: string;
  cardName: string;
  federalTaxID: string;
  address: string;
  docDate: string;
  vatSum: number;
  docTotal: number;
  comments: string;
  salesPersonCode: number;
  lines: OrderLineType[];
}