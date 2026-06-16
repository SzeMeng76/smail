import { Outlet, redirect, useLocation } from "react-router";
import { getSession } from "~/.server/session";
import { Navigation } from "~/components/Navigation";
import { Footer } from "~/components/Footer";
import type { Route } from "./+types/layout";

export async function loader({ request, context }: Route.LoaderArgs) {
	const adminPassword = context.cloudflare.env.ADMIN_PASSWORD;
	// 未设置 ADMIN_PASSWORD 时不启用登录保护
	if (!adminPassword) return null;

	const session = await getSession(request.headers.get("Cookie"));
	if (!session.get("isLoggedIn")) {
		throw redirect("/login");
	}
	return null;
}

export default function Layout() {
	const location = useLocation();

	return (
		<>
			<Navigation currentPath={location.pathname} />
			<Outlet />
			<Footer />
		</>
	);
}
