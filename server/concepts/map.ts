import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError } from "./errors";
import { PostDoc } from "./post";
import { UserDoc } from "./user";

type TargetType = UserDoc | PostDoc; //might need to omit password

export interface LocationDoc extends BaseDoc {
  target: ObjectId;
  latitude: string;
  longitude: string;
}

export default class MapConcept<Target extends TargetType> {
  public readonly locations: DocCollection<LocationDoc>;

  constructor(name: string) {
    this.locations = new DocCollection<LocationDoc>(name);
  }

  async register(target: Target, latitude: string, longitude: string) {
    await this.canCreate(target, latitude, longitude);
    const _id = await this.locations.createOne({ target: target._id, latitude, longitude });
    return { msg: `Target registered at (${latitude}, ${longitude}) successfully!`, location: await this.locations.readOne({ _id })! };
  }

  async getTargets(query: Filter<LocationDoc>) {
    const locations = await this.locations.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return locations;
  }

  async getAllByLocation(latitude: string, longitude: string) {
    return await this.getTargets({ latitude, longitude });
  }

  async getTargetLocation(target: Target) {
    return await this.getTargets({ target: target._id });
  }

  async update(target: Target, update: Partial<LocationDoc>) {
    this.sanitizeUpdate(update);
    const _id = await this.getTargetLocation(target);
    await this.locations.updateOne({ _id }, update);
    return { msg: "Location successfully updated!" };
  }

  async delete(target: Target) {
    await this.locations.deleteOne({ target: target._id });
    return { msg: "Post deleted successfully!" };
  }

  private sanitizeUpdate(update: Partial<LocationDoc>) {
    // Make sure the update cannot change the target id.
    const allowedUpdates = ["latitude", "longitude"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }

  private async canCreate(target: Target, latitude: string, longitude: string) {
    if (!latitude || !longitude) {
      throw new BadValuesError("Latitude and longitude must be given!");
    }
    await this.isTargetUnique(target);
  }

  private async isTargetUnique(target: Target) {
    if (await this.locations.readOne({ id: target._id })) {
      throw new NotAllowedError(`Location for target already exists!`);
    }
  }
}
