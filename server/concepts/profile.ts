import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface ProfileDoc extends BaseDoc {
  username: string;
  displayName: string;
  photo: string; // photo endpoint
}

export default class ProfileConcept {
  public readonly profiles = new DocCollection<ProfileDoc>("profiles");

  async create(username: string, displayName: string, photo: string) {
    await this.canCreate(username);
    const _id = await this.profiles.createOne({ username, displayName, photo });
    return { msg: "Profile created successfully!", user: await this.profiles.readOne({ _id }) };
  }

  //   async getProfileById(_id: ObjectId) {
  //     const profile = await this.profiles.readOne({ _id });
  //     if (profile === null) {
  //       throw new NotFoundError(`Profile not found!`);
  //     }
  //     return profile;
  //   }

  async getProfiles(username?: string) {
    // If username is undefined, return all profiles by applying empty filter
    const filter = username ? { username } : {};
    const users = await this.profiles.readMany(filter);
    return users;
  }

  async update(_id: ObjectId, update: Partial<ProfileDoc>) {
    await this.profiles.updateOne({ _id }, update);
    return { msg: "Profile updated successfully!" };
  }

  async profileExists(_id: ObjectId) {
    const maybeProfile = await this.profiles.readOne({ _id });
    if (maybeProfile === null) {
      throw new NotFoundError(`Profile not found!`);
    }
  }

  private async canCreate(username: string) {
    if (!username) {
      throw new BadValuesError("Username must be non-empty!");
    }
    await this.isUsernameUnique(username);
  }

  private async isUsernameUnique(username: string) {
    if (await this.profiles.readOne({ username })) {
      throw new NotAllowedError(`Profile with username ${username} already exists!`);
    }
  }
}
