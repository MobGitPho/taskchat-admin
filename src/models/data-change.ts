export class DataChangeModel {
  id?: number
  tableName: string
  changeId: string
  createdAt?: string
  updatedAt?: string

  constructor(
    tableName: string,
    changeId: string,
    id?: number,
    createdAt?: string,
    updatedAt?: string
  ) {
    this.tableName = tableName
    this.changeId = changeId
    this.id = id
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}
