import { Bool } from '@/enums/bool'

export interface UserPrefs {
  inAppNotifEnabled?: Bool
  emailNotifEnabled?: Bool
  locale?: string
}

export interface Coords {
  lat: number
  lng: number
}

export type FieldTypeValue =
  | 'text'
  | 'i18n-text'
  | 'textarea'
  | 'i18n-textarea'
  | 'number'
  | 'checkbox'
  | 'single-select'
  | 'multi-select'
  | 'date'
  | 'year'
  | 'editor'
  | 'i18n-editor'
  | 'image'
  | 'gallery'
  | 'news-article'
  | 'news-articles'
  | 'news-category'
  | 'news-categories'
  | 'news-tag'
  | 'news-tags'
  | 'icon'
  | 'icons'
  | 'albums'
  | 'audio'
  | 'video'
  | 'document'
  | 'file'
  | 'color'
  | 'content-model-item'
  | 'content-model-items'
  | 'menu-item-link'
  | 'list'
  | 'i18n-list'

export interface FieldType {
  label: string
  value: FieldTypeValue
}

export interface ItemOption {
  value: string
  label: string
}

export interface ItemSettings {
  [key: string]: any
}

export interface DataStructureField {
  key: string
  label: string
  type: FieldTypeValue
  required: boolean
  options?: ItemOption[]
  settings: ItemSettings
  defaultValue?: string
}

export interface AppConfig {
  apiBaseUrl: string
  apiUrl: string
  apiRequestHeaders: {
    'X-API-Key': string
    Authorization?: string
  }
  forceDevMode: boolean
}
