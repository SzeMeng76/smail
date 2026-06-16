import { data, Form, redirect } from "react-router";
import { commitSession, getSession } from "~/.server/session";
import type { Route } from "./+types/login";

export function meta() {
	return [{ title: "登录" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const session = await getSession(request.headers.get("Cookie"));
	if (session.get("isLoggedIn")) {
		return redirect("/");
	}
	return null;
}

export async function action({ request, context }: Route.ActionArgs) {
	const session = await getSession(request.headers.get("Cookie"));
	const formData = await request.formData();
	const password = formData.get("password");

	const adminPassword = context.cloudflare.env.ADMIN_PASSWORD;

	if (!adminPassword) {
		// 未设置 ADMIN_PASSWORD 时，直接放行（方便开发调试）
		session.set("isLoggedIn", true);
		return redirect("/", {
			headers: { "Set-Cookie": await commitSession(session) },
		});
	}

	if (password !== adminPassword) {
		return data({ error: "密码错误" }, { status: 401 });
	}

	session.set("isLoggedIn", true);
	return redirect("/", {
		headers: { "Set-Cookie": await commitSession(session) },
	});
}

export default function Login({ actionData }: Route.ComponentProps) {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
				<h1 className="text-xl font-semibold text-center mb-6 text-gray-800">
					访问验证
				</h1>
				<Form method="post" className="space-y-4">
					<div>
						<label
							htmlFor="password"
							className="block text-sm text-gray-600 mb-1"
						>
							密码
						</label>
						<input
							id="password"
							name="password"
							type="password"
							autoFocus
							required
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="请输入访问密码"
						/>
					</div>
					{actionData?.error && (
						<p className="text-red-500 text-sm">{actionData.error}</p>
					)}
					<button
						type="submit"
						className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors"
					>
						进入
					</button>
				</Form>
			</div>
		</div>
	);
}
