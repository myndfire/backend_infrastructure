/**
 * tok/s footer — custom footer showing output tokens per second.
 *
 * - Live rate while the assistant streams (estimated from streamed content,
 *   upgraded to provider-reported usage when available).
 * - Last completed response rate, persisted in memory across the session.
 * - Session average computed from message timestamps (works for resumed sessions).
 */

import type { AssistantMessage } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

function estimateOutputTokens(msg: AssistantMessage): number {
	let chars = 0;
	for (const part of msg.content as any[]) {
		if (part.type === "text" || part.type === "thinking") chars += (part.text || part.thinking || "").length;
		else if (part.type === "toolCall" || part.type === "tool_use")
			chars += JSON.stringify(part.args ?? part.input ?? {}).length;
	}
	return Math.max(0, Math.round(chars / 4)); // rough heuristic
}

export default function (pi: ExtensionAPI) {
	let streamStartMs: number | undefined;
	let streamTokens = 0;
	let lastRate: number | undefined;
	let requestRender: (() => void) | undefined;
	let lastRenderAt = 0;

	pi.on("message_start", async (event) => {
		if (event.message.role !== "assistant") return;
		streamStartMs = Date.now();
		streamTokens = 0;
	});

	pi.on("message_update", async (event) => {
		if (event.message.role !== "assistant" || streamStartMs === undefined) return;
		const msg = event.message as AssistantMessage;
		streamTokens = Math.max(estimateOutputTokens(msg), msg.usage?.output || 0);
		// Throttle renders to ~4/s; the footer recomputes the rate on render.
		const now = Date.now();
		if (now - lastRenderAt > 250) {
			lastRenderAt = now;
			requestRender?.();
		}
	});

	pi.on("message_end", async (event) => {
		if (event.message.role !== "assistant" || streamStartMs === undefined) return;
		const msg = event.message as AssistantMessage;
		const seconds = (Date.now() - streamStartMs) / 1000;
		const tokens = Math.max(estimateOutputTokens(msg), msg.usage?.output || 0);
		if (seconds > 0.1 && tokens > 0) lastRate = tokens / seconds;
		streamStartMs = undefined;
		streamTokens = 0;
		requestRender?.();
	});

	// Install the footer as soon as we have a TUI context.
	pi.on("session_start", async (_event, ctx) => {
		if (ctx.mode !== "tui") return;
		ctx.ui.setFooter((tui, theme, footerData) => {
			requestRender = () => tui.requestRender();
			const unsub = footerData.onBranchChange(() => tui.requestRender());

			return {
				dispose: () => {
					unsub();
					requestRender = undefined;
				},
				invalidate() {},
				render(width: number): string[] {
					// Session totals + average rate from branch history.
					let input = 0,
						output = 0,
						cost = 0;
					let genMs = 0,
						genTokens = 0;
					let prevTs: number | undefined;
					for (const e of ctx.sessionManager.getBranch()) {
						if (e.type !== "message") continue;
						const m = e.message as any;
						if (m.role === "assistant") {
							output += m.usage?.output || 0;
							input += m.usage?.input || 0;
							cost += m.usage?.cost?.total || 0;
							// Approximate generation window: previous message -> assistant completion.
							if (prevTs !== undefined && m.timestamp) {
								const dt = m.timestamp - prevTs;
								if (dt > 0 && dt < 10 * 60 * 1000 && (m.usage?.output || 0) > 0) {
									genMs += dt;
									genTokens += m.usage.output;
								}
							}
						}
						if (m.timestamp) prevTs = m.timestamp;
					}

					// Current live rate while streaming.
					let rateLabel: string | undefined;
					if (streamStartMs !== undefined) {
						const s = (Date.now() - streamStartMs) / 1000;
						if (s > 0.05 && streamTokens > 0) rateLabel = `⚡ ${(streamTokens / s).toFixed(1)} tok/s`;
					}
					if (!rateLabel && lastRate) rateLabel = `⚡ ${lastRate.toFixed(1)} tok/s (last)`;
					if (!rateLabel && genMs > 0) rateLabel = `⚡ ${(genTokens / (genMs / 1000)).toFixed(1)} tok/s (avg)`;

					const fmt = (n: number) => (n < 1000 ? `${n}` : `${(n / 1000).toFixed(1)}k`);
					const left = theme.fg("dim", `↑${fmt(input)} ↓${fmt(output)} $${cost.toFixed(3)}${rateLabel ? " " + rateLabel : ""}`);
					const branch = footerData.getGitBranch();
					const right = theme.fg("dim", `${ctx.model?.id || "no-model"}${branch ? ` (${branch})` : ""}`);

					const pad = " ".repeat(Math.max(1, width - visibleWidth(left) - visibleWidth(right)));
					return [truncateToWidth(left + pad + right, width)];
				},
			};
		});
	});

	pi.on("session_shutdown", async () => {
		requestRender = undefined;
		streamStartMs = undefined;
	});
}
