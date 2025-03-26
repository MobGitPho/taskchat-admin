import { NewsArticleStatus } from '@/enums/news-article-status'

export const useNews = () => {
  const { t } = useI18n()

  const newsArticleStatus = [
    {
      label: t('draft'),
      value: NewsArticleStatus.DRAFT,
      tagType: 'default',
    },
    {
      label: t('pending'),
      value: NewsArticleStatus.PENDING,
      tagType: 'info',
    },
    {
      label: t('published'),
      value: NewsArticleStatus.PUBLISHED,
      tagType: 'success',
    },
    {
      label: t('trash'),
      value: NewsArticleStatus.TRASH,
      tagType: 'error',
    },
  ]

  const getNewsArticleStatusLabel = (value: NewsArticleStatus) =>
    newsArticleStatus.find((status) => status.value === value)?.label

  const getNewsArticleStatusTagType = (value: NewsArticleStatus) =>
    newsArticleStatus.find((status) => status.value === value)?.tagType ||
    'default'

  return {
    getNewsArticleStatusTagType,
    getNewsArticleStatusLabel,
    newsArticleStatus,
  }
}
