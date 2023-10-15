import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface GroupDoc extends BaseDoc {
  groupID: ObjectId; // group id will come from initial object id made by creator
  name?: string; // only the creator will hold the group name
  member: ObjectId;
}

export default class GroupConcept {
  public readonly groups = new DocCollection<GroupDoc>("groups");

  async create(creator: ObjectId, name: string) {
    const _id = await this.groups.createOne({ name, member: creator });
    await this.groups.updateOne({ _id }, { groupID: _id }); // unique id so that name does not need to be unique
    return { msg: `Group ${name} successfully created!`, group: await this.groups.readOne({ _id }) };
  }

  async delete(groupID: ObjectId, user: ObjectId) {
    const originalNode = await this.isInGroup(groupID, user);
    await this.groups.deleteMany({ groupID: new ObjectId(groupID) });
    return { msg: `Group ${originalNode.name} was successfully deleted!` };
  }

  async getGroupInfo(groupID: ObjectId) {
    const originalNode = await this.groups.readOne({ _id: groupID });
    if (!originalNode || !originalNode.name) {
      throw new NotFoundError(`Group does not exist!`);
    }
    const members = await this.groups.readMany({ groupID: originalNode.groupID });
    return { groupID: originalNode.groupID, groupName: originalNode.name, creator: originalNode.member, members: members.map((info) => info.member) };
  }

  async getGroupsOfUser(user: ObjectId) {
    return await this.groups.readMany({ member: user });
  }

  async isInGroup(groupID: ObjectId, member: ObjectId) {
    const originalNode = await this.groups.readOne({ _id: groupID });
    const maybeMember = await this.groups.readOne({ groupID: new ObjectId(groupID), member });
    if (!originalNode || !originalNode.name) {
      throw new NotFoundError(`Group does not exist!`);
    } else if (!maybeMember) {
      throw new NotAllowedError(`User is not in group ${originalNode.name}!`);
    }
    return originalNode;
  }

  async updateGroupName(groupID: ObjectId, name: string) {
    const originalNode = await this.getGroupInfo(groupID);
    await this.groups.updateOne({ _id: originalNode.groupID }, { name });
    return { msg: `Group ${name} was updated successfully!`, groupInfo: await this.getGroupInfo(groupID) };
  }

  async addMember(groupID: ObjectId, member: ObjectId) {
    const creator = await this.getGroupInfo(groupID);
    await this.groups.createOne({ groupID: new ObjectId(groupID), member });
    return { msg: `User was successfully added to ${creator.groupName}`, groupInfo: await this.getGroupInfo(groupID) };
  }

  async transferOwnership(groupID: ObjectId, owner: ObjectId, member: ObjectId) {
    if (owner.toString() === member.toString()) {
      throw new NotAllowedError("Ownership cannot be transferred ot same user");
    }

    const group = await this.getGroupInfo(groupID);
    const members = new Set(group.members.map((id) => id.toString()));
    const memberString = member.toString();

    if (owner.toString() !== group.creator.toString()) {
      throw new NotAllowedError("Only the owner can transfer ownership");
    } else if (memberString === group.creator.toString()) {
      throw new NotAllowedError(`User is already the owner of group ${group.groupName}`);
    } else if (!members.has(memberString)) {
      throw new NotAllowedError(`User is not in group ${group.groupName}`);
    }

    await this.groups.updateOne({ groupID: group.groupID, member }, { member: group.creator });
    await this.groups.updateOne({ _id: group.groupID }, { member });
    return { msg: `${group.groupName}: Ownership was successfully transferred`, groupInfo: await this.getGroupInfo(groupID) };
  }

  async removeMember(groupID: ObjectId, member: ObjectId) {
    const originalNode = await this.getGroupInfo(groupID);
    if (member.toString() === originalNode.creator.toString()) {
      // Owner can not leave group
      throw new NotAllowedError(`Owner cannot leave group, must transfer ownership first.`);
    } else {
      const groupMember = await this.groups.popOne({ groupID: new ObjectId(groupID), member });
      if (groupMember) {
        return { msg: `User successfully left group ${originalNode.groupName}!`, groupInfo: await this.getGroupInfo(groupID) };
      } else {
        throw new GroupMemberNotFound(originalNode.groupName!);
      }
    }
  }
}

export class GroupMemberNotFound extends NotFoundError {
  constructor(public readonly name: string) {
    super(`User was not found in group ${name}`);
  }
}
