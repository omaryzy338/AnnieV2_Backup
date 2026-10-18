import { api, ApiError, normalizarUrl, resolveMediaUrl, setApiBaseUrl, setAuthToken, setUnauthorizedHandler } from '@/lib/api';

const respuesta = (status: number, body: unknown) =>
  Promise.resolve({ ok: status >= 200 && status < 300, status, text: () => Promise.resolve(JSON.stringify(body)) } as Response);

describe('cliente de la API', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    setApiBaseUrl('https://api.annie.test');
    setAuthToken('tok123');
    setUnauthorizedHandler(null);
  });

  it('manda el token y JSON', async () => {
    fetchMock.mockReturnValue(respuesta(201, { ok: true }));
    await api.post('/sales', { productId: 'p1' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.annie.test/sales');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer tok123');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({ productId: 'p1' });
  });

  it('regresa el mensaje del backend como error', async () => {
    fetchMock.mockReturnValue(respuesta(400, { message: 'Stock insuficiente. Disponible: 2' }));
    await expect(api.post('/sales', {})).rejects.toEqual(new ApiError('Stock insuficiente. Disponible: 2', 400));
  });

  it('un 401 cierra la sesión, excepto en login/registro', async () => {
    const handler = jest.fn();
    setUnauthorizedHandler(handler);
    fetchMock.mockReturnValue(respuesta(401, { message: 'Sesión vencida' }));
    await expect(api.get('/products')).rejects.toThrow('Sesión vencida');
    expect(handler).toHaveBeenCalledTimes(1);
    await expect(api.post('/auth/login', {})).rejects.toThrow();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('sin conexión da un mensaje entendible', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    await expect(api.get('/products')).rejects.toThrow(/No se pudo conectar/);
  });

  it('error 500 sin mensaje', async () => {
    fetchMock.mockReturnValue(Promise.resolve({ ok: false, status: 502, text: () => Promise.resolve('<html>') } as Response));
    await expect(api.get('/products')).rejects.toThrow(/error en el servidor/);
  });
});

describe('direcciones', () => {
  it('normaliza la URL del servidor', () => {
    expect(normalizarUrl('annie-backend.onrender.com/')).toBe('https://annie-backend.onrender.com');
    expect(normalizarUrl('192.168.1.20:5000')).toBe('http://192.168.1.20:5000');
    expect(normalizarUrl('localhost:5000')).toBe('http://localhost:5000');
    expect(normalizarUrl(' http://10.0.0.5:5000// ')).toBe('http://10.0.0.5:5000');
    expect(normalizarUrl('')).toBe('');
  });
  it('resuelve imágenes del backend y externas', () => {
    setApiBaseUrl('https://api.annie.test');
    expect(resolveMediaUrl('/uploads/abc')).toBe('https://api.annie.test/uploads/abc');
    expect(resolveMediaUrl('https://cdn.test/x.png')).toBe('https://cdn.test/x.png');
    expect(resolveMediaUrl('')).toBeNull();
  });
});
