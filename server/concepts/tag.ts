import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface TagDoc extends BaseDoc {
  author: ObjectId;
  item: ObjectId;
  name: string;
}

export default class TagConcept {
  public readonly tags = new DocCollection<TagDoc>("tags");

  async add(author: ObjectId, item: ObjectId, name: string) {
    await this.canCreate(author, item, name);
    const _id = await this.tags.createOne({ author, item, name });
    return { msg: `Item successfully tagged as ${name}!`, tag: await this.tags.readOne({ _id }) };
  }

  async getTags(query: Filter<TagDoc>) {
    const tags = await this.tags.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return tags;
  }

  async getTagsByAuthor(author: ObjectId) {
    return await this.getTags({ author });
  }

  async getItemsByTag(author: ObjectId, name: string) {
    return await this.getTags({ author, name });
  }

  async getItemTags(author: ObjectId, item: ObjectId) {
    return await this.getTags({ author, item });
  }

  async delete(tagID: ObjectId) {
    const tag = await this.tags.popOne({ _id: tagID });
    if (tag) {
      return { msg: "Tag successfully removed!", tag };
    } else {
      throw new NotFoundError("Tag not found under user!");
    }
  }

  async isAuthor(user: ObjectId, _id: ObjectId) {
    const tag = await this.tags.readOne({ _id });
    if (!tag) {
      throw new NotFoundError(`Tag ${_id} does not exist!`);
    }
    if (tag.author.toString() !== user.toString()) {
      throw new TagAuthorNotMatchError(user, _id);
    }
  }

  private async itemHasTag(author: ObjectId, item: ObjectId, name: string) {
    const tag = await this.tags.readOne({ author, item, name });
    return tag !== null;
  }

  private async canCreate(author: ObjectId, item: ObjectId, name: string) {
    if (!author) {
      //should be non-empty, pass in logged in user
      throw new BadValuesError("Username must be non-empty!");
    } else if (!item) {
      throw new BadValuesError("Item must be non-empty!");
    } else if (!name) {
      throw new BadValuesError("Tag name must be non-empty");
    }

    if (await this.itemHasTag(author, item, name)) {
      throw new NotAllowedError(`Item already has tag ${name}!`);
    }
  }
}

export class TagAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of the tagged post {1}!", author, _id);
  }
}
