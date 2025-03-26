import { UserModel } from './user'

export class UserPlaceModel {
  id?: number
  userId?: number
  country?: string
  position?: string
  locality?: string
  administrativeArea?: string
  postalCode?: string
  name?: string
  subAdministrativeArea?: string
  isoCountryCode?: string
  subLocality?: string
  subThoroughfare?: string
  thoroughfare?: string
  street?: string
  createdAt?: string
  updatedAt?: string

  user?: UserModel

  constructor(
    id?: number,
    userId?: number,
    country?: string,
    position?: string,
    locality?: string,
    administrativeArea?: string,
    postalCode?: string,
    name?: string,
    subAdministrativeArea?: string,
    isoCountryCode?: string,
    subLocality?: string,
    subThoroughfare?: string,
    thoroughfare?: string,
    street?: string,
    createdAt?: string,
    updatedAt?: string
  ) {
    this.id = id
    this.userId = userId
    this.country = country
    this.position = position
    this.locality = locality
    this.administrativeArea = administrativeArea
    this.postalCode = postalCode
    this.name = name
    this.subAdministrativeArea = subAdministrativeArea
    this.isoCountryCode = isoCountryCode
    this.subLocality = subLocality
    this.subThoroughfare = subThoroughfare
    this.thoroughfare = thoroughfare
    this.street = street
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}
