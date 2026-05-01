import { PublicView } from "@/config/catalog-themes";

export interface PublicCatalogProductItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string | null;
  image_url: string | null;
  images?: string[];
  category_name: string | null;
}

export interface PublicCatalogSection {
  id: string | null;
  name: string;
  products: PublicCatalogProductItem[];
  icon_name?: string | null;
}

/** Día en horario (API puede enviar `from` o `from_`) */
export interface PublicDaySchedule {
  open?: boolean;
  from?: string;
  from_?: string;
  to?: string;
}

export interface PublicWeekSchedule {
  monday?: PublicDaySchedule;
  tuesday?: PublicDaySchedule;
  wednesday?: PublicDaySchedule;
  thursday?: PublicDaySchedule;
  friday?: PublicDaySchedule;
  saturday?: PublicDaySchedule;
  sunday?: PublicDaySchedule;
}

export interface CatalogBusinessInfo {
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  payment_methods?: string[];
  delivery_zone?: string | null;
  business_category?: string | null;
  delivery_mode?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  whatsapp_social?: string | null;
  catalog_banner_url?: string | null;
  /** Horario desde `config.schedule` (ajustes del negocio) */
  schedule?: PublicWeekSchedule | null;
}

// Aliases for compatibility with premium components
export type BusinessInfo = CatalogBusinessInfo;

export interface PublicCatalogData {
  business_name: string;
  business_type: string;
  slug: string | null;
  total_products: number;
  plan_limit: number | null;
  sections: PublicCatalogSection[];
  catalog_logo_url: string | null;
  whatsapp_display_number?: string | null;
  public_view?: PublicView;
  catalog_theme?: {
    preset: string;
    custom?: { primary: string; secondary: string };
  };
  business_info?: CatalogBusinessInfo;
}

// Alias for compatibility
export type PublicCatalog = PublicCatalogData;
