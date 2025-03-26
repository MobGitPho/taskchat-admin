export type TabKey = 'upload-files' | 'media-library' | 'add-from-an-url'

export interface Props {
  enableUploadFiles?: boolean
  enableMediaLibrary?: boolean
  enableAddFromAnUrl?: boolean
  displayImages?: boolean
  displayVideos?: boolean
  displayAudios?: boolean
  displayDocuments?: boolean
  displayOtherTypes?: boolean
  preselectedMediaList?: number[] | null
  selectionType?: 'path' | 'url' | 'item'
  selectionMultiple?: boolean
  selectionLimit?: number
  title?: string
  uploadConfig?: {
    folder: string
    limit: number
    maxSize: number
    baseUrl: string | null
    excludedExtensions: string[]
  }
}

export const propsKey = Symbol() as InjectionKey<Props>
