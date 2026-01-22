/**
 * functions/src/services/sendgridEmailService.ts
 * 
 * Purpose: SendGrid email delivery service for Time 2 Trade transactional emails.
 * Key responsibility and main functionality: Send custom reminder notifications via SendGrid API
 * with branded HTML content and safe fallback text.
 * 
 * Changelog:
 * v1.0.0 - 2026-01-21 - Implement SendGrid-based custom reminder email delivery.
 */

import sgMail from '@sendgrid/mail';

type ReminderEmailPayload = {
	to: string;
	title: string;
	description?: string;
	localDate?: string;
	localTime?: string;
	timezone?: string;
	minutesBefore?: number;
};

const getSenderEmail = () => process.env.SENDGRID_SENDER_EMAIL || 'noreply@time2.trade';
const getSenderName = () => process.env.SENDGRID_SENDER_NAME || 'Time 2 Trade';

const buildSubject = (title: string, minutesBefore?: number) => {
	const suffix = Number.isFinite(minutesBefore) ? ` (${minutesBefore} min)` : '';
	return `Reminder: ${title}${suffix}`;
};

const buildTextContent = ({ title, description, localDate, localTime, timezone, minutesBefore }: ReminderEmailPayload) => {
	const parts = [
		`Reminder: ${title}`,
		Number.isFinite(minutesBefore) ? `${minutesBefore} minutes before` : null,
		localDate ? `Date: ${localDate}` : null,
		localTime ? `Time: ${localTime}` : null,
		timezone ? `Timezone: ${timezone}` : null,
		description ? `Notes: ${description}` : null,
		'— Time 2 Trade',
	].filter(Boolean);

	return parts.join('\n');
};

const buildHtmlContent = ({ title, description, localDate, localTime, timezone, minutesBefore }: ReminderEmailPayload) => {
	const scheduleLine = [localDate, localTime, timezone].filter(Boolean).join(' · ');
	const lead = Number.isFinite(minutesBefore)
		? `${minutesBefore} minute${minutesBefore === 1 ? '' : 's'} before`
		: 'Upcoming reminder';

	return `
		<div style="font-family: Arial, sans-serif; color:#0f172a; line-height:1.5;">
			<h2 style="margin:0 0 12px; font-size:20px;">${title}</h2>
			<p style="margin:0 0 12px; color:#334155;">${lead}</p>
			${scheduleLine ? `<p style="margin:0 0 12px; font-weight:600;">${scheduleLine}</p>` : ''}
			${description ? `<p style="margin:0 0 12px; color:#475569;">${description}</p>` : ''}
			<hr style="border:none; border-top:1px solid #e2e8f0; margin:16px 0;" />
			<p style="margin:0; font-size:12px; color:#64748b;">Time 2 Trade • https://time2.trade</p>
		</div>
	`;
};

export const sendCustomReminderEmail = async (payload: ReminderEmailPayload) => {
	const apiKey = process.env.SENDGRID_API_KEY;
	if (!apiKey) {
		throw new Error('SendGrid API key not configured');
	}

	if (!payload?.to || !payload?.title) {
		throw new Error('Missing reminder email payload');
	}

	sgMail.setApiKey(apiKey);

	const subject = buildSubject(payload.title, payload.minutesBefore);
	const msg = {
		to: payload.to,
		from: {
			email: getSenderEmail(),
			name: getSenderName(),
		},
		subject,
		text: buildTextContent(payload),
		html: buildHtmlContent(payload),
	};

	await sgMail.send(msg);
};
