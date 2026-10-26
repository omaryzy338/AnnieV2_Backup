import { rolDeSesion } from '@/lib/roles';

// base64url del JSON en UTF-8 (como lo genera jsonwebtoken)
const base64url = (txt: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(txt))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const firmar = (payload: object) => `x.${base64url(JSON.stringify(payload))}.y`;

describe('rol de la sesión', () => {
  it('sin rol (sesiones de antes de los roles) es el dueño', () => {
    expect(rolDeSesion({})).toBe('dueno');
    expect(rolDeSesion(null)).toBe('dueno');
    expect(rolDeSesion({}, firmar({ exp: 9999999999 }))).toBe('dueno');
    expect(rolDeSesion({}, 'token-ilegible')).toBe('dueno');
  });

  it('usa el rol del usuario guardado', () => {
    expect(rolDeSesion({ rol: 'empleado' })).toBe('empleado');
    expect(rolDeSesion({ rol: 'dueno' })).toBe('dueno');
    expect(rolDeSesion({ rol: 'dueno' }, firmar({ rol: 'empleado' }))).toBe('dueno');
  });

  it('si el usuario guardado no lo trae, usa el rol del token', () => {
    expect(rolDeSesion({}, firmar({ exp: 9999999999, rol: 'empleado' }))).toBe('empleado');
    expect(rolDeSesion({ rol: undefined }, firmar({ rol: 'dueno' }))).toBe('dueno');
  });
});
