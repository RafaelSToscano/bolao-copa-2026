import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { AuthForm } from '@/components/forms/AuthForm';

describe('AuthForm Component', () => {
  const mockOnLogin = vi.fn();
  const mockOnRequestAccess = vi.fn();
  const mockOnRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Mode', () => {
    it('should render login form by default', () => {
      render(
        <AuthForm
          onLogin={mockOnLogin}
          onRequestAccess={mockOnRequestAccess}
          onRefresh={mockOnRefresh}
        />
      );
      expect(screen.getByText('Bolão 2026')).toBeInTheDocument();
      const inputs = screen.getAllByPlaceholderText('Exemplo: 51999999999');
      expect(inputs.length).toBeGreaterThanOrEqual(1);
    });

    it('should render login button', () => {
      render(
        <AuthForm
          onLogin={mockOnLogin}
          onRequestAccess={mockOnRequestAccess}
          onRefresh={mockOnRefresh}
        />
      );
      expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
    });

    it('should render register access button', () => {
      render(
        <AuthForm
          onLogin={mockOnLogin}
          onRequestAccess={mockOnRequestAccess}
          onRefresh={mockOnRefresh}
        />
      );
      expect(
        screen.getByRole('button', { name: /Primeiro acesso/i })
      ).toBeInTheDocument();
    });

    it('should have logo image', () => {
      render(
        <AuthForm
          onLogin={mockOnLogin}
          onRequestAccess={mockOnRequestAccess}
          onRefresh={mockOnRefresh}
        />
      );
      const logo = screen.getByAltText('Bolão Copa 2026');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/brand/bolao-logo.jpg');
    });

    it('should display Copa do Mundo FIFA text', () => {
      render(
        <AuthForm
          onLogin={mockOnLogin}
          onRequestAccess={mockOnRequestAccess}
          onRefresh={mockOnRefresh}
        />
      );
      expect(screen.getByText('Copa do Mundo FIFA')).toBeInTheDocument();
    });

    it('should call onLogin with credentials', async () => {
      const user = userEvent.setup();
      mockOnLogin.mockResolvedValue(undefined);

      render(
        <AuthForm
          onLogin={mockOnLogin}
          onRequestAccess={mockOnRequestAccess}
          onRefresh={mockOnRefresh}
        />
      );

      const phoneInput = screen.getByPlaceholderText('Exemplo: 51999999999');
      const passwordInput = screen.getByPlaceholderText('Digite sua senha');
      const loginButton = screen.getByRole('button', { name: /Entrar/i });

      await user.type(phoneInput, '51999999999');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);

      expect(mockOnLogin).toHaveBeenCalledWith('51999999999', 'password123');
    });

    it('should disable login button when fields are empty', () => {
      render(
        <AuthForm
          onLogin={mockOnLogin}
          onRequestAccess={mockOnRequestAccess}
          onRefresh={mockOnRefresh}
        />
      );
      const loginButton = screen.getByRole('button', { name: /Entrar/i });
      expect(loginButton).toBeDisabled();
    });

    it('should disable login button when only phone is filled', async () => {
      const user = userEvent.setup();
      render(
        <AuthForm
          onLogin={mockOnLogin}
          onRequestAccess={mockOnRequestAccess}
          onRefresh={mockOnRefresh}
        />
      );

      const phoneInput = screen.getByPlaceholderText('Exemplo: 51999999999');
      const loginButton = screen.getByRole('button', { name: /Entrar/i });

      await user.type(phoneInput, '51999999999');
      expect(loginButton).toBeDisabled();
    });

    it('should disable login button when only password is filled', async () => {
      const user = userEvent.setup();
      render(
        <AuthForm
          onLogin={mockOnLogin}
          onRequestAccess={mockOnRequestAccess}
          onRefresh={mockOnRefresh}
        />
      );

      const passwordInput = screen.getByPlaceholderText('Digite sua senha');
      const loginButton = screen.getByRole('button', { name: /Entrar/i });

      await user.type(passwordInput, 'password123');
      expect(loginButton).toBeDisabled();
    });

    it('should enable login button when both fields are filled', async () => {
      const user = userEvent.setup();
      render(
        <AuthForm
          onLogin={mockOnLogin}
          onRequestAccess={mockOnRequestAccess}
          onRefresh={mockOnRefresh}
        />
      );

      const phoneInput = screen.getByPlaceholderText('Exemplo: 51999999999');
      const passwordInput = screen.getByPlaceholderText('Digite sua senha');
      const loginButton = screen.getByRole('button', { name: /Entrar/i });

      await user.type(phoneInput, '51999999999');
      await user.type(passwordInput, 'password123');
      expect(loginButton).not.toBeDisabled();
    });

    it('should disable submit and refresh buttons when isLoading is true', () => {
      render(
        <AuthForm
          onLogin={mockOnLogin}
          onRequestAccess={mockOnRequestAccess}
          onRefresh={mockOnRefresh}
          isLoading={true}
        />
      );

      const loginButton = screen.getByRole('button', { name: /Entrando/i });
      const refreshButton = screen.getByRole('button', { name: /Atualizar/i });

      expect(loginButton).toBeDisabled();
      expect(refreshButton).toBeDisabled();
    });

    it('should display loading text when isLoading', () => {
      render(
        <AuthForm
          onLogin={mockOnLogin}
          onRequestAccess={mockOnRequestAccess}
          onRefresh={mockOnRefresh}
          isLoading={true}
        />
      );
      expect(screen.getByText('Entrando...')).toBeInTheDocument();
    });

    it('should display error message', () => {
      render(
        <AuthForm
          onLogin={mockOnLogin}
          onRequestAccess={mockOnRequestAccess}
          onRefresh={mockOnRefresh}
          error="Credenciais inválidas"
        />
      );
      expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument();
    });
  });

  describe('Register Mode', () => {
    it('should switch to register mode', async () => {
      const user = userEvent.setup();
      render(
        <AuthForm
          onLogin={mockOnLogin}
          onRequestAccess={mockOnRequestAccess}
          onRefresh={mockOnRefresh}
        />
      );

      const registerButton = screen.getByRole('button', {
        name: /Primeiro acesso/i,
      });
      await user.click(registerButton);

      expect(screen.getByText('Solicitar acesso')).toBeInTheDocument();
      const nameInput = screen.getByPlaceholderText(
        'Exemplo: Rafael Toscano ou apelido'
      );
      expect(nameInput).toBeInTheDocument();
    });

    it('should display register instructions', async () => {
      const user = userEvent.setup();
      render(
        <AuthForm
          onLogin={mockOnLogin}
          onRequestAccess={mockOnRequestAccess}
          onRefresh={mockOnRefresh}
        />
      );

      const registerButton = screen.getByRole('button', {
        name: /Primeiro acesso/i,
      });
      await user.click(registerButton);

      expect(
        screen.getByText(
          /Preencha seus dados. O administrador precisa aprovar seu acesso./i
        )
      ).toBeInTheDocument();
    });

    it('should call onRequestAccess with register data', async () => {
      const user = userEvent.setup();
      mockOnRequestAccess.mockResolvedValue(undefined);

      render(
        <AuthForm
          onLogin={mockOnLogin}
          onRequestAccess={mockOnRequestAccess}
          onRefresh={mockOnRefresh}
        />
      );

      const registerButton = screen.getByRole('button', {
        name: /Primeiro acesso/i,
      });
      await user.click(registerButton);

      const nameInput = screen.getByPlaceholderText(
        'Exemplo: Rafael Toscano ou apelido'
      );
      const phoneInput = screen.getByPlaceholderText('Exemplo: 51999999999');
      const passwordInput = screen.getByPlaceholderText('Crie uma senha');
      const submitButton = screen.getByRole('button', {
        name: /Enviar solicitação/i,
      });

      await user.type(nameInput, 'João Silva');
      await user.type(phoneInput, '51999999999');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(mockOnRequestAccess).toHaveBeenCalledWith(
        'João Silva',
        '51999999999',
        'password123'
      );
    });

    it('should return to login mode', async () => {
      const user = userEvent.setup();
      render(
        <AuthForm
          onLogin={mockOnLogin}
          onRequestAccess={mockOnRequestAccess}
          onRefresh={mockOnRefresh}
        />
      );

      let registerButton = screen.getByRole('button', {
        name: /Primeiro acesso/i,
      });
      await user.click(registerButton);
      expect(screen.getByText('Solicitar acesso')).toBeInTheDocument();

      const backButton = screen.getByRole('button', { name: /Voltar para login/i });
      await user.click(backButton);

      expect(screen.getByText('Bolão 2026')).toBeInTheDocument();
    });

    it('should disable send button when fields are empty', async () => {
      const user = userEvent.setup();
      render(
        <AuthForm
          onLogin={mockOnLogin}
          onRequestAccess={mockOnRequestAccess}
          onRefresh={mockOnRefresh}
        />
      );

      const registerButton = screen.getByRole('button', {
        name: /Primeiro acesso/i,
      });
      await user.click(registerButton);

      const submitButton = screen.getByRole('button', {
        name: /Enviar solicitação/i,
      });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Refresh Button', () => {
    it('should render refresh button', () => {
      render(
        <AuthForm
          onLogin={mockOnLogin}
          onRequestAccess={mockOnRequestAccess}
          onRefresh={mockOnRefresh}
        />
      );
      expect(screen.getByRole('button', { name: /Atualizar/i })).toBeInTheDocument();
    });

    it('should call onRefresh when clicked', async () => {
      const user = userEvent.setup();
      mockOnRefresh.mockResolvedValue(undefined);

      render(
        <AuthForm
          onLogin={mockOnLogin}
          onRequestAccess={mockOnRequestAccess}
          onRefresh={mockOnRefresh}
        />
      );

      const refreshButton = screen.getByRole('button', { name: /Atualizar/i });
      await user.click(refreshButton);

      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });
});
