import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";
import { UserDoc } from "./user";

export interface CanvasDoc extends BaseDoc {
  user: ObjectId;
  post: ObjectId;
}

type UserType = Omit<UserDoc, "password">;

export default class CanvasConcept<User extends UserType> {
  public readonly canvas = new DocCollection<CanvasDoc>("canvas");

  async deleteCanvasFilter(filter: Partial<CanvasDoc>) {
    await this.canvas.deleteMany(filter);
  }

  async addPost(user: User, post: ObjectId) {
    const existing = await this.userHasPost(user, post);
    if (!existing) {
      const _id = await this.canvas.createOne({ user: user._id, post });
      return { msg: `Post was successfully added to ${user.username}'s canvas`, post: await this.canvas.readOne({ _id }) };
    }
    throw new NotAllowedError(`Post already exists on user ${user.username}'s canvas`);
  }

  async removePost(user: User, post: ObjectId) {
    const existing = await this.userHasPost(user, post);
    if (existing) {
      const removed = await this.canvas.popOne({ user: user._id, post });
      return { msg: `Post was successfully removed from ${user.username}'s canvas`, removed };
    }
    throw new NotAllowedError(`Post not on user ${user.username}'s canvas`);
  }

  async getCanvas(id?: ObjectId) {
    const filter = id ? { user: id } : {};
    const users = await this.canvas.readMany(filter);
    return users;
  }

  private async userHasPost(user: User, post: ObjectId) {
    const canvas = await this.canvas.readOne({ user: user._id, post });
    return canvas !== null;
  }
}
