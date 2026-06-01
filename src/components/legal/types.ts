export type LegalDocBuyer = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  district: string;
  city: string;
  zip?: string | null;
};

export type LegalDocItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  variantLabel?: string;
};

export type LegalDocProps = {
  buyer: LegalDocBuyer;
  items: LegalDocItem[];
  subtotal: number;
  shippingFee: number;
  discountCode?: string | null;
  discountAmount: number;
  total: number;
  date: string;
  orderNumber?: string;
};
