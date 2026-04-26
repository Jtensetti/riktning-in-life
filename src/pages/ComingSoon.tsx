import { AppShell } from "@/components/AppShell";

interface Props {
  title: string;
  body: string;
}

export const ComingSoon = ({ title, body }: Props) => (
  <AppShell>
    <h1 className="text-[32px] leading-[38px] mb-2">{title}</h1>
    <p className="text-sm text-text-secondary mb-8">{body}</p>
    <div className="card-cream p-8 text-center">
      <p className="text-base font-extrabold mb-2">Kommer snart</p>
      <p className="text-sm text-text-secondary">
        Den här delen byggs i nästa steg.
      </p>
    </div>
  </AppShell>
);

export default ComingSoon;
