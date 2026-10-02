export type SignUpInput = {
  name: string;
  email: string;
  password: string;
};

export type ValidationResult =
  | {
      ok: true;
      normalizedName: string;
    }
  | {
      ok: false;
      error: string;
    };

const PASSWORD_MIN_LENGTH = 8;

export function validateSignUpData(input: SignUpInput): ValidationResult {
  const name = input.name.trim();
  const email = input.email.trim();

  if (!name) {
    return { ok: false, error: 'Informe um nome para criar a conta.' };
  }

  if (name.length < 2) {
    return { ok: false, error: 'O nome deve ter pelo menos 2 caracteres.' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Informe um e-mail válido.' };
  }

  if (input.password.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, error: 'A senha deve ter pelo menos 8 caracteres.' };
  }

  if (!/[A-Z]/.test(input.password) || !/[0-9]/.test(input.password)) {
    return {
      ok: false,
      error: 'A senha deve conter pelo menos uma letra maiúscula e um número.',
    };
  }

  return {
    ok: true,
    normalizedName: name,
  };
}
