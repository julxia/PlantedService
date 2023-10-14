import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface LocationDoc extends BaseDoc {
  target: ObjectId;
  latitude: string;
  longitude: string;
}

export default class MapConcept {
  public readonly locations: DocCollection<LocationDoc>;

  constructor(name: string) {
    this.locations = new DocCollection<LocationDoc>(name);
  }

  async register(target: ObjectId, latitude: string, longitude: string) {
    await this.canCreate(target, latitude, longitude);
    const _id = await this.locations.createOne({ target, latitude, longitude });
    return { msg: `Target registered at (${latitude}, ${longitude}) successfully!`, location: await this.locations.readOne({ _id })! };
  }

  async getTargets(filter: Partial<LocationDoc>) {
    const locations = await this.locations.readMany(filter);
    return locations;
  }

  async getLocations(target?: ObjectId) {
    // If target is undefined, return locations of everyone
    const filter = target ? { target } : {};
    const locations = await this.locations.readMany(filter);
    return locations;
  }

  async update(target: ObjectId, update: Partial<LocationDoc>) {
    this.sanitizeUpdate(update);
    await this.targetExists(target);
    await this.locations.updateOne({ target }, update);
    const result = await this.locations.readOne({ target })!;
    return { msg: `Location updated to (${result?.latitude}, ${result?.longitude}) successfully!` };
  }

  async delete(target: ObjectId) {
    await this.locations.deleteOne({ target });
    return { msg: "User location deleted successfully!" };
  }

  async targetExists(target: ObjectId) {
    const maybeTarget = await this.locations.readOne({ target });
    if (maybeTarget === null) {
      throw new NotFoundError(`Target not found!`);
    }
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

  private async canCreate(target: ObjectId, latitude: string, longitude: string) {
    if (!latitude || !longitude) {
      throw new BadValuesError("Latitude and longitude must be given!");
    }
    await this.isTargetUnique(target);
  }

  private async isTargetUnique(target: ObjectId) {
    if (await this.locations.readOne({ id: target })) {
      throw new NotAllowedError(`Location for target already exists!`);
    }
  }
}
