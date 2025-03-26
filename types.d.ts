declare module '@ckeditor/ckeditor5-vue'
declare module '@ckeditor/ckeditor5-dev-utils'
declare module '@ckeditor/vite-plugin-ckeditor5'

declare module 'device-detector-js'
declare module 'device-detector-js/dist/parsers/bot'

declare module 'vue-virtual-scroller' {
	type Plugin_2<Option = any> =
		| (PluginInstallFunction<Option> & {
				install?: PluginInstallFunction<Option>
			})
		| {
				install: PluginInstallFunction<Option>
		  }
	export { Plugin_2 as Plugin }

	type PluginInstallFunction<Option> = (app: App, ...options: Option[]) => any

	interface App {
		//use(plugin: Plugin_2, ...options: any[]): this; // this line overrides below (because of any)
		use<Option>(plugin: Plugin_2<Option>, ...options: Option[]): this
	}

	export const RecycleScroller: Component<any, any, any, any>
	export const DynamicScroller: Component<any, any, any, any>
	export const DynamicScrollerItem: Component<any, any, any, any>

	export const install: PluginInstallFunction<any>
}
