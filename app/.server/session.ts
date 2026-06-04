import { env } from "cloudflare:workers";
import { createCookie } from "react-router";
import { createD1SessionStorage } from "./d1-session-storage";

// 7 天过期（与邮箱保留时间一致）
// Session 会自动过期，过期数据需要定期清理
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 604800 秒

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

// 使用 D1 替代 KV 存储 session
// D1 免费额度：100k 写入/天 vs KV 的 1k 写入/天
const { getSession, commitSession, destroySession } =
	createD1SessionStorage<SessionData>({
		cookie: sessionCookie,
	});

export { getSession, commitSession, destroySession };
