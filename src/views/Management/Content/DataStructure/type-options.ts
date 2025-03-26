import { FieldTypeValue } from '@/utils/types'

import i18n from '@/i18n'

const { t } = i18n.global

export default [
  { label: t('text'), value: 'text' },
  { label: t('i18nText'), value: 'i18n-text' },
  { label: t('textarea'), value: 'textarea' },
  {
    label: t('i18nTextarea'),
    value: 'i18n-textarea',
  },
  { label: t('number'), value: 'number' },
  { label: t('checkbox'), value: 'checkbox' },
  {
    label: t('singleSelect'),
    value: 'single-select',
  },
  {
    label: t('multiSelect'),
    value: 'multi-select',
  },
  { label: t('date'), value: 'date' },
  { label: t('year'), value: 'year' },
  { label: t('editor'), value: 'editor' },
  {
    label: t('i18nEditor'),
    value: 'i18n-editor',
  },
  { label: t('image'), value: 'image' },
  { label: t('gallery'), value: 'gallery' },
  {
    label: t('newsArticle'),
    value: 'news-article',
  },
  {
    label: t('newsArticles'),
    value: 'news-articles',
  },
  {
    label: t('newsCategory'),
    value: 'news-category',
  },
  {
    label: t('newsCategories'),
    value: 'news-categories',
  },
  {
    label: t('newsTag'),
    value: 'news-tag',
  },
  {
    label: t('newsTags'),
    value: 'news-tags',
  },
  { label: t('icon'), value: 'icon' },
  { label: t('icons'), value: 'icons' },
  { label: t('albums'), value: 'albums' },
  { label: t('audio'), value: 'audio' },
  { label: t('video'), value: 'video' },
  { label: t('document'), value: 'document' },
  { label: t('file'), value: 'file' },
  { label: t('color'), value: 'color' },
  {
    label: t('contentItem'),
    value: 'content-model-item',
  },
  {
    label: t('contentItems'),
    value: 'content-model-items',
  },
  {
    label: t('menuItemLink'),
    value: 'menu-item-link',
  },
  {
    label: t('list'),
    value: 'list',
  },
  {
    label: t('i18nList'),
    value: 'i18n-list',
  },
] as { label: any; value: FieldTypeValue }[]
