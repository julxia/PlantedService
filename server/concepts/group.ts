import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotFoundError } from "./errors";

export interface GroupDoc extends BaseDoc {
  name: string;
  members: Set<ObjectId>;
  posts: Set<ObjectId>;
}

export default class GroupConcept {
  public readonly groups = new DocCollection<GroupDoc>("groups");

  async create(creator: ObjectId, name: string, members?: Set<ObjectId>) {
    const _id = await this.groups.createOne({ name, members: new Set([creator, ...(members ?? [])]) });
    return { msg: "Group successfully created!", post: await this.groups.readOne({ _id }) };
  }

  async updateGroup(_id: ObjectId, update: Partial<GroupDoc>) {
    await this.groups.updateOne({ _id }, update);
    return { msg: `Group name was updated to ${name} successfully!` };
  }

  async getGroup(_id: ObjectId) {
    await this.groupExists(_id);
    const group = await this.groups.readOne({ _id });
    return group;
  }

  async getMembers(_id: ObjectId) {
    const group = await this.getGroup(_id);
    return group?.members;
  }

  async getPosts(_id: ObjectId) {
    const group = await this.getGroup(_id);
    return group?.posts;
  }

  async addUser(_id: ObjectId, user: ObjectId) {
    const group = await this.groups.readOne({ _id });
    const currentMembers = group?.members ?? new Set();

    if (currentMembers.has(user)) {
      return { msg: `User is already in ${group?.name}!` };
    }
    currentMembers.add(user);
    await this.groups.updateOne({ _id }, { members: currentMembers });
    return { msg: `User was added to group successfully!` };
  }

  async removeUser(_id: ObjectId, user: ObjectId) {
    const group = await this.groups.readOne({ _id });
    const currentMembers = group?.members ?? new Set();

    if (!currentMembers.has(user)) {
      return { msg: `User was not found in ${group?.name}!` };
    }
    currentMembers.delete(user);
    await this.groups.updateOne({ _id }, { members: currentMembers });
    return { msg: `User was removed from group successfully!` };
  }

  async addPost(_id: ObjectId, post: ObjectId) {
    const group = await this.groups.readOne({ _id });
    const currentPosts = group?.posts ?? new Set();

    if (currentPosts.has(post)) {
      return { msg: `Post is already in ${group?.name}!` };
    }
    currentPosts.add(post);
    await this.groups.updateOne({ _id }, { posts: currentPosts });
    return { msg: `Post was added to group successfully!` };
  }

  async removePost(_id: ObjectId, post: ObjectId) {
    const group = await this.groups.readOne({ _id });
    const currentPosts = group?.posts ?? new Set();

    if (!currentPosts.has(post)) {
      return { msg: `Post was not found in ${group?.name}!` };
    }
    currentPosts.delete(post);
    await this.groups.updateOne({ _id }, { posts: currentPosts });
    return { msg: `Post was removed from group successfully!` };
  }

  async groupExists(_id: ObjectId) {
    const maybeGroup = await this.groups.readOne({ _id });
    if (maybeGroup === null) {
      throw new NotFoundError(`Group was not found!`);
    }
  }
}
