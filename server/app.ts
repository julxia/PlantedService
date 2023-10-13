import CanvasConcept from "./concepts/canvas";
import CommentsConcept from "./concepts/comments";
import FriendConcept from "./concepts/friend";
import GroupConcept from "./concepts/group";
import MapConcept from "./concepts/map";
import PostConcept, { PostDoc } from "./concepts/post";
import ProfileConcept from "./concepts/profile";
import TagConcept from "./concepts/tag";
import UserConcept, { UserDoc } from "./concepts/user";
import WebSessionConcept from "./concepts/websession";

// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const Post = new PostConcept();
export const Friend = new FriendConcept();

export const Profile = new ProfileConcept();

export const UserLocation = new MapConcept<UserDoc>("userLocations");
export const PostLocation = new MapConcept<PostDoc>("postLocations");

export const Canvas = new CanvasConcept();

export const Comments = new CommentsConcept();

export const Group = new GroupConcept();

export const Tag = new TagConcept();
