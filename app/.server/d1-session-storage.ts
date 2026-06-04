import type { SessionStorage, SessionData, Session } from "react-router";
import { createSession } from "react-router";
import type { Cookie } from "react-router";
import { nanoid } from "nanoid";
import { createDB } from "~/lib/db";
import { sessions } from "~/db/schema";
import { eq, lte } from "drizzle-orm";

/**
 * 基于 Cloudflare D1 的 Session Storage 实现
 * 替代 KV 存储，利用 D1 更高的免费额度
 */
export function createD1SessionStorage<
	Data = SessionData,
	FlashData = Data,
>({
	cookie,
}: {
	cookie: Cookie;
}): SessionStorage<Data, FlashData> {
	return {
		async getSession(cookieHeader) {
			const id = cookieHeader && (await cookie.parse(cookieHeader));
			if (!id) return createSession();

			try {
				const db = createDB();
				const now = new Date();

				// 查询 session
				const result = await db
					.select()
					.from(sessions)
					.where(eq(sessions.id, id))
					.limit(1);

				if (result.length === 0) {
					return createSession();
				}

				const sessionRecord = result[0];

				// 检查是否过期
				if (sessionRecord.expiresAt <= now) {
					// 异步删除过期 session（不阻塞）
					db.delete(sessions).where(eq(sessions.id, id)).catch(console.error);
					return createSession();
				}

				// 解析 session 数据
				const data = JSON.parse(sessionRecord.data) as Data;
				return createSession(data, id);
			} catch (error) {
				console.error("Error getting session from D1:", error);
				return createSession();
			}
		},

		async commitSession(session: Session<Data, FlashData>) {
			const id = session.id || nanoid();
			const data = JSON.stringify(session.data);

			// 计算过期时间
			const maxAge = cookie.maxAge;
			const expiresAt = maxAge
				? new Date(Date.now() + maxAge * 1000)
				: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 默认 7 天

			try {
				const db = createDB();

				// 尝试更新现有 session
				const existingResult = await db
					.select()
					.from(sessions)
					.where(eq(sessions.id, id))
					.limit(1);

				if (existingResult.length > 0) {
					// 更新现有 session
					await db
						.update(sessions)
						.set({
							data,
							expiresAt,
							updatedAt: new Date(),
						})
						.where(eq(sessions.id, id));
				} else {
					// 创建新 session
					await db.insert(sessions).values({
						id,
						data,
						expiresAt,
					});
				}

				// 返回 Set-Cookie 头
				return cookie.serialize(id);
			} catch (error) {
				console.error("Error committing session to D1:", error);
				throw error;
			}
		},

		async destroySession(session: Session<Data, FlashData>) {
			const id = session.id;
			if (!id) return "";

			try {
				const db = createDB();
				await db.delete(sessions).where(eq(sessions.id, id));
			} catch (error) {
				console.error("Error destroying session in D1:", error);
			}

			// 返回删除 cookie 的 Set-Cookie 头
			return cookie.serialize("", { maxAge: 0 });
		},
	};
}

/**
 * 清理过期的 sessions（建议在定时任务中调用）
 */
export async function cleanupExpiredSessions(): Promise<number> {
	try {
		const db = createDB();
		const now = new Date();

		const result = await db
			.delete(sessions)
			.where(lte(sessions.expiresAt, now));

		return result.rowsAffected || 0;
	} catch (error) {
		console.error("Error cleaning up expired sessions:", error);
		return 0;
	}
}
