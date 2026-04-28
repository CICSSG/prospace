import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html, Preview,
  Section,
  Tailwind,
  Text
} from "@react-email/components"

export interface EmailTemplateProps {
  title: string
  name: string
  content: string
  logoUrl?: string
}

export function EmailTemplate(data: EmailTemplateProps) {
  const previewText = `${data.title} - ProSpace`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: "#1976d2",
                accent: "#00a3af",
              },
            },
          },
        }}
      >
        <Body className="m-0 px-3 py-6 font-sans">
          <Container className="mx-auto max-w-160 overflow-hidden rounded-xl border border-slate-200 bg-gray-900 text-white">
            <Section>
              <Text className="relative mx-auto w-fit px-6 text-2xl font-bold">
                ProSpace
              </Text>

              <Heading className="my-2 px-6 text-center text-2xl">
                {data.title}
              </Heading>

              <Text className="mb-3 px-6 text-base leading-7">
                Hello, <strong>{data.name}</strong>!
              </Text>

              <Text className="mb-8 px-6 text-base leading-7">
                {data.content}
              </Text>

              <Text className="px-6 text-base leading-3">Best regards,</Text>
              <Text className="mb-8 px-6 text-base leading-0">
                The ProSpace Team
              </Text>

              <Hr className="my-5 border-slate-200 px-6" />

              <Text className="px-6 text-center text-sm leading-6">
                If you have any questions or need assistance, feel free to reach
                out to us.
              </Text>
              <Text className="mb-2 px-6 text-center text-[13px]">
                Facebook:{" "}
                <a
                  href="https://www.facebook.com/dlsud.cicssg"
                  target="_blank"
                  className="text-blue-500"
                >
                  CICSSG Facebook Page
                </a>
              </Text>
              <Text className="mb-2 px-6 text-center text-[13px]">
                Email: cicssg@dlsud.edu.ph / prospace@cicssg.com
              </Text>
              <Text className="mb-4 px-6 text-center text-[13px] font-bold">
                This email is read only, please do not reply.
              </Text>

              <Text className="m-0 border-t border-purple-500/20 bg-purple-500/30 py-3 text-center text-[13px] leading-5 text-white">
                &copy; {new Date().getFullYear()} DLSU-D CICSSG. All rights
                reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
