import type { Ride, RideId, UserId } from "../ride"

export interface RideRepository {
  save(ride: Ride): Promise<void>
  findById(id: RideId): Promise<Ride | null>
  findActive(): Promise<Ride[]>
  findActiveByMember(userId: UserId): Promise<Ride[]>
  update(ride: Ride): Promise<void>
  addMember(rideId: RideId, userId: UserId): Promise<void>
  removeMember(rideId: RideId, userId: UserId): Promise<void>
  getMembers(rideId: RideId): Promise<UserId[]>
}
