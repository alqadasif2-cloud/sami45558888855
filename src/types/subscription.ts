export type SubscriptionPlanId =
  | 'journey_3000'
  | 'journey_5000'
  | 'journey_10000'
  | 'sami_vip'
  | 'sami_scalping';

export interface PaymentMethodItem {
  id: string;
  name: string;
  type: 'crypto' | 'bank' | 'wallet' | 'other';
  network?: string;
  addressOrDetails?: string;
  instructions?: string;
  isEnabled: boolean;
}

export interface TermsItem {
  id: string;
  order: number;
  title: string;
  content: string;
  isEnabled: boolean;
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId | string;
  name: string;
  price: number;
  currency: string;
  shortDescription: string;
  fullDescription: string;
  paymentMethods: PaymentMethodItem[];
  allowsInstallments: boolean;
  installmentMinimum: number;
  durationDays: number;
  maxSubscribers: number;
  enrolledCount: number;
  isActive: boolean;
  status: 'active' | 'closed' | 'paused';
  closedMessage?: string;
  termsTitle?: string;
  termsItems: TermsItem[];
  termsFullText?: string;
  termsVersion: number;
  paymentInstructions?: string;
  ownerNotes?: string;
  publishedAt?: number;
  updatedAt: number;
  updatedBy: number;
}

export interface SubscriptionAuditLog {
  id: string;
  subscriptionId: string;
  subscriptionName: string;
  changeType:
    | 'price_update'
    | 'terms_update'
    | 'details_update'
    | 'status_change'
    | 'payment_update'
    | 'full_publish';
  summary: string;
  previousData?: Partial<SubscriptionPlan>;
  newData?: Partial<SubscriptionPlan>;
  changedBy: number;
  changedByName: string;
  timestamp: number;
}

export interface SubscriptionConsent {
  id: string;
  userId: number;
  userName: string;
  subscriptionId: string;
  subscriptionName: string;
  termsVersion: number;
  agreedAt: number;
  timestamp: number;
  status: 'active' | 'superseded';
}
