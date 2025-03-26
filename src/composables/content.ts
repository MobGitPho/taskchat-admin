import { isStringifiedObject } from '@/utils/functions'

import { ContentType } from '@/enums/content-type'

import { ContentModelModel } from '@/models/content-model'
import { ContentModelItemModel } from '@/models/content-model-item'

export const useContent = () => {
  const { t } = useI18n()
  const { tr } = useHelper()

  const extractItemTitle = (
    item: ContentModelItemModel,
    contentModel: ContentModelModel | null | undefined
  ) => {
    if (contentModel && contentModel.titleFieldName) {
      return isStringifiedObject(
        item.contentModelData['index'][contentModel.titleFieldName]
      )
        ? tr(item.contentModelData['index'][contentModel.titleFieldName])
        : item.contentModelData['index'][contentModel.titleFieldName]
    }

    if (item.contentModelData && item.contentModelData.index) {
      const fields = [
        'title',
        'titre',
        'name',
        'nom',
        'label',
        'text',
        'texte',
        'slug',
        'subject',
        'sujet',
        'summary',
        'description',
        'content',
        'body',
      ]

      for (const field of fields) {
        if (item.contentModelData.index[field]) {
          return isStringifiedObject(item.contentModelData.index[field])
            ? tr(item.contentModelData.index[field])
            : item.contentModelData.index[field]
        }
      }
    }

    return tr(item.title)
  }

  const contentTypes = [
    {
      label: t('contentModel'),
      value: ContentType.CONTENT_MODEL,
      tagType: 'warning',
    },
    {
      label: t('newsArticle'),
      value: ContentType.NEWS_ARTICLE,
      tagType: 'info',
    },
    {
      label: t('newsCategory'),
      value: ContentType.NEWS_CATEGORY,
      tagType: 'success',
    },
    {
      label: t('newsTag'),
      value: ContentType.NEWS_TAG,
      tagType: 'error',
    },
  ]

  const getContentTypeLabel = (value: ContentType) =>
    contentTypes.find((type) => type.value === value)?.label

  const getContentTypeTagType = (value: ContentType) =>
    contentTypes.find((type) => type.value === value)?.tagType || 'default'

  return {
    contentTypes,
    getContentTypeLabel,
    getContentTypeTagType,
    extractItemTitle,
  }
}
