# FormFactory

Sistema de formulários tipado E2E baseado em TanStack Form + Zod. A factory garante que validação, tipos e defaults estejam definidos uma única vez no schema — eliminando drift entre validação client/server.

**Regra:** Todo formulário com validação neste projeto DEVE usar `createFormFactory`. Nunca use `<form>` raw com estado manual, `react-hook-form`, ou validação fora do schema Zod.

## Arquivos

```
form-factory/
├── create-form-factory.tsx  # Factory principal — ponto de entrada
├── form-factory.types.ts    # Tipos exportados (FieldType, SelectOption, etc.)
├── form-field.tsx           # Renderizador interno de campo (FormFieldRenderer)
├── form-field-info.tsx      # Exibe erros de validação abaixo do campo
└── index.ts                 # Re-exports públicos
```

## Uso

### 1. Schema Zod (em `packages/types`)

```typescript
// packages/types/src/schemas/user.schema.ts
import { z } from "zod";

export const createUserSchema = z.object({
  name:  z.string().min(2, "Mínimo 2 caracteres"),
  email: z.email("Email inválido"),
  role:  z.enum(["admin", "member"]),
});

export type CreateUserInput = z.input<typeof createUserSchema>;
```

### 2. Criar a factory (module-level, fora do componente)

```typescript
// src/components/features/users/user-form.tsx
import { createFormFactory } from "@/components/form-factory";
import { createUserSchema } from "@workspace/types/schemas/user.schema";

// Defina fora do componente — evita re-criação a cada render
const userFormFactory = createFormFactory({
  schema: createUserSchema,
  defaultValues: {
    name:  "",
    email: "",
    role:  "member",
  },
});
```

### 3. Instanciar dentro do componente

```typescript
function UserForm({ onSuccess }: { onSuccess: () => void }) {
  const createUser = useUserCreateMutation();

  const form = userFormFactory.useForm({
    onSubmit: async (values) => {
      await createUser.mutateAsync(values);
      onSuccess();
    },
  });

  return (
    <form.Form className="space-y-4">
      <form.Field name="name"  label="Nome"  type="text"  placeholder="João Silva" />
      <form.Field name="email" label="Email" type="email" placeholder="joao@empresa.com" />
      <form.Field
        name="role"
        label="Perfil"
        type="select"
        options={[
          { value: "admin",  label: "Administrador" },
          { value: "member", label: "Membro" },
        ]}
      />
      <form.Submit>Criar Usuário</form.Submit>
    </form.Form>
  );
}
```

## API

### `createFormFactory(config)`

| Prop | Tipo | Descrição |
|------|------|-----------|
| `schema` | `ZodObject<TShape>` | Schema de validação — aplicado no submit |
| `defaultValues` | `z.input<schema>` | Valores iniciais tipados pelo schema |

Retorna um objeto com `useForm`.

### `factory.useForm(options)`

Deve ser chamado dentro de um componente React (é um hook).

| Prop | Tipo | Descrição |
|------|------|-----------|
| `onSubmit` | `(values: z.output<schema>) => Promise<void> \| void` | Callback chamado após validação bem-sucedida |
| `defaultValues?` | `Partial<z.input<schema>>` | Sobrescreve os defaults da factory (útil para edição) |

Retorna `{ Form, Field, Submit, instance }`.

### `<form.Form>`

Wrapper do `<form>` com `handleSubmit` integrado. Chame `e.preventDefault()` já é feito internamente.

| Prop | Tipo |
|------|------|
| `children` | `ReactNode` |
| `className?` | `string` |

### `<form.Field>`

Campo tipado. O prop `name` é restrito às keys do schema — erros de typo são capturados em compile-time.

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `name` | `keyof schema` | — | **Obrigatório.** Key do schema |
| `type` | `FieldType` | `"text"` | Tipo do input |
| `label` | `string` | — | Label exibida acima do campo |
| `placeholder` | `string` | — | Placeholder do input |
| `disabled` | `boolean` | — | Desabilita o campo |
| `options` | `SelectOption[]` | — | Obrigatório para `type="select"` |
| `leftSection` | `ReactNode` | — | Ícone/elemento à esquerda (Input) |
| `rightSection` | `ReactNode` | — | Ícone/elemento à direita (Input) |
| `mask` | `MaskPreset \| Mask` | — | Máscara de input (valor armazenado **raw**, sem formatação) |
| `maskOptions` | `Options` | — | Opções extras do `use-mask-input` (ex.: `prefix`, `digits`) |
| `children` | `(field: AnyFieldApi) => ReactNode` | — | Render customizado — recebe a instância raw do field |
| `className` | `string` | — | Classe CSS no wrapper do campo |

### Máscaras de Input

Campos com `mask` usam [`use-mask-input`](https://github.com/eduardoborges/use-mask-input) via `useTanStackFormMask`. O estado do formulário armazena o valor **raw** (somente dígitos/caracteres úteis) graças a `autoUnmask: true` — alinhado ao backend (ex.: CNPJ com 14 dígitos).

**Presets disponíveis** (`MASK_PRESETS` em `@acme/ui/lib/masks`):

| Preset | Máscara | Exemplo raw |
|--------|---------|-------------|
| `cpf` | CPF | `12345678901` |
| `cnpj` | CNPJ | `12345678000199` |
| `phone` | `(99) 99999-9999` | `11987654321` |
| `cep` | `99999-999` | `01310100` |
| `currency` | BRL | conforme alias |
| `integer` | inteiro | `42` |
| `decimal` | decimal | `42.5` |

Também aceita padrões custom (`mask="99.999.999/9999-99"`) ou aliases da lib (`mask="email"`).

**Uso declarativo:**

```typescript
import { cnpjSchema } from "@acme/types/schemas/mask.schema";

const itemForm = createFormFactory({
  schema: z.object({ cnpj: cnpjSchema }),
  defaultValues: { cnpj: "" },
});

// No componente:
<form.Field name="cnpj" label="CNPJ" mask="cnpj" placeholder="00.000.000/0000-00" />
<form.Field name="phone" label="Telefone" mask="phone" />
```

**Uso standalone** (render customizado com `MaskedInput`):

```typescript
import { MaskedInput } from "@acme/ui/components/masked-input";

<form.Field name="cnpj">
  {(field) => (
    <MaskedInput
      mask="cnpj"
      value={field.state.value as string}
      onBlur={field.handleBlur}
      onChange={(e) => field.handleChange(e.target.value)}
    />
  )}
</form.Field>
```

Schemas de validação raw: `packages/types/src/schemas/mask.schema.ts` (`cpfSchema`, `cnpjSchema`, `phoneSchema`, `cepSchema`).

### Tipos de Campo (`FieldType`)

| Tipo | Componente renderizado |
|------|----------------------|
| `"text"` | `<Input type="text">` |
| `"email"` | `<Input type="email">` |
| `"password"` | `<Input type="password">` |
| `"number"` | `<Input type="number">` (converte para `number` automaticamente) |
| `"textarea"` | `<Textarea>` |
| `"select"` | `<Select>` com `options` |
| `"checkbox"` | `<Checkbox>` + label inline |

### `<form.Submit>`

Botão de submit com estado reativo. Desabilitado automaticamente durante `isSubmitting` ou quando `!canSubmit`.

```typescript
// Texto simples
<form.Submit>Salvar</form.Submit>

// Render function para texto dinâmico
<form.Submit>
  {({ isSubmitting }) => isSubmitting ? "Salvando..." : "Salvar"}
</form.Submit>
```

| Prop | Tipo |
|------|------|
| `children` | `ReactNode \| (({ isSubmitting, canSubmit }) => ReactNode)` |
| `className?` | `string` |

### `form.instance`

Acesso direto à instância do TanStack Form para casos avançados:

```typescript
// Resetar formulário programaticamente
form.instance.reset();

// Ler valor de um campo
form.instance.getFieldValue("email");

// Subscribe a estado específico
<form.instance.Subscribe selector={(s) => s.isSubmitting}>
  {(isSubmitting) => <Spinner show={isSubmitting} />}
</form.instance.Subscribe>
```

## Formulário de Edição

Para pré-preencher com dados existentes, passe `defaultValues` no `useForm`:

```typescript
function EditUserForm({ user, onSuccess }) {
  const form = userFormFactory.useForm({
    defaultValues: {
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
    onSubmit: async (values) => {
      await updateUser.mutateAsync({ id: user.id, ...values });
      onSuccess();
    },
  });

  // ...
}
```

## Render Customizado de Campo

Quando o render automático não atende, use `children` como render function:

```typescript
<form.Field name="avatar">
  {(field) => (
    <AvatarUploader
      value={field.state.value}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
    />
  )}
</form.Field>
```

O `field` recebe a `AnyFieldApi` do TanStack Form com acesso a `state`, `handleChange`, `handleBlur`, `validate`, etc.

## Validação

- A validação acontece **somente no submit** (`validators: { onSubmit: schema }`).
- Erros são exibidos automaticamente pelo `FieldInfo` abaixo de cada campo após o campo ser tocado (`isTouched`).
- Não replique validação em `onSubmit` — o schema Zod já garante que `values` está correto ao chegar no callback.

## Regras

- `createFormFactory` deve ser declarado **fora** do componente (module-level). Dentro causa re-criação e perda de estado a cada render.
- O schema DEVE vir de `packages/types` — nunca defina schemas inline no componente.
- Não acesse `form.instance` para ler valores que poderiam ser props — use o fluxo normal de `onSubmit`.
- Para `type="select"`, `options` é obrigatório. O renderer passa `items={options}` ao Base UI Select para exibir labels no trigger (não os values crus).
- CRUD completo: `docs/crud-playbook.md`.
- Não misture `createFormFactory` com `useState` para os mesmos campos — escolha um.
