type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type InputTag = "input" | "textarea" | "json";
type Field = InputTag | { [key: string]: Field };
type Fields = Record<string, Field>;

type operation = {
  name: string;
  endpoint: string;
  method: HttpMethod;
  fields: Fields;
};

const operations: operation[] = [
  {
    name: "Get Session User (logged in user)",
    endpoint: "/api/session",
    method: "GET",
    fields: {},
  },
  {
    name: "Create User",
    endpoint: "/api/users",
    method: "POST",
    fields: { username: "input", password: "input", displayName: "input", photo: "input", latitude: "input", longitude: "input" },
  },
  {
    name: "Login",
    endpoint: "/api/login",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Logout",
    endpoint: "/api/logout",
    method: "POST",
    fields: {},
  },
  {
    name: "Update User",
    endpoint: "/api/users",
    method: "PATCH",
    fields: { update: { username: "input", password: "input" } },
  },
  {
    name: "Update Profile",
    endpoint: "/api/profiles",
    method: "PATCH",
    fields: { update: { displayName: "input", photo: "input" } },
  },
  {
    name: "Update User Location",
    endpoint: "/api/locations/users",
    method: "PATCH",
    fields: { update: { latitude: "input", longitude: "input" } },
  },
  {
    name: "Delete User",
    endpoint: "/api/users",
    method: "DELETE",
    fields: {},
  },
  {
    name: "Get Users (empty for all)",
    endpoint: "/api/users/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Get Profiles (empty for all)",
    endpoint: "/api/profiles/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Get User Locations (empty for all)",
    endpoint: "/api/locations/users/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Get Users @ Location",
    endpoint: "/api/locations/users/filter/:latitude/:longitude",
    method: "GET",
    fields: { latitude: "input", longitude: "input" },
  },
  {
    name: "Get Friends",
    endpoint: "api/friends",
    method: "GET",
    fields: {},
  },
  {
    name: "Remove Friend",
    endpoint: "api/friends/:friend",
    method: "DELETE",
    fields: { friend: "input" },
  },
  {
    name: "Get Friend Requests",
    endpoint: "api/friend/requests",
    method: "GET",
    fields: {},
  },
  {
    name: "Send Friend Request To",
    endpoint: "api/friend/requests/:to",
    method: "POST",
    fields: { to: "input" },
  },
  {
    name: "Remove Friend Request To",
    endpoint: "api/friend/requests/:to",
    method: "DELETE",
    fields: { to: "input" },
  },
  {
    name: "Accept Friend Request From",
    endpoint: "api/friend/accept/:from",
    method: "PUT",
    fields: { from: "input" },
  },
  {
    name: "Reject Friend Request From",
    endpoint: "api/friend/reject/:from",
    method: "PUT",
    fields: { from: "input" },
  },
  {
    name: "Get Posts (empty for all)",
    endpoint: "/api/posts",
    method: "GET",
    fields: { author: "input" },
  },
  {
    name: "Get Post Locations (empty for all)",
    endpoint: "/api/locations/posts/:id",
    method: "GET",
    fields: { id: "input" },
  },
  {
    name: "Get Posts @ Location",
    endpoint: "/api/locations/posts/filter/:latitude/:longitude",
    method: "GET",
    fields: { latitude: "input", longitude: "input" },
  },
  {
    name: "Create Post",
    endpoint: "/api/posts",
    method: "POST",
    fields: { content: "input", latitude: "input", longitude: "input" },
  },
  {
    name: "Update Post",
    endpoint: "/api/posts/:id",
    method: "PATCH",
    fields: { id: "input", update: { content: "input", options: { backgroundColor: "input" } } },
  },
  {
    name: "Update Post Location",
    endpoint: "/api/locations/posts/:id",
    method: "PATCH",
    fields: { id: "input", update: { latitude: "input", longitude: "input" } },
  },
  {
    name: "Delete Post",
    endpoint: "/api/posts/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Get Comments (empty for all)",
    endpoint: "/api/comments",
    method: "GET",
    fields: { author: "input", post: "input" },
  },
  {
    name: "Create Comment",
    endpoint: "/api/comments",
    method: "POST",
    fields: { target: "input", message: "input" },
  },
  {
    name: "Update Comment",
    endpoint: "/api/comments/:id",
    method: "PATCH",
    fields: { id: "input", update: { message: "input" } },
  },
  {
    name: "Delete Comment",
    endpoint: "/api/comments/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Create Group",
    endpoint: "/api/groups",
    method: "POST",
    fields: { name: "input" },
  },
  {
    name: "Get All Groups of User",
    endpoint: "/api/groups",
    method: "GET",
    fields: {},
  },
  {
    name: "Delete Group",
    endpoint: "/api/groups",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Get Group Info",
    endpoint: "/api/groups/:id",
    method: "GET",
    fields: { id: "input" },
  },
  {
    name: "Get Posts Under Group",
    endpoint: "/api/groups/:id/posts",
    method: "GET",
    fields: { id: "input" },
  },
  {
    name: "Update Group Name",
    endpoint: "/api/groups",
    method: "PATCH",
    fields: { groupID: "input", name: "input" },
  },
  {
    name: "Transfer ownership",
    endpoint: "/api/groups/ownership",
    method: "PATCH",
    fields: { groupID: "input", member: "input" },
  },
  {
    name: "Add member to group",
    endpoint: "/api/groups/members",
    method: "PATCH",
    fields: { groupID: "input", username: "input" },
  },
  {
    name: "Remove member from group",
    endpoint: "/api/groups/members",
    method: "DELETE",
    fields: { groupID: "input", username: "input" },
  },
  {
    name: "Add Tag to Post",
    endpoint: "/api/tags",
    method: "POST",
    fields: { postID: "input", tagName: "input" },
  },
  {
    name: "Get all tags of user",
    endpoint: "/api/tags",
    method: "GET",
    fields: {},
  },
  {
    name: "Get items under tag",
    endpoint: "/api/tags/:username/:name",
    method: "GET",
    fields: { username: "input", name: "input" },
  },
  {
    name: "Get tags of a post",
    endpoint: "/api/tags/:id",
    method: "GET",
    fields: { id: "input" },
  },
  {
    name: "Delete Tag",
    endpoint: "/api/tags",
    method: "DELETE",
    fields: { tagID: "input" },
  },
  {
    name: "View canvas (empty for all)",
    endpoint: "/api/canvas/:id",
    method: "GET",
    fields: { id: "input" },
  },
  {
    name: "Add to canvas",
    endpoint: "/api/canvas",
    method: "POST",
    fields: { postID: "input" },
  },
  {
    name: "Remove from canvas",
    endpoint: "/api/canvas",
    method: "DELETE",
    fields: { postID: "input" },
  },
];

// Do not edit below here.
// If you are interested in how this works, feel free to ask on forum!

function updateResponse(code: string, response: string) {
  document.querySelector("#status-code")!.innerHTML = code;
  document.querySelector("#response-text")!.innerHTML = response;
}

async function request(method: HttpMethod, endpoint: string, params?: unknown) {
  try {
    if (method === "GET" && params) {
      endpoint += "?" + new URLSearchParams(params as Record<string, string>).toString();
      params = undefined;
    }

    const res = fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: params ? JSON.stringify(params) : undefined,
    });

    return {
      $statusCode: (await res).status,
      $response: await (await res).json(),
    };
  } catch (e) {
    console.log(e);
    return {
      $statusCode: "???",
      $response: { error: "Something went wrong, check your console log.", details: e },
    };
  }
}

function fieldsToHtml(fields: Record<string, Field>, indent = 0, prefix = ""): string {
  return Object.entries(fields)
    .map(([name, tag]) => {
      const htmlTag = tag === "json" ? "textarea" : tag;
      return `
        <div class="field" style="margin-left: ${indent}px">
          <label>${name}:
          ${typeof tag === "string" ? `<${htmlTag} name="${prefix}${name}"></${htmlTag}>` : fieldsToHtml(tag, indent + 10, prefix + name + ".")}
          </label>
        </div>`;
    })
    .join("");
}

function getHtmlOperations() {
  return operations.map((operation) => {
    return `<li class="operation">
      <h3>${operation.name}</h3>
      <form class="operation-form">
        <input type="hidden" name="$endpoint" value="${operation.endpoint}" />
        <input type="hidden" name="$method" value="${operation.method}" />
        ${fieldsToHtml(operation.fields)}
        <button type="submit">Submit</button>
      </form>
    </li>`;
  });
}

function prefixedRecordIntoObject(record: Record<string, string>) {
  const obj: any = {}; // eslint-disable-line
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    const keys = key.split(".");
    const lastKey = keys.pop()!;
    let currentObj = obj;
    for (const key of keys) {
      if (!currentObj[key]) {
        currentObj[key] = {};
      }
      currentObj = currentObj[key];
    }
    currentObj[lastKey] = value;
  }
  return obj;
}

async function submitEventHandler(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const { $method, $endpoint, ...reqData } = Object.fromEntries(new FormData(form));

  // Replace :param with the actual value.
  const endpoint = ($endpoint as string).replace(/:(\w+)/g, (_, key) => {
    const param = reqData[key] as string;
    delete reqData[key];
    return param;
  });

  const op = operations.find((op) => op.endpoint === $endpoint && op.method === $method);
  const pairs = Object.entries(reqData);
  for (const [key, val] of pairs) {
    if (val === "") {
      delete reqData[key];
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const type = key.split(".").reduce((obj, key) => obj[key], op?.fields as any);
    if (type === "json") {
      reqData[key] = JSON.parse(val as string);
    }
  }

  const data = prefixedRecordIntoObject(reqData as Record<string, string>);

  updateResponse("", "Loading...");
  const response = await request($method as HttpMethod, endpoint as string, Object.keys(data).length > 0 ? data : undefined);
  updateResponse(response.$statusCode.toString(), JSON.stringify(response.$response, null, 2));
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#operations-list")!.innerHTML = getHtmlOperations().join("");
  document.querySelectorAll(".operation-form").forEach((form) => form.addEventListener("submit", submitEventHandler));
});
