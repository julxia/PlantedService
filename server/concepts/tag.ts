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
    return { msg: "Item successfully tagged!", post: await this.tags.readOne({ _id }) };
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

  async delete(author: ObjectId, item: ObjectId, name: string) {
    const tag = await this.tags.popOne({ author, item, name });
    if (tag) {
      return { msg: "Tag successfully removed!", tag };
    } else {
      throw new TagNotFoundError(name);
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

export class TagNotFoundError extends NotFoundError {
  constructor(public readonly tag: string) {
    super("The tag #{0} does not exist!", tag);
  }
}
