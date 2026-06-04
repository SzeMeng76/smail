import PostalMime from "postal-mime";
import { createRequestHandler } from "react-router";
import {
	cleanupExpiredEmails,
	cleanupExpiredSessions,
	createDB,
	getOrCreateMailbox,
	storeEmail,
} from "../app/lib/db";

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: Env;
			ctx: ExecutionContext;
		};
	}
}

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

interface ParsedEmail {
	messageId?: string;
	from?: {
		name?: string;
		address?: string;
	};
	to?: Array<{
		name?: string;
		address?: string;
	}>;
	subject?: string;
	text?: string;
	html?: string;
	attachments?: Array<{
		filename?: string;
		mimeType?: string;
		size?: number;
		contentId?: string;
		related?: boolean;
		content?: ArrayBuffer;
	}>;
}

export default {
	async fetch(request, env, ctx) {
		return requestHandler(request, {
			cloudflare: { env, ctx },
		});
	},
	async email(
		message: ForwardableEmailMessage,
		env: Env,
		ctx: ExecutionContext,
	): Promise<void> {
		try {
			console.log(
				`📧 Received email: ${message.from} -> ${message.to}, size: ${message.rawSize}`,
			);

			// 创建数据库实例
			const db = createDB();

			// 清理过期邮件和 sessions（异步执行，不阻塞当前邮件处理）
			ctx.waitUntil(cleanupExpiredEmails(db));
			ctx.waitUntil(cleanupExpiredSessions(db));

			// 读取原始邮件内容
			const rawEmailArray = await new Response(message.raw).arrayBuffer();
			const rawEmail = new TextDecoder().decode(rawEmailArray);

			// 使用 postal-mime 解析邮件
			const parsedEmail = (await PostalMime.parse(
				rawEmailArray,
			)) as ParsedEmail;

			console.log(
				`📝 Parsed email from: ${parsedEmail.from?.address}, subject: ${parsedEmail.subject}`,
			);

			// 获取或创建邮箱记录（使用统一的drizzle方法）
			const mailbox = await getOrCreateMailbox(db, message.to);

			console.log(
				`📦 Found/Created mailbox: ${mailbox.id} for ${mailbox.email}`,
			);

			// 存储邮件到数据库，附件存储到 R2
			const emailId = await storeEmail(
				db,
				env.ATTACHMENTS, // R2 存储桶
				mailbox.id,
				parsedEmail,
				rawEmail,
				message.rawSize,
				message.to,
			);

			console.log(`✅ Email stored successfully with ID: ${emailId}`);
		} catch (error) {
			console.error("❌ Error processing email:", error);
			// 在生产环境中，你可能想要拒绝邮件或发送到错误队列
			// message.setReject("Email processing failed");
		}
	},
} satisfies ExportedHandler<Env>;
