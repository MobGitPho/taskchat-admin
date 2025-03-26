import i18n from '@/i18n'

const { t } = i18n.global

const textInputSettings = [
  {
    key: 'maxlength',
    defaultValue: '',
    placeholder: t('maxInputLength'),
    isNumber: true,
  },
  {
    key: 'minlength',
    defaultValue: '',
    placeholder: t('minInputLength'),
    isNumber: true,
  },
  { key: 'clearable', defaultValue: '', placeholder: t('inputClearable') },
]

export default {
  text: textInputSettings,
  textarea: textInputSettings,
  number: [
    {
      key: 'min',
      defaultValue: '',
      placeholder: t('minValue'),
      isNumber: true,
    },
    {
      key: 'max',
      defaultValue: '',
      placeholder: t('maxValue'),
      isNumber: true,
    },
    {
      key: 'step',
      defaultValue: '1',
      placeholder: t('stepPlaceholder'),
      isNumber: true,
    },
    { key: 'clearable', defaultValue: '', placeholder: t('inputClearable') },
  ],
  checkbox: [
    {
      key: 'checked-value',
      defaultValue: '',
      placeholder: t('checkedValue'),
    },
    {
      key: 'unchecked-value',
      defaultValue: '',
      placeholder: t('uncheckedValue'),
    },
  ],
  'single-select': [
    { key: 'clearable', defaultValue: '', placeholder: t('inputClearable') },
  ],
  'multi-select': [
    { key: 'clearable', defaultValue: '', placeholder: t('inputClearable') },
    {
      key: 'max-tag-count',
      defaultValue: '',
      placeholder: t('maxTagCount'),
    },
    {
      key: 'max',
      defaultValue: '',
      placeholder: t('maxSelectCount'),
      isNumber: true,
    },
  ],
  date: [
    { key: 'clearable', defaultValue: '', placeholder: t('inputClearable') },
    { key: 'format', defaultValue: '', placeholder: t('dateFormat') },
  ],
  year: [
    { key: 'clearable', defaultValue: '', placeholder: t('inputClearable') },
  ],
  'news-article': [
    { key: 'clearable', defaultValue: '', placeholder: t('inputClearable') },
  ],
  'news-articles': [
    { key: 'clearable', defaultValue: '', placeholder: t('inputClearable') },
    {
      key: 'max-tag-count',
      defaultValue: '',
      placeholder: t('maxTagCount'),
    },
    {
      key: 'max',
      defaultValue: '',
      placeholder: t('maxSelectCount'),
      isNumber: true,
    },
  ],
  'news-category': [
    { key: 'clearable', defaultValue: '', placeholder: t('inputClearable') },
  ],
  'news-categories': [
    { key: 'clearable', defaultValue: '', placeholder: t('inputClearable') },
    {
      key: 'max-tag-count',
      defaultValue: '',
      placeholder: t('maxTagCount'),
    },
    {
      key: 'max',
      defaultValue: '',
      placeholder: t('maxSelectCount'),
      isNumber: true,
    },
  ],
  'news-tag': [
    { key: 'clearable', defaultValue: '', placeholder: t('inputClearable') },
  ],
  'news-tags': [
    { key: 'clearable', defaultValue: '', placeholder: t('inputClearable') },
    {
      key: 'max-tag-count',
      defaultValue: '',
      placeholder: t('maxTagCount'),
    },
    {
      key: 'max',
      defaultValue: '',
      placeholder: t('maxSelectCount'),
      isNumber: true,
    },
  ],
  icon: [
    { key: 'clearable', defaultValue: '', placeholder: t('inputClearable') },
    { key: 'library', defaultValue: 'all', placeholder: t('iconLibrary') },
  ],
  'content-model-item': [
    { key: 'clearable', defaultValue: '', placeholder: t('inputClearable') },
  ],
  'content-model-items': [
    { key: 'clearable', defaultValue: '', placeholder: t('inputClearable') },
    {
      key: 'max-tag-count',
      defaultValue: '',
      placeholder: t('maxTagCount'),
    },
    {
      key: 'max',
      defaultValue: '',
      placeholder: t('maxSelectCount'),
      isNumber: true,
    },
  ],
  'menu-item-link': [
    { key: 'clearable', defaultValue: '', placeholder: t('inputClearable') },
  ],
  list: [
    {
      key: 'min',
      defaultValue: '',
      placeholder: t('minItemCount'),
      isNumber: true,
    },
    {
      key: 'max',
      defaultValue: '',
      placeholder: t('maxItemCount'),
      isNumber: true,
    },
    {
      key: 'type',
      defaultValue: 'text',
      placeholder: t('inputType'),
    },
  ],
  'i18n-list': [
    {
      key: 'min',
      defaultValue: '',
      placeholder: t('minItemCount'),
      isNumber: true,
    },
    {
      key: 'max',
      defaultValue: '',
      placeholder: t('maxItemCount'),
      isNumber: true,
    },
    {
      key: 'type',
      defaultValue: 'text',
      placeholder: t('inputType'),
    },
  ],
} as Record<
  string,
  {
    key: string
    defaultValue: string
    placeholder: string
    isNumber?: boolean
  }[]
>
