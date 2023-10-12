import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";
import { UserDoc } from "./user";

export interface ProfileDoc extends BaseDoc {
  username: string;
  displayName: string;
  photo: string; // photo endpoint
}

type UserType = Omit<UserDoc, "password">;

export default class ProfileConcept<User extends UserType> {
  public readonly profiles = new DocCollection<ProfileDoc>("profiles");

  async create(owner: User, displayName: string, photo: string) {
    await this.canCreate(owner);
    const _id = await this.profiles.createOne({ username: owner.username, displayName, photo });
    return { msg: "User profile created successfully!", profile: await this.profiles.readOne({ _id }) };
  }

  async getProfileByUsername(username: string) {
    const profile = await this.profiles.readOne({ username });
    if (profile === null) {
      throw new NotFoundError(`Profile not found!`);
    }
    return profile;
  }

  async getProfiles(username?: string) {
    // If username is undefined, return all profiles by applying empty filter
    const filter = username ? { username } : {};
    const users = await this.profiles.readMany(filter);
    return users;
  }

  async update(owner: User, update: Partial<ProfileDoc>) {
    // username should only be updated if updated by call to UserConcept
    const _id = await this.getProfileByUsername(owner.username).then((response) => response._id);
    await this.profiles.updateOne({ _id }, update);
    return { msg: "User Profile updated successfully!" };
  }

  async delete(owner: User) {
    const _id = await this.getProfileByUsername(owner.username).then((response) => response._id);
    await this.profiles.deleteOne({ _id });
    return { msg: "User Profile deleted!" };
  }

  async profileExists(_id: ObjectId) {
    const maybeProfile = await this.profiles.readOne({ _id });
    if (maybeProfile === null) {
      throw new NotFoundError(`Profile not found!`);
    }
  }

  private async canCreate(user: User) {
    if (!user) {
      throw new BadValuesError("The user must exist to create a profile!");
    }
    await this.doesUsernameExist(user.username);
  }

  private async doesUsernameExist(username: string) {
    if (await this.profiles.readOne({ username })) {
      throw new NotAllowedError(`Profile with username ${username} already exists!`);
    }
  }
}
