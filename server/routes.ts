import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Canvas, Comments, Friend, Group, Post, PostLocation, Profile, Tag, User, UserLocation, WebSession } from "./app";
import { LocationDoc } from "./concepts/map";
import { PostDoc, PostOptions } from "./concepts/post";
import { ProfileDoc } from "./concepts/profile";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import Responses from "./responses";

class Routes {
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return await User.getUserByUsername(username);
  }

  @Router.get("/profiles")
  async getProfiles() {
    return await Profile.getProfiles();
  }

  @Router.get("/profiles/:username")
  async getProfile(username: string) {
    return await Profile.getProfileByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string, displayName: string, photo: string, latitude: string, longitude: string) {
    WebSession.isLoggedOut(session);
    const { user } = await User.create(username, password);
    const profile = await Profile.create(user!, displayName, photo);
    // ideally will have latitude and longitude from frontend default with geolocation api
    await UserLocation.register(user!._id, latitude, longitude);
    return profile;
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    const owner = await User.getUserById(user);
    await User.update(user, update);
    return await Profile.update(owner, { username: update.username });
  }

  @Router.patch("/profiles")
  async updateProfile(session: WebSessionDoc, update: Partial<ProfileDoc>) {
    const user = WebSession.getUser(session);
    const owner = await User.getUserById(user);
    return await Profile.update(owner, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    const owner = await User.getUserById(user);
    WebSession.end(session);
    await User.delete(user);
    await UserLocation.delete(user);
    await Canvas.deleteCanvasFilter({ user });
    return await Profile.delete(owner);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  async getPosts(session: WebSessionDoc, author?: string) {
    const user = WebSession.getUser(session);
    let posts;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      console.log(Friend.areFriends(user, id));
      if (!(await Friend.areFriends(user, id))) {
        const currUser = await User.getUserById(user);
        return { msg: `Cannot get posts, User ${currUser.username} and author ${author} are not friends` };
      }
      posts = await Post.getByAuthor(id);
    } else {
      const allPosts = await Post.getPosts({});
      const friendFilter = await Promise.all(
        allPosts.map(async (post) => {
          return await Friend.areFriends(user, post.author);
        }),
      );
      posts = allPosts.filter((_, index) => friendFilter[index]);
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, latitude: string, longitude: string, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content, options);
    const post = await Responses.post(created.post);
    // current throws error, but ideally will have latitude and longitude from frontend default with geolocation api
    await PostLocation.register(post!._id, latitude, longitude);
    return { msg: created.msg, post };
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    const post = await Post.getPost(_id);
    await PostLocation.delete(post._id);
    await Canvas.deleteCanvasFilter({ post: _id });
    return await Post.delete(_id);
  }

  @Router.get("/comments")
  async getComments(session: WebSessionDoc, author?: string, post?: ObjectId) {
    const user = WebSession.getUser(session);
    let comments;
    if (author) {
      const authorUser = await User.getUserByUsername(author);
      const id = authorUser._id;
      if (!(await Friend.areFriends(user, id))) {
        const currUser = await User.getUserById(user);
        return { msg: `Cannot get comments as User ${currUser.username} and Author ${authorUser.username} are not friends` };
      }
      comments = await Comments.getByAuthor(id);
    } else if (post) {
      const postData = await Post.getPost(post);
      if (!(await Friend.areFriends(user, postData.author))) {
        const currUser = await User.getUserById(user);
        const authorUser = await User.getUserById(postData.author);
        return { msg: `Cannot get comment under post as User ${currUser.username} and Author ${authorUser.username} are not friends` };
      }
      comments = await Comments.getByTarget(post);
    } else {
      const allComments = await Comments.getComments({});
      const friendFilter = await Promise.all(
        allComments.map(async (comment) => {
          return await Friend.areFriends(user, comment.author);
        }),
      );
      comments = allComments.filter((_, index) => friendFilter[index]);
    }
    return Responses.comments(comments);
  }

  @Router.post("/comments")
  async createComment(session: WebSessionDoc, target: ObjectId, message: string) {
    const user = WebSession.getUser(session);
    const created = await Comments.create(target, user, message);
    return { msg: created.msg, comment: await Responses.comment(created.comment) };
  }

  @Router.patch("/comments/:_id")
  async updateComment(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Comments.isAuthor(user, _id);
    return await Comments.update(_id, update);
  }

  @Router.delete("/comments/:_id")
  async deleteComment(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Comments.isAuthor(user, _id);
    return Comments.delete(_id);
  }

  @Router.get("/friends")
  async getFriends(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.idsToUsernames(await Friend.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: WebSessionDoc, friend: string) {
    const user = WebSession.getUser(session);
    const friendId = (await User.getUserByUsername(friend))._id;
    return await Friend.removeFriend(user, friendId);
  }

  @Router.get("/friend/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.friendRequests(await Friend.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.sendRequest(user, toId);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.removeRequest(user, toId);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.acceptRequest(fromId, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.rejectRequest(fromId, user);
  }

  @Router.get("/locations/users")
  async getUserLocations(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    const allLocations = await UserLocation.getLocations();
    const friendFilter = await Promise.all(
      allLocations.map(async (otherUser) => {
        return await Friend.areFriends(user, otherUser.target);
      }),
    );
    return allLocations.filter((_, index) => friendFilter[index]);
  }

  @Router.get("/locations/users/:username")
  async getUserLocation(session: WebSessionDoc, username: string) {
    const user = WebSession.getUser(session);
    const otherUser = await User.getUserByUsername(username);
    if (await Friend.areFriends(user, otherUser._id)) return await UserLocation.getLocations(otherUser._id);
    const currUser = await User.getUserById(user);
    return { msg: `Cannot view location, Users ${currUser.username} and ${otherUser.username} are not friends!` };
  }

  @Router.get("/locations/users/filter/:latitude/:longitude")
  async getUserTargets(session: WebSessionDoc, latitude: string, longitude: string) {
    const user = WebSession.getUser(session);
    const allTargets = await UserLocation.getTargets({ latitude, longitude });
    const friendFilter = await Promise.all(
      allTargets.map(async (otherUser) => {
        return await Friend.areFriends(user, otherUser.target);
      }),
    );
    return allTargets.filter((_, index) => friendFilter[index]);
  }

  @Router.patch("/locations/users")
  async updateUserLocation(session: WebSessionDoc, update: Partial<LocationDoc>) {
    const user = WebSession.getUser(session);
    return await UserLocation.update(user, update);
  }

  @Router.get("/locations/posts")
  async getPostLocations(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    const allPostLocations = await PostLocation.getLocations();
    const friendFilter = await Promise.all(
      allPostLocations.map(async (postLocation) => {
        return await Friend.areFriends(user, await Post.getPost(postLocation.target).then((x) => x.author));
      }),
    );

    return allPostLocations.filter((_, index) => friendFilter[index]);
  }

  @Router.get("/locations/posts/:_id")
  async getPostLocation(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    const post = await Post.getPosts({ _id }).then((response) => response[0]);
    if (await Friend.areFriends(user, post.author)) return await PostLocation.getLocations(post._id);
    const currUser = await User.getUserById(user);
    const authorUser = await User.getUserById(post.author);
    return { msg: `Cannot view post location, User ${currUser.username} and post author ${authorUser.username} are not friends!` };
  }

  @Router.get("/locations/posts/filter/:latitude/:longitude")
  async getPostTargets(session: WebSessionDoc, latitude: string, longitude: string) {
    const user = WebSession.getUser(session);
    const allTargets = await PostLocation.getTargets({ latitude, longitude });
    const friendFilter = await Promise.all(
      allTargets.map(async (postLocation) => {
        return await Friend.areFriends(user, await Post.getPost(postLocation.target).then((x) => x.author));
      }),
    );

    return allTargets.filter((_, index) => friendFilter[index]);
  }

  @Router.patch("/locations/posts/:id")
  async updatePostLocation(session: WebSessionDoc, id: ObjectId, update: Partial<LocationDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, id);
    const post = await Post.getPosts({ _id: id }).then((response) => response[0]);
    return await PostLocation.update(post._id, update);
  }

  @Router.post("/groups")
  async createGroup(session: WebSessionDoc, name: string) {
    const user = WebSession.getUser(session);
    return await Group.create(user, name);
  }

  @Router.delete("/groups")
  async deleteGroup(session: WebSessionDoc, id: ObjectId) {
    const user = WebSession.getUser(session);
    return await Group.delete(id, user);
  }

  @Router.get("/groups/:id")
  async getGroupInfo(id: ObjectId) {
    return await Group.getGroupInfo(id);
  }

  @Router.get("/groups/:id/posts")
  async getGroupPosts(session: WebSessionDoc, id: ObjectId) {
    const user = WebSession.getUser(session);
    await Group.isInGroup(id, user);
    const groupMembers = new Set((await Group.getGroupInfo(id).then((x) => x.members)).map((x) => x.toString()));
    const posts = (await Post.getPosts({})).filter((post) => groupMembers.has(post.author.toString()));
    return Responses.posts(posts);
  }

  @Router.get("/groups/:id/comments")
  async getGroupComments(session: WebSessionDoc, id: ObjectId) {
    const user = WebSession.getUser(session);
    await Group.isInGroup(id, user);
    const groupMembers = new Set((await Group.getGroupInfo(id).then((x) => x.members)).map((x) => x.toString()));
    const comments = (await Comments.getComments({})).filter((comment) => groupMembers.has(comment.author.toString()));
    return Responses.comments(comments);
  }

  @Router.get("/groups")
  async getGroupsOfUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Group.getGroupsOfUser(user);
  }

  @Router.patch("/groups")
  async updateGroup(session: WebSessionDoc, groupID: ObjectId, name: string) {
    const user = WebSession.getUser(session);
    await Group.isInGroup(groupID, user);
    return await Group.updateGroupName(groupID, name);
  }

  @Router.patch("/groups/ownership")
  async updateGroupOwnership(session: WebSessionDoc, groupID: ObjectId, member: string) {
    const user = WebSession.getUser(session);
    const maybeMember = await User.getUserByUsername(member);
    return await Group.transferOwnership(groupID, user, maybeMember._id);
  }

  @Router.patch("/groups/members")
  async addMember(session: WebSessionDoc, groupID: ObjectId, username: string) {
    const user = WebSession.getUser(session);
    const memberID = (await User.getUserByUsername(username))._id;
    await Group.isInGroup(groupID, user);
    if (await Friend.areFriends(user, memberID)) return await Group.addMember(groupID, memberID);
    const currUser = await User.getUserById(user);
    return { msg: `Cannot add member to group, Users ${currUser.username} and ${username} are not friends!` };
  }

  @Router.delete("/groups/members")
  async removeMember(session: WebSessionDoc, groupID: ObjectId, username: string) {
    const user = WebSession.getUser(session);
    const memberID = (await User.getUserByUsername(username))._id;
    await Group.isInGroup(groupID, user);
    return await Group.removeMember(groupID, memberID);
  }

  @Router.post("/tags")
  async addTag(session: WebSessionDoc, postID: ObjectId, tagName: string) {
    const user = WebSession.getUser(session);
    const post = await Post.getPost(postID);
    if (await Friend.areFriends(user, post.author)) return await Tag.add(user, postID, tagName);
    const currUser = await User.getUserById(user);
    return { msg: `Cannot add tag to post, User ${currUser.username} and post author ${post.author} are not friends!` };
  }

  @Router.get("/tags")
  async getTags(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Tag.getTagsByAuthor(user);
  }

  @Router.get("/tags/:username/:name")
  async getItemsUnderTag(session: WebSessionDoc, username: string, name: string) {
    const user = WebSession.getUser(session);
    const author = await User.getUserByUsername(username);
    if (await Friend.areFriends(user, author._id)) return await Tag.getItemsByTag(author._id, name);
    const currUser = await User.getUserById(user);
    return { msg: `Cannot view items under tag ${name}, User ${currUser.username} and author ${author.username} are not friends!` };
  }

  @Router.get("/tags/:id")
  async getTagsOfItem(session: WebSessionDoc, id: ObjectId) {
    const user = WebSession.getUser(session);
    return await Tag.getItemTags(user, id);
  }

  @Router.delete("/tags")
  async deleteItemTag(session: WebSessionDoc, tagID: ObjectId) {
    const user = WebSession.getUser(session);
    await Tag.isAuthor(user, tagID);
    return await Tag.delete(tagID);
  }

  @Router.get("/canvas")
  async viewCanvas() {
    // likely won't be used, as users should be able to see their own canvas
    return await Canvas.getCanvas();
  }

  @Router.get("/canvas/:id")
  async viewUserCanvas(id: ObjectId) {
    const user = await User.getUserById(id);
    return await Canvas.getCanvas(user._id);
  }

  @Router.post("/canvas")
  async addToCanvas(session: WebSessionDoc, postID: ObjectId) {
    const userID = WebSession.getUser(session);
    const user = await User.getUserById(userID);
    await Post.getPost(postID);
    return await Canvas.addPost(user, postID);
  }

  @Router.delete("/canvas")
  async removeFromCanvas(session: WebSessionDoc, postID: ObjectId) {
    const userID = WebSession.getUser(session);
    const user = await User.getUserById(userID);
    await Post.getPost(postID);
    return await Canvas.removePost(user, postID);
  }
}

export default getExpressRouter(new Routes());
