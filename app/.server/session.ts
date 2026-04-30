import { env } from "cloudflare:workers";
import { createWorkersKVSessionStorage } from "@react-router/cloudflare";
import { createCookie } from "react-router";

// 24 小时过期（与邮箱保留时间一致）
// Session 会自动过期，KV 中的过期数据会被 Cloudflare 自动清理
const SESSION_MAX_AGE = 24 * 60 * 60; // 86400 秒

const sessionCookie = createCookie("__session", {
	secrets: [env.SESSION_SECRET],
	sameSite: "lax",
	httpOnly: true, // 防止 XSS 攻击
	secure: env.ENVIRONMENT === "production", // 生产环境强制 HTTPS
	maxAge: SESSION_MAX_AGE,
});

type SessionData = {
	email: string;
};

const { getSession, commitSession, destroySession } =
	createWorkersKVSessionStorage<SessionData>({
		kv: env.KV,
		cookie: sessionCookie,
	});

export { getSession, commitSession, destroySession };
