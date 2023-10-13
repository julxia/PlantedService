import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface GroupDoc extends BaseDoc {
  groupID: ObjectId; // group id will come from initial object id made by creator
  name?: string; // only the creator will hold the group name
  member: ObjectId;
}

export interface GroupItemsDoc extends BaseDoc {
  group: ObjectId;
  post: ObjectId;
}

export default class GroupConcept {
  public readonly groups = new DocCollection<GroupDoc>("groups");
  public readonly groupItems = new DocCollection<GroupItemsDoc>("groupItems");

  async create(creator: ObjectId, name: string) {
    const _id = await this.groups.createOne({ name, member: creator });
    await this.groups.updateOne({ _id }, { groupID: _id }); // unique id so that name does not need to be unique
    return { msg: `Group ${name} successfully created!`, group: await this.groups.readOne({ _id }) };
  }

  async getGroupCreator(groupID: ObjectId) {
    const creator = await this.groups.readOne({ _id: groupID });
    if (!creator) {
      throw new NotFoundError(`Group does not exist!`);
    }
    return creator;
  }

  async getGroupMembers(groupID: ObjectId) {
    const creator = await this.getGroupCreator(groupID);
    const group = await this.groups.readMany({ groupID: creator._id });
    return group;
  }

  async updateGroupName(groupID: ObjectId, name: string) {
    const creator = await this.getGroupCreator(groupID);
    await this.groups.updateOne(creator, { name });
    return { msg: `Group ${name} was updated successfully!`, creator: creator };
  }

  async addMember(groupID: ObjectId, member: ObjectId) {
    const creator = await this.getGroupCreator(groupID);
    const _id = await this.groups.createOne({ groupID, member });
    return { msg: `User was successfully added to ${creator.name}`, post: await this.groups.readOne({ _id }) };
  }

  async removeMember(groupID: ObjectId, member: ObjectId) {
    const creator = await this.getGroupCreator(groupID);
    if (member === creator.member) {
      // creator can not leave group
      throw new NotAllowedError(`Creator cannot leave group`);
    } else {
      const groupMember = await this.groups.popOne({ groupID, member });
      if (groupMember) {
        return { msg: `User successfully left group ${creator.name}!`, groupMember };
      } else {
        throw new GroupMemberNotFound(creator.name!);
      }
    }
  }

  async addPost(groupID: ObjectId, post: ObjectId) {
    const creator = await this.getGroupCreator(groupID);
    const _id = await this.groupItems.createOne({ group: groupID, post });
    return { msg: `Post was successfully added to ${creator.name}`, post: await this.groupItems.readOne({ _id }) };
  }

  async removePost(groupID: ObjectId, post: ObjectId) {
    const creator = await this.getGroupCreator(groupID);
    const removed = await this.groupItems.popOne({ group: groupID, post });
    return { msg: `Post was successfully removed from ${creator.name}`, post: removed };
  }

  async getPosts(groupID: ObjectId) {
    const creator = await this.getGroupCreator(groupID);
    const groupItems = await this.groupItems.readMany({ groupID: creator._id });
    return groupItems;
  }
}

export class GroupMemberNotFound extends NotFoundError {
  constructor(public readonly name: string) {
    super(`User was not found in group ${name}`);
  }
}
