import { UserModel } from './user'

export class UserDeviceModel {
  id?: number
  userId?: number
  deviceId?: string
  data?: any
  isActive?: boolean
  createdAt?: string
  updatedAt?: string

  user?: UserModel

  constructor(
    id?: number,
    userId?: number,
    deviceId?: string,
    data?: any,
    isActive?: boolean,
    createdAt?: string,
    updatedAt?: string
  ) {
    this.id = id
    this.userId = userId
    this.deviceId = deviceId
    this.data = data
    this.isActive = isActive
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}
