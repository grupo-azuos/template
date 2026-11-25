import { Fragment, type ReactNode } from 'react';
import { Settings } from 'lucide-react';

import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';
import { AzuosPageHeader } from '../azuos-page-header/azuos-page-header.component';
import { AzuosContentCard } from '../azuos-content-card/azuos-content-card.component';
import { AzuosPersonAvatar } from '../azuos-person-avatar/azuos-person-avatar.component';
import { AzuosThemeToggle } from '../azuos-theme-toggle/azuos-theme-toggle.component';

export type AzuosIdentityOverviewProps = {
  data: {
    person: {
      id?: string;
      name: string;
      email: string;
      roleLabel: string;
      avatarUrl?: string | null;
    } | null;
    details?: readonly (readonly [string, string])[];
    accountUrl?: string | null;
  };
  state?: { isLoading?: boolean; error?: string | null };
  children?: ReactNode;
  identity?: ReactNode;
  actions?: { onRetry?: () => void };
};

/** Identidade, dados da conta e preferências seguem o perfil de referência do CertMonitor. */
export function AzuosIdentityOverview({
  data,
  state,
  children,
  identity,
  actions,
}: AzuosIdentityOverviewProps) {
  if (state?.error) return <OverviewError message={state.error} actions={actions} />;
  if (state?.isLoading || !data.person)
    return (
      <p role="status" aria-label="Carregando o perfil" className="text-muted-foreground p-6">
        Carregando seu perfil…
      </p>
    );

  const person = data.person;
  const details = data.details ?? [];
  return (
    <section
      className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-10 sm:px-6"
      aria-label="Meu perfil"
    >
      <AzuosPageHeader
        data={{ title: 'Meu perfil', description: 'Quem o sistema entende que você é.' }}
      />
      {identity ?? <AzuosIdentityHeader person={person} details={details} />}

      <AzuosContentCard
        data={{
          label: 'Dados da conta',
          title: 'Dados da conta',
          meta: 'Nome, e-mail e perfil são mantidos na conta do grupo.',
        }}
        ui={{
          body: (
            <div className="flex flex-col gap-3 pb-1">
              <AccountFacts person={person} details={details} />
              <AccountLink url={data.accountUrl} />
            </div>
          ),
        }}
      />

      <AzuosContentCard
        data={{ label: 'Preferências', title: 'Preferências', meta: 'Valem só neste navegador.' }}
        ui={{
          body: (
            <div className="flex items-center justify-between gap-4 pb-1 text-sm">
              <span className="text-muted-foreground">Tema</span>
              <AzuosThemeToggle />
            </div>
          ),
        }}
      />
      {children}
    </section>
  );
}

type Person = NonNullable<AzuosIdentityOverviewProps['data']['person']>;

export function AzuosIdentityHeader({
  person,
  details = [],
  avatar,
  aside,
  emailAction,
  children,
}: {
  person: Person;
  details?: readonly (readonly [string, string])[];
  avatar?: ReactNode;
  aside?: ReactNode;
  emailAction?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section aria-label="Identidade" className="rounded-surface bg-card shadow-card p-5">
      <div className="flex flex-wrap items-center gap-4">
        {avatar ?? (
          <AzuosPersonAvatar name={person.name} avatarUrl={person.avatarUrl} ui={{ size: 'xl' }} />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-foreground truncate text-base font-semibold">{person.name}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-muted-foreground min-w-0 truncate text-sm">{person.email}</p>
            {emailAction}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {details
              .filter(([label]) => ['Cargo', 'Departamento', 'Setor'].includes(label))
              .map(([, value]) => value)
              .join(' · ')}
          </p>
        </div>
        <span className="rounded-chip bg-primary text-primary-foreground shrink-0 px-2 py-0.5 text-xs font-semibold">
          {person.roleLabel}
        </span>
        {aside}
      </div>
      {children}
    </section>
  );
}

function AccountFacts({
  person,
  details,
}: {
  person: Person;
  details: readonly (readonly [string, string])[];
}) {
  const identifier = person.id ?? details.find(([label]) => label === 'Identificador')?.[1];
  const rows: readonly (readonly [string, string])[] = [
    ...(identifier ? ([['Identificador', identifier]] as const) : []),
    ['E-mail', person.email],
    ['Perfil', person.roleLabel],
    ...details.filter(([label]) => label !== 'Identificador'),
  ];
  return (
    <dl className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
      {rows.map(([label, value]) => (
        <Fragment key={label}>
          <dt className="text-muted-foreground">{label}</dt>
          <dd
            className={
              label === 'Identificador' ? 'font-mono text-xs break-all' : 'min-w-0 break-words'
            }
          >
            {value}
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}

function AccountLink({ url }: { url?: string | null }) {
  if (!url) return null;
  return (
    <a
      className="text-primary dark:text-info mt-4 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4"
      href={url}
    >
      <Settings className="size-4" aria-hidden="true" />
      Gerenciar minha conta
    </a>
  );
}

function OverviewError({
  message,
  actions,
}: {
  message: string;
  actions?: AzuosIdentityOverviewProps['actions'];
}) {
  return (
    <div className="p-6">
      <p role="alert" className="text-destructive">
        Não consegui saber quem é você. {message}
      </p>
      {actions?.onRetry ? (
        <AzuosActionButton
          data={{ label: 'Tentar de novo' }}
          actions={{ onClick: actions.onRetry }}
        />
      ) : null}
    </div>
  );
}
