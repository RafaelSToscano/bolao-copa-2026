import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/services/supabase/playersService', () => ({
  playersService: {
    findPlayerByCredentials: vi.fn(),
    findPlayerByAccessCode: vi.fn(),
    createPendingPlayer: vi.fn(),
  },
}));

import { playersService } from '@/services/supabase/playersService';

const mockPlayer = {
  id: 'player1',
  name: 'João Silva',
  access_code: 'ABC123',
  is_admin: false,
  approved: true,
};

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should start with null user and isChecking true then false', async () => {
    const { result } = renderHook(() => useAuth());
    // After effect runs, isChecking becomes false
    await act(async () => {});
    expect(result.current.currentUser).toBeNull();
    expect(result.current.isChecking).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should restore user from localStorage on mount', async () => {
    localStorage.setItem('bolao_user', JSON.stringify(mockPlayer));
    const { result } = renderHook(() => useAuth());
    await act(async () => {});
    expect(result.current.currentUser).toEqual(mockPlayer);
  });

  it('should clear invalid localStorage on mount', async () => {
    localStorage.setItem('bolao_user', 'invalid-json');
    const { result } = renderHook(() => useAuth());
    await act(async () => {});
    expect(result.current.currentUser).toBeNull();
    expect(localStorage.getItem('bolao_user')).toBeNull();
  });

  it('should login successfully', async () => {
    vi.mocked(playersService.findPlayerByCredentials).mockResolvedValue(mockPlayer);
    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    let success: boolean;
    await act(async () => {
      success = await result.current.login('ABC123', 'password');
    });

    expect(success!).toBe(true);
    expect(result.current.currentUser).toEqual(mockPlayer);
    expect(localStorage.getItem('bolao_user')).toBe(JSON.stringify(mockPlayer));
  });

  it('should fail login when user not found', async () => {
    vi.mocked(playersService.findPlayerByCredentials).mockResolvedValue(null);
    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    let success: boolean;
    await act(async () => {
      success = await result.current.login('WRONG', 'password');
    });

    expect(success!).toBe(false);
    expect(result.current.error).toBe('Usuário não encontrado.');
    expect(result.current.currentUser).toBeNull();
  });

  it('should fail login when user not approved', async () => {
    vi.mocked(playersService.findPlayerByCredentials).mockResolvedValue({
      ...mockPlayer,
      approved: false,
    });
    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    let success: boolean;
    await act(async () => {
      success = await result.current.login('ABC123', 'password');
    });

    expect(success!).toBe(false);
    expect(result.current.error).toContain('aprovação');
  });

  it('should handle login error', async () => {
    vi.mocked(playersService.findPlayerByCredentials).mockRejectedValue(
      new Error('Network error')
    );
    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    let success: boolean;
    await act(async () => {
      success = await result.current.login('ABC123', 'password');
    });

    expect(success!).toBe(false);
    expect(result.current.error).toBe('Network error');
  });

  it('should logout and clear localStorage', async () => {
    localStorage.setItem('bolao_user', JSON.stringify(mockPlayer));
    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    act(() => {
      result.current.logout();
    });

    expect(result.current.currentUser).toBeNull();
    expect(localStorage.getItem('bolao_user')).toBeNull();
  });

  it('should requestAccess successfully', async () => {
    vi.mocked(playersService.findPlayerByAccessCode).mockResolvedValue(null);
    vi.mocked(playersService.createPendingPlayer).mockResolvedValue(undefined);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    let success: boolean;
    await act(async () => {
      success = await result.current.requestAccess('João', 'ABC123', 'pass');
    });

    expect(success!).toBe(true);
    expect(playersService.createPendingPlayer).toHaveBeenCalledWith('João', 'ABC123', 'pass');
  });

  it('should fail requestAccess when user already exists', async () => {
    vi.mocked(playersService.findPlayerByAccessCode).mockResolvedValue(mockPlayer);
    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    let success: boolean;
    await act(async () => {
      success = await result.current.requestAccess('João', 'ABC123', 'pass');
    });

    expect(success!).toBe(false);
    expect(result.current.error).toContain('cadastrado');
  });
});
