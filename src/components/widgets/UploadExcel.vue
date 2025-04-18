<script setup>
  import * as XLSX from 'xlsx'

  const props = defineProps({
    beforeUpload: {
      type: Function,
      default: null,
    },
    onSuccess: {
      type: Function,
      default: null,
    },
  })

  const { t } = useI18n()

  const loading = ref(false)
  const excelUploadInput = ref(null)
  const excelData = ref({
    header: null,
    results: null,
  })

  function generateData({ header, results }) {
    excelData.value = { header, results }
    props.onSuccess && props.onSuccess(excelData.value)
  }

  function handleDrop(e) {
    e.stopPropagation()
    e.preventDefault()
    if (loading.value) return
    const files = e.dataTransfer.files
    if (files.length !== 1) {
      console.log(t('supportUploadingOneFile'))
      return
    }
    const rawFile = files[0]
    if (!isExcel(rawFile)) {
      console.log(t('formatNotSupported'))
      return false
    }
    upload(rawFile)
    e.stopPropagation()
    e.preventDefault()
  }

  function handleDragover(e) {
    e.stopPropagation()
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  function handleUpload() {
    excelUploadInput.value.click()
  }

  function handleClick(e) {
    const files = e.target.files
    const rawFile = files[0]
    if (!rawFile) return
    upload(rawFile)
  }

  function upload(rawFile) {
    excelUploadInput.value = null
    if (!props.beforeUpload) {
      readerData(rawFile)
      return
    }
    const before = props.beforeUpload(rawFile)
    if (before) {
      readerData(rawFile)
    }
  }

  function readerData(rawFile) {
    loading.value = true
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = e.target.result
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const header = getHeaderRow(worksheet)
        const results = XLSX.utils.sheet_to_json(worksheet)
        generateData({ header, results })
        loading.value = false
        resolve()
      }
      reader.readAsArrayBuffer(rawFile)
    })
  }

  function getHeaderRow(sheet) {
    const headers = []
    const range = XLSX.utils.decode_range(sheet['!ref'])
    let C
    const R = range.s.r
    /* start in the first row */
    for (C = range.s.c; C <= range.e.c; ++C) {
      /* walk every column in the range */
      const cell = sheet[XLSX.utils.encode_cell({ c: C, r: R })]
      /* find the cell in the first row */
      let hdr = 'UNKNOWN ' + C // <-- replace with your desired default
      if (cell && cell.t) hdr = XLSX.utils.format_cell(cell)
      headers.push(hdr)
    }
    return headers
  }

  function isExcel(file) {
    return /\.(xlsx|xls|csv)$/.test(file.name)
  }
</script>

<template>
  <div>
    <input
      ref="excelUploadInput"
      class="excel-upload-input"
      type="file"
      accept=".xlsx, .xls"
      @change="handleClick" />
    <div
      class="drop"
      @drop="handleDrop"
      @dragover="handleDragover"
      @dragenter="handleDragover">
      {{ t('dropExcelFileHereOr') }}
      <n-button
        :loading="loading"
        style="margin-left: 16px"
        size="small"
        type="primary"
        @click="handleUpload">
        {{ t('browse') }}
      </n-button>
    </div>
  </div>
</template>

<style scoped>
  .excel-upload-input {
    display: none;
    z-index: -9999;
  }
  .drop {
    border: 2px dashed #bbb;
    width: 100%;
    height: 160px;
    line-height: 160px;
    margin: 0 auto;
    font-size: 24px;
    border-radius: 5px;
    text-align: center;
    color: #bbb;
    position: relative;
  }
</style>
