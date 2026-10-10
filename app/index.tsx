import { Redirect } from "expo-router";

import { useSession } from "../lib/session";

// Entry route: the root layout waits for the session before rendering, so
// here it's already known.
export default function Index() {
  const { session } = useSession();
  return <Redirect href={session ? "/home" : "/auth"} />;
}
