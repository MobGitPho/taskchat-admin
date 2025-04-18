import { Coords } from '@/utils/types'

import { AccountStatus } from '@/enums/account-status'
import { AuthType } from '@/enums/auth-type'
import { ProfileType } from '@/enums/profile-type'

import { AdminProfileModel } from './admin-profile'
import { PermissionModel } from './permission'
import { RoleModel } from './role'
import { UserDeviceModel } from './user-device'
import { UserPlaceModel } from './user-place'
import { UserSessionModel } from './user-session'

export class UserModel {
  id?: number
  uid?: string
  avatar: string
  avatarUrl: string
  fullname: string
  lastname: string
  firstname: string
  email: string
  emailVerifiedAt?: string
  password: string
  phone?: string
  address?: string
  location?: Coords | null
  profileType: ProfileType | string
  profileId: number
  accountStatus: AccountStatus
  preferences?: any
  authType?: AuthType
  lastLoggedInAt?: string
  rememberToken?: string
  deletedAt?: string
  createdAt?: string
  updatedAt?: string

  permissions?: PermissionModel[]
  profile?: AdminProfileModel | any
  roles?: RoleModel[]
  sessions?: UserSessionModel[]
  devices?: UserDeviceModel[]
  place?: UserPlaceModel

  constructor(
    avatar: string,
    avatarUrl: string,
    fullname: string,
    lastname: string,
    firstname: string,
    email: string,
    password: string,
    profileType: ProfileType | string,
    profileId: number,
    accountStatus: AccountStatus,
    id?: number,
    uid?: string,
    emailVerifiedAt?: string,
    phone?: string,
    address?: string,
    location?: Coords | null,
    preferences?: any,
    authType?: AuthType,
    lastLoggedInAt?: string,
    rememberToken?: string,
    deletedAt?: string,
    createdAt?: string,
    updatedAt?: string
  ) {
    this.id = id
    this.uid = uid
    this.avatar = avatar
    this.avatarUrl = avatarUrl
    this.fullname = fullname
    this.lastname = lastname
    this.firstname = firstname
    this.email = email
    this.password = password
    this.phone = phone
    this.address = address
    this.location = location
    this.accountStatus = accountStatus
    this.emailVerifiedAt = emailVerifiedAt
    this.profileType = profileType
    this.profileId = profileId
    this.preferences = preferences
    this.authType = authType
    this.lastLoggedInAt = lastLoggedInAt
    this.rememberToken = rememberToken
    this.deletedAt = deletedAt
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}
