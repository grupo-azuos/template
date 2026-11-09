import {
  AppWindow,
  Briefcase,
  Building2,
  ExternalLink,
  type LucideIcon,
  Mail,
  Moon,
  Palette,
  Phone,
  Sun,
  UserRound,
} from 'lucide-react';
import { type ReactNode } from 'react';

import { cn } from '../../utils/cn.util';
import { initialsOf } from '../azuos-app-shell-avatar/azuos-app-shell-avatar.component';

/**
 * MEU PERFIL — a mesma ficha nos 13 sistemas.
 *
 * Tem a cara da ficha de uma pessoa no admin-console: cartão com a faixa da marca, a foto
 * sobreposta, os fatos de relance e as seções com índice ao lado. Nos 12 sistemas ela é SÓ DE
 * LEITURA — quem muda nome, foto, telefone ou senha é o admin-console, e o botão "Editar no
 * Admin Console" leva para lá. No admin-console, a MESMA ficha recebe os formulários pelos
 * encaixes (`slots`), e vira o único ponto de edição da conta.
 *
 * A única coisa que muda em qualquer sistema é o tema, que é preferência de tela e não dado
 * da conta.
 *
 * Travada pelo hook `protect-app-shell.mjs`, junto com a casca: cada sistema só entrega os
 * DADOS (o `use-profile.model.ts` dele). Pedido de mudança vai para o suporte.
 *
 * Na largura da moldura das telas (`page-frame`), com folga no fim da página: a ficha não se estica na
 * tela larga, e a última seção não encosta na borda de baixo.
 */
export type MyProfileSystem = { name: string; url: string; roleLabel: string };

export type MyProfilePerson = {
  name: string;
  email: string | null;
  /* O papel NESTE sistema, já escrito para gente ("Administrador"). */
  roleLabel: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  department: string | null;
  phone?: string | null;
  /* Já formatada para gente ("25/03/1990"). */
  birthDateLabel?: string | null;
  bio?: string | null;
  /* Os sistemas que a pessoa abre; `undefined` = o admin-console não respondeu. */
  systems?: MyProfileSystem[];
};

/** Uma seção a mais, só do sistema que a monta (ex.: "Senha" no admin-console). */
export type MyProfileExtraSection = {
  id: string;
  label: string;
  icon: LucideIcon;
  content: ReactNode;
};

export type AzuosMyProfileViewProps = {
  data: {
    person: MyProfilePerson | null;
    /* Onde a conta é editada; sem ele, o botão não aparece. */
    accountUrl: string | null;
    theme: 'light' | 'dark';
  };
  state?: { isLoading?: boolean; error?: string | null };
  actions: { onToggleTheme: () => void; onRetry?: () => void };
  /**
   * Os encaixes de quem EDITA (só o admin-console). Cada um troca o bloco de leitura inteiro
   * pelo formulário, que traz o próprio cartão.
   */
  slots?: {
    bannerAside?: ReactNode;
    personal?: ReactNode;
    organization?: ReactNode;
    extraSections?: MyProfileExtraSection[];
  };
};

const EMPTY = 'Não informado';

export function AzuosMyProfileView({ data, state, actions, slots }: AzuosMyProfileViewProps) {
  if (state?.isLoading) return <ProfileSkeleton />;
  if (!data.person) {
    return (
      <ErrorNotice
        data={{ message: state?.error ?? 'Não consegui carregar seu perfil.' }}
        actions={{ onRetry: actions.onRetry }}
      />
    );
  }

  return (
    <section aria-label="Meu perfil" className="flex w-full flex-col gap-6 px-4 pb-10 sm:px-6">
      <Banner
        data={{ person: data.person, accountUrl: data.accountUrl }}
        aside={slots?.bannerAside}
      />
      {state?.error ? (
        <ErrorNotice data={{ message: state.error }} actions={{ onRetry: actions.onRetry }} />
      ) : null}
      <ProfileSections
        data={{ person: data.person, theme: data.theme }}
        actions={actions}
        slots={slots}
      />
    </section>
  );
}

function sectionsOf(extras: MyProfileExtraSection[]) {
  return [
    { id: 'profile-personal', label: 'Dados pessoais', icon: UserRound },
    { id: 'profile-organization', label: 'Organização', icon: Building2 },
    { id: 'profile-systems', label: 'Sistemas', icon: AppWindow },
    ...extras.map(({ id, label, icon }) => ({ id, label, icon })),
    { id: 'profile-preferences', label: 'Preferências', icon: Palette },
  ];
}

function ProfileSections({
  data,
  actions,
  slots,
}: {
  data: { person: MyProfilePerson; theme: 'light' | 'dark' };
  actions: AzuosMyProfileViewProps['actions'];
  slots: AzuosMyProfileViewProps['slots'];
}) {
  const extras = slots?.extraSections ?? [];

  return (
    /* Índice só a partir de `lg`: no celular ele empurraria o conteúdo para baixo da dobra. */
    <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
      <SectionNav data={{ sections: sectionsOf(extras) }} />
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-9">
        <Anchor id="profile-personal">
          {slots?.personal ?? <PersonalCard data={{ person: data.person }} />}
        </Anchor>
        <Anchor id="profile-organization">
          {slots?.organization ?? <OrganizationCard data={{ person: data.person }} />}
        </Anchor>
        <Anchor id="profile-systems">
          <SystemsCard data={{ systems: data.person.systems }} />
        </Anchor>
        {extras.map((section) => (
          <Anchor key={section.id} id={section.id}>
            {section.content}
          </Anchor>
        ))}
        <Anchor id="profile-preferences">
          <Card data={{ title: 'Preferências', icon: Palette }}>
            <ThemeSwitch data={{ theme: data.theme }} actions={actions} />
          </Card>
        </Anchor>
      </div>
    </div>
  );
}

function PersonalCard({ data }: { data: { person: MyProfilePerson } }) {
  const { person } = data;

  return (
    <Card data={{ title: 'Dados pessoais', icon: UserRound }}>
      <Field data={{ label: 'Nome', value: person.name }} />
      <Field data={{ label: 'E-mail', value: person.email }} />
      <Field data={{ label: 'Telefone', value: person.phone ?? null }} />
      <Field data={{ label: 'Data de nascimento', value: person.birthDateLabel ?? null }} />
      <Field data={{ label: 'Bio', value: person.bio ?? null }} ui={{ isWide: true }} />
    </Card>
  );
}

function OrganizationCard({ data }: { data: { person: MyProfilePerson } }) {
  return (
    <Card data={{ title: 'Organização', icon: Building2 }}>
      <Field data={{ label: 'Cargo', value: data.person.jobTitle }} />
      <Field data={{ label: 'Departamento', value: data.person.department }} />
    </Card>
  );
}

/* A âncora para no alto da seção com folga: sem o `scroll-mt`, o título encosta na borda. */
function Anchor({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div id={id} className="scroll-mt-6">
      {children}
    </div>
  );
}

/** O cartão de topo: faixa da marca, foto, nome, e-mail, papel e os fatos de relance. */
function Banner({
  data,
  aside,
}: {
  data: { person: MyProfilePerson; accountUrl: string | null };
  aside?: ReactNode;
}) {
  const { person } = data;

  return (
    <section
      aria-label="Identidade"
      className="overflow-hidden rounded-surface border border-border bg-card shadow-xs"
    >
      <div aria-hidden className="h-20 bg-primary sm:h-24" />
      <div className="flex flex-col gap-5 px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <BigAvatar data={{ name: person.name, avatarUrl: person.avatarUrl }} />
          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:pt-3">
            <h1 className="text-2xl font-bold break-words text-primary">{person.name}</h1>
            <p className="flex min-w-0 items-center gap-1.5 text-sm text-ink-500">
              <Mail className="size-4 shrink-0" aria-hidden />
              <span className="break-all">{person.email ?? 'Sem e-mail'}</span>
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <RoleBadge data={{ label: person.roleLabel }} />
            </div>
          </div>
          {aside ?? (data.accountUrl ? <EditLink data={{ href: data.accountUrl }} /> : null)}
        </div>
        <dl className="grid gap-3 sm:grid-cols-3">
          <Fact data={{ label: 'Telefone', value: person.phone ?? null }} ui={{ icon: Phone }} />
          <Fact data={{ label: 'Cargo', value: person.jobTitle }} ui={{ icon: Briefcase }} />
          <Fact
            data={{ label: 'Departamento', value: person.department }}
            ui={{ icon: Building2 }}
          />
        </dl>
      </div>
    </section>
  );
}

/** Com foto, a foto fala por si ("Foto de Ana"); sem ela, as iniciais respondem pelo nome. */
function BigAvatar({ data }: { data: { name: string; avatarUrl: string | null } }) {
  return (
    <span
      role={data.avatarUrl ? undefined : 'img'}
      aria-label={data.avatarUrl ? undefined : data.name}
      className="relative -mt-12 flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-yellow-400 text-2xl font-bold text-brand-blue-900 ring-4 ring-card"
    >
      <span aria-hidden={data.avatarUrl ? true : undefined}>{initialsOf(data.name)}</span>
      {data.avatarUrl ? (
        <img
          src={data.avatarUrl}
          alt={`Foto de ${data.name}`}
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
    </span>
  );
}

function EditLink({ data }: { data: { href: string } }) {
  return (
    <a
      href={data.href}
      className="inline-flex shrink-0 items-center gap-2 self-start rounded-control border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:mt-3"
    >
      <ExternalLink className="size-4" aria-hidden />
      Editar no Admin Console
    </a>
  );
}

function RoleBadge({ data }: { data: { label: string } }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
      {data.label}
    </span>
  );
}

function Fact({
  data,
  ui,
}: {
  data: { label: string; value: string | null };
  ui: { icon: LucideIcon };
}) {
  const Icon = ui.icon;

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-box bg-muted p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-chip bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-ink-500">{data.label}</dt>
        <dd
          className={cn(
            'truncate text-sm font-medium',
            data.value ? 'text-foreground' : 'text-ink-500',
          )}
        >
          {data.value ?? EMPTY}
        </dd>
      </div>
    </div>
  );
}

function SectionNav({
  data,
}: {
  data: { sections: { id: string; label: string; icon: LucideIcon }[] };
}) {
  return (
    <nav aria-label="Seções da página" className="hidden lg:sticky lg:top-6 lg:col-span-3 lg:block">
      <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-ink-500 uppercase">
        Nesta página
      </p>
      <ul className="flex flex-col gap-0.5">
        {data.sections.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="flex items-center gap-2.5 rounded-control px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Card({
  data,
  children,
}: {
  data: { title: string; icon: LucideIcon };
  children: ReactNode;
}) {
  const Icon = data.icon;

  return (
    <section
      aria-label={data.title}
      className="flex flex-col gap-4 rounded-surface border border-border bg-card p-4 shadow-xs sm:p-6"
    >
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <span className="flex size-8 items-center justify-center rounded-chip bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
        {data.title}
      </h2>
      <dl className="grid gap-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

/** Um dado só de leitura: rótulo miúdo em cima, valor embaixo — sem caixa de texto. */
function Field({
  data,
  ui,
}: {
  data: { label: string; value: string | null };
  ui?: { isWide?: boolean };
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', ui?.isWide && 'sm:col-span-2')}>
      <dt className="text-xs font-medium text-ink-500">{data.label}</dt>
      <dd
        className={cn(
          'text-sm break-words whitespace-pre-line',
          data.value ? 'text-foreground' : 'text-ink-500',
        )}
      >
        {data.value ?? EMPTY}
      </dd>
    </div>
  );
}

function SystemsCard({ data }: { data: { systems: MyProfileSystem[] | undefined } }) {
  return (
    <section
      aria-label="Sistemas"
      className="flex flex-col gap-4 rounded-surface border border-border bg-card p-4 shadow-xs sm:p-6"
    >
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <span className="flex size-8 items-center justify-center rounded-chip bg-primary/10 text-primary">
          <AppWindow className="size-4" aria-hidden />
        </span>
        Sistemas
      </h2>
      <SystemsList data={data} />
    </section>
  );
}

function SystemsList({ data }: { data: { systems: MyProfileSystem[] | undefined } }) {
  if (!data.systems) {
    return <p className="text-sm text-ink-500">Não consegui ver seus sistemas agora.</p>;
  }
  if (data.systems.length === 0) {
    return <p className="text-sm text-ink-500">Você ainda não tem acesso a nenhum sistema.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {data.systems.map((system) => (
        <li key={system.url} className="flex items-center justify-between gap-3 py-2.5">
          <a
            href={system.url}
            className="min-w-0 truncate text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            {system.name}
          </a>
          <RoleBadge data={{ label: system.roleLabel }} />
        </li>
      ))}
    </ul>
  );
}

function ThemeSwitch({
  data,
  actions,
}: {
  data: { theme: 'light' | 'dark' };
  actions: { onToggleTheme: () => void };
}) {
  const isDark = data.theme === 'dark';
  const Icon = isDark ? Moon : Sun;

  return (
    <div className="flex items-center justify-between gap-4 sm:col-span-2">
      <div className="flex min-w-0 flex-col gap-1">
        <dt className="text-sm font-medium text-foreground">Tema escuro</dt>
        <dd className="text-xs text-ink-500">
          Vale para todos os sistemas do grupo neste navegador.
        </dd>
      </div>
      {/* design-ignore-next-line fitts/target-size: switch toggle compacto de 28px */}
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label="Tema escuro"
        onClick={actions.onToggleTheme}
        className={cn(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors',
          isDark ? 'bg-primary' : 'bg-ink-300',
        )}
      >
        <span
          className={cn(
            'flex size-5 items-center justify-center rounded-full bg-card text-primary shadow-xs transition-transform',
            isDark ? 'translate-x-6' : 'translate-x-1',
          )}
        >
          <Icon className="size-3" aria-hidden />
        </span>
      </button>
    </div>
  );
}

function ErrorNotice({
  data,
  actions,
}: {
  data: { message: string };
  actions: { onRetry?: () => void };
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-box border border-border px-4 py-3 text-sm text-destructive"
    >
      <span>{data.message}</span>
      {actions.onRetry ? (
        <button
          type="button"
          onClick={actions.onRetry}
          className="rounded-control px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          Tentar de novo
        </button>
      ) : null}
    </div>
  );
}

/** O esqueleto com a forma da página: um "carregando…" solto fazia a tela pular. */
function ProfileSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex w-full flex-col gap-6 px-4 pb-10 sm:px-6">
      <span className="sr-only">Carregando seu perfil…</span>
      <div className="overflow-hidden rounded-surface border border-border bg-card shadow-xs">
        <div className="h-20 animate-pulse bg-muted" />
        <div className="flex flex-col gap-4 p-4 sm:p-6">
          <div className="-mt-16 size-24 animate-pulse rounded-full bg-muted" />
          <div className="h-6 w-56 animate-pulse rounded-box bg-muted" />
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-box bg-muted" />
            ))}
          </div>
        </div>
      </div>
      <div className="h-40 animate-pulse rounded-surface bg-muted" />
    </div>
  );
}
