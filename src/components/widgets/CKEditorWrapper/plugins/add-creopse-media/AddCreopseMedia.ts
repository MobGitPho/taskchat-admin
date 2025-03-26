import i18n from '@/i18n'
import Plugin from '@ckeditor/ckeditor5-core/src/plugin'
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview'

const { t } = i18n.global

export default class AddCreopseMedia extends Plugin {
  init() {
    const editor = this.editor

    editor.ui.componentFactory.add('addCreopseMedia', (locale) => {
      const view = new ButtonView(locale)
      view.set({
        label: t('addMedia'),
        withText: true,
        tooltip: true,
      })

      view.on('execute', () => {
        const myEvent = new Event('add-creopse-media')

        document.dispatchEvent(myEvent)
      })

      return view
    })
  }
}
