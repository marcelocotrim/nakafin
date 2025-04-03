interface ErrorMessages {
  [key: string]: string;
}

const errorMessages: ErrorMessages = {
  // Authentication errors
  'Invalid email or password': 'Email ou senha inválidos',
  'User already exists': 'Este email já está cadastrado',
  'User not found': 'Usuário não encontrado',
  'Password is required': 'A senha é obrigatória',
  'Email is required': 'O email é obrigatório',
  'Email not verified': 'Email não verificado',
  'You have been banned from this application. Please contact support if you believe this is an error.':
    'Você foi banido desta aplicação. Por favor, contate o suporte se você acredita que isso é um erro.',

  // Validation errors
  'Invalid email format': 'Formato de email inválido',
  'Password must be at least 6 characters': 'A senha deve ter no mínimo 6 caracteres',
  'Name is required': 'O nome é obrigatório',

  // Generic errors
  'Something went wrong': 'Algo deu errado',
  'Operation not permitted': 'Operação não permitida',
  'Not authorized': 'Não autorizado',
  'Session expired': 'Sessão expirada',

  // Form errors
  'Required field': 'Campo obrigatório',
  'Invalid format': 'Formato inválido',
  'Invalid date': 'Data inválida',
};

export const translateError = (error: string): string => {
  return errorMessages[error] || error;
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return translateError(error.message);
  }

  if (typeof error === 'string') {
    return translateError(error);
  }

  return translateError('Something went wrong');
};
