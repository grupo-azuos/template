import { z } from 'zod';

/**
 * Identidade — sem cadastro próprio, e sem tela de login.
 *
 * O template NÃO tem tabela de usuário. A identidade chega pronta por auth-forward: quem fica
 * na frente da aplicação autentica a pessoa e injeta quem ela é. Enquanto esse provedor não
 * existe, o servidor usa uma pessoa fixa (`server/src/lib/auth/identity.provider.ts`).
 *
 * Isso muda o que este arquivo é: não é o contrato de um CRUD de usuários, é a FORMA da
 * identidade que chega — o que o servidor precisa saber para decidir permissão e para
 * carimbar autoria.
 *
 * A consequência prática que mais importa: `createdBy` e `updatedBy` vêm de quem está na
 * requisição, e nunca do corpo. Não ter cadastro não afrouxa isso.
 */
/**
 * OS PAPÉIS SÃO OS DO ADMIN-CONSOLE, e não os nossos — é o vocabulário que chega em
 * `x-forwarded-user-role`. Eram `admin | editor | viewer`, traduzidos na chegada; um papel que o
 * admin-console emite e este sistema não reconhece cairia na recusa por identidade inválida —
 * 401 para todo mundo daquele papel.
 *
 * São em CASCATA, cada um faz tudo o que os de baixo fazem: funcionário (`user`) < gestor de
 * departamento (`manager`) < gestor da operação (`operations_manager`) < dono da empresa
 * (`owner`) < TI/suporte (`admin`). A ordem é a da lista. Regra nova pergunta "a partir de qual
 * papel?", e não lista papéis um a um: papel novo no meio da escada herda o que está abaixo.
 */
export const USER_ROLES = ['user', 'manager', 'operations_manager', 'owner', 'admin'] as const;

export const userRoleSchema = z.enum(USER_ROLES);

export type UserRole = z.infer<typeof userRoleSchema>;

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  owner: 'Dono',
  operations_manager: 'Gestor da operação',
  manager: 'Gestor',
  user: 'Consulta',
};

export function userRoleLabel(role: UserRole): string {
  return USER_ROLE_LABELS[role];
}

/** A altura do papel na escada; sem papel fica abaixo de todos. */
export function roleRank(role: UserRole | null | undefined): number {
  if (!role) return -1;

  return USER_ROLES.indexOf(role);
}

export function hasRoleAtLeast(role: UserRole | null | undefined, minimum: UserRole): boolean {
  return roleRank(role) >= roleRank(minimum);
}

/**
 * A aba "O que notificar" do perfil é do administrador: a escolha vale para a equipe inteira.
 * Sistema que tem gestor acrescenta o papel dele aqui.
 */
export function canManageNotifications(role: UserRole): boolean {
  return role === 'admin';
}

/**
 * Quem está usando o sistema agora.
 *
 * O `id` é o identificador que o provedor de identidade mandar — não uma chave nossa. Sem
 * tabela de usuário, não há registro a criar nem a manter em dia: a pessoa existe enquanto
 * a requisição dela existe.
 *
 * E a sessão nunca é persistida no navegador: num escritório de máquinas compartilhadas, a
 * próxima pessoa herdaria a conta da anterior — inclusive o crédito do trabalho dela.
 */
export const sessionUserSchema = z.object({
  id: z.string().min(1),
  email: z.email(),
  name: z.string().min(1),
  role: userRoleSchema,
});

export type SessionUser = z.infer<typeof sessionUserSchema>;
