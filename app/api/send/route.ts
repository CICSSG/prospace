import { EmailTemplate, EmailTemplateProps } from '@/components/email-template';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function toErrorPayload(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  if (error && typeof error === "object") {
    const maybeError = error as Record<string, unknown>;
    const message = String(
      maybeError.message ?? maybeError.name ?? "Unexpected email service error",
    );

    return {
      message,
      details: error,
    };
  }

  return { message: "Unexpected email service error" };
}

export interface EmailRequestBody {
    from: string;
    to: string[];
    subject: string;
    content: EmailTemplateProps;
}

export async function POST(req: Request) {
  try {
    if (!process.env.RESEND_API_KEY?.trim()) {
      return Response.json(
        { error: { message: "RESEND_API_KEY is not configured." } },
        { status: 500 },
      );
    }

    const body = await req.json().catch(() => null);
    const to = Array.isArray(body?.to) ? body.to : [];
    const subject = String(body?.subject ?? "").trim();
    const content = body?.content as EmailTemplateProps | undefined;
    // console.log("Received email data:", body);

    if (!subject || to.length === 0) {
      return Response.json(
        { error: { message: "Missing required fields: to, subject." } },
        { status: 400 },
      );
    }

    if (!content?.title || !content?.name || !content?.content) {
      return Response.json(
        { error: { message: "Missing email template fields: title, name, content." } },
        { status: 400 },
      );
    }

    const { data, error } = await resend.emails.send({
      from: "ProSpace <prospace@cicssg.com>",
      to,
      subject,
      react: EmailTemplate(content),
    });

    if (error) {
      return Response.json({ error: toErrorPayload(error) }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: toErrorPayload(error) }, { status: 500 });
  }
}