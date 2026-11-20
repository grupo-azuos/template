import { z } from 'zod';

/**
 * AS PESSOAS QUE PODEM SER ESCOLHIDAS NESTE SISTEMA — quem tem acesso a ele no admin-console.
 *
 * Este sistema não tem tabela de usuário e não vai ter. Todo campo de pessoa (responsável,
 * "quem fez", o filtro "Pessoa" do dashboard) escolhe desta lista, com a foto, e GUARDA O ID.
 */
export const directoryPersonSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
});

export type DirectoryPerson = z.infer<typeof directoryPersonSchema>;

export const directoryListSchema = z.object({
  people: z.array(directoryPersonSchema),
  /**
   * `false` enquanto a integração com o admin-console não foi ligada pelo suporte: a lista traz
   * só quem está logado. A tela pode dizer isso em vez de parecer que a equipe tem uma pessoa.
   */
  isConnected: z.boolean(),
});

export type DirectoryList = z.infer<typeof directoryListSchema>;
